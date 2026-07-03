// ============================================================
// MEGABRAIN — pages/planosPage.js
// Gestão simples de planos de ação por demanda.
// ============================================================

import "../main.js";
import { listarDemandas } from "../services/demandaService.js";
import {
  criarPlano,
  listarPlanosPorDemanda,
  atualizarPlano,
  alterarStatusPlano,
  STATUS_PLANO,
} from "../services/planoService.js";
import { formatarDataBR } from "../utils/datas.js";
import { formatarStatus } from "../utils/formatadores.js";
import { obterParametroUrl } from "../utils/tokens.js";
import { mostrarSucesso, mostrarErro, mostrarAviso } from "../utils/mensagens.js";

const selectDemanda = document.getElementById("select-demanda");
const formulario = document.getElementById("form-plano");
const campoIdEdicao = document.getElementById("plano-id-edicao");
const tituloFormulario = document.getElementById("titulo-form-plano");
const botaoCancelarEdicao = document.getElementById("btn-cancelar-edicao");
const corpoTabela = document.getElementById("tabela-planos-corpo");
const placeholderVazio = document.getElementById("planos-vazio");
const filtroStatus = document.getElementById("filtro-status");
const filtroResponsavel = document.getElementById("filtro-responsavel");

let planosAtuais = [];

async function carregarDemandas() {
  try {
    const demandas = await listarDemandas();
    selectDemanda.innerHTML = '<option value="">Selecione…</option>';
    for (const demanda of demandas) {
      const opcao = document.createElement("option");
      opcao.value = demanda.id;
      opcao.textContent = `${demanda.nome} (${demanda.tipo})`;
      selectDemanda.appendChild(opcao);
    }

    const demandaUrl = obterParametroUrl("demanda");
    if (demandaUrl) {
      selectDemanda.value = demandaUrl;
      if (selectDemanda.value === demandaUrl) await carregarPlanos();
    }
  } catch (erro) {
    mostrarErro(`Erro ao carregar demandas: ${erro.message}`);
  }
}

function montarSelectStatus(plano) {
  const select = document.createElement("select");
  for (const status of STATUS_PLANO) {
    const opcao = document.createElement("option");
    opcao.value = status;
    opcao.textContent = formatarStatus(status);
    select.appendChild(opcao);
  }
  select.value = plano.status;
  select.addEventListener("change", async () => {
    try {
      await alterarStatusPlano(plano.id, select.value);
      mostrarSucesso("Status atualizado.");
      await carregarPlanos();
    } catch (erro) {
      mostrarErro(`Erro ao atualizar status: ${erro.message}`);
    }
  });
  return select;
}

function preencherFormularioParaEdicao(plano) {
  campoIdEdicao.value = plano.id;
  formulario.elements.tema.value = plano.tema || "";
  formulario.elements.problema.value = plano.problema || "";
  formulario.elements.causa.value = plano.causa || "";
  formulario.elements.acao.value = plano.acao || "";
  formulario.elements.responsavel.value = plano.responsavel || "";
  formulario.elements.prazo.value = plano.prazo || "";
  formulario.elements.impacto_esperado.value = plano.impacto_esperado || "";
  formulario.elements.impacto_realizado.value = plano.impacto_realizado || "";
  formulario.elements.observacao.value = plano.observacao || "";
  tituloFormulario.textContent = "Editar plano de ação";
  botaoCancelarEdicao.classList.remove("oculto");
  formulario.scrollIntoView({ behavior: "smooth", block: "start" });
}

function sairDoModoEdicao() {
  campoIdEdicao.value = "";
  formulario.reset();
  tituloFormulario.textContent = "Novo plano de ação";
  botaoCancelarEdicao.classList.add("oculto");
}

function renderizarTabela() {
  const status = filtroStatus.value;
  const responsavel = filtroResponsavel.value.trim().toLowerCase();

  const visiveis = planosAtuais.filter(
    (plano) =>
      (!status || plano.status === status) &&
      (!responsavel || (plano.responsavel || "").toLowerCase().includes(responsavel))
  );

  corpoTabela.innerHTML = "";
  placeholderVazio.classList.toggle("oculto", visiveis.length > 0);

  for (const plano of visiveis) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${plano.tema || "—"}</td>
      <td>${plano.problema || "—"}</td>
      <td>${plano.acao}</td>
      <td>${plano.responsavel || "—"}</td>
      <td>${formatarDataBR(plano.prazo) || "—"}</td>
      <td></td>
      <td></td>
    `;

    tr.children[5].appendChild(montarSelectStatus(plano));

    const botaoEditar = document.createElement("button");
    botaoEditar.className = "btn btn-pequeno";
    botaoEditar.textContent = "Editar";
    botaoEditar.addEventListener("click", () => preencherFormularioParaEdicao(plano));
    tr.children[6].appendChild(botaoEditar);

    corpoTabela.appendChild(tr);
  }
}

async function carregarPlanos() {
  const demandaId = selectDemanda.value;
  planosAtuais = [];
  if (!demandaId) {
    renderizarTabela();
    return;
  }

  try {
    planosAtuais = await listarPlanosPorDemanda(demandaId);
    renderizarTabela();
  } catch (erro) {
    mostrarErro(`Erro ao listar planos: ${erro.message}`);
  }
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const demandaId = selectDemanda.value;
  if (!demandaId) return mostrarAviso("Selecione a demanda antes de salvar.");

  const dados = new FormData(formulario);
  const registro = {
    tema: dados.get("tema").trim() || null,
    problema: dados.get("problema").trim() || null,
    causa: dados.get("causa").trim() || null,
    acao: dados.get("acao").trim(),
    responsavel: dados.get("responsavel").trim() || null,
    prazo: dados.get("prazo") || null,
    impacto_esperado: dados.get("impacto_esperado").trim() || null,
    impacto_realizado: dados.get("impacto_realizado").trim() || null,
    observacao: dados.get("observacao").trim() || null,
  };

  try {
    if (campoIdEdicao.value) {
      await atualizarPlano(campoIdEdicao.value, registro);
      mostrarSucesso("Plano atualizado.");
    } else {
      await criarPlano({ demanda_id: demandaId, ...registro });
      mostrarSucesso("Plano de ação criado.");
    }
    sairDoModoEdicao();
    await carregarPlanos();
  } catch (erro) {
    mostrarErro(`Erro ao salvar plano: ${erro.message}`);
  }
});

botaoCancelarEdicao.addEventListener("click", sairDoModoEdicao);
selectDemanda.addEventListener("change", () => {
  sairDoModoEdicao();
  carregarPlanos();
});
filtroStatus.addEventListener("change", renderizarTabela);
filtroResponsavel.addEventListener("input", renderizarTabela);

carregarDemandas();
