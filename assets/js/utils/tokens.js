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

// Demandas de escala apontam para o painel público completo
// (escala-publica.html); as demais, para o formulário genérico.
export function montarLinkPublico(demanda) {
  const base = window.location.href.split("?")[0].replace(/[^/]*$/, "");
  const pagina = demanda.tipo === "escala" ? "escala-publica.html" : "formulario.html";
  return `${base}${pagina}?token=${encodeURIComponent(demanda.token_publico)}`;
}
