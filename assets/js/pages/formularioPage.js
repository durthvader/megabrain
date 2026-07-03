// ============================================================
// MEGABRAIN — pages/formularioPage.js
// Página PÚBLICA de preenchimento genérico (sem login, via token).
// formulario.html?token=TOKEN
//
// Demandas do tipo "escala" são redirecionadas automaticamente
// para o painel completo (escala-publica.html), que tem a UX de
// clique instantâneo na grade em vez deste formulário linha a linha.
// ============================================================

import { buscarDemandaPorToken } from "../services/demandaService.js";
import { salvarResposta } from "../services/formularioService.js";
import { obterParametroUrl } from "../utils/tokens.js";
import { mostrarSucesso, mostrarErro } from "../utils/mensagens.js";

const blocoCarregando = document.getElementById("bloco-carregando");
const blocoErro = document.getElementById("bloco-erro");
const blocoFormulario = document.getElementById("bloco-formulario");
const tituloDemanda = document.getElementById("titulo-demanda");
const descricaoDemanda = document.getElementById("descricao-demanda");
const formGenerico = document.getElementById("form-generico");

let demandaAtual = null;

function mostrarErroToken(mensagem) {
  blocoCarregando.classList.add("oculto");
  blocoFormulario.classList.add("oculto");
  blocoErro.classList.remove("oculto");
  document.getElementById("mensagem-erro-token").textContent = mensagem;
}

function interpretarCamposDinamicos(texto) {
  // Uma linha por campo, no formato "campo: valor".
  const extras = {};
  for (const linha of String(texto || "").split("\n")) {
    const separador = linha.indexOf(":");
    if (separador === -1) continue;
    const chave = linha.slice(0, separador).trim();
    const valor = linha.slice(separador + 1).trim();
    if (chave) extras[chave] = valor;
  }
  return extras;
}

async function enviarFormularioGenerico(evento) {
  evento.preventDefault();
  const dados = new FormData(formGenerico);
  const botao = formGenerico.querySelector("button[type=submit]");
  botao.disabled = true;

  try {
    await salvarResposta({
      demanda_id: demandaAtual.id,
      token_publico: demandaAtual.token_publico,
      tipo_formulario: "generico",
      respondente_nome: dados.get("nome").trim() || null,
      respondente_perfil: dados.get("perfil").trim() || null,
      supervisor: dados.get("supervisor").trim() || null,
      tecnico: dados.get("tecnico").trim() || null,
      empresa: dados.get("empresa").trim() || null,
      cidade: dados.get("cidade").trim() || null,
      data_referencia: dados.get("data") || null,
      dados: {
        observacao: dados.get("observacao").trim(),
        ...interpretarCamposDinamicos(dados.get("campos_dinamicos")),
      },
    });
    mostrarSucesso("Resposta enviada. Obrigado!");
    formGenerico.reset();
  } catch (erro) {
    mostrarErro(`Erro ao enviar: ${erro.message}`);
  } finally {
    botao.disabled = false;
  }
}

async function iniciar() {
  const token = obterParametroUrl("token");
  if (!token) {
    mostrarErroToken("Link incompleto: o parâmetro ?token= não foi informado.");
    return;
  }

  try {
    demandaAtual = await buscarDemandaPorToken(token);
  } catch (erro) {
    mostrarErroToken(`Erro ao consultar a demanda: ${erro.message}`);
    return;
  }

  if (!demandaAtual) {
    mostrarErroToken("Token inválido ou demanda não encontrada. Confira o link recebido.");
    return;
  }

  if (demandaAtual.status !== "ativa") {
    mostrarErroToken(
      `Esta demanda está com status "${demandaAtual.status}" e não aceita mais respostas.`
    );
    return;
  }

  // Links antigos de demandas de escala continuam funcionando: redireciona
  // para o painel completo em vez do formulário linha a linha.
  if (demandaAtual.tipo === "escala") {
    window.location.replace(`escala-publica.html?token=${encodeURIComponent(token)}`);
    return;
  }

  tituloDemanda.textContent = demandaAtual.nome;
  descricaoDemanda.textContent = demandaAtual.descricao || "";

  blocoCarregando.classList.add("oculto");
  blocoFormulario.classList.remove("oculto");
  formGenerico.classList.remove("oculto");
  formGenerico.addEventListener("submit", enviarFormularioGenerico);
}

iniciar();
