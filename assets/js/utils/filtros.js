// ============================================================
// MEGABRAIN — utils/filtros.js
// Filtros em memória para tabelas e painéis.
// ============================================================

import { converterParaData } from "./datas.js";

export function obterValoresUnicos(linhas, campo) {
  const valores = new Set();
  for (const linha of linhas || []) {
    const valor = String(linha?.[campo] ?? "").trim();
    if (valor) valores.add(valor);
  }
  return [...valores].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function preencherSelect(select, valores, rotuloTodos = "Todos") {
  if (!select) return;
  const valorAtual = select.value;
  select.innerHTML = "";

  const opcaoTodos = document.createElement("option");
  opcaoTodos.value = "";
  opcaoTodos.textContent = rotuloTodos;
  select.appendChild(opcaoTodos);

  for (const valor of valores || []) {
    const opcao = document.createElement("option");
    opcao.value = valor;
    opcao.textContent = valor;
    select.appendChild(opcao);
  }

  if ([...select.options].some((opcao) => opcao.value === valorAtual)) {
    select.value = valorAtual;
  }
}

export function aplicarFiltros(linhas, filtros) {
  const entradas = Object.entries(filtros || {}).filter(([, valor]) => valor);
  if (!entradas.length) return [...(linhas || [])];

  return (linhas || []).filter((linha) =>
    entradas.every(
      ([campo, valor]) =>
        String(linha?.[campo] ?? "").trim().toLowerCase() ===
        String(valor).trim().toLowerCase()
    )
  );
}

export function filtrarPorPeriodo(linhas, campoData, inicio, fim) {
  const dataInicio = converterParaData(inicio);
  const dataFim = converterParaData(fim);
  if (!dataInicio && !dataFim) return [...(linhas || [])];

  return (linhas || []).filter((linha) => {
    const data = converterParaData(linha?.[campoData]);
    if (!data) return false;
    if (dataInicio && data < dataInicio) return false;
    if (dataFim && data > dataFim) return false;
    return true;
  });
}
