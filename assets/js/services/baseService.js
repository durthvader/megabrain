// ============================================================
// MEGABRAIN — services/baseService.js
// Registro de bases importadas (independentes de demanda) e
// leitura das linhas (JSONB). Uma base pode ser usada por várias
// demandas via a tabela de junção demanda_bases. Leituras são
// paginadas e limitadas para proteger o plano free.
// ============================================================

import { supabase } from "../supabaseClient.js";

const TAMANHO_PAGINA = 1000;
const LIMITE_LINHAS = 20000;
const BUCKET = "megabrain-bases";

export async function criarBase(dados) {
  const { data, error } = await supabase.from("bases").insert(dados).select().single();
  if (error) throw error;
  return data;
}

// Todas as bases da biblioteca (upload é independente de demanda).
export async function listarBasesDisponiveis() {
  const { data, error } = await supabase
    .from("bases")
    .select("*")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function listarBaseIdsVinculados(demandaId) {
  const { data, error } = await supabase
    .from("demanda_bases")
    .select("base_id")
    .eq("demanda_id", demandaId);
  if (error) throw error;
  return (data || []).map((linha) => linha.base_id);
}

// Bases vinculadas a uma demanda específica (via demanda_bases).
export async function listarBasesVinculadas(demandaId) {
  const baseIds = await listarBaseIdsVinculados(demandaId);
  if (!baseIds.length) return [];

  const { data, error } = await supabase
    .from("bases")
    .select("*")
    .in("id", baseIds)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function vincularBases(demandaId, baseIds) {
  if (!baseIds || !baseIds.length) return;
  const registros = baseIds.map((baseId) => ({ demanda_id: demandaId, base_id: baseId }));
  const { error } = await supabase.from("demanda_bases").upsert(registros);
  if (error) throw error;
}

export async function desvincularBase(demandaId, baseId) {
  const { error } = await supabase
    .from("demanda_bases")
    .delete()
    .eq("demanda_id", demandaId)
    .eq("base_id", baseId);
  if (error) throw error;
}

async function listarLinhas(filtros, baseIds) {
  if (baseIds && !baseIds.length) return [];

  const linhas = [];
  for (let inicio = 0; inicio < LIMITE_LINHAS; inicio += TAMANHO_PAGINA) {
    let consulta = supabase
      .from("base_linhas")
      .select("*")
      .order("id", { ascending: true })
      .range(inicio, inicio + TAMANHO_PAGINA - 1);

    for (const [campo, valor] of Object.entries(filtros)) {
      consulta = consulta.eq(campo, valor);
    }
    if (baseIds) consulta = consulta.in("base_id", baseIds);

    const { data, error } = await consulta;
    if (error) throw error;
    linhas.push(...(data || []));
    if (!data || data.length < TAMANHO_PAGINA) break;
  }
  return linhas;
}

export async function listarLinhasPorDemanda(demandaId) {
  const baseIds = await listarBaseIdsVinculados(demandaId);
  return listarLinhas({}, baseIds);
}

export async function listarLinhasPorTipo(demandaId, tipoBase) {
  const baseIds = await listarBaseIdsVinculados(demandaId);
  return listarLinhas({ tipo_base: tipoBase }, baseIds);
}

export function listarLinhasPorBase(baseId) {
  return listarLinhas({ base_id: baseId });
}

export async function apagarBase(baseId) {
  const { data: base, error: erroBusca } = await supabase
    .from("bases")
    .select("caminho_storage")
    .eq("id", baseId)
    .maybeSingle();
  if (erroBusca) throw erroBusca;

  if (base?.caminho_storage) {
    await supabase.storage.from(BUCKET).remove([base.caminho_storage]);
  }

  // O delete em cascata (FK) remove base_linhas e os vínculos em demanda_bases.
  const { error } = await supabase.from("bases").delete().eq("id", baseId);
  if (error) throw error;
}
