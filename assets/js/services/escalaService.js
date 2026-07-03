// ============================================================
// MEGABRAIN — services/escalaService.js
// Monta a grade de 30 dias a partir das bases (tecnicos, ferias,
// treinamentos, exames, folgas) e das respostas do formulário.
// ============================================================

import { listarLinhasPorTipo } from "./baseService.js";
import { listarRespostasPorDemanda } from "./formularioService.js";
import { gerarProximos30Dias, formatarDataISO, converterParaData } from "../utils/datas.js";
import { converterParaCsv } from "../utils/csv.js";

export async function carregarDadosEscala(demandaId) {
  const [tecnicos, ferias, treinamentos, exames, folgas, respostas] = await Promise.all([
    listarLinhasPorTipo(demandaId, "tecnicos"),
    listarLinhasPorTipo(demandaId, "ferias"),
    listarLinhasPorTipo(demandaId, "treinamentos"),
    listarLinhasPorTipo(demandaId, "exames"),
    listarLinhasPorTipo(demandaId, "folgas"),
    listarRespostasPorDemanda(demandaId),
  ]);

  const eventos = [];

  for (const linha of ferias) {
    const dados = linha.dados || {};
    eventos.push({
      tipo: "ferias",
      tecnico: dados.tecnico,
      inicio: dados.data_inicio,
      fim: dados.data_fim || dados.data_inicio,
      descricao: "Férias",
      origem: "base",
    });
  }

  for (const linha of treinamentos) {
    const dados = linha.dados || {};
    eventos.push({
      tipo: "treinamento",
      tecnico: dados.tecnico,
      inicio: dados.data_inicio,
      fim: dados.data_fim || dados.data_inicio,
      descricao: dados.treinamento || "Treinamento",
      origem: "base",
    });
  }

  for (const linha of exames) {
    const dados = linha.dados || {};
    eventos.push({
      tipo: "exame",
      tecnico: dados.tecnico,
      inicio: dados.data,
      fim: dados.data,
      descricao: dados.tipo_exame || "Exame periódico",
      origem: "base",
    });
  }

  for (const linha of folgas) {
    const dados = linha.dados || {};
    eventos.push({
      tipo: "folga",
      tecnico: dados.tecnico,
      inicio: dados.data,
      fim: dados.data,
      descricao: dados.tipo_folga || "Folga",
      origem: "base",
    });
  }

  for (const resposta of respostas) {
    if (!resposta.tecnico || !resposta.data_referencia) continue;
    const tipoOcorrencia = resposta.dados?.tipo_ocorrencia || resposta.dados?.tipo_folga || "folga";
    const descricaoBase = ROTULOS_OCORRENCIA[tipoOcorrencia] || "Ocorrência";
    eventos.push({
      tipo: tipoOcorrencia,
      tecnico: resposta.tecnico,
      inicio: resposta.data_referencia,
      fim: resposta.data_referencia,
      descricao: resposta.dados?.observacao ? `${descricaoBase} — ${resposta.dados.observacao}` : descricaoBase,
      origem: "formulario",
      respostaId: resposta.id,
    });
  }

  return {
    tecnicos: tecnicos.map((linha) => linha.dados || {}),
    eventos,
  };
}

const ROTULOS_OCORRENCIA = {
  disponivel: "Disponível",
  ferias: "Férias",
  treinamento: "Treinamento",
  exame: "Exame periódico",
  folga: "Folga",
};

export function chaveTecnico(nome) {
  return String(nome || "").trim().toLowerCase();
}

// Localiza o evento marcado pelo supervisor (origem "formulario") para um
// técnico/dia — os eventos vindos de bases importadas (origem "base") nunca
// são retornados aqui, pois o clique instantâneo do painel não os altera.
export function encontrarEventoFormulario(eventos, tecnico, dataIso) {
  return (eventos || []).find(
    (evento) =>
      evento.origem === "formulario" &&
      chaveTecnico(evento.tecnico) === chaveTecnico(tecnico) &&
      evento.inicio === dataIso
  );
}

function eventoCobreDia(evento, dia) {
  const inicio = converterParaData(evento.inicio);
  if (!inicio) return false;
  const fim = converterParaData(evento.fim) || inicio;
  return dia >= inicio && dia <= fim;
}

export function montarGrade30Dias(tecnicos, eventos, dataInicial = new Date()) {
  const dias = gerarProximos30Dias(dataInicial);

  const eventosPorTecnico = new Map();
  for (const evento of eventos || []) {
    const chave = chaveTecnico(evento.tecnico);
    if (!chave) continue;
    if (!eventosPorTecnico.has(chave)) eventosPorTecnico.set(chave, []);
    eventosPorTecnico.get(chave).push(evento);
  }

  const linhas = (tecnicos || []).map((tecnico) => {
    const nome = tecnico.tecnico || tecnico.nome || "";
    const eventosDoTecnico = eventosPorTecnico.get(chaveTecnico(nome)) || [];

    const celulas = dias.map((dia) => {
      const eventosNoDia = eventosDoTecnico.filter((evento) => eventoCobreDia(evento, dia));
      const tipos = [...new Set(eventosNoDia.map((evento) => evento.tipo))];

      let status = "disponivel";
      if (tipos.length > 1) status = "conflito";
      else if (tipos.length === 1) status = tipos[0];

      return { data: formatarDataISO(dia), status, eventos: eventosNoDia };
    });

    return {
      tecnico: nome,
      supervisor: tecnico.supervisor || "",
      empresa: tecnico.empresa || "",
      cidade: tecnico.cidade || "",
      celulas,
    };
  });

  return { dias: dias.map((dia) => formatarDataISO(dia)), linhas };
}

export function identificarConflitos(grade) {
  const conflitos = [];
  for (const linha of grade.linhas) {
    for (const celula of linha.celulas) {
      if (celula.status !== "conflito") continue;
      conflitos.push({
        tecnico: linha.tecnico,
        supervisor: linha.supervisor,
        data: celula.data,
        eventos: celula.eventos.map((evento) => evento.tipo).join(" + "),
      });
    }
  }
  return conflitos;
}

export function consolidarPorDia(grade) {
  return grade.dias.map((dia, indice) => {
    const resumo = {
      data: dia,
      disponivel: 0,
      ferias: 0,
      treinamento: 0,
      exame: 0,
      folga: 0,
      conflito: 0,
    };
    for (const linha of grade.linhas) {
      const status = linha.celulas[indice]?.status || "disponivel";
      resumo[status] = (resumo[status] || 0) + 1;
    }
    return resumo;
  });
}

export function exportarEscalaCsv(grade) {
  const registros = grade.linhas.map((linha) => {
    const registro = {
      tecnico: linha.tecnico,
      supervisor: linha.supervisor,
      empresa: linha.empresa,
      cidade: linha.cidade,
    };
    for (const celula of linha.celulas) {
      registro[celula.data] = celula.status;
    }
    return registro;
  });
  return converterParaCsv(registros);
}
