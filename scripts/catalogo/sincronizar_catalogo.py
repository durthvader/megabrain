#!/usr/bin/env python3
"""Valida manifests de sandboxes e consolida o catálogo do Megabrain."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urlsplit


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
VISIBILIDADES_VALIDAS = {"privado", "restrito", "nao_listado", "publico"}
CAMPOS_PROJETO = {
    "$schema",
    "id",
    "titulo",
    "descricao",
    "status",
    "tipo",
    "responsavel",
    "criado_em",
    "atualizado_em",
    "tags",
    "resultado_principal",
    "artefatos",
    "compartilhamento",
    "ordem",
}
CAMPOS_OBRIGATORIOS = CAMPOS_PROJETO - {"$schema", "ordem"}
CAMPOS_DESTINO_PUBLICO = {"tipo", "rotulo", "href"}
CAMPOS_DESTINO_LOCAL = CAMPOS_DESTINO_PUBLICO | {"caminho_local"}
CAMPOS_COMPARTILHAMENTO = {
    "visibilidade",
    "publico_descricao",
    "modo_acesso",
}
CAMPOS_LOCAL = {"id", "resultado_principal", "artefatos", "compartilhamento"}

PADRAO_SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
PADRAO_CHAVE_PRIVADA = re.compile(
    r"(?:^|_)(?:token|senha|password|secret|api_?key|service_?role|"
    r"caminho_local|local_path)(?:$|_)",
    re.IGNORECASE,
)
PADRAO_CAMINHO_ABSOLUTO = re.compile(r"^(?:[a-zA-Z]:[\\/]|\\\\)")
PADRAO_FILE_URL = re.compile(r"^file://", re.IGNORECASE)
PADRAO_CREDENCIAL_URL = re.compile(
    r"[?&](?:token|access_token|key|api_key|sig|signature|code)=",
    re.IGNORECASE,
)


class ErroContrato(Exception):
    """Erro de validação que deve impedir a geração do catálogo."""


def _ler_json(caminho: Path) -> dict[str, Any]:
    try:
        conteudo = json.loads(caminho.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ErroContrato(f"arquivo não encontrado: {caminho}") from exc
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ErroContrato(f"JSON inválido em {caminho}: {exc}") from exc

    if not isinstance(conteudo, dict):
        raise ErroContrato(f"{caminho}: a raiz do JSON deve ser um objeto")
    return conteudo


def _exigir_string(objeto: dict[str, Any], campo: str, contexto: str) -> None:
    valor = objeto.get(campo)
    if not isinstance(valor, str) or not valor.strip():
        raise ErroContrato(f"{contexto}.{campo}: deve ser uma string não vazia")


def _ler_data_iso(valor: Any, contexto: str) -> date:
    if not isinstance(valor, str):
        raise ErroContrato(f"{contexto}: deve usar o formato YYYY-MM-DD")
    try:
        return date.fromisoformat(valor)
    except ValueError as exc:
        raise ErroContrato(f"{contexto}: data inválida; use YYYY-MM-DD") from exc


def _validar_chaves(
    objeto: dict[str, Any], permitidas: set[str], contexto: str
) -> None:
    desconhecidas = sorted(set(objeto) - permitidas)
    if desconhecidas:
        raise ErroContrato(
            f"{contexto}: campos não reconhecidos: {', '.join(desconhecidas)}"
        )


def _validar_destino_publico(destino: Any, contexto: str) -> None:
    if not isinstance(destino, dict):
        raise ErroContrato(f"{contexto}: deve ser um objeto")
    _validar_chaves(destino, CAMPOS_DESTINO_PUBLICO, contexto)
    for campo in ("tipo", "rotulo", "href"):
        _exigir_string(destino, campo, contexto)
    _validar_href(destino["href"], f"{contexto}.href")


def _validar_href(href: str, contexto: str) -> None:
    """Aceita HTTPS/HTTP ou caminho relativo interno, nunca código/traversal."""
    if any(ord(char) < 32 for char in href):
        raise ErroContrato(f"{contexto}: contém caractere de controle")
    if "\\" in href:
        raise ErroContrato(f"{contexto}: use '/' em links, não '\\'")

    partes = urlsplit(href)
    esquema = partes.scheme.lower()
    if esquema:
        if esquema not in {"https", "http"}:
            raise ErroContrato(
                f"{contexto}: esquema {esquema!r} não permitido; use HTTPS/HTTP"
            )
        if not partes.netloc:
            raise ErroContrato(f"{contexto}: URL absoluta sem host")
        if partes.username is not None or partes.password is not None:
            raise ErroContrato(f"{contexto}: credencial embutida na URL")
        return

    if partes.netloc or href.startswith(("/", "//")):
        raise ErroContrato(
            f"{contexto}: caminho relativo deve permanecer dentro do sandbox"
        )
    segmentos = partes.path.split("/")
    if any(segmento in {".", ".."} for segmento in segmentos):
        raise ErroContrato(f"{contexto}: travessia com '.' ou '..' não permitida")
    if not partes.path:
        raise ErroContrato(f"{contexto}: informe uma URL ou caminho relativo")


def _validar_destino_local(destino: Any, contexto: str) -> None:
    if not isinstance(destino, dict):
        raise ErroContrato(f"{contexto}: deve ser um objeto")
    _validar_chaves(destino, CAMPOS_DESTINO_LOCAL, contexto)
    for campo in ("tipo", "rotulo"):
        _exigir_string(destino, campo, contexto)

    href = destino.get("href")
    caminho = destino.get("caminho_local")
    if href is not None and (not isinstance(href, str) or not href.strip()):
        raise ErroContrato(f"{contexto}.href: deve ser string não vazia ou null")
    if href:
        _validar_href(href, f"{contexto}.href")
    if caminho is not None and (
        not isinstance(caminho, str) or not caminho.strip()
    ):
        raise ErroContrato(
            f"{contexto}.caminho_local: deve ser string não vazia ou null"
        )
    if not href and not caminho:
        raise ErroContrato(
            f"{contexto}: informe pelo menos href ou caminho_local"
        )


def _validar_compartilhamento(
    compartilhamento: Any, contexto: str, *, parcial: bool = False
) -> None:
    if not isinstance(compartilhamento, dict):
        raise ErroContrato(f"{contexto}: deve ser um objeto")
    _validar_chaves(compartilhamento, CAMPOS_COMPARTILHAMENTO, contexto)
    if not parcial:
        ausentes = sorted(CAMPOS_COMPARTILHAMENTO - set(compartilhamento))
        if ausentes:
            raise ErroContrato(
                f"{contexto}: campos obrigatórios ausentes: {', '.join(ausentes)}"
            )

    if "visibilidade" in compartilhamento:
        visibilidade = compartilhamento["visibilidade"]
        if visibilidade not in VISIBILIDADES_VALIDAS:
            raise ErroContrato(
                f"{contexto}.visibilidade: valor inválido: {visibilidade!r}"
            )
    for campo in ("publico_descricao", "modo_acesso"):
        if campo in compartilhamento:
            _exigir_string(compartilhamento, campo, contexto)


def _localizar_dado_privado(valor: Any, trilha: str = "$") -> str | None:
    if isinstance(valor, dict):
        for chave, item in valor.items():
            if PADRAO_CHAVE_PRIVADA.search(str(chave)):
                return f"{trilha}.{chave} usa uma chave reservada a dados locais"
            achado = _localizar_dado_privado(item, f"{trilha}.{chave}")
            if achado:
                return achado
    elif isinstance(valor, list):
        for indice, item in enumerate(valor):
            achado = _localizar_dado_privado(item, f"{trilha}[{indice}]")
            if achado:
                return achado
    elif isinstance(valor, str):
        if PADRAO_CAMINHO_ABSOLUTO.search(valor):
            return f"{trilha} contém caminho absoluto"
        if PADRAO_FILE_URL.search(valor):
            return f"{trilha} contém URL file://"
        if PADRAO_CREDENCIAL_URL.search(valor):
            return f"{trilha} aparenta conter credencial na URL"
    return None


def _validar_projeto(projeto: dict[str, Any], caminho: Path) -> None:
    contexto = str(caminho)
    _validar_chaves(projeto, CAMPOS_PROJETO, contexto)
    ausentes = sorted(CAMPOS_OBRIGATORIOS - set(projeto))
    if ausentes:
        raise ErroContrato(
            f"{contexto}: campos obrigatórios ausentes: {', '.join(ausentes)}"
        )

    for campo in ("id", "titulo", "descricao", "responsavel"):
        _exigir_string(projeto, campo, contexto)

    project_id = projeto["id"]
    if not PADRAO_SLUG.fullmatch(project_id):
        raise ErroContrato(f"{contexto}.id: use kebab-case sem acentos")
    if caminho.parent.name != project_id:
        raise ErroContrato(
            f"{contexto}.id: {project_id!r} deve ser igual à pasta "
            f"{caminho.parent.name!r}"
        )

    status = projeto.get("status")
    if status not in STATUS_VALIDOS:
        raise ErroContrato(f"{contexto}.status: valor inválido: {status!r}")
    tipo = projeto.get("tipo")
    if tipo not in TIPOS_VALIDOS:
        raise ErroContrato(f"{contexto}.tipo: valor inválido: {tipo!r}")

    criado = _ler_data_iso(projeto.get("criado_em"), f"{contexto}.criado_em")
    atualizado = _ler_data_iso(
        projeto.get("atualizado_em"), f"{contexto}.atualizado_em"
    )
    if atualizado < criado:
        raise ErroContrato(
            f"{contexto}.atualizado_em: não pode ser anterior a criado_em"
        )

    tags = projeto.get("tags")
    if not isinstance(tags, list):
        raise ErroContrato(f"{contexto}.tags: deve ser uma lista")
    if not all(isinstance(tag, str) for tag in tags):
        raise ErroContrato(f"{contexto}.tags: use somente strings")
    if len(tags) != len(set(tags)):
        raise ErroContrato(f"{contexto}.tags: use strings únicas")
    for indice, tag in enumerate(tags):
        if not isinstance(tag, str) or not PADRAO_SLUG.fullmatch(tag):
            raise ErroContrato(
                f"{contexto}.tags[{indice}]: use kebab-case sem acentos"
            )

    resultado = projeto.get("resultado_principal")
    if resultado is not None:
        _validar_destino_publico(resultado, f"{contexto}.resultado_principal")

    artefatos = projeto.get("artefatos")
    if not isinstance(artefatos, list):
        raise ErroContrato(f"{contexto}.artefatos: deve ser uma lista")
    for indice, artefato in enumerate(artefatos):
        _validar_destino_publico(artefato, f"{contexto}.artefatos[{indice}]")

    _validar_compartilhamento(
        projeto.get("compartilhamento"), f"{contexto}.compartilhamento"
    )

    if "ordem" in projeto and (
        isinstance(projeto["ordem"], bool)
        or not isinstance(projeto["ordem"], int)
        or projeto["ordem"] < 0
    ):
        raise ErroContrato(f"{contexto}.ordem: deve ser um inteiro não negativo")

    dado_privado = _localizar_dado_privado(projeto)
    if dado_privado:
        raise ErroContrato(f"{contexto}: manifesto público recusado: {dado_privado}")


def _validar_local(local: dict[str, Any], project_id: str, caminho: Path) -> None:
    contexto = str(caminho)
    _validar_chaves(local, CAMPOS_LOCAL, contexto)
    if "id" in local and local["id"] != project_id:
        raise ErroContrato(
            f"{contexto}.id: {local['id']!r} deve ser igual a {project_id!r}"
        )
    if set(local) <= {"id"}:
        raise ErroContrato(f"{contexto}: não contém nenhuma sobreposição")

    if "resultado_principal" in local and local["resultado_principal"] is not None:
        _validar_destino_local(
            local["resultado_principal"], f"{contexto}.resultado_principal"
        )
    if "artefatos" in local:
        artefatos = local["artefatos"]
        if not isinstance(artefatos, list):
            raise ErroContrato(f"{contexto}.artefatos: deve ser uma lista")
        for indice, artefato in enumerate(artefatos):
            _validar_destino_local(artefato, f"{contexto}.artefatos[{indice}]")
    if "compartilhamento" in local:
        _validar_compartilhamento(
            local["compartilhamento"],
            f"{contexto}.compartilhamento",
            parcial=True,
        )


def _coletar_projetos(raiz: Path) -> tuple[list[dict[str, Any]], list[Path]]:
    manifests = sorted((raiz / "projects").glob("*/project.json"))
    if not manifests:
        raise ErroContrato(
            f"nenhum manifesto encontrado em {raiz / 'projects' / '*' / 'project.json'}; "
            "o catálogo existente não será sobrescrito"
        )

    projetos: list[dict[str, Any]] = []
    ids: dict[str, Path] = {}
    erros: list[str] = []
    for caminho in manifests:
        try:
            projeto = _ler_json(caminho)
            _validar_projeto(projeto, caminho)
            project_id = projeto["id"]
            if project_id in ids:
                raise ErroContrato(
                    f"id duplicado {project_id!r} em {ids[project_id]} e {caminho}"
                )
            ids[project_id] = caminho
            projetos.append(projeto)
        except ErroContrato as exc:
            erros.append(str(exc))

    if erros:
        raise ErroContrato("\n- ".join(["manifests inválidos:", *erros]))

    projetos.sort(key=lambda item: (item.get("ordem", sys.maxsize), item["id"]))
    return projetos, manifests


def _verificar_ignorados_pelo_git(raiz: Path, caminhos: Iterable[Path]) -> None:
    nao_ignorados: list[str] = []
    for caminho in caminhos:
        relativo = caminho.relative_to(raiz)
        try:
            processo = subprocess.run(
                ["git", "check-ignore", "--quiet", "--", os.fspath(relativo)],
                cwd=raiz,
                check=False,
                capture_output=True,
                text=True,
            )
        except OSError as exc:
            raise ErroContrato(
                "não foi possível executar git check-ignore para proteger os "
                "manifests locais"
            ) from exc
        if processo.returncode == 1:
            nao_ignorados.append(os.fspath(relativo))
        elif processo.returncode not in (0, 1):
            detalhe = processo.stderr.strip() or f"código {processo.returncode}"
            raise ErroContrato(f"git check-ignore falhou: {detalhe}")

    if nao_ignorados:
        raise ErroContrato(
            "arquivos locais não ignorados pelo Git; ajuste .gitignore antes de "
            "continuar: " + ", ".join(nao_ignorados)
        )


def _coletar_locais(
    raiz: Path, manifests: list[Path]
) -> list[dict[str, Any]]:
    locais_existentes = sorted((raiz / "projects").glob("*/project.local.json"))
    sem_manifesto = [
        caminho
        for caminho in locais_existentes
        if not (caminho.parent / "project.json").is_file()
    ]
    if sem_manifesto:
        raise ErroContrato(
            "project.local.json sem project.json correspondente: "
            + ", ".join(map(str, sem_manifesto))
        )
    if not locais_existentes:
        raise ErroContrato(
            "--incluir-local foi usado, mas nenhum project.local.json foi encontrado; "
            "o catálogo local existente não será sobrescrito"
        )

    _verificar_ignorados_pelo_git(
        raiz,
        [*locais_existentes, raiz / "data" / "catalogo-projetos.local.json"],
    )
    manifests_por_pasta = {caminho.parent: caminho for caminho in manifests}
    locais: list[dict[str, Any]] = []
    erros: list[str] = []
    for caminho in locais_existentes:
        try:
            project_id = _ler_json(manifests_por_pasta[caminho.parent])["id"]
            local = _ler_json(caminho)
            _validar_local(local, project_id, caminho)
            local = {**local, "id": project_id}
            locais.append(local)
        except (ErroContrato, KeyError) as exc:
            erros.append(str(exc))
    if erros:
        raise ErroContrato("\n- ".join(["manifests locais inválidos:", *erros]))
    locais.sort(key=lambda item: item["id"])
    return locais


def _escrever_json_atomico(caminho: Path, conteudo: dict[str, Any]) -> None:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    temporario = caminho.with_name(f".{caminho.name}.tmp")
    texto = json.dumps(conteudo, ensure_ascii=False, indent=2) + "\n"
    try:
        temporario.write_text(texto, encoding="utf-8", newline="\n")
        os.replace(temporario, caminho)
    finally:
        if temporario.exists():
            temporario.unlink()


def _criar_parser() -> argparse.ArgumentParser:
    raiz_padrao = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(
        description="Valida projects/*/project.json e gera o catálogo Megabrain."
    )
    parser.add_argument(
        "--raiz",
        type=Path,
        default=raiz_padrao,
        help=f"raiz do workspace (padrão: {raiz_padrao})",
    )
    parser.add_argument(
        "--somente-validar",
        action="store_true",
        help="valida sem escrever arquivos de catálogo",
    )
    parser.add_argument(
        "--incluir-local",
        action="store_true",
        help="também consolida project.local.json (deve estar ignorado pelo Git)",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = _criar_parser().parse_args(argv)
    raiz = args.raiz.expanduser().resolve()
    try:
        projetos, manifests = _coletar_projetos(raiz)
        locais = _coletar_locais(raiz, manifests) if args.incluir_local else None
    except ErroContrato as exc:
        print(f"ERRO: {exc}", file=sys.stderr)
        return 1

    atualizado_em = datetime.now().astimezone().isoformat(timespec="seconds")
    catalogo = {
        "versao": 1,
        "atualizado_em": atualizado_em,
        "projetos": projetos,
    }
    catalogo_local = (
        {
            "versao": 1,
            "atualizado_em": atualizado_em,
            "projetos": locais,
        }
        if locais is not None
        else None
    )

    if not args.somente_validar:
        _escrever_json_atomico(raiz / "data" / "catalogo-projetos.json", catalogo)
        if catalogo_local is not None:
            _escrever_json_atomico(
                raiz / "data" / "catalogo-projetos.local.json", catalogo_local
            )

    acao = "validados" if args.somente_validar else "sincronizados"
    complemento = f"; {len(locais)} locais" if locais is not None else ""
    print(f"OK: {len(projetos)} projetos {acao}{complemento}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
