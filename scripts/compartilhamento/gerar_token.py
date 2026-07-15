#!/usr/bin/env python3
"""Gera identificadores locais para links não listados de projetos."""

from __future__ import annotations

import argparse
import secrets


ALFABETO = "abcdefghjkmnpqrstuvwxyz23456789"
TAMANHO_PADRAO = 16


def gerar_token(tamanho: int = TAMANHO_PADRAO) -> str:
    """Retorna um token aleatório sem caracteres visualmente ambíguos."""
    if not 8 <= tamanho <= 64:
        raise ValueError("o tamanho deve ficar entre 8 e 64 caracteres")
    return "".join(secrets.choice(ALFABETO) for _ in range(tamanho))


def criar_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Gera um token para compor o endereço não listado de um projeto. "
            "Guarde somente a URL final em project.local.json."
        )
    )
    parser.add_argument(
        "--tamanho",
        type=int,
        default=TAMANHO_PADRAO,
        help=f"quantidade de caracteres (padrão: {TAMANHO_PADRAO})",
    )
    parser.add_argument(
        "--quantidade",
        type=int,
        default=1,
        help="quantidade de tokens a gerar (padrão: 1)",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = criar_parser().parse_args(argv)
    if not 1 <= args.quantidade <= 100:
        raise SystemExit("--quantidade deve ficar entre 1 e 100")
    try:
        tokens = [gerar_token(args.tamanho) for _ in range(args.quantidade)]
    except ValueError as exc:
        raise SystemExit(str(exc)) from exc
    print("\n".join(tokens))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
