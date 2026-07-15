// ============================================================
// MEGABRAIN — pages/resultadosPage.js
// Catálogo pesquisável de projetos e seus resultados.
// ============================================================

import "../main.js";
import {
  carregarCatalogo,
  caminhoParaFileUrl,
  formatarAcesso,
  formatarDataCatalogo,
  formatarStatusProjeto,
  formatarTipoProjeto,
  listarDestinos,
} from "../services/catalogoService.js";
import { mostrarErro, mostrarSucesso } from "../utils/mensagens.js";

const lista = document.getElementById("catalogo-projetos");
const vazio = document.getElementById("catalogo-vazio");
const contagem = document.getElementById("catalogo-contagem");
const busca = document.getElementById("filtro-busca");
const filtroStatus = document.getElementById("filtro-status");
const filtroTipo = document.getElementById("filtro-tipo");
const filtroAcesso = document.getElementById("filtro-acesso");

let projetos = [];

function elemento(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

function normalizarHrefSeguro(valor) {
  if (typeof valor !== "string" || !valor.trim()) return null;
  try {
    const url = new URL(valor, document.baseURI);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.href;
  } catch {
    return null;
  }
}

async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    const area = document.createElement("textarea");
    area.value = texto;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  mostrarSucesso("Caminho copiado.");
}

function criarAcao(destino, principal = false) {
  if (destino.href) {
    const href = normalizarHrefSeguro(destino.href);
    if (!href) return null;
    const link = elemento("a", `btn${principal ? " btn-primario" : ""}`, destino.rotulo || "Abrir");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  }

  if (destino.caminho_local) {
    const grupo = elemento("span", "grupo-acoes-locais");
    const copiar = elemento(
      "button",
      `btn${principal ? " btn-primario" : ""}`,
      destino.rotulo || "Copiar caminho"
    );
    copiar.type = "button";
    copiar.addEventListener("click", () => copiarTexto(destino.caminho_local));
    grupo.appendChild(copiar);

    const fileUrl = caminhoParaFileUrl(destino.caminho_local);
    if (fileUrl) {
      const abrir = elemento("a", "btn btn-pequeno", "Tentar abrir");
      abrir.href = fileUrl;
      abrir.target = "_blank";
      abrir.rel = "noopener noreferrer";
      abrir.title = "O navegador pode bloquear caminhos locais; use Copiar caminho se isso ocorrer.";
      grupo.appendChild(abrir);
    }
    return grupo;
  }

  return null;
}

function criarCard(projeto) {
  const card = elemento("article", "projeto-card");
  card.id = projeto.id;

  const topo = elemento("div", "projeto-card-topo");
  const tituloArea = elemento("div");
  const titulo = elemento("h2", "projeto-card-titulo", projeto.titulo);
  const atualizado = elemento(
    "span",
    "texto-mudo",
    `Atualizado em ${formatarDataCatalogo(projeto.atualizado_em)}`
  );
  tituloArea.append(titulo, atualizado);

  const badges = elemento("div", "projeto-badges");
  badges.append(
    elemento("span", `badge badge-${projeto.status}`, formatarStatusProjeto(projeto.status)),
    elemento(
      "span",
      `badge badge-acesso-${projeto.compartilhamento?.visibilidade || "privado"}`,
      formatarAcesso(projeto.compartilhamento?.visibilidade)
    )
  );
  topo.append(tituloArea, badges);

  const descricao = elemento("p", "projeto-card-descricao", projeto.descricao);
  const metadados = elemento("div", "projeto-metadados");
  metadados.append(
    elemento("span", "projeto-meta", formatarTipoProjeto(projeto.tipo)),
    elemento("span", "projeto-meta", projeto.responsavel || "Sem responsável")
  );
  for (const tag of projeto.tags || []) {
    metadados.appendChild(elemento("span", "projeto-tag", tag));
  }

  const compartilhamento = projeto.compartilhamento || {};
  const acesso = elemento("div", "projeto-acesso");
  const iconeAcesso = compartilhamento.modo_acesso === "pendente" ? "⚠️" : "🔒";
  acesso.textContent = `${iconeAcesso} ${compartilhamento.publico_descricao || "Acesso não definido"}`;
  if (compartilhamento.modo_acesso === "pendente") {
    acesso.appendChild(document.createTextNode(" · proteção de servidor ainda pendente"));
  }

  const acoes = elemento("div", "projeto-acoes");
  const destinos = listarDestinos(projeto);
  destinos.forEach((destino, indice) => {
    const acao = criarAcao(destino, indice === 0);
    if (acao) acoes.appendChild(acao);
  });
  if (!acoes.children.length) {
    const indisponivel = elemento("button", "btn", "Destino privado não configurado");
    indisponivel.type = "button";
    indisponivel.disabled = true;
    acoes.appendChild(indisponivel);
  }

  card.append(topo, descricao, metadados, acesso, acoes);
  return card;
}

function corresponde(projeto) {
  const termo = busca.value.trim().toLocaleLowerCase("pt-BR");
  const texto = [projeto.titulo, projeto.descricao, projeto.responsavel, ...(projeto.tags || [])]
    .join(" ")
    .toLocaleLowerCase("pt-BR");
  return (
    (!termo || texto.includes(termo)) &&
    (!filtroStatus.value || projeto.status === filtroStatus.value) &&
    (!filtroTipo.value || projeto.tipo === filtroTipo.value) &&
    (!filtroAcesso.value || projeto.compartilhamento?.visibilidade === filtroAcesso.value)
  );
}

function renderizar() {
  const visiveis = projetos.filter(corresponde);
  lista.replaceChildren(...visiveis.map(criarCard));
  vazio.classList.toggle("oculto", visiveis.length > 0);
  contagem.textContent = `${visiveis.length} de ${projetos.length} projeto(s)`;

  const id = window.location.hash.slice(1);
  if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "center" }));
}

for (const controle of [busca, filtroStatus, filtroTipo, filtroAcesso]) {
  controle.addEventListener(controle.tagName === "INPUT" ? "input" : "change", renderizar);
}

async function iniciar() {
  try {
    const catalogo = await carregarCatalogo();
    projetos = catalogo.projetos;
    document.getElementById("catalogo-atualizado").textContent = formatarDataCatalogo(
      catalogo.atualizado_em
    );
    renderizar();
  } catch (erro) {
    mostrarErro(erro.message);
    lista.innerHTML = '<div class="alerta alerta-erro">Não foi possível carregar o catálogo.</div>';
  }
}

iniciar();
