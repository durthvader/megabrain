// ============================================================
// MEGABRAIN — pages/analisesPage.js
// Registro de análises por demanda (feitas manualmente ou com
// apoio do Codex/Claude no VS Code).
// ============================================================

import "../main.js";
import { listarDemandas } from "../services/demandaService.js";
import { salvarAnalise, listarAnalisesPorDemanda } from "../services/analiseService.js";
import { criarPlano } from "../services/planoService.js";
import { formatarDataBR } from "../utils/datas.js";
import { obterParametroUrl } from "../utils/tokens.js";
import { mostrarSucesso, mostrarErro, mostrarAviso } from "../utils/mensagens.js";

const selectDemanda = document.getElementById("select-demanda");
const formulario = document.getElementById("form-analise");
const lista = document.getElementById("lista-analises");
const placeholderVazio = document.getElementById("analises-vazio");
const secaoMenuDemandas = document.getElementById("secao-menu-demandas");
const secaoAnaliseDemanda = document.getElementById("secao-analise-demanda");
const gradeDemandas = document.getElementById("grade-demandas");
const menuDemandasVazio = document.getElementById("demandas-menu-vazio");
const analiseDemandaNome = document.getElementById("analise-demanda-nome");

const ICONES_TIPO = {
  escala: "🗓️",
  custos: "💰",
  indicadores: "📈",
  formulario: "📝",
  analise_livre: "🔎",
};

function montarCardDemanda(demanda) {
  const link = document.createElement("a");
  link.className = "card-acesso";
  link.href = `analises.html?demanda=${demanda.id}`;
  link.innerHTML = `
    <div class="card-acesso-icone">${ICONES_TIPO[demanda.tipo] || "🔎"}</div>
    <div class="card-acesso-titulo">${demanda.nome}</div>
    <div class="card-acesso-descricao">${demanda.tipo}${demanda.responsavel ? " · " + demanda.responsavel : ""}</div>
  `;
  return link;
}

const CAMPOS_TEXTO = [
  ["pergunta", "Pergunta"],
  ["resumo", "Resumo"],
  ["evidencias", "Evidências"],
  ["hipoteses", "Hipóteses"],
  ["sugestoes", "Sugestões"],
  ["proximos_passos", "Próximos passos"],
];

async function carregarDemandas() {
  try {
    const demandas = await listarDemandas();
    const demandaUrl = obterParametroUrl("demanda");

    gradeDemandas.innerHTML = "";
    menuDemandasVazio.classList.toggle("oculto", demandas.length > 0);
    for (const demanda of demandas) {
      gradeDemandas.appendChild(montarCardDemanda(demanda));
    }

    const demandaAtual = demandas.find((demanda) => String(demanda.id) === String(demandaUrl));
    if (demandaAtual) {
      secaoMenuDemandas.classList.add("oculto");
      secaoAnaliseDemanda.classList.remove("oculto");
      selectDemanda.value = demandaAtual.id;
      analiseDemandaNome.textContent = `— ${demandaAtual.nome}`;
      await carregarAnalises();
    } else {
      secaoMenuDemandas.classList.remove("oculto");
      secaoAnaliseDemanda.classList.add("oculto");
    }
  } catch (erro) {
    mostrarErro(`Erro ao carregar demandas: ${erro.message}`);
  }
}

function montarCartao(analise) {
  const cartao = document.createElement("div");
  cartao.className = "cartao-item";

  const detalhes = CAMPOS_TEXTO.filter(([campo]) => analise[campo])
    .map(([campo, rotulo]) => `<dt>${rotulo}</dt><dd>${analise[campo]}</dd>`)
    .join("");

  cartao.innerHTML = `
    <div class="cartao-item-topo">
      <h3>${analise.titulo}</h3>
      <span class="texto-mudo">${formatarDataBR(analise.criado_em)}</span>
    </div>
    <dl>${detalhes}</dl>
  `;

  if (analise.sugestoes) {
    const botaoPlano = document.createElement("button");
    botaoPlano.className = "btn btn-pequeno";
    botaoPlano.style.marginTop = "0.75rem";
    botaoPlano.textContent = "Transformar sugestão em plano de ação";
    botaoPlano.addEventListener("click", async () => {
      try {
        await criarPlano({
          demanda_id: analise.demanda_id,
          tema: analise.titulo,
          problema: analise.resumo || analise.pergunta || null,
          causa: analise.hipoteses || null,
          acao: analise.sugestoes,
        });
        mostrarSucesso("Plano de ação criado a partir da sugestão.");
      } catch (erro) {
        mostrarErro(`Erro ao criar plano: ${erro.message}`);
      }
    });
    cartao.appendChild(botaoPlano);
  }

  return cartao;
}

async function carregarAnalises() {
  const demandaId = selectDemanda.value;
  lista.innerHTML = "";
  placeholderVazio.classList.remove("oculto");
  if (!demandaId) return;

  try {
    const analises = await listarAnalisesPorDemanda(demandaId);
    placeholderVazio.classList.toggle("oculto", analises.length > 0);
    for (const analise of analises) {
      lista.appendChild(montarCartao(analise));
    }
  } catch (erro) {
    mostrarErro(`Erro ao listar análises: ${erro.message}`);
  }
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const demandaId = selectDemanda.value;
  if (!demandaId) return mostrarAviso("Selecione a demanda antes de salvar.");

  const dados = new FormData(formulario);
  try {
    await salvarAnalise({
      demanda_id: demandaId,
      titulo: dados.get("titulo").trim(),
      pergunta: dados.get("pergunta").trim() || null,
      resumo: dados.get("resumo").trim() || null,
      evidencias: dados.get("evidencias").trim() || null,
      hipoteses: dados.get("hipoteses").trim() || null,
      sugestoes: dados.get("sugestoes").trim() || null,
      proximos_passos: dados.get("proximos_passos").trim() || null,
    });
    mostrarSucesso("Análise salva.");
    formulario.reset();
    await carregarAnalises();
  } catch (erro) {
    mostrarErro(`Erro ao salvar análise: ${erro.message}`);
  }
});

carregarDemandas();
