// ============================================================
// MEGABRAIN — services/limpezaService.js
// Rotinas de limpeza para manter o projeto no plano gratuito.
// Regra de ouro: exportar antes de apagar.
// ============================================================

import { supabase } from "../supabaseClient.js";

const BUCKET = "megabrain-bases";

async function apagarPorDemanda(tabela, demandaId) {
  const { error } = await supabase.from(tabela).delete().eq("demanda_id", demandaId);
  if (error) throw error;
}

export async function apagarBasesDaDemanda(demandaId) {
  await apagarPorDemanda("base_linhas", demandaId);
  await apagarPorDemanda("bases", demandaId);
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

export async function apagarArquivosStorageDaDemanda(demandaId) {
  const { data, error } = await supabase.storage.from(BUCKET).list(String(demandaId));
  if (error || !data || data.length === 0) return 0;

  const caminhos = data.map((arquivo) => `${demandaId}/${arquivo.name}`);
  const { error: erroRemocao } = await supabase.storage.from(BUCKET).remove(caminhos);
  if (erroRemocao) throw erroRemocao;
  return caminhos.length;
}

export async function limparDemanda(demandaId) {
  await apagarArquivosStorageDaDemanda(demandaId);
  await apagarBasesDaDemanda(demandaId);
  await apagarRespostasDaDemanda(demandaId);
  await apagarAnalisesDaDemanda(demandaId);
  await apagarPlanosDaDemanda(demandaId);
  await apagarPorDemanda("logs", demandaId);
}

export async function apagarDemandasArquivadas() {
  const { data, error } = await supabase.from("demandas").select("id").eq("status", "arquivada");
  if (error) throw error;

  for (const demanda of data || []) {
    await limparDemanda(demanda.id);
    const { error: erroDelete } = await supabase.from("demandas").delete().eq("id", demanda.id);
    if (erroDelete) throw erroDelete;
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
