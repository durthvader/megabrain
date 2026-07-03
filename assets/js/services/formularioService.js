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

// Painel de escala (admin e público): grava uma ocorrência marcada por
// clique direto na grade — ferias | folga | treinamento | exame.
export async function salvarOcorrenciaEscala({
  demandaId,
  tokenPublico,
  supervisor,
  tecnico,
  dataReferencia,
  tipoOcorrencia,
  observacao,
  respondenteNome,
}) {
  return salvarResposta({
    demanda_id: demandaId,
    token_publico: tokenPublico,
    tipo_formulario: "escala_ocorrencia",
    respondente_nome: respondenteNome || supervisor || null,
    respondente_perfil: "supervisor",
    supervisor: supervisor || null,
    tecnico,
    data_referencia: dataReferencia,
    dados: {
      tipo_ocorrencia: tipoOcorrencia || "folga",
      observacao: observacao || "",
    },
  });
}

export async function removerRespostaPorId(id) {
  const { error } = await supabase.from("formulario_respostas").delete().eq("id", id);
  if (error) throw error;
}
