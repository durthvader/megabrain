// ============================================================
// MEGABRAIN — services/limpezaService.js
// Rotinas de limpeza para manter o projeto no plano gratuito.
// Regra de ouro: exportar antes de apagar.
//
// Bases são reutilizáveis entre demandas (ver sql/007): limpar uma
// demanda desvincula as bases (demanda_bases), mas NÃO apaga
// bases/base_linhas nem arquivos do Storage — isso é feito por base,
// em baseService.apagarBase, para não afetar outras demandas.
// ============================================================

import { supabase } from "../supabaseClient.js";

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
