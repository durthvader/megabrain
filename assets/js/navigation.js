// ============================================================
// MEGABRAIN — navigation.js
// Monta a sidebar em todas as páginas administrativas e marca
// o item ativo a partir de <body data-page="...">.
// ============================================================

// Escala, Custos e Planos deixaram de ser seções de topo: são painéis
// acessados como cards dentro de Demandas (demandas.html), não concorrem
// no menu principal com Demandas/Upload/Análises.
const LINKS = [
  { pagina: "index", rotulo: "Início", href: "index.html", icone: "🏠" },
  { pagina: "demandas", rotulo: "Demandas", href: "demandas.html", icone: "📋" },
  { pagina: "upload", rotulo: "Upload de bases", href: "upload.html", icone: "📤" },
  { pagina: "analises", rotulo: "Análises", href: "analises.html", icone: "🔎" },
  { pagina: "configuracoes", rotulo: "Configurações", href: "configuracoes.html", icone: "⚙️" },
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
    <div class="sidebar-rodape">Portal leve de demandas operacionais</div>
  `;

  const botaoMenu = document.getElementById("btn-menu");
  if (botaoMenu) {
    botaoMenu.addEventListener("click", () => sidebar.classList.toggle("aberta"));
  }
}
