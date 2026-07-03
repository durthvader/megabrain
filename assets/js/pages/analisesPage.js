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
      if (selectDemanda.value === demandaUrl) await carregarAnalises();
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

selectDemanda.addEventListener("change", carregarAnalises);
carregarDemandas();
