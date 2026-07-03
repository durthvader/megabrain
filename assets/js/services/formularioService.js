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

export async function salvarFolgaEscala({
  demandaId,
  tokenPublico,
  supervisor,
  tecnico,
  data,
  tipoFolga,
  observacao,
  respondenteNome,
}) {
  return salvarResposta({
    demanda_id: demandaId,
    token_publico: tokenPublico,
    tipo_formulario: "escala_folga",
    respondente_nome: respondenteNome || supervisor || null,
    respondente_perfil: "supervisor",
    supervisor: supervisor || null,
    tecnico,
    data_referencia: data,
    dados: {
      tipo_folga: tipoFolga || "folga",
      observacao: observacao || "",
    },
  });
}
