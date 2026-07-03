// ============================================================
// MEGABRAIN — services/exportService.js
// Exportação de resultados (CSV e texto).
// ============================================================

import { baixarCsv } from "../utils/csv.js";

export function exportarArrayParaCsv(nomeArquivo, dados, colunas) {
  if (!Array.isArray(dados) || dados.length === 0) {
    throw new Error("Não há dados para exportar.");
  }
  baixarCsv(nomeArquivo, dados, colunas);
}

export function exportarTabelaHtmlParaCsv(nomeArquivo, seletorTabela) {
  const tabela = document.querySelector(seletorTabela);
  if (!tabela) throw new Error(`Tabela não encontrada: ${seletorTabela}`);

  const linhas = [...tabela.querySelectorAll("tr")].map((tr) =>
    [...tr.querySelectorAll("th,td")]
      .map((celula) => {
        const texto = celula.textContent.trim();
        return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
      })
      .join(";")
  );

  baixarCsv(nomeArquivo, linhas.join("\r\n"));
}

export function baixarArquivoTexto(nomeArquivo, conteudo, tipo = "text/plain;charset=utf-8;") {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
