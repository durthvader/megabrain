// ============================================================
// MEGABRAIN — services/demandaService.js
// CRUD de demandas e token público.
// ============================================================

import { supabase } from "../supabaseClient.js";
import { gerarTokenCurto } from "../utils/tokens.js";

export function gerarTokenPublico() {
  return gerarTokenCurto();
}

export async function criarDemanda(dados) {
  const registro = {
    nome: dados.nome,
    tipo: dados.tipo,
    descricao: dados.descricao || null,
    responsavel: dados.responsavel || null,
    data_inicio: dados.data_inicio || null,
    data_fim: dados.data_fim || null,
    status: dados.status || "ativa",
    token_publico: dados.token_publico || gerarTokenPublico(),
  };

  const { data, error } = await supabase.from("demandas").insert(registro).select().single();
  if (error) throw error;
  return data;
}

export async function listarDemandas(filtro = {}) {
  let consulta = supabase
    .from("demandas")
    .select("*")
    .neq("status", "apagada")
    .order("criado_em", { ascending: false });

  if (filtro.tipo) consulta = consulta.eq("tipo", filtro.tipo);
  if (filtro.status) consulta = consulta.eq("status", filtro.status);

  const { data, error } = await consulta;
  if (error) throw error;
  return data || [];
}

export async function buscarDemandaPorId(id) {
  const { data, error } = await supabase.from("demandas").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function buscarDemandaPorToken(token) {
  const { data, error } = await supabase
    .from("demandas")
    .select("*")
    .eq("token_publico", token)
    .neq("status", "apagada")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function atualizarDemanda(id, dados) {
  const { data, error } = await supabase
    .from("demandas")
    .update(dados)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function arquivarDemanda(id) {
  return atualizarDemanda(id, { status: "arquivada" });
}

export async function apagarDemanda(id) {
  // O delete em cascata (FK) remove bases, linhas, respostas, análises,
  // planos e logs vinculados. Arquivos do Storage: usar limpezaService antes.
  const { error } = await supabase.from("demandas").delete().eq("id", id);
  if (error) throw error;
}
