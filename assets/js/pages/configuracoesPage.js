// ============================================================
// MEGABRAIN — pages/configuracoesPage.js
// Status da conexão, contagens de uso e rotinas de limpeza.
// ============================================================

import "../main.js";
import { supabase, configuracaoPreenchida } from "../supabaseClient.js";
import { listarDemandas } from "../services/demandaService.js";
import {
  estimarUsoLocal,
  limparDemanda,
  apagarDemandasArquivadas,
} from "../services/limpezaService.js";
import { formatarNumero } from "../utils/formatadores.js";
import { mostrarSucesso, mostrarErro, mostrarAviso } from "../utils/mensagens.js";

const statusConexao = document.getElementById("status-conexao");
const selectDemandaLimpeza = document.getElementById("select-demanda-limpeza");

async function testarConexao() {
  statusConexao.textContent = "Testando…";
  statusConexao.className = "badge";

  if (!configuracaoPreenchida()) {
    statusConexao.textContent = "config.js não preenchido";
    statusConexao.className = "badge badge-pendente";
    return;
  }

  try {
    const { error } = await supabase
      .from("demandas")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    statusConexao.textContent = "Conectado";
    statusConexao.className = "badge badge-ativa";
  } catch (erro) {
    statusConexao.textContent = `Falha: ${erro.message}`;
    statusConexao.className = "badge badge-pendente";
  }
}

async function carregarContagens() {
  try {
    const uso = await estimarUsoLocal();
    const preencher = (id, valor) => {
      document.getElementById(id).textContent = valor === null ? "—" : formatarNumero(valor);
    };

    preencher("contagem-demandas", uso.demandas);
    preencher("contagem-bases", uso.bases);
    preencher("contagem-linhas", uso.base_linhas);
    preencher("contagem-respostas", uso.formulario_respostas);
    preencher("contagem-analises", uso.analises);
    preencher("contagem-planos", uso.planos_acao);
    document.getElementById("contagem-estimativa").textContent = `~${uso.estimativa_mb} MB`;
  } catch (erro) {
    mostrarErro(`Erro ao carregar contagens: ${erro.message}`);
  }
}

async function carregarDemandasParaLimpeza() {
  try {
    const demandas = await listarDemandas();
    selectDemandaLimpeza.innerHTML = '<option value="">Selecione…</option>';
    for (const demanda of demandas) {
      const opcao = document.createElement("option");
      opcao.value = demanda.id;
      opcao.textContent = `${demanda.nome} (${demanda.status})`;
      selectDemandaLimpeza.appendChild(opcao);
    }
  } catch (erro) {
    mostrarErro(`Erro ao carregar demandas: ${erro.message}`);
  }
}

document.getElementById("btn-testar-conexao").addEventListener("click", testarConexao);

document.getElementById("btn-limpar-arquivadas").addEventListener("click", async () => {
  const confirmacao = window.prompt(
    "Isso apaga DEFINITIVAMENTE todas as demandas arquivadas e seus dados (bases, respostas, análises, planos, arquivos).\n\nExporte antes, se precisar. Digite LIMPAR para confirmar:"
  );
  if (confirmacao !== "LIMPAR") return mostrarAviso("Limpeza cancelada.");

  try {
    const quantidade = await apagarDemandasArquivadas();
    mostrarSucesso(`${quantidade} demanda(s) arquivada(s) apagada(s).`);
    await Promise.all([carregarContagens(), carregarDemandasParaLimpeza()]);
  } catch (erro) {
    mostrarErro(`Erro na limpeza: ${erro.message}`);
  }
});

document.getElementById("btn-limpar-demanda").addEventListener("click", async () => {
  const demandaId = selectDemandaLimpeza.value;
  if (!demandaId) return mostrarAviso("Selecione a demanda a limpar.");

  const confirmacao = window.prompt(
    "Isso apaga bases, linhas, respostas, análises, planos, logs e arquivos da demanda selecionada (a demanda em si permanece).\n\nDigite LIMPAR para confirmar:"
  );
  if (confirmacao !== "LIMPAR") return mostrarAviso("Limpeza cancelada.");

  try {
    await limparDemanda(demandaId);
    mostrarSucesso("Dados da demanda apagados.");
    await carregarContagens();
  } catch (erro) {
    mostrarErro(`Erro na limpeza: ${erro.message}`);
  }
});

testarConexao();
carregarContagens();
carregarDemandasParaLimpeza();
