from __future__ import annotations

import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path


RAIZ = Path(__file__).resolve().parents[1]
CAMINHO_MODULO = RAIZ / "scripts" / "projetos" / "gerenciar.py"
SPEC = importlib.util.spec_from_file_location("gerenciar_projetos", CAMINHO_MODULO)
assert SPEC and SPEC.loader
MODULO = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULO)


class GerenciarProjetosTest(unittest.TestCase):
    def setUp(self) -> None:
        self._temporario = tempfile.TemporaryDirectory()
        self.raiz = Path(self._temporario.name).resolve()

    def tearDown(self) -> None:
        self._temporario.cleanup()

    def criar(self, project_id: str, *, tipo: str = "pptx") -> Path:
        return MODULO.criar_projeto(
            project_id,
            titulo=f"Projeto {project_id}",
            descricao="Projeto usado pelo teste.",
            tipo=tipo,
            responsavel="Operações",
            status="backlog",
            tags=["teste", "operacao"],
            raiz=self.raiz,
            sincronizar=False,
        )

    def test_criacao_por_perfil_e_ordem_incremental(self) -> None:
        web = self.criar("portal-teste", tipo="portal")
        arquivo = self.criar("arquivo-teste", tipo="pptx")

        for nome in (
            "project.json",
            "project.local.json",
            "resources.local.json",
            "README.md",
        ):
            self.assertTrue((web / nome).is_file())
            self.assertTrue((arquivo / nome).is_file())

        for relativa in ("src", "data/private", "data/public", "public"):
            self.assertTrue((web / relativa).is_dir(), relativa)
        self.assertFalse((web / "deliverables").exists())

        for relativa in ("src", "data/private", "deliverables"):
            self.assertTrue((arquivo / relativa).is_dir(), relativa)
        self.assertFalse((arquivo / "public").exists())
        self.assertFalse((arquivo / "data/public").exists())

        manifesto_web = json.loads((web / "project.json").read_text(encoding="utf-8"))
        manifesto_arquivo = json.loads(
            (arquivo / "project.json").read_text(encoding="utf-8")
        )
        self.assertEqual(10, manifesto_web["ordem"])
        self.assertEqual(20, manifesto_arquivo["ordem"])
        self.assertEqual(["teste", "operacao"], manifesto_web["tags"])
        recursos = json.loads(
            (web / "resources.local.json").read_text(encoding="utf-8")
        )
        self.assertEqual([], recursos["external_resources"])

    def test_criacao_recusa_sobrescrita(self) -> None:
        alvo = self.criar("nao-sobrescrever")
        marcador = alvo / "marcador.txt"
        marcador.write_text("preservar", encoding="utf-8")

        with self.assertRaises(MODULO.ErroGerenciamento):
            self.criar("nao-sobrescrever")

        self.assertEqual("preservar", marcador.read_text(encoding="utf-8"))

    def test_criacao_recusa_traversal_e_ids_invalidos(self) -> None:
        invalidos = (
            "../fora",
            "projeto/filho",
            r"projeto\filho",
            "Projeto",
            ".",
            "a..b",
            "-inicio",
            "fim-",
        )
        for project_id in invalidos:
            with self.subTest(project_id=project_id):
                with self.assertRaises(MODULO.ErroGerenciamento):
                    self.criar(project_id)
        self.assertFalse((self.raiz.parent / "fora").exists())

    def test_exclusao_recusa_confirmacao_errada(self) -> None:
        alvo = self.criar("confirmacao")

        with self.assertRaises(MODULO.ErroGerenciamento):
            MODULO.excluir_projeto(
                "confirmacao",
                confirmar="outro-id",
                raiz=self.raiz,
                sincronizar=False,
            )

        self.assertTrue(alvo.is_dir())

    def test_recursos_externos_bloqueiam_ate_atestado_explicito(self) -> None:
        alvo = self.criar("com-recursos", tipo="ferramenta")
        inventario = {
            "version": 1,
            "project_id": "com-recursos",
            "external_resources": [
                {
                    "type": "supabase",
                    "reference": "demanda-teste",
                    "description": "Demanda externa do teste",
                }
            ],
        }
        (alvo / "resources.local.json").write_text(
            json.dumps(inventario), encoding="utf-8"
        )

        lista = MODULO.listar_projetos(self.raiz)
        self.assertTrue(lista[0]["exclusao_assistida"])
        with self.assertRaises(MODULO.ErroGerenciamento):
            MODULO.excluir_projeto(
                "com-recursos",
                confirmar="com-recursos",
                raiz=self.raiz,
                sincronizar=False,
            )
        self.assertTrue(alvo.exists())

        MODULO.excluir_projeto(
            "com-recursos",
            confirmar="com-recursos",
            recursos_externos_removidos=True,
            raiz=self.raiz,
            sincronizar=False,
        )
        self.assertFalse(alvo.exists())

    def test_inventario_vazio_nao_bloqueia_exclusao(self) -> None:
        alvo = self.criar("sem-recursos")

        MODULO.excluir_projeto(
            "sem-recursos",
            confirmar="sem-recursos",
            raiz=self.raiz,
            sincronizar=False,
        )

        self.assertFalse(alvo.exists())

    def test_inventario_ausente_ou_malformado_falha_com_seguranca(self) -> None:
        casos = {
            "ausente": None,
            "tipo-errado": {
                "version": 1,
                "project_id": "tipo-errado",
                "external_resources": "",
            },
            "id-divergente": {
                "version": 1,
                "project_id": "outro-projeto",
                "external_resources": [],
            },
            "campo-mascarado": {
                "version": 1,
                "project_id": "campo-mascarado",
                "external_resources": [],
                "resources": [{"type": "supabase"}],
            },
        }
        for project_id, inventario in casos.items():
            with self.subTest(project_id=project_id):
                alvo = self.criar(project_id)
                caminho = alvo / "resources.local.json"
                if inventario is None:
                    caminho.unlink()
                else:
                    caminho.write_text(
                        json.dumps(inventario), encoding="utf-8"
                    )
                with self.assertRaises(MODULO.ErroGerenciamento):
                    MODULO.excluir_projeto(
                        project_id,
                        confirmar=project_id,
                        raiz=self.raiz,
                        sincronizar=False,
                    )
                self.assertTrue(alvo.exists())

    def test_exclusao_simples_nao_toca_projeto_irmao(self) -> None:
        apagar = self.criar("apagar")
        preservar = self.criar("preservar")
        marcador = preservar / "deliverables" / "resultado.txt"
        marcador.write_text("intacto", encoding="utf-8")

        MODULO.excluir_projeto(
            "apagar",
            confirmar="apagar",
            raiz=self.raiz,
            sincronizar=False,
        )

        self.assertFalse(apagar.exists())
        self.assertTrue(preservar.is_dir())
        self.assertEqual("intacto", marcador.read_text(encoding="utf-8"))

    def test_exclusao_do_ultimo_projeto_gera_catalogos_vazios(self) -> None:
        (self.raiz / ".gitignore").write_text(
            "projects/*/project.local.json\n"
            "data/catalogo-projetos.local.json\n",
            encoding="utf-8",
        )
        subprocess.run(
            ["git", "init", "--quiet"], cwd=self.raiz, check=True
        )
        self.criar("ultimo-projeto")
        MODULO._executar_sincronizador(self.raiz)

        MODULO.excluir_projeto(
            "ultimo-projeto",
            confirmar="ultimo-projeto",
            raiz=self.raiz,
        )

        publico = json.loads(
            (self.raiz / "data" / "catalogo-projetos.json").read_text(
                encoding="utf-8"
            )
        )
        local = json.loads(
            (self.raiz / "data" / "catalogo-projetos.local.json").read_text(
                encoding="utf-8"
            )
        )
        self.assertEqual([], publico["projetos"])
        self.assertEqual([], local["projetos"])

    def test_sincronizacao_vazia_acidental_preserva_catalogo(self) -> None:
        dados = self.raiz / "data"
        dados.mkdir()
        catalogo = dados / "catalogo-projetos.json"
        catalogo.write_text('{"marcador":"preservar"}\n', encoding="utf-8")

        with self.assertRaises(MODULO.ErroGerenciamento):
            MODULO._executar_sincronizador(self.raiz)

        self.assertEqual(
            '{"marcador":"preservar"}\n',
            catalogo.read_text(encoding="utf-8"),
        )


if __name__ == "__main__":
    unittest.main()
