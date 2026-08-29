#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sobe os sandboxes de `projects/` para repositórios privados no GitHub.

    python scripts\\subir_projetos.py                 # todos os que já têm commit
    python scripts\\subir_projetos.py reparos         # só um

Cada sandbox tem git próprio: o `megabrain` é público e ignora `projects/*/`,
então o código de cada projeto precisa do seu próprio repositório privado.

O push usa o gerenciador de credenciais do Git (o mesmo login que já publica no
`painel-bnb`), não o PAT do `.env`: os PATs da conta são fine-grained e enxergam
só uma lista fixa de repositórios, então dão 404 em repositório novo. O script
não cria o repositório — crie vazio e privado em https://github.com/new com o
nome exato da tabela abaixo, e rode.
"""
from __future__ import annotations

import subprocess
import sys
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


def subir(nome: str) -> bool:
    pasta = RAIZ / "projects" / nome
    url = f"https://github.com/{DONO}/{nome}.git"
    print(f"\n{nome}:")
    if not (pasta / ".git").exists() or git(pasta, "rev-parse", "HEAD").returncode != 0:
        print("  ainda nao tem git proprio com commit; rode git init e o primeiro commit.")
        return False

    if git(pasta, "ls-remote", url).returncode != 0:
        print(f"  repositorio nao encontrado. Crie vazio e privado como '{nome}'")
        print("  em https://github.com/new e rode de novo.")
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
