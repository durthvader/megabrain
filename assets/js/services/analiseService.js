// ============================================================
// MEGABRAIN — services/analiseService.js
// Análises salvas por demanda (registradas manualmente ou com
// apoio do Codex/Claude no VS Code).
// ============================================================

import { supabase } from "../supabaseClient.js";

export async function salvarAnalise(dados) {
  const { data, error } = await supabase.from("analises").insert(dados).select().single();
  if (error) throw error;
  return data;
}

export async function listarAnalisesPorDemanda(demandaId) {
  const { data, error } = await supabase
    .from("analises")
    .select("*")
    .eq("demanda_id", demandaId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function criarAnaliseSimples(demandaId, texto) {
  return salvarAnalise({
    demanda_id: demandaId,
    titulo: `Análise rápida — ${new Date().toLocaleDateString("pt-BR")}`,
    resumo: texto,
  });
}
