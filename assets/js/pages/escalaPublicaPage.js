// ============================================================
// MEGABRAIN — pages/escalaPublicaPage.js
// Painel PÚBLICO de escala (sem login, via token na URL).
// escala-publica.html?token=TOKEN
//
// Mesma grade e clique instantâneo do painel administrativo
// (compartilha UI com escalaPage.js via escalaGrade.js), mas
// restrito a uma única demanda e sem o menu do portal — só o
// painel de escala fica acessível por este link.
// ============================================================

import { buscarDemandaPorToken } from "../services/demandaService.js";
import {
  carregarDadosEscala,
  montarGrade30Dias,
  identificarConflitos,
  consolidarPorDia,
  exportarEscalaCsv,
  encontrarEventoFormulario,
} from "../services/escalaService.js";
import { salvarOcorrenciaEscala, removerRespostaPorId } from "../services/formularioService.js";
import {
  TIPOS_OCORRENCIA,
  renderizarSeletorOcorrencia,
  marcarSeletorAtivo,
  renderizarGradeEscala,
  renderizarGraficoConsolidado,
  renderizarConflitos,
} from "./escalaGrade.js";
import { baixarCsv } from "../utils/csv.js";
import { obterValoresUnicos, preencherSelect } from "../utils/filtros.js";
import { obterParametroUrl } from "../utils/tokens.js";
import { mostrarSucesso, mostrarErro, mostrarAviso } from "../utils/mensagens.js";

const blocoCarregando = document.getElementById("bloco-carregando");
const blocoErro = document.getElementById("bloco-erro");
const blocoPainel = document.getElementById("bloco-painel");
const tituloDemanda = document.getElementById("titulo-demanda");
const inputSeuNome = document.getElementById("input-seu-nome");
const seletorContainer = document.getElementById("seletor-ocorrencia");
const tabelaGrade = document.getElementById("grade-escala");
const canvasConsolidado = document.getElementById("grafico-consolidado");
const corpoConflitos = document.getElementById("tabela-conflitos-corpo");
const filtroSupervisor = document.getElementById("filtro-supervisor");
const filtroEmpresa = document.getElementById("filtro-empresa");
const filtroCidade = document.getElementById("filtro-cidade");

let demandaAtual = null;
let dadosEscala = null;
let gradeCompleta = null;
let tipoSelecionado = "folga";
const celulasEmAndamento = new Set();

function mostrarErroToken(mensagem) {
  blocoCarregando.classList.add("oculto");
  blocoPainel.classList.add("oculto");
  blocoErro.classList.remove("oculto");
  document.getElementById("mensagem-erro-token").textContent = mensagem;
}

function linhasFiltradas() {
  const supervisor = filtroSupervisor.value.toLowerCase();
  const empresa = filtroEmpresa.value.toLowerCase();
  const cidade = filtroCidade.value.toLowerCase();

  return gradeCompleta.linhas.filter(
    (linha) =>
      (!supervisor || linha.supervisor.toLowerCase() === supervisor) &&
      (!empresa || linha.empresa.toLowerCase() === empresa) &&
      (!cidade || linha.cidade.toLowerCase() === cidade)
  );
}

function renderizarTudo() {
  const linhas = linhasFiltradas();
  const gradeVisivel = { dias: gradeCompleta.dias, linhas };

  renderizarGradeEscala({ tabela: tabelaGrade, grade: gradeVisivel, aoClicarCelula });
  renderizarGraficoConsolidado(canvasConsolidado, consolidarPorDia(gradeVisivel));

  const conflitos = identificarConflitos(gradeVisivel);
  document.getElementById("secao-conflitos").classList.toggle("oculto", conflitos.length === 0);
  renderizarConflitos(corpoConflitos, conflitos);
}

async function aoClicarCelula(linha, celula) {
  const chave = `${linha.tecnico}|${celula.data}`;
  if (celulasEmAndamento.has(chave)) return;
  celulasEmAndamento.add(chave);

  try {
    const marcaAtual = encontrarEventoFormulario(dadosEscala.eventos, linha.tecnico, celula.data);

    if (marcaAtual) {
      await removerRespostaPorId(marcaAtual.respostaId);
      dadosEscala.eventos = dadosEscala.eventos.filter((evento) => evento !== marcaAtual);
    }

    const estavaMarcadoComMesmoTipo = marcaAtual && marcaAtual.tipo === tipoSelecionado;
    if (tipoSelecionado !== "disponivel" && !estavaMarcadoComMesmoTipo) {
      const nova = await salvarOcorrenciaEscala({
        demandaId: demandaAtual.id,
        tokenPublico: demandaAtual.token_publico,
        supervisor: linha.supervisor,
        tecnico: linha.tecnico,
        dataReferencia: celula.data,
        tipoOcorrencia: tipoSelecionado,
        respondenteNome: inputSeuNome.value.trim(),
      });
      dadosEscala.eventos.push({
        tipo: tipoSelecionado,
        tecnico: linha.tecnico,
        inicio: celula.data,
        fim: celula.data,
        descricao: TIPOS_OCORRENCIA.find((tipo) => tipo.valor === tipoSelecionado)?.rotulo || tipoSelecionado,
        origem: "formulario",
        respostaId: nova.id,
      });
    }

    gradeCompleta = montarGrade30Dias(dadosEscala.tecnicos, dadosEscala.eventos);
    renderizarTudo();
  } catch (erro) {
    mostrarErro(`Erro ao salvar: ${erro.message}`);
  } finally {
    celulasEmAndamento.delete(chave);
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
    mostrarErroToken(`Esta demanda está com status "${demandaAtual.status}" e não aceita mais alterações.`);
    return;
  }

  if (demandaAtual.tipo !== "escala") {
    mostrarErroToken("Este link é de um painel de escala, mas a demanda informada não é do tipo escala.");
    return;
  }

  tituloDemanda.textContent = demandaAtual.nome;

  try {
    dadosEscala = await carregarDadosEscala(demandaAtual.id);
    if (!dadosEscala.tecnicos.length) {
      mostrarErroToken('Esta demanda ainda não tem uma base do tipo "tecnicos" cadastrada.');
      return;
    }

    gradeCompleta = montarGrade30Dias(dadosEscala.tecnicos, dadosEscala.eventos);

    preencherSelect(filtroSupervisor, obterValoresUnicos(gradeCompleta.linhas, "supervisor"));
    preencherSelect(filtroEmpresa, obterValoresUnicos(gradeCompleta.linhas, "empresa"));
    preencherSelect(filtroCidade, obterValoresUnicos(gradeCompleta.linhas, "cidade"));

    renderizarSeletorOcorrencia({
      container: seletorContainer,
      tipoSelecionado,
      aoMudar: (novoTipo) => {
        tipoSelecionado = novoTipo;
        marcarSeletorAtivo(seletorContainer, tipoSelecionado);
      },
    });

    blocoCarregando.classList.add("oculto");
    blocoPainel.classList.remove("oculto");
    renderizarTudo();
  } catch (erro) {
    mostrarErroToken(`Erro ao montar a escala: ${erro.message}`);
  }
}

[filtroSupervisor, filtroEmpresa, filtroCidade].forEach((filtro) =>
  filtro.addEventListener("change", () => gradeCompleta && renderizarTudo())
);

document.getElementById("btn-exportar-escala").addEventListener("click", () => {
  if (!gradeCompleta) return mostrarAviso("Aguarde o carregamento do painel.");
  const csv = exportarEscalaCsv({ dias: gradeCompleta.dias, linhas: linhasFiltradas() });
  baixarCsv(`escala_${demandaAtual?.nome || "30dias"}`, csv);
  mostrarSucesso("Escala exportada em CSV.");
});

iniciar();
