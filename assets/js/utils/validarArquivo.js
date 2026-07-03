// ============================================================
// MEGABRAIN — utils/validarArquivo.js
// Validações de arquivo antes da importação.
// Limite conservador para caber no navegador e no plano free.
// ============================================================

export const EXTENSOES_PERMITIDAS = ["csv", "xlsx", "xls"];
export const TAMANHO_MAXIMO_MB = 10;

export function obterExtensao(arquivo) {
  return (arquivo?.name?.split(".").pop() || "").toLowerCase();
}

export function validarArquivoObrigatorio(arquivo) {
  if (!arquivo) return { valido: false, erro: "Selecione um arquivo." };
  return { valido: true };
}

export function validarExtensao(arquivo) {
  const extensao = obterExtensao(arquivo);
  if (!EXTENSOES_PERMITIDAS.includes(extensao)) {
    return {
      valido: false,
      erro: `Extensão ".${extensao}" não suportada. Use: ${EXTENSOES_PERMITIDAS.join(", ")}.`,
    };
  }
  return { valido: true, extensao };
}

export function validarTamanhoArquivo(arquivo, maximoMb = TAMANHO_MAXIMO_MB) {
  const tamanhoMb = arquivo.size / 1024 / 1024;
  if (tamanhoMb > maximoMb) {
    return {
      valido: false,
      erro: `Arquivo com ${tamanhoMb.toFixed(1)} MB excede o limite de ${maximoMb} MB.`,
    };
  }
  return { valido: true };
}
