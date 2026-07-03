// ============================================================
// MEGABRAIN — services/baseService.js
// Registro de bases importadas e leitura das linhas (JSONB).
// Leituras são paginadas e limitadas para proteger o plano free.
// ============================================================

import { supabase } from "../supabaseClient.js";

const TAMANHO_PAGINA = 1000;
const LIMITE_LINHAS = 20000;

export async function criarBase(dados) {
  const { data, error } = await supabase.from("bases").insert(dados).select().single();
  if (error) throw error;
  return data;
}

export async function listarBasesPorDemanda(demandaId) {
  const { data, error } = await supabase
    .from("bases")
    .select("*")
    .eq("demanda_id", demandaId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function listarLinhas(filtros) {
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

    const { data, error } = await consulta;
    if (error) throw error;
    linhas.push(...(data || []));
    if (!data || data.length < TAMANHO_PAGINA) break;
  }
  return linhas;
}

export function listarLinhasPorDemanda(demandaId) {
  return listarLinhas({ demanda_id: demandaId });
}

export function listarLinhasPorTipo(demandaId, tipoBase) {
  return listarLinhas({ demanda_id: demandaId, tipo_base: tipoBase });
}

export function listarLinhasPorBase(baseId) {
  return listarLinhas({ base_id: baseId });
}

export async function apagarBase(baseId) {
  // O delete em cascata (FK) remove as linhas vinculadas.
  const { error } = await supabase.from("bases").delete().eq("id", baseId);
  if (error) throw error;
}
