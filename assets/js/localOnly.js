// ============================================================
// MEGABRAIN — localOnly.js
// O catálogo administrativo é executado somente no computador local.
// As páginas públicas de projetos não importam este módulo.
// ============================================================

const HOSTS_LOCAIS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function ambienteLocal(localizacao = window.location) {
  return ["http:", "https:"].includes(localizacao.protocol) &&
    HOSTS_LOCAIS.has(localizacao.hostname);
}

export function exigirAmbienteLocal() {
  if (ambienteLocal()) return;

  document.title = "Megabrain · Uso local";
  document.body.innerHTML = [
    '<main class="conteudo" style="max-width: 760px; margin: 8vh auto;">',
    '  <section class="secao card">',
    "    <h1>Megabrain é um catálogo local</h1>",
    "    <p>O portal administrativo não é carregado pela internet.</p>",
    "    <p>Para abrir neste computador, execute:</p>",
    "    <pre><code>python -m http.server 5500 --bind 127.0.0.1</code></pre>",
    '    <p>Depois acesse <strong>http://127.0.0.1:5500/</strong>.</p>',
    "  </section>",
    "</main>",
  ].join("\n");

  throw new Error("Megabrain central bloqueado fora do ambiente local.");
}
