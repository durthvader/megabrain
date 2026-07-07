// ============================================================
// MEGABRAIN — pages/resultadosPage.js
// Cards com o link de resultado público de cada demanda.
// ============================================================

import "../main.js";
import { listarDemandas } from "../services/demandaService.js";
import { montarLinkPublico } from "../utils/tokens.js";
import { mostrarErro } from "../utils/mensagens.js";

const gradeDemandas = document.getElementById("grade-demandas");
const placeholderVazio = document.getElementById("demandas-vazio");

const ICONES_TIPO = {
  escala: "🗓️",
  custos: "💰",
  indicadores: "📈",
  formulario: "📝",
  analise_livre: "🔎",
};

function montarCard(demanda) {
  const link = document.createElement("a");
  link.className = "card-acesso";
  link.href = montarLinkPublico(demanda);
  link.target = "_blank";
  link.rel = "noopener";
  link.innerHTML = `
    <div class="card-acesso-icone">${ICONES_TIPO[demanda.tipo] || "📄"}</div>
    <div class="card-acesso-titulo">${demanda.nome}</div>
    <div class="card-acesso-descricao">${demanda.tipo}${demanda.responsavel ? " · " + demanda.responsavel : ""}</div>
  `;
  return link;
}

async function carregar() {
  try {
    const demandas = await listarDemandas();
    gradeDemandas.innerHTML = "";
    placeholderVazio.classList.toggle("oculto", demandas.length > 0);
    for (const demanda of demandas) {
      gradeDemandas.appendChild(montarCard(demanda));
    }
  } catch (erro) {
    mostrarErro(`Erro ao listar demandas: ${erro.message}`);
  }
}

carregar();
