#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sobe os sandboxes de `projects/` para repositórios privados no GitHub.

    python scripts\\subir_projetos.py                 # todos os que já têm commit
    python scripts\\subir_projetos.py reparos         # só um

Cada sandbox tem git próprio: o `megabrain` é público e ignora `projects/*/`,
então o código de cada projeto precisa do seu próprio repositório privado.

O script tenta criar o repositório pela API. Se o token não tiver permissão de
**Administration: Read and write** (é o caso do PAT atual, que só lê), ele diz
exatamente o que criar na mão e segue para o push assim que o repositório existir.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import requests

RAIZ = Path(__file__).resolve().parents[1]
DONO = "durthvader"

# Descrição de cada sandbox que vira repositório. bnb-dossie já é `painel-bnb`.
PROJETOS = {
    "bnb-fase2": "Portal da CMO para os 115 novos postos do BNB (fase 2)",
    "reparos": "Painel de reparos da CMO: telão, gestão e fila",
    "databricks": "Camada de acesso ao lakehouse: dbx.py, inventário e mapa do Atrix",
}


def carregar_env() -> dict[str, str]:
    valores: dict[str, str] = {}
    arquivo = RAIZ / ".env"
    if arquivo.exists():
        for linha in arquivo.read_text(encoding="utf-8").splitlines():
            linha = linha.strip()
            if linha and not linha.startswith("#") and "=" in linha:
                chave, valor = linha.split("=", 1)
                valores[chave.strip()] = valor.strip()
    return valores


def git(pasta: Path, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(["git", *args], cwd=pasta, capture_output=True, text=True,
                          encoding="utf-8", errors="replace")


def existe_no_github(nome: str, cabecalho: dict) -> bool:
    r = requests.get(f"https://api.github.com/repos/{DONO}/{nome}", headers=cabecalho, timeout=60)
    return r.status_code == 200


def criar_no_github(nome: str, descricao: str, cabecalho: dict) -> bool:
    r = requests.post("https://api.github.com/user/repos", headers=cabecalho,
                      json={"name": nome, "private": True, "description": descricao},
                      timeout=60)
    if r.status_code == 201:
        print(f"  repositorio privado criado: {DONO}/{nome}")
        return True
    if r.status_code == 403:
        print(f"  o token nao pode criar repositorio (403). Crie em branco, privado, com o nome")
        print(f"  '{nome}' em https://github.com/new e rode este script de novo.")
        return False
    print(f"  falha ao criar ({r.status_code}): {r.text[:200]}")
    return False


def subir(nome: str, token: str, cabecalho: dict) -> bool:
    pasta = RAIZ / "projects" / nome
    print(f"\n{nome}:")
    if not (pasta / ".git").exists():
        print("  ainda nao tem git proprio; rode git init e o primeiro commit antes.")
        return False
    if git(pasta, "rev-parse", "HEAD").returncode != 0:
        print("  git existe mas nao tem commit nenhum.")
        return False

    if not existe_no_github(nome, cabecalho) and not criar_no_github(nome, PROJETOS[nome], cabecalho):
        return False

    # O token vai só neste comando; nunca gravado no .git/config do projeto.
    url = f"https://{token}@github.com/{DONO}/{nome}.git"
    atual = git(pasta, "remote", "get-url", "origin")
    if atual.returncode != 0:
        git(pasta, "remote", "add", "origin", f"https://github.com/{DONO}/{nome}.git")

    ramo = git(pasta, "rev-parse", "--abbrev-ref", "HEAD").stdout.strip() or "main"
    if ramo != "main":
        git(pasta, "branch", "-M", "main")
        ramo = "main"

    envio = git(pasta, "push", "-u", url, f"{ramo}:main")
    if envio.returncode != 0:
        print("  falha no push:", (envio.stderr or envio.stdout).strip()[:300])
        return False
    print(f"  enviado: https://github.com/{DONO}/{nome} (privado)")
    return True


def main() -> int:
    env = carregar_env()
    token = env.get("GITHUB_PAT")
    if not token:
        print("GITHUB_PAT nao esta no .env da raiz.", file=sys.stderr)
        return 1
    cabecalho = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}

    alvos = sys.argv[1:] or list(PROJETOS)
    desconhecidos = [a for a in alvos if a not in PROJETOS]
    if desconhecidos:
        print("nao conheco:", ", ".join(desconhecidos), file=sys.stderr)
        return 1

    resultados = [subir(nome, token, cabecalho) for nome in alvos]
    print(f"\n{sum(resultados)} de {len(resultados)} no ar.")
    return 0 if all(resultados) else 1


if __name__ == "__main__":
    raise SystemExit(main())
