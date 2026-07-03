// ============================================================
// MEGABRAIN — utils/tokens.js
// Tokens públicos de demanda e leitura de parâmetros da URL.
// ============================================================

// Sem caracteres ambíguos (0/O, 1/l/I) para facilitar leitura em voz alta.
const ALFABETO = "abcdefghjkmnpqrstuvwxyz23456789";

export function gerarTokenCurto(tamanho = 12) {
  const aleatorios = new Uint32Array(tamanho);
  crypto.getRandomValues(aleatorios);
  let token = "";
  for (let i = 0; i < tamanho; i++) {
    token += ALFABETO[aleatorios[i] % ALFABETO.length];
  }
  return token;
}

export function obterParametroUrl(nome) {
  return new URLSearchParams(window.location.search).get(nome);
}

export function montarLinkFormulario(token) {
  // Troca o nome do arquivo atual por formulario.html, preservando a pasta.
  const base = window.location.href.split("?")[0].replace(/[^/]*$/, "");
  return `${base}formulario.html?token=${encodeURIComponent(token)}`;
}
