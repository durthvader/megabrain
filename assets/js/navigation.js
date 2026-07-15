// ============================================================
// MEGABRAIN — navigation.js
// Monta a sidebar em todas as páginas administrativas e marca
// o item ativo a partir de <body data-page="...">.
// ============================================================

// O Megabrain é um catálogo administrativo. As ferramentas e os portais
// de cada projeto são abertos pelos cards de Resultados.
const LINKS = [
  { pagina: "index", rotulo: "Início", href: "index.html", icone: "🏠" },
  { pagina: "resultados", rotulo: "Projetos e resultados", href: "resultados.html", icone: "🗂️" },
  { pagina: "upload", rotulo: "Upload de arquivos", href: "upload.html", icone: "📤" },
  { pagina: "configuracoes", rotulo: "Bases e armazenamento", href: "configuracoes.html", icone: "🗄️" },
];

export function initNavigation() {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return; // páginas públicas não têm sidebar

  const paginaAtiva = document.body.dataset.page || "";

  sidebar.innerHTML = `
    <div class="sidebar-marca"><span>🧠</span><span>Megabrain</span></div>
    <nav class="sidebar-nav">
      ${LINKS.map(
        (link) => `
        <a class="sidebar-link${link.pagina === paginaAtiva ? " ativo" : ""}" href="${link.href}">
          <span class="sidebar-icone">${link.icone}</span>${link.rotulo}
        </a>`
      ).join("")}
    </nav>
    <div class="sidebar-rodape">Catálogo privado de projetos</div>
  `;

  const botaoMenu = document.getElementById("btn-menu");
  if (botaoMenu) {
    botaoMenu.addEventListener("click", () => sidebar.classList.toggle("aberta"));
  }
}
