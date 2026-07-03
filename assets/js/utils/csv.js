// ============================================================
// MEGABRAIN — utils/csv.js
// Geração e download de CSV com separador ";" e BOM UTF-8
// (compatível com o Excel brasileiro).
// ============================================================

const SEPARADOR = ";";

function escaparCelula(valor) {
  if (valor === null || valor === undefined) return "";
  const texto = typeof valor === "object" ? JSON.stringify(valor) : String(valor);
  if (/[";\n\r]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

export function converterParaCsv(dados, colunas) {
  if (!Array.isArray(dados) || dados.length === 0) return "";

  const cabecalho =
    colunas && colunas.length
      ? colunas
      : [...new Set(dados.flatMap((linha) => Object.keys(linha || {})))];

  const linhas = [cabecalho.map(escaparCelula).join(SEPARADOR)];
  for (const registro of dados) {
    linhas.push(cabecalho.map((coluna) => escaparCelula(registro?.[coluna])).join(SEPARADOR));
  }
  return linhas.join("\r\n");
}

export function baixarCsv(nomeArquivo, dados, colunas) {
  const conteudo = typeof dados === "string" ? dados : converterParaCsv(dados, colunas);
  const blob = new Blob(["﻿" + conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo.endsWith(".csv") ? nomeArquivo : `${nomeArquivo}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
