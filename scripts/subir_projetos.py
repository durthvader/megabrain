#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sobe os sandboxes de `projects/` para repositórios privados no GitHub.

    python scripts\\subir_projetos.py                 # todos os que já têm commit
    python scripts\\subir_projetos.py reparos         # só um

Cada sandbox tem git próprio: o `megabrain` é público e ignora `projects/*/`,
então o código de cada projeto precisa do seu próprio repositório privado.

O push usa o gerenciador de credenciais do Git (o mesmo login que já publica no
`painel-bnb`), não o PAT do `.env`: os PATs da conta são fine-grained e enxergam
só uma lista fixa de repositórios, então dão 404 em repositório novo. O mesmo
vale para criar: `POST /user/repos` com esses PATs volta 403, e a criação sai
pelo token do gerenciador, que é OAuth e tem a conta inteira.

Repositório que ainda não existe é criado aqui, vazio e privado, com a descrição
da tabela abaixo. Antes valia a pena abrir https://github.com/new à mão porque
era uma vez por sandbox; virou a etapa que fazia o script parar no meio de um
push que ele já sabia fazer.
"""
from __future__ import annotations

import json
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
DONO = "durthvader"

# Descrição de cada sandbox que vira repositório. bnb-dossie já é `painel-bnb`.
PROJETOS = {
    "bnb-fase2": "Portal da CMO para os 115 novos postos do BNB (fase 2)",
    "reparos": "Painel de reparos da CMO: telão, gestão e fila",
    "databricks": "Camada de acesso ao lakehouse: dbx.py, inventário e mapa do Atrix",
    "acompanhamento-implantacao": "Painel LD/FTTA que aposentou o Acompanhamento26.xlsx",
    "fust": "Portal do programa FUST/BNDES: preenchimento, gerencial e executivo",
}


def git(pasta: Path, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(["git", *args], cwd=pasta, capture_output=True, text=True,
                          encoding="utf-8", errors="replace")


# O que o `git credential fill` espera na entrada: os pares do pedido e uma
# linha em branco fechando o bloco.
PEDIDO_CREDENCIAL = "protocol=https\nhost=github.com\n\n"


def token_do_gerenciador() -> str | None:
    """O token que o Git já usa para falar com o GitHub nesta máquina.

    `git credential fill` lê o gerenciador de credenciais do Windows e devolve
    o mesmo `gho_...` dos pushes. Com o cofre vazio ele abriria um prompt e o
    script ficaria pendurado esperando alguém digitar, por isso o timeout.
    """
    try:
        r = subprocess.run(["git", "credential", "fill"],
                           input=PEDIDO_CREDENCIAL,
                           capture_output=True, text=True, timeout=20,
                           encoding="utf-8", errors="replace")
    except subprocess.TimeoutExpired:
        return None
    for linha in r.stdout.splitlines():
        if linha.startswith("password="):
            return linha.split("=", 1)[1].strip()
    return None


def criar_repo(nome: str, descricao: str) -> bool:
    token = token_do_gerenciador()
    if not token:
        print("  nao achei credencial do github no gerenciador do Git.")
        print(f"  crie '{nome}' vazio e privado em https://github.com/new e rode de novo.")
        return False

    corpo = json.dumps({"name": nome, "description": descricao, "private": True}).encode()
    req = urllib.request.Request(
        "https://api.github.com/user/repos", data=corpo, method="POST",
        headers={"Authorization": f"Bearer {token}",
                 "Accept": "application/vnd.github+json",
                 "Content-Type": "application/json",
                 "User-Agent": "megabrain-subir-projetos"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            criado = json.load(resp)
        print(f"  repositorio criado: {criado['full_name']} (privado)")
        return True
    except urllib.error.HTTPError as erro:
        detalhe = erro.read().decode("utf-8", "replace")[:200]
        print(f"  falha ao criar ({erro.code}): {detalhe}")
        # 403 aqui é token sem permissao de administracao; 422 costuma ser
        # nome ja em uso por um repositorio que o token nao enxerga.
        print(f"  crie '{nome}' vazio e privado em https://github.com/new e rode de novo.")
        return False
    except urllib.error.URLError as erro:
        print(f"  falha ao criar: {erro.reason}")
        return False


def subir(nome: str) -> bool:
    pasta = RAIZ / "projects" / nome
    url = f"https://github.com/{DONO}/{nome}.git"
    print(f"\n{nome}:")
    if not (pasta / ".git").exists() or git(pasta, "rev-parse", "HEAD").returncode != 0:
        print("  ainda nao tem git proprio com commit; rode git init e o primeiro commit.")
        return False

    if git(pasta, "ls-remote", url).returncode != 0:
        print("  repositorio nao encontrado, criando...")
        if not criar_repo(nome, PROJETOS[nome]):
            return False

    if git(pasta, "remote", "get-url", "origin").returncode != 0:
        git(pasta, "remote", "add", "origin", url)
    if git(pasta, "rev-parse", "--abbrev-ref", "HEAD").stdout.strip() != "main":
        git(pasta, "branch", "-M", "main")

    envio = git(pasta, "push", "-u", "origin", "main")
    if envio.returncode != 0:
        print("  falha no push:", (envio.stderr or envio.stdout).strip()[:300])
        return False
    print(f"  no ar: https://github.com/{DONO}/{nome} (privado)")
    return True


def main() -> int:
    alvos = sys.argv[1:] or list(PROJETOS)
    desconhecidos = [a for a in alvos if a not in PROJETOS]
    if desconhecidos:
        print("nao conheco:", ", ".join(desconhecidos), file=sys.stderr)
        return 1

    resultados = [subir(nome) for nome in alvos]
    print(f"\n{sum(resultados)} de {len(resultados)} no ar.")
    return 0 if all(resultados) else 1


if __name__ == "__main__":
    raise SystemExit(main())
