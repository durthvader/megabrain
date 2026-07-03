// ============================================================
// MEGABRAIN — pages/demandasPage.js
// Criação e listagem de demandas, com token e link públicos.
// ============================================================

import "../main.js";
import { criarDemanda, listarDemandas, arquivarDemanda } from "../services/demandaService.js";
import { montarLinkPublico } from "../utils/tokens.js";
import { formatarDataBR } from "../utils/datas.js";
import { formatarStatus } from "../utils/formatadores.js";
import { mostrarSucesso, mostrarErro } from "../utils/mensagens.js";

const formulario = document.getElementById("form-demanda");
const corpoTabela = document.getElementById("tabela-demandas-corpo");
const placeholderVazio = document.getElementById("demandas-vazio");

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
      ? `${formatarDataBR(demanda.data_inicio) || "…"} → ${formatarDataBR(demanda.data_fim) || "…"}`
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
    const demandas = await listarDemandas();
    corpoTabela.innerHTML = "";

    placeholderVazio.classList.toggle("oculto", demandas.length > 0);
    for (const demanda of demandas) {
      corpoTabela.appendChild(montarLinhaTabela(demanda));
    }
  } catch (erro) {
    mostrarErro(`Erro ao listar demandas: ${erro.message}`);
  }
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const dadosFormulario = new FormData(formulario);

  try {
    const demanda = await criarDemanda({
      nome: dadosFormulario.get("nome").trim(),
      tipo: dadosFormulario.get("tipo"),
      descricao: dadosFormulario.get("descricao").trim(),
      responsavel: dadosFormulario.get("responsavel").trim(),
      data_inicio: dadosFormulario.get("data_inicio") || null,
      data_fim: dadosFormulario.get("data_fim") || null,
    });

    mostrarSucesso(`Demanda criada. Token público: ${demanda.token_publico}`);
    formulario.reset();
    await carregarLista();
  } catch (erro) {
    mostrarErro(`Erro ao criar demanda: ${erro.message}`);
  }
});

carregarLista();
