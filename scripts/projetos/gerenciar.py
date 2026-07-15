#!/usr/bin/env python3
"""Cria, lista e exclui sandboxes de projetos com limites de segurança."""

from __future__ import annotations

import argparse
import base64
import json
import os
import re
import shutil
import stat
import subprocess
import sys
from collections.abc import Sequence
from datetime import date
from pathlib import Path
from typing import Any


RAIZ_PADRAO = Path(__file__).resolve().parents[2]
PADRAO_ID = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

STATUS_VALIDOS = {
    "backlog",
    "aguardando",
    "em_andamento",
    "concluido",
    "publicado",
    "arquivado",
    "cancelado",
}
TIPOS_VALIDOS = {
    "portal",
    "pptx",
    "planilha",
    "documento",
    "dashboard",
    "formulario",
    "ferramenta",
    "pasta",
    "pdf",
    "arquivo",
    "outro",
}
TIPOS_WEB = {"portal", "dashboard", "formulario", "ferramenta"}


class ErroGerenciamento(ValueError):
    """Entrada inválida ou operação insegura sobre um sandbox."""


def _normalizar_raiz(raiz: str | os.PathLike[str] | None) -> Path:
    caminho = Path(raiz) if raiz is not None else RAIZ_PADRAO
    caminho = caminho.expanduser().resolve()
    if not caminho.is_dir():
        raise ErroGerenciamento(f"raiz do workspace inexistente: {caminho}")
    return caminho


def _validar_id(project_id: str) -> str:
    if not isinstance(project_id, str) or not PADRAO_ID.fullmatch(project_id):
        raise ErroGerenciamento(
            "id inválido; use kebab-case com letras minúsculas, números e hífens"
        )
    return project_id


def _validar_texto(valor: str, campo: str) -> str:
    if not isinstance(valor, str) or not valor.strip():
        raise ErroGerenciamento(f"{campo} deve ser um texto não vazio")
    return valor.strip()


def _eh_reparse_point(caminho: Path) -> bool:
    """Rejeita links simbólicos e junctions antes de operações destrutivas."""
    try:
        atributos = getattr(caminho.lstat(), "st_file_attributes", 0)
    except OSError:
        return False
    mascara = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0)
    return caminho.is_symlink() or bool(mascara and atributos & mascara)


def _remover_sandbox(projetos: Path, alvo: Path) -> None:
    """Remove um filho direto já validado, com fallback para ACL do OneDrive."""
    projetos_resolvido = projetos.resolve(strict=True)
    if _eh_reparse_point(alvo) or not alvo.is_dir():
        raise ErroGerenciamento("alvo de remoção deve ser um diretório real")
    alvo_resolvido = alvo.resolve(strict=True)
    if (
        alvo_resolvido.parent != projetos_resolvido
        or not PADRAO_ID.fullmatch(alvo_resolvido.name)
    ):
        raise ErroGerenciamento("alvo de remoção não é um sandbox direto de projects")

    try:
        shutil.rmtree(alvo_resolvido)
    except OSError as exc:
        if os.name != "nt" or not alvo_resolvido.exists():
            raise ErroGerenciamento(
                f"não foi possível remover o sandbox: {alvo_resolvido}"
            ) from exc

        # O OneDrive corporativo pode negar rmdir a Python mesmo quando o usuário
        # possui permissão. Remove-Item respeita a ACL do usuário logado.
        literal = os.fspath(alvo_resolvido).replace("'", "''")
        script = (
            f"Remove-Item -LiteralPath '{literal}' -Recurse -Force "
            "-ErrorAction Stop"
        )
        comando_codificado = base64.b64encode(
            script.encode("utf-16-le")
        ).decode("ascii")
        try:
            processo = subprocess.run(
                [
                    "powershell.exe",
                    "-NoLogo",
                    "-NoProfile",
                    "-NonInteractive",
                    "-EncodedCommand",
                    comando_codificado,
                ],
                cwd=projetos_resolvido.parent,
                check=False,
                capture_output=True,
                text=True,
                timeout=30,
            )
        except (OSError, subprocess.TimeoutExpired) as fallback_exc:
            raise ErroGerenciamento(
                f"não foi possível remover o sandbox: {alvo_resolvido}"
            ) from fallback_exc
        if processo.returncode:
            detalhe = processo.stderr.strip() or processo.stdout.strip()
            raise ErroGerenciamento(
                f"não foi possível remover o sandbox: {detalhe}"
            ) from exc

    if alvo_resolvido.exists() or alvo_resolvido.is_symlink():
        raise ErroGerenciamento(f"o sandbox ainda existe: {alvo_resolvido}")


def _diretorio_projects(raiz: Path, *, criar: bool = False) -> Path:
    projetos = raiz / "projects"
    if not projetos.exists():
        if not criar:
            return projetos
        projetos.mkdir(parents=False, exist_ok=False)
    if not projetos.is_dir() or _eh_reparse_point(projetos):
        raise ErroGerenciamento(
            f"projects deve ser um diretório real dentro da raiz: {projetos}"
        )
    resolvido = projetos.resolve(strict=True)
    if resolvido.parent != raiz:
        raise ErroGerenciamento("projects não é filho direto da raiz informada")
    return resolvido


def _ler_json(caminho: Path) -> Any:
    try:
        return json.loads(caminho.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ErroGerenciamento(f"JSON inválido ou ilegível: {caminho}") from exc


def _escrever_json_novo(caminho: Path, conteudo: dict[str, Any]) -> None:
    texto = json.dumps(conteudo, ensure_ascii=False, indent=2) + "\n"
    try:
        with caminho.open("x", encoding="utf-8", newline="\n") as arquivo:
            arquivo.write(texto)
    except FileExistsError as exc:
        raise ErroGerenciamento(f"arquivo já existe; nada foi sobrescrito: {caminho}") from exc


def _normalizar_tags(tags: Sequence[str] | str | None) -> list[str]:
    if tags is None:
        itens: list[str] = []
    elif isinstance(tags, str):
        itens = tags.split(",")
    else:
        itens = []
        for item in tags:
            if not isinstance(item, str):
                raise ErroGerenciamento("cada tag deve ser um texto")
            itens.extend(item.split(","))

    resultado: list[str] = []
    for item in itens:
        tag = item.strip()
        if not tag:
            continue
        if not PADRAO_ID.fullmatch(tag):
            raise ErroGerenciamento(f"tag inválida: {tag!r}; use kebab-case")
        if tag not in resultado:
            resultado.append(tag)
    return resultado


def _proxima_ordem(projetos: Path) -> int:
    maior = 0
    for manifesto in sorted(projetos.glob("*/project.json")):
        dados = _ler_json(manifesto)
        if not isinstance(dados, dict):
            raise ErroGerenciamento(f"manifesto deve conter um objeto: {manifesto}")
        ordem = dados.get("ordem")
        if ordem is None:
            continue
        if isinstance(ordem, bool) or not isinstance(ordem, int) or ordem < 0:
            raise ErroGerenciamento(f"ordem inválida no manifesto: {manifesto}")
        maior = max(maior, ordem)
    return maior + 10


def _executar_sincronizador(
    raiz: Path,
    *,
    somente_validar: bool = False,
    permitir_vazio: bool = False,
) -> None:
    script = Path(__file__).resolve().parents[1] / "catalogo" / "sincronizar_catalogo.py"
    comando = [
        sys.executable,
        os.fspath(script),
        "--raiz",
        os.fspath(raiz),
        "--incluir-local",
    ]
    if somente_validar:
        comando.append("--somente-validar")
    if permitir_vazio:
        comando.append("--permitir-vazio")
    try:
        processo = subprocess.run(
            comando,
            cwd=raiz,
            check=False,
            capture_output=True,
            text=True,
        )
    except OSError as exc:
        raise ErroGerenciamento("não foi possível executar o sincronizador") from exc
    if processo.returncode:
        detalhe = processo.stderr.strip() or processo.stdout.strip()
        raise ErroGerenciamento(f"sincronização do catálogo falhou: {detalhe}")


def _tem_recursos_externos(caminho: Path) -> bool:
    """Falha de modo seguro: inventário ilegível também exige assistência."""
    if not caminho.exists() and not caminho.is_symlink():
        return True
    if _eh_reparse_point(caminho) or not caminho.is_file():
        return True
    try:
        dados = json.loads(caminho.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return True

    if not isinstance(dados, dict):
        return True
    if set(dados) != {"version", "project_id", "external_resources"}:
        return True
    if dados.get("version") != 1 or dados.get("project_id") != caminho.parent.name:
        return True
    recursos = dados.get("external_resources")
    if not isinstance(recursos, list):
        return True
    for recurso in recursos:
        if not isinstance(recurso, dict):
            return True
        if set(recurso) != {"type", "reference", "description"}:
            return True
        if any(
            not isinstance(recurso.get(campo), str)
            or not recurso[campo].strip()
            for campo in ("type", "reference", "description")
        ):
            return True
    return bool(recursos)


def listar_projetos(
    raiz: str | os.PathLike[str] | None = None,
) -> list[dict[str, Any]]:
    """Retorna o resumo seguro dos sandboxes, ordenado pelo id."""
    raiz_resolvida = _normalizar_raiz(raiz)
    projetos = _diretorio_projects(raiz_resolvida)
    if not projetos.exists():
        return []

    resultado: list[dict[str, Any]] = []
    for manifesto in sorted(projetos.glob("*/project.json")):
        pasta = manifesto.parent
        if _eh_reparse_point(pasta) or pasta.resolve(strict=True).parent != projetos:
            raise ErroGerenciamento(f"sandbox não é filho direto seguro: {pasta}")
        dados = _ler_json(manifesto)
        if not isinstance(dados, dict):
            raise ErroGerenciamento(f"manifesto deve conter um objeto: {manifesto}")
        project_id = _validar_id(dados.get("id", ""))
        if project_id != pasta.name:
            raise ErroGerenciamento(
                f"id do manifesto {project_id!r} difere da pasta {pasta.name!r}"
            )
        resultado.append(
            {
                "id": project_id,
                "status": dados.get("status", ""),
                "tipo": dados.get("tipo", ""),
                "exclusao_assistida": _tem_recursos_externos(
                    pasta / "resources.local.json"
                ),
            }
        )
    return resultado


def criar_projeto(
    project_id: str,
    *,
    titulo: str,
    descricao: str,
    tipo: str,
    responsavel: str,
    status: str = "backlog",
    tags: Sequence[str] | str | None = None,
    raiz: str | os.PathLike[str] | None = None,
    sincronizar: bool = True,
) -> Path:
    """Cria um sandbox novo sem reutilizar nem sobrescrever nenhum caminho."""
    project_id = _validar_id(project_id)
    titulo = _validar_texto(titulo, "titulo")
    descricao = _validar_texto(descricao, "descricao")
    responsavel = _validar_texto(responsavel, "responsavel")
    if tipo not in TIPOS_VALIDOS:
        raise ErroGerenciamento(f"tipo inválido: {tipo!r}")
    if status not in STATUS_VALIDOS:
        raise ErroGerenciamento(f"status inválido: {status!r}")
    tags_normalizadas = _normalizar_tags(tags)

    raiz_resolvida = _normalizar_raiz(raiz)
    projetos = _diretorio_projects(raiz_resolvida, criar=True)
    alvo = projetos / project_id
    if alvo.exists() or alvo.is_symlink():
        raise ErroGerenciamento(f"sandbox já existe; nada foi sobrescrito: {alvo}")
    if alvo.parent != projetos:
        raise ErroGerenciamento("alvo deve ser filho direto de projects")

    hoje = date.today().isoformat()
    manifesto = {
        "$schema": "../../docs/sandboxes/project.schema.json",
        "id": project_id,
        "titulo": titulo,
        "descricao": descricao,
        "status": status,
        "tipo": tipo,
        "responsavel": responsavel,
        "criado_em": hoje,
        "atualizado_em": hoje,
        "tags": tags_normalizadas,
        "resultado_principal": None,
        "artefatos": [],
        "compartilhamento": {
            "visibilidade": "privado",
            "publico_descricao": "Uso local",
            "modo_acesso": "local",
        },
        "ordem": _proxima_ordem(projetos),
    }

    alvo.mkdir(exist_ok=False)
    try:
        if tipo in TIPOS_WEB:
            pastas = ("src", "data/private", "data/public", "public")
            perfil = "web"
        else:
            pastas = ("src", "data/private", "deliverables")
            perfil = "arquivo"
        for relativa in pastas:
            (alvo / relativa).mkdir(parents=True, exist_ok=False)

        manifesto_local = {
            "id": project_id,
            "resultado_principal": None,
            "artefatos": [
                {
                    "tipo": "pasta",
                    "rotulo": "Pasta do projeto",
                    "href": None,
                    "caminho_local": os.fspath(alvo),
                }
            ],
        }
        readme = (
            f"# {titulo}\n\n"
            f"{descricao}\n\n"
            "## Estrutura inicial\n\n"
            f"Perfil: `{perfil}`. O resultado principal ainda não foi configurado. "
            "Mantenha caminhos e destinos privados em `project.local.json`.\n"
        )

        _escrever_json_novo(alvo / "project.json", manifesto)
        _escrever_json_novo(alvo / "project.local.json", manifesto_local)
        _escrever_json_novo(
            alvo / "resources.local.json",
            {
                "version": 1,
                "project_id": project_id,
                "external_resources": [],
            },
        )
        with (alvo / "README.md").open(
            "x", encoding="utf-8", newline="\n"
        ) as arquivo:
            arquivo.write(readme)
    except Exception:
        _remover_sandbox(projetos, alvo)
        raise

    if sincronizar:
        try:
            _executar_sincronizador(raiz_resolvida)
        except Exception:
            _remover_sandbox(projetos, alvo)
            raise
    return alvo


def _obter_alvo_exclusao(raiz: Path, project_id: str) -> tuple[Path, Path]:
    projetos = _diretorio_projects(raiz)
    if not projetos.exists():
        raise ErroGerenciamento(f"diretório projects inexistente: {projetos}")
    alvo_lexico = projetos / project_id
    if alvo_lexico.parent != projetos:
        raise ErroGerenciamento("alvo deve ser filho direto de projects")
    if not alvo_lexico.exists() or not alvo_lexico.is_dir():
        raise ErroGerenciamento(f"sandbox não encontrado: {alvo_lexico}")
    if _eh_reparse_point(alvo_lexico):
        raise ErroGerenciamento("recusa de exclusão de link simbólico ou junction")

    alvo = alvo_lexico.resolve(strict=True)
    if alvo.parent != projetos:
        raise ErroGerenciamento("sandbox resolvido fora de projects; exclusão recusada")

    manifesto = alvo / "project.json"
    if (
        not manifesto.is_file()
        or _eh_reparse_point(manifesto)
        or manifesto.resolve(strict=True).parent != alvo
    ):
        raise ErroGerenciamento(f"manifesto seguro não encontrado: {manifesto}")
    dados = _ler_json(manifesto)
    if not isinstance(dados, dict) or dados.get("id") != project_id:
        raise ErroGerenciamento("id do manifesto não coincide com o sandbox solicitado")
    return projetos, alvo


def excluir_projeto(
    project_id: str,
    *,
    confirmar: str,
    recursos_externos_removidos: bool = False,
    raiz: str | os.PathLike[str] | None = None,
    sincronizar: bool = True,
) -> None:
    """Exclui somente um filho direto validado de projects."""
    project_id = _validar_id(project_id)
    if confirmar != project_id:
        raise ErroGerenciamento(
            f"confirmação incorreta; use exatamente --confirmar {project_id}"
        )
    raiz_resolvida = _normalizar_raiz(raiz)
    _projetos, alvo = _obter_alvo_exclusao(raiz_resolvida, project_id)

    inventario = alvo / "resources.local.json"
    if _tem_recursos_externos(inventario) and not recursos_externos_removidos:
        raise ErroGerenciamento(
            "resources.local.json registra recursos externos, está ausente ou é "
            "inválido; corrija/remova os recursos primeiro e repita com "
            "--recursos-externos-removidos"
        )

    if sincronizar:
        _executar_sincronizador(raiz_resolvida, somente_validar=True)

    # Revalida imediatamente antes da única operação destrutiva.
    projetos, alvo = _obter_alvo_exclusao(raiz_resolvida, project_id)
    _remover_sandbox(projetos, alvo)

    if sincronizar:
        ultimo_excluido = not any(projetos.glob("*/project.json"))
        _executar_sincronizador(
            raiz_resolvida, permitir_vazio=ultimo_excluido
        )


def _criar_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Gerencia sandboxes em projects/.")
    parser.add_argument(
        "--raiz",
        type=Path,
        default=RAIZ_PADRAO,
        help=f"raiz do workspace (padrão: {RAIZ_PADRAO})",
    )
    subparsers = parser.add_subparsers(dest="comando", required=True)

    subparsers.add_parser("listar", help="lista os sandboxes atuais")

    criar = subparsers.add_parser("criar", help="cria um sandbox novo")
    criar.add_argument("id")
    criar.add_argument("--titulo", required=True)
    criar.add_argument("--descricao", required=True)
    criar.add_argument("--tipo", choices=sorted(TIPOS_VALIDOS), required=True)
    criar.add_argument("--responsavel", required=True)
    criar.add_argument("--status", choices=sorted(STATUS_VALIDOS), default="backlog")
    criar.add_argument(
        "--tags",
        nargs="*",
        default=[],
        help="tags em kebab-case, separadas por espaço ou vírgula",
    )

    excluir = subparsers.add_parser("excluir", help="exclui um sandbox validado")
    excluir.add_argument("id")
    excluir.add_argument("--confirmar", required=True)
    excluir.add_argument(
        "--recursos-externos-removidos",
        action="store_true",
        help="atesta que os recursos registrados já foram removidos",
    )
    return parser


def _imprimir_lista(projetos: list[dict[str, Any]]) -> None:
    if not projetos:
        print("Nenhum projeto encontrado.")
        return
    print("ID\tSTATUS\tTIPO\tEXCLUSÃO ASSISTIDA")
    for projeto in projetos:
        assistida = "sim" if projeto["exclusao_assistida"] else "não"
        print(
            f"{projeto['id']}\t{projeto['status']}\t{projeto['tipo']}\t{assistida}"
        )


def main(argv: list[str] | None = None) -> int:
    args = _criar_parser().parse_args(argv)
    try:
        if args.comando == "listar":
            _imprimir_lista(listar_projetos(args.raiz))
        elif args.comando == "criar":
            alvo = criar_projeto(
                args.id,
                titulo=args.titulo,
                descricao=args.descricao,
                tipo=args.tipo,
                responsavel=args.responsavel,
                status=args.status,
                tags=args.tags,
                raiz=args.raiz,
            )
            print(f"OK: sandbox criado em {alvo}")
        elif args.comando == "excluir":
            excluir_projeto(
                args.id,
                confirmar=args.confirmar,
                recursos_externos_removidos=args.recursos_externos_removidos,
                raiz=args.raiz,
            )
            print(f"OK: sandbox {args.id} excluído.")
    except ErroGerenciamento as exc:
        print(f"ERRO: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
