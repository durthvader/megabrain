// ============================================================
// MEGABRAIN — pages/indexPage.js
// Página inicial: cards de acesso rápido + indicadores simples.
// ============================================================

import "../main.js";
import { supabase } from "../supabaseClient.js";
import { mostrarAviso } from "../utils/mensagens.js";

async function contar(tabela, filtro) {
  let consulta = supabase.from(tabela).select("*", { count: "exact", head: true });
  if (filtro) {
    for (const [campo, valor] of Object.entries(filtro)) {
      consulta = consulta.eq(campo, valor);
    }
  }
  const { count, error } = await consulta;
  if (error) throw error;
  return count ?? 0;
}

function preencher(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = valor;
}

async function carregarIndicadores() {
  try {
    const [demandasAtivas, bases, respostas, planosPendentes] = await Promise.all([
      contar("demandas", { status: "ativa" }),
      contar("bases"),
      contar("formulario_respostas"),
      contar("planos_acao", { status: "pendente" }),
    ]);

    preencher("kpi-demandas", demandasAtivas);
    preencher("kpi-bases", bases);
    preencher("kpi-respostas", respostas);
    preencher("kpi-planos", planosPendentes);
  } catch (erro) {
    ["kpi-demandas", "kpi-bases", "kpi-respostas", "kpi-planos"].forEach((id) =>
      preencher(id, "—")
    );
    mostrarAviso(
      "Não foi possível carregar os indicadores. Verifique o config.js e se os SQLs foram executados no Supabase."
    );
    console.error(erro);
  }
}

carregarIndicadores();
