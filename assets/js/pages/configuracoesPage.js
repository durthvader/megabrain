// ============================================================
// MEGABRAIN — pages/configuracoesPage.js
// Monitoramento de bases e armazenamento, sem gestão de demandas.
// ============================================================

import "../main.js";
import { supabase, configuracaoPreenchida } from "../supabaseClient.js";
import { listarBasesDisponiveis } from "../services/baseService.js";
import { formatarBytes } from "../services/catalogoService.js";
import { formatarNumero } from "../utils/formatadores.js";

const statusConexao = document.getElementById("status-conexao");

function preencher(id, valor) {
  document.getElementById(id).textContent = valor;
}

async function testarConexao() {
  statusConexao.textContent = "Testando…";
  statusConexao.className = "badge";

  if (!configuracaoPreenchida()) {
    statusConexao.textContent = "Não configurado";
    statusConexao.className = "badge badge-pendente";
    return false;
  }

  try {
    const { error } = await supabase.from("bases").select("id", { count: "exact", head: true });
    if (error) throw error;
    statusConexao.textContent = "Conectado";
    statusConexao.className = "badge badge-ativa";
    return true;
  } catch (erro) {
    statusConexao.textContent = "Falha";
    statusConexao.className = "badge badge-pendente";
    document.getElementById("status-uso").textContent = erro.message;
    return false;
  }
}

async function carregarUso() {
  try {
    const bases = await listarBasesDisponiveis();
    const linhas = bases.reduce((total, base) => total + Number(base.qtd_linhas || 0), 0);
    const tamanho = bases.reduce((total, base) => total + Number(base.tamanho_bytes || 0), 0);
    const originais = bases.filter((base) => Boolean(base.caminho_storage)).length;

    preencher("contagem-bases", formatarNumero(bases.length));
    preencher("contagem-linhas", formatarNumero(linhas));
    preencher("contagem-tamanho", formatarBytes(tamanho));
    preencher("contagem-originais", formatarNumero(originais));
    preencher("status-uso", "Os valores representam os metadados registrados no Supabase.");
  } catch (erro) {
    ["contagem-bases", "contagem-linhas", "contagem-tamanho", "contagem-originais"].forEach(
      (id) => preencher(id, "—")
    );
    preencher("status-uso", `Não foi possível carregar o uso: ${erro.message}`);
  }
}

document.getElementById("btn-testar-conexao").addEventListener("click", async () => {
  if (await testarConexao()) await carregarUso();
});

testarConexao().then((conectado) => conectado && carregarUso());
