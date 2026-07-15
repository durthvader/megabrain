from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


RAIZ = Path(__file__).resolve().parents[1]
CAMINHO_MODULO = RAIZ / "scripts" / "compartilhamento" / "gerar_token.py"
SPEC = importlib.util.spec_from_file_location("gerar_token", CAMINHO_MODULO)
assert SPEC and SPEC.loader
MODULO = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULO)


class GerarTokenTest(unittest.TestCase):
    def test_padrao_tem_16_caracteres_e_alfabeto_permitido(self) -> None:
        token = MODULO.gerar_token()
        self.assertEqual(16, len(token))
        self.assertTrue(set(token) <= set(MODULO.ALFABETO))

    def test_amostra_nao_repete_tokens(self) -> None:
        tokens = {MODULO.gerar_token() for _ in range(2_000)}
        self.assertEqual(2_000, len(tokens))

    def test_recusa_tamanho_fora_do_intervalo(self) -> None:
        for tamanho in (0, 7, 65):
            with self.subTest(tamanho=tamanho):
                with self.assertRaises(ValueError):
                    MODULO.gerar_token(tamanho)


if __name__ == "__main__":
    unittest.main()
