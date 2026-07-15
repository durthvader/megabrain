// ============================================================
// MEGABRAIN — services/limpezaService.js
// Rotinas de limpeza para manter o projeto no plano gratuito.
// Regra de ouro: exportar antes de apagar.
//
// Duas operações com escopos bem diferentes:
//
// - limparDemanda: esvazia a demanda mas a mantém de pé. Desvincula
//   as bases (demanda_bases) sem apagá-las, porque são reutilizáveis
//   (ver sql/007) e outras demandas podem depender delas.
//
// - apagarDemandaCompleta: remove a demanda de vez. Aqui as bases
//   PRECISAM ser tratadas, senão sobra lixo — ver o comentário da
//   função sobre os dois modelos de posse que convivem no banco.
// ============================================================

import { supabase } from "../supabaseClient.js";
import { apagarBase } from "./baseService.js";
import { apagarDemanda } from "./demandaService.js";

async function apagarPorDemanda(tabela, demandaId) {
  const { error } = await supabase.from(tabela).delete().eq("demanda_id", demandaId);
  if (error) throw error;
}

export async function desvincularBasesDaDemanda(demandaId) {
  const { error } = await supabase.from("demanda_bases").delete().eq("demanda_id", demandaId);
  if (error) throw error;
}

export function apagarRespostasDaDemanda(demandaId) {
  return apagarPorDemanda("formulario_respostas", demandaId);
}

export function apagarAnalisesDaDemanda(demandaId) {
  return apagarPorDemanda("analises", demandaId);
}

export function apagarPlanosDaDemanda(demandaId) {
  return apagarPorDemanda("planos_acao", demandaId);
}

export async function limparDemanda(demandaId) {
  await desvincularBasesDaDemanda(demandaId);
  await apagarRespostasDaDemanda(demandaId);
  await apagarAnalisesDaDemanda(demandaId);
  await apagarPlanosDaDemanda(demandaId);
  await apagarPorDemanda("logs", demandaId);
}

// Bases que somem junto com a demanda. Convivem dois modelos de posse
// no banco e cada um vaza de um jeito diferente se ignorado:
//
// - Legado (upload anterior a sql/007): bases.demanda_id aponta para a
//   demanda e tem ON DELETE CASCADE. A base some sozinha, mas o arquivo
//   no Storage NÃO — o cascade do Postgres não alcança o bucket. Por
//   isso precisamos passar por apagarBase antes do delete da demanda,
//   enquanto caminho_storage ainda existe para ser lido.
//
// - Atual: bases.demanda_id é null e o vínculo vive em demanda_bases.
//   O cascade derruba só o vínculo, deixando a base órfã e invisível.
//   Apagamos as que ficariam sem nenhuma outra demanda usando.
//
// Bases ainda usadas por outra demanda nunca entram na lista.
async function levantarBasesDescartaveis(demandaId) {
  const { data: proprias, error: erroProprias } = await supabase
    .from("bases")
    .select("id")
    .eq("demanda_id", demandaId);
  if (erroProprias) throw erroProprias;

  const { data: vinculos, error: erroVinculos } = await supabase
    .from("demanda_bases")
    .select("base_id")
    .eq("demanda_id", demandaId);
  if (erroVinculos) throw erroVinculos;

  const idsVinculados = (vinculos || []).map((vinculo) => vinculo.base_id);

  let compartilhadas = new Set();
  if (idsVinculados.length) {
    const { data: outrosUsos, error: erroOutros } = await supabase
      .from("demanda_bases")
      .select("base_id")
      .in("base_id", idsVinculados)
      .neq("demanda_id", demandaId);
    if (erroOutros) throw erroOutros;
    compartilhadas = new Set((outrosUsos || []).map((uso) => uso.base_id));
  }

  const descartaveis = [
    ...(proprias || []).map((base) => base.id),
    ...idsVinculados.filter((id) => !compartilhadas.has(id)),
  ];

  return {
    descartaveis: [...new Set(descartaveis)],
    mantidas: [...compartilhadas],
  };
}

async function resumir(demandaId, { descartaveis, mantidas }) {
  const contar = async (tabela) => {
    const { count } = await supabase
      .from(tabela)
      .select("*", { count: "exact", head: true })
      .eq("demanda_id", demandaId);
    return count ?? 0;
  };

  let linhas = 0;
  let arquivos = 0;
  if (descartaveis.length) {
    const { count } = await supabase
      .from("base_linhas")
      .select("*", { count: "exact", head: true })
      .in("base_id", descartaveis);
    linhas = count ?? 0;

    const { count: comArquivo } = await supabase
      .from("bases")
      .select("*", { count: "exact", head: true })
      .in("id", descartaveis)
      .not("caminho_storage", "is", null);
    arquivos = comArquivo ?? 0;
  }

  const [respostas, analises, planos] = await Promise.all([
    contar("formulario_respostas"),
    contar("analises"),
    contar("planos_acao"),
  ]);

  return {
    bases: descartaveis.length,
    basesMantidas: mantidas.length,
    linhas,
    arquivos,
    respostas,
    analises,
    planos,
  };
}

// Prévia para a confirmação: o que exatamente sai se apagar a demanda.
export async function resumirImpactoDemanda(demandaId) {
  return resumir(demandaId, await levantarBasesDescartaveis(demandaId));
}

// Apaga a demanda e tudo que só existia por causa dela.
export async function apagarDemandaCompleta(demandaId) {
  const levantamento = await levantarBasesDescartaveis(demandaId);
  const resumo = await resumir(demandaId, levantamento);

  // Antes do delete da demanda: apagarBase remove o arquivo do Storage e,
  // em cascata, base_linhas e os vínculos em demanda_bases.
  for (const baseId of levantamento.descartaveis) {
    await apagarBase(baseId);
  }

  // O cascade das FKs cobre respostas, análises, planos, logs e vínculos.
  await apagarDemanda(demandaId);

  return resumo;
}

export async function apagarDemandasArquivadas() {
  const { data, error } = await supabase.from("demandas").select("id").eq("status", "arquivada");
  if (error) throw error;

  for (const demanda of data || []) {
    await apagarDemandaCompleta(demanda.id);
  }
  return (data || []).length;
}

export async function estimarUsoLocal() {
  const tabelas = [
    "demandas",
    "bases",
    "base_linhas",
    "formulario_respostas",
    "analises",
    "planos_acao",
  ];

  const resultado = {};
  await Promise.all(
    tabelas.map(async (tabela) => {
      const { count, error } = await supabase
        .from(tabela)
        .select("*", { count: "exact", head: true });
      resultado[tabela] = error ? null : count ?? 0;
    })
  );

  // Estimativa grosseira: ~1 KB por linha importada (JSONB médio).
  resultado.estimativa_mb =
    Math.round(((resultado.base_linhas || 0) * 1024) / (1024 * 1024) * 10) / 10;

  return resultado;
}
