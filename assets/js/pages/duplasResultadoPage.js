// ============================================================
// MEGABRAIN — pages/duplasResultadoPage.js
// Resultado PÚBLICO de duplas: total, quem está em dupla/sozinho
// e quem ainda falta classificar, por GO/GA.
// duplas-resultado.html?token=TOKEN
// ============================================================

import { buscarDemandaPorToken } from "../services/demandaService.js";
import {
  carregarDadosDuplas,
  listarGOs,
  listarGAs,
  montarResumoPorGA,
  montarTotais,
  montarLinhasExportacao,
} from "../services/duplasService.js";
import { obterParametroUrl } from "../utils/tokens.js";
import { preencherSelect } from "../utils/filtros.js";
import { baixarCsv } from "../utils/csv.js";
import { mostrarSucesso, mostrarAviso } from "../utils/mensagens.js";

const blocoCarregando = document.getElementById("bloco-carregando");
const blocoErro = document.getElementById("bloco-erro");
const blocoResultado = document.getElementById("bloco-resultado");
const tituloDemanda = document.getElementById("titulo-demanda");
const linkPreencherDuplas = document.getElementById("link-preencher-duplas");

const filtroGo = document.getElementById("filtro-go");
const filtroGa = document.getElementById("filtro-ga");
const listaPendentes = document.getElementById("lista-gas-pendentes");
const pendentesVazio = document.getElementById("pendentes-vazio");
const contagemPendentes = document.getElementById("contagem-pendentes");
const listaConcluidos = document.getElementById("lista-gas-concluidos");
const concluidosVazio = document.getElementById("concluidos-vazio");
const contagemConcluidos = document.getElementById("contagem-concluidos");
const tabelaResumoCorpo = document.getElementById("tabela-resumo-corpo");
const botaoExportar = document.getElementById("btn-exportar-duplas");

let demandaAtual = null;
let hierarquia = [];
let duplas = [];
let solos = [];
let afastados = [];

// Esconde o cartão de KPI inteiro quando o valor é zero — só total de
// pessoas fica sempre visível, mesmo que os demais números sejam 0.
function preencherKpi(id, valor, { ocultarSeZero = true } = {}) {
  const elemento = document.getElementById(id);
  elemento.textContent = valor;
  elemento.closest(".kpi").classList.toggle("oculto", ocultarSeZero && !valor);
}

function mostrarErroToken(mensagem) {
  blocoCarregando.classList.add("oculto");
  blocoResultado.classList.add("oculto");
  blocoErro.classList.remove("oculto");
  document.getElementById("mensagem-erro-token").textContent = mensagem;
}

function montarCardGA(grupo) {
  const cartao = document.createElement("div");
  const completo = grupo.faltando.length === 0;
  cartao.className = `cartao-item duplas-cartao-ga ${completo ? "duplas-cartao-completo" : "duplas-cartao-pendente"}`;

  const tagManual = (r) => {
    const manuais = r.dados?.adicionado_manualmente || [];
    return manuais.length ? ` <span class="texto-erro">(manual: ${manuais.join(", ")})</span>` : "";
  };

  const linhasDuplas = grupo.duplas
    .map((r) => `<li>${r.tecnico} + ${r.dados?.parceiro || "?"}${tagManual(r)}</li>`)
    .join("");
  const linhasSolos = grupo.solos.map((r) => `<li>${r.tecnico} — sozinho${tagManual(r)}</li>`).join("");
  const linhasAfastados = grupo.afastados
    .map((r) => `<li>${r.tecnico} — afastado/desligado${tagManual(r)}</li>`)
    .join("");
  const linhasFaltando = grupo.faltando.map((pessoa) => `<li>${pessoa.nome}</li>`).join("");

  // Só mostra as seções que têm gente — sem "Nenhum." nem "(0)" poluindo o card.
  const secoes = [
    grupo.faltando.length
      ? `<div class="duplas-bloco duplas-bloco-faltando">
           <dt>🔴 Faltando classificar (${grupo.faltando.length})</dt>
           <dd><ul>${linhasFaltando}</ul></dd>
         </div>`
      : "",
    grupo.duplas.length
      ? `<div class="duplas-bloco">
           <dt>Duplas (${grupo.duplas.length})</dt>
           <dd><ul>${linhasDuplas}</ul></dd>
         </div>`
      : "",
    grupo.solos.length
      ? `<div class="duplas-bloco">
           <dt>Sozinhos (${grupo.solos.length})</dt>
           <dd><ul>${linhasSolos}</ul></dd>
         </div>`
      : "",
    grupo.afastados.length
      ? `<div class="duplas-bloco">
           <dt>Afastados/desligados (${grupo.afastados.length})</dt>
           <dd><ul>${linhasAfastados}</ul></dd>
         </div>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  cartao.innerHTML = `
    <div class="cartao-item-topo">
      <h3>${grupo.ga}</h3>
      <span class="texto-mudo">GO: ${grupo.go}</span>
    </div>
    <span class="duplas-status-badge ${completo ? "badge-concluido" : "badge-pendente"}">
      ${completo ? "✅ Completo" : `⏳ Faltam ${grupo.faltando.length}`}
    </span>
    <dl>${secoes}</dl>
  `;
  return cartao;
}

function montarLinhaResumo(grupo) {
  const total = grupo.pessoas.length;
  const concluido = total - grupo.faltando.length;
  const percentual = total ? Math.round((concluido / total) * 100) : 0;
  const linha = document.createElement("tr");
  if (grupo.faltando.length === 0) linha.classList.add("duplas-linha-completa");
  linha.innerHTML = `
    <td>${grupo.go}</td>
    <td>${grupo.ga}</td>
    <td>${total}</td>
    <td>${concluido || "—"}</td>
    <td>${grupo.faltando.length || "—"}</td>
    <td>
      <div class="duplas-barra-progresso" title="${percentual}% concluído">
        <div class="duplas-barra-progresso-preenchida" style="width: ${percentual}%"></div>
        <span>${percentual}%</span>
      </div>
    </td>
  `;
  return linha;
}

function renderizar() {
  const resumo = montarResumoPorGA(hierarquia, duplas, solos, afastados).filter(
    (grupo) => (!filtroGo.value || grupo.go === filtroGo.value) && (!filtroGa.value || grupo.ga === filtroGa.value)
  );

  tabelaResumoCorpo.innerHTML = "";
  for (const grupo of resumo) {
    tabelaResumoCorpo.appendChild(montarLinhaResumo(grupo));
  }

  const pendentes = resumo.filter((grupo) => grupo.faltando.length > 0);
  const concluidos = resumo.filter((grupo) => grupo.faltando.length === 0);

  listaPendentes.innerHTML = "";
  pendentesVazio.classList.toggle("oculto", pendentes.length > 0);
  contagemPendentes.textContent = `(${pendentes.length})`;
  for (const grupo of pendentes) {
    listaPendentes.appendChild(montarCardGA(grupo));
  }

  listaConcluidos.innerHTML = "";
  concluidosVazio.classList.toggle("oculto", concluidos.length > 0);
  contagemConcluidos.textContent = `(${concluidos.length})`;
  for (const grupo of concluidos) {
    listaConcluidos.appendChild(montarCardGA(grupo));
  }
}

filtroGo.addEventListener("change", () => {
  preencherSelect(filtroGa, listarGAs(hierarquia, filtroGo.value), "Todos");
  renderizar();
});
filtroGa.addEventListener("change", renderizar);

botaoExportar.addEventListener("click", () => {
  if (!hierarquia.length) return mostrarAviso("Aguarde o carregamento do resultado.");
  const linhas = montarLinhasExportacao(hierarquia, duplas, solos, afastados);
  baixarCsv(`duplas_${demandaAtual?.nome || "resultado"}`, linhas);
  mostrarSucesso("Planilha exportada — abra com o Excel.");
});

async function iniciar() {
  const token = obterParametroUrl("token");
  if (!token) {
    mostrarErroToken("Link incompleto: o parâmetro ?token= não foi informado.");
    return;
  }

  let demanda;
  try {
    demanda = await buscarDemandaPorToken(token);
    demandaAtual = demanda;
  } catch (erro) {
    mostrarErroToken(`Erro ao consultar a demanda: ${erro.message}`);
    return;
  }

  if (!demanda) {
    mostrarErroToken("Token inválido ou demanda não encontrada. Confira o link recebido.");
    return;
  }

  if (demanda.tipo !== "duplas") {
    mostrarErroToken("Este link é de um resultado de duplas, mas a demanda informada não é do tipo duplas.");
    return;
  }

  tituloDemanda.textContent = demanda.nome;
  linkPreencherDuplas.href = `duplas-publica.html?token=${encodeURIComponent(token)}`;

  try {
    const dados = await carregarDadosDuplas(demanda.id);
    hierarquia = dados.hierarquia;
    duplas = dados.duplas;
    solos = dados.solos;
    afastados = dados.afastados;

    if (!hierarquia.length) {
      mostrarErroToken('Esta demanda ainda não tem uma base do tipo "hierarquia" cadastrada.');
      return;
    }

    const totais = montarTotais(hierarquia, duplas, solos, afastados);
    preencherKpi("kpi-total", totais.totalPessoas, { ocultarSeZero: false });
    preencherKpi("kpi-duplas", totais.totalDuplas);
    preencherKpi("kpi-sozinhos", totais.totalSozinhos);
    preencherKpi("kpi-afastados", totais.totalAfastados);
    preencherKpi("kpi-faltando", totais.totalFaltando);

    preencherSelect(filtroGo, listarGOs(hierarquia), "Todos");
    renderizar();

    blocoCarregando.classList.add("oculto");
    blocoResultado.classList.remove("oculto");
  } catch (erro) {
    mostrarErroToken(`Erro ao montar o resultado: ${erro.message}`);
  }
}

iniciar();
