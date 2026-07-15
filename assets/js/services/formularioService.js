// ============================================================
// MEGABRAIN — services/formularioService.js
// Respostas dos formulários públicos (sem login, via token).
// ============================================================

import { supabase } from "../supabaseClient.js";

export async function salvarResposta(dados) {
  const { data, error } = await supabase
    .from("formulario_respostas")
    .insert(dados)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listarRespostasPorDemanda(demandaId) {
  const { data, error } = await supabase
    .from("formulario_respostas")
    .select("*")
    .eq("demanda_id", demandaId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listarRespostasPorToken(token) {
  const { data, error } = await supabase
    .from("formulario_respostas")
    .select("*")
    .eq("token_publico", token)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function removerRespostaPorId(id) {
  const { error } = await supabase.from("formulario_respostas").delete().eq("id", id);
  if (error) throw error;
}
