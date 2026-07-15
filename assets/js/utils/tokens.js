// ============================================================
// MEGABRAIN — utils/tokens.js
// Tokens públicos de demanda e leitura de parâmetros da URL.
// ============================================================

// Sem caracteres ambíguos (0/O, 1/l/I) para facilitar leitura em voz alta.
const ALFABETO = "abcdefghjkmnpqrstuvwxyz23456789";

export function gerarTokenCurto(tamanho = 16) {
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

// O link público sempre aponta para a página de resultado — em
// branco (só título + descrição) até a IA gerar o conteúdo daquela
// demanda e a página ser registrada em `demandas.pagina_resultado`.
export function montarLinkPublico(demanda) {
  const base = window.location.href.split("?")[0].replace(/[^/]*$/, "");
  return `${base}resultado.html?token=${encodeURIComponent(demanda.token_publico)}`;
}
