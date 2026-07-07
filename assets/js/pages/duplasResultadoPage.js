// ============================================================
// MEGABRAIN — pages/duplasResultadoPage.js
// Resultado PÚBLICO de duplas: total, quem está em dupla/sozinho
// e quem ainda falta classificar, por GO/GA.
// duplas-resultado.html?token=TOKEN
// ============================================================

import { buscarDemandaPorToken } from "../services/demandaService.js";
import { carregarDadosDuplas, listarGOs, listarGAs, montarResumoPorGA, montarTotais } from "../services/duplasService.js";
import { obterParametroUrl } from "../utils/tokens.js";
import { preencherSelect } from "../utils/filtros.js";

const blocoCarregando = document.getElementById("bloco-carregando");
const blocoErro = document.getElementById("bloco-erro");
const blocoResultado = document.getElementById("bloco-resultado");
const tituloDemanda = document.getElementById("titulo-demanda");
const linkPreencherDuplas = document.getElementById("link-preencher-duplas");

const filtroGo = document.getElementById("filtro-go");
const filtroGa = document.getElementById("filtro-ga");
const listaGAs = document.getElementById("lista-gas");
const gasVazio = document.getElementById("gas-vazio");

let hierarquia = [];
let duplas = [];
let solos = [];

function mostrarErroToken(mensagem) {
  blocoCarregando.classList.add("oculto");
  blocoResultado.classList.add("oculto");
  blocoErro.classList.remove("oculto");
  document.getElementById("mensagem-erro-token").textContent = mensagem;
}

function montarCardGA(grupo) {
  const cartao = document.createElement("div");
  cartao.className = "cartao-item";

  const linhasDuplas = grupo.duplas
    .map((r) => `<li>${r.tecnico} + ${r.dados?.parceiro || "?"}</li>`)
    .join("");
  const linhasSolos = grupo.solos.map((r) => `<li>${r.tecnico} — sozinho</li>`).join("");
  const linhasFaltando = grupo.faltando.map((pessoa) => `<li>${pessoa.nome}</li>`).join("");

  cartao.innerHTML = `
    <div class="cartao-item-topo">
      <h3>${grupo.ga}</h3>
      <span class="texto-mudo">GO: ${grupo.go}</span>
    </div>
    <dl>
      <dt>Duplas (${grupo.duplas.length})</dt>
      <dd>${linhasDuplas ? `<ul>${linhasDuplas}</ul>` : "Nenhuma."}</dd>
      <dt>Sozinhos (${grupo.solos.length})</dt>
      <dd>${linhasSolos ? `<ul>${linhasSolos}</ul>` : "Nenhum."}</dd>
      <dt>Faltando classificar (${grupo.faltando.length})</dt>
      <dd>${linhasFaltando ? `<ul>${linhasFaltando}</ul>` : "Ninguém — GA completo."}</dd>
    </dl>
  `;
  return cartao;
}

function renderizar() {
  const resumo = montarResumoPorGA(hierarquia, duplas, solos).filter(
    (grupo) => (!filtroGo.value || grupo.go === filtroGo.value) && (!filtroGa.value || grupo.ga === filtroGa.value)
  );

  listaGAs.innerHTML = "";
  gasVazio.classList.toggle("oculto", resumo.length > 0);
  for (const grupo of resumo) {
    listaGAs.appendChild(montarCardGA(grupo));
  }
}

filtroGo.addEventListener("change", () => {
  preencherSelect(filtroGa, listarGAs(hierarquia, filtroGo.value), "Todos");
  renderizar();
});
filtroGa.addEventListener("change", renderizar);

async function iniciar() {
  const token = obterParametroUrl("token");
  if (!token) {
    mostrarErroToken("Link incompleto: o parâmetro ?token= não foi informado.");
    return;
  }

  let demanda;
  try {
    demanda = await buscarDemandaPorToken(token);
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

    if (!hierarquia.length) {
      mostrarErroToken('Esta demanda ainda não tem uma base do tipo "hierarquia" cadastrada.');
      return;
    }

    const totais = montarTotais(hierarquia, duplas, solos);
    document.getElementById("kpi-total").textContent = totais.totalPessoas;
    document.getElementById("kpi-duplas").textContent = totais.totalDuplas;
    document.getElementById("kpi-sozinhos").textContent = totais.totalSozinhos;
    document.getElementById("kpi-faltando").textContent = totais.totalFaltando;

    preencherSelect(filtroGo, listarGOs(hierarquia), "Todos");
    renderizar();

    blocoCarregando.classList.add("oculto");
    blocoResultado.classList.remove("oculto");
  } catch (erro) {
    mostrarErroToken(`Erro ao montar o resultado: ${erro.message}`);
  }
}

iniciar();
