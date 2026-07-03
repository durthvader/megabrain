// ============================================================
// MEGABRAIN — services/planoService.js
// Planos de ação por demanda.
// ============================================================

import { supabase } from "../supabaseClient.js";

export const STATUS_PLANO = ["pendente", "em_andamento", "concluido", "cancelado"];

export async function criarPlano(dados) {
  const { data, error } = await supabase.from("planos_acao").insert(dados).select().single();
  if (error) throw error;
  return data;
}

export async function listarPlanosPorDemanda(demandaId, filtro = {}) {
  let consulta = supabase
    .from("planos_acao")
    .select("*")
    .eq("demanda_id", demandaId)
    .order("criado_em", { ascending: false });

  if (filtro.status) consulta = consulta.eq("status", filtro.status);
  if (filtro.responsavel) consulta = consulta.ilike("responsavel", `%${filtro.responsavel}%`);

  const { data, error } = await consulta;
  if (error) throw error;
  return data || [];
}

export async function atualizarPlano(id, dados) {
  const { data, error } = await supabase
    .from("planos_acao")
    .update(dados)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function alterarStatusPlano(id, status) {
  return atualizarPlano(id, { status });
}
