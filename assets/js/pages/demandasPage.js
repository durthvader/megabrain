// ============================================================
// MEGABRAIN — pages/demandasPage.js
// Criação e listagem de demandas: período (com opção indeterminada),
// checklist de bases a vincular e link público de resultado.
// ============================================================

import "../main.js";
import { criarDemanda, listarDemandas, arquivarDemanda } from "../services/demandaService.js";
import { listarBasesDisponiveis, vincularBases } from "../services/baseService.js";
import { montarLinkPublico } from "../utils/tokens.js";
import { formatarDataBR } from "../utils/datas.js";
import { formatarStatus } from "../utils/formatadores.js";
import { mostrarSucesso, mostrarErro } from "../utils/mensagens.js";

const formulario = document.getElementById("form-demanda");
const corpoTabela = document.getElementById("tabela-demandas-corpo");
const placeholderVazio = document.getElementById("demandas-vazio");
const checkboxIndeterminada = document.getElementById("demanda-indeterminada");
const inputDataFim = document.getElementById("demanda-fim");
const inputFiltroBases = document.getElementById("filtro-bases-disponiveis");
const listaBasesDisponiveis = document.getElementById("lista-bases-disponiveis");
const filtroTipo = document.getElementById("filtro-tipo");
const filtroStatus = document.getElementById("filtro-status");

let basesDisponiveis = [];

async function copiarLink(demanda) {
  const link = montarLinkPublico(demanda);
  try {
    await navigator.clipboard.writeText(link);
    mostrarSucesso("Link público copiado para a área de transferência.");
  } catch {
    window.prompt("Copie o link público:", link);
  }
}

function montarLinhaTabela(demanda) {
  const tr = document.createElement("tr");

  const periodo =
    demanda.data_inicio || demanda.data_fim
      ? `${formatarDataBR(demanda.data_inicio) || "…"} → ${formatarDataBR(demanda.data_fim) || "indeterminada"}`
      : "—";

  tr.innerHTML = `
    <td><a href="demanda-detalhe.html?id=${demanda.id}">${demanda.nome}</a></td>
    <td>${demanda.tipo}</td>
    <td>${demanda.responsavel || "—"}</td>
    <td>${periodo}</td>
    <td><span class="badge badge-${demanda.status}">${formatarStatus(demanda.status)}</span></td>
    <td><code>${demanda.token_publico}</code></td>
    <td></td>
  `;

  const celulaAcoes = tr.lastElementChild;
  const acoes = document.createElement("div");
  acoes.className = "tabela-acoes";

  const botaoDetalhe = document.createElement("a");
  botaoDetalhe.className = "btn btn-pequeno";
  botaoDetalhe.href = `demanda-detalhe.html?id=${demanda.id}`;
  botaoDetalhe.textContent = "Detalhe";

  const botaoLink = document.createElement("button");
  botaoLink.className = "btn btn-pequeno";
  botaoLink.type = "button";
  botaoLink.textContent = "Copiar link";
  botaoLink.addEventListener("click", () => copiarLink(demanda));

  const botaoArquivar = document.createElement("button");
  botaoArquivar.className = "btn btn-pequeno";
  botaoArquivar.type = "button";
  botaoArquivar.textContent = "Arquivar";
  botaoArquivar.disabled = demanda.status === "arquivada";
  botaoArquivar.addEventListener("click", async () => {
    if (!window.confirm(`Arquivar a demanda "${demanda.nome}"?`)) return;
    try {
      await arquivarDemanda(demanda.id);
      mostrarSucesso("Demanda arquivada.");
      await carregarLista();
    } catch (erro) {
      mostrarErro(`Erro ao arquivar: ${erro.message}`);
    }
  });

  acoes.append(botaoDetalhe, botaoLink, botaoArquivar);
  celulaAcoes.appendChild(acoes);
  return tr;
}

async function carregarLista() {
  try {
    const demandas = await listarDemandas({
      tipo: filtroTipo.value || undefined,
      status: filtroStatus.value || undefined,
    });
    corpoTabela.innerHTML = "";

    placeholderVazio.classList.toggle("oculto", demandas.length > 0);
    for (const demanda of demandas) {
      corpoTabela.appendChild(montarLinhaTabela(demanda));
    }
  } catch (erro) {
    mostrarErro(`Erro ao listar demandas: ${erro.message}`);
  }
}

function renderizarChecklistBases(filtroTexto = "") {
  const texto = filtroTexto.trim().toLowerCase();
  const bases = basesDisponiveis.filter(
    (base) =>
      !texto ||
      base.nome_arquivo.toLowerCase().includes(texto) ||
      base.tipo_base.toLowerCase().includes(texto)
  );

  listaBasesDisponiveis.innerHTML = "";

  if (!basesDisponiveis.length) {
    listaBasesDisponiveis.innerHTML =
      '<p class="texto-mudo">Nenhuma base importada ainda. Suba uma em "Upload de bases".</p>';
    return;
  }
  if (!bases.length) {
    listaBasesDisponiveis.innerHTML = '<p class="texto-mudo">Nenhuma base corresponde ao filtro.</p>';
    return;
  }

  for (const base of bases) {
    const linha = document.createElement("div");
    linha.className = "campo campo-checkbox";
    linha.innerHTML = `
      <input type="checkbox" id="base-${base.id}" value="${base.id}" />
      <label for="base-${base.id}">${base.nome_arquivo} — ${base.tipo_base} (${base.qtd_linhas} linhas)</label>
    `;
    listaBasesDisponiveis.appendChild(linha);
  }
}

async function carregarBasesDisponiveis() {
  try {
    basesDisponiveis = await listarBasesDisponiveis();
    renderizarChecklistBases(inputFiltroBases.value);
  } catch (erro) {
    mostrarErro(`Erro ao listar bases disponíveis: ${erro.message}`);
  }
}

function baseIdsMarcados() {
  return [...listaBasesDisponiveis.querySelectorAll('input[type="checkbox"]:checked')].map(
    (input) => input.value
  );
}

checkboxIndeterminada.addEventListener("change", () => {
  inputDataFim.disabled = checkboxIndeterminada.checked;
  if (checkboxIndeterminada.checked) inputDataFim.value = "";
});

inputFiltroBases.addEventListener("input", () => renderizarChecklistBases(inputFiltroBases.value));

[filtroTipo, filtroStatus].forEach((select) => select.addEventListener("change", carregarLista));

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const dadosFormulario = new FormData(formulario);
  const baseIds = baseIdsMarcados();

  try {
    const demanda = await criarDemanda({
      nome: dadosFormulario.get("nome").trim(),
      tipo: dadosFormulario.get("tipo"),
      descricao: dadosFormulario.get("descricao").trim(),
      responsavel: dadosFormulario.get("responsavel").trim(),
      data_inicio: dadosFormulario.get("data_inicio") || null,
      data_fim: checkboxIndeterminada.checked ? null : dadosFormulario.get("data_fim") || null,
    });

    if (baseIds.length) {
      await vincularBases(demanda.id, baseIds);
    }

    const link = montarLinkPublico(demanda);
    mostrarSucesso(`Demanda criada. Link de resultado: ${link}`);
    formulario.reset();
    inputDataFim.disabled = false;
    renderizarChecklistBases();
    await carregarLista();
  } catch (erro) {
    mostrarErro(`Erro ao criar demanda: ${erro.message}`);
  }
});

carregarBasesDisponiveis();
carregarLista();
