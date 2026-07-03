// ============================================================
// MEGABRAIN — pages/resultadoPage.js
// Página PÚBLICA de resultado da demanda (sem login, via token).
// resultado.html?token=TOKEN
//
// Ponto de entrada único para o link público de qualquer demanda:
// enquanto `demandas.pagina_resultado` não estiver preenchido, mostra
// só título + descrição (a IA ainda não gerou o resultado). Depois de
// gerado, mostra um link para a página customizada.
// ============================================================

import { buscarDemandaPorToken } from "../services/demandaService.js";
import { obterParametroUrl } from "../utils/tokens.js";
import { formatarStatus } from "../utils/formatadores.js";

const blocoCarregando = document.getElementById("bloco-carregando");
const blocoErro = document.getElementById("bloco-erro");
const blocoResultado = document.getElementById("bloco-resultado");
const tituloDemanda = document.getElementById("titulo-demanda");
const statusDemanda = document.getElementById("status-demanda");
const descricaoDemanda = document.getElementById("descricao-demanda");
const blocoComResultado = document.getElementById("bloco-com-resultado");
const blocoSemResultado = document.getElementById("bloco-sem-resultado");
const linkPaginaResultado = document.getElementById("link-pagina-resultado");

function mostrarErroToken(mensagem) {
  blocoCarregando.classList.add("oculto");
  blocoResultado.classList.add("oculto");
  blocoErro.classList.remove("oculto");
  document.getElementById("mensagem-erro-token").textContent = mensagem;
}

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

  tituloDemanda.textContent = demanda.nome;
  statusDemanda.innerHTML = `<span class="badge badge-${demanda.status}">${formatarStatus(demanda.status)}</span>`;
  descricaoDemanda.textContent = demanda.descricao || "";

  if (demanda.pagina_resultado) {
    linkPaginaResultado.href = `${demanda.pagina_resultado}?token=${encodeURIComponent(token)}`;
    blocoComResultado.classList.remove("oculto");
  } else {
    blocoSemResultado.classList.remove("oculto");
  }

  blocoCarregando.classList.add("oculto");
  blocoResultado.classList.remove("oculto");
}

iniciar();
