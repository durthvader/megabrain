// ============================================================
// MEGABRAIN — pages/indexPage.js
// Visão geral do portfólio e da infraestrutura de bases.
// ============================================================

import "../main.js";
import {
  calcularResumo,
  carregarCatalogo,
  formatarAcesso,
  formatarBytes,
  formatarDataCatalogo,
  formatarStatusProjeto,
  formatarTipoProjeto,
} from "../services/catalogoService.js";
import { formatarNumero } from "../utils/formatadores.js";

function preencher(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = valor;
}

function criarCelula(texto) {
  const td = document.createElement("td");
  td.textContent = texto;
  return td;
}

function renderizarStatusProjetos(catalogo) {
  const corpo = document.getElementById("status-projetos-corpo");
  const resumo = calcularResumo(catalogo.projetos);

  preencher("kpi-projetos", resumo.total);
  preencher("kpi-andamento", resumo.emAndamento);
  preencher("kpi-publicados", resumo.publicados);
  preencher("kpi-concluidos", resumo.concluidos);
  preencher("kpi-restritos", resumo.restritos);
  preencher("status-atualizado", `Catálogo atualizado em ${formatarDataCatalogo(catalogo.atualizado_em)}`);

  corpo.replaceChildren();
  for (const projeto of catalogo.projetos) {
    const tr = document.createElement("tr");
    const nome = document.createElement("td");
    const link = document.createElement("a");
    link.href = `resultados.html#${encodeURIComponent(projeto.id)}`;
    link.textContent = projeto.titulo;
    nome.appendChild(link);

    const status = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `badge badge-${projeto.status}`;
    badge.textContent = formatarStatusProjeto(projeto.status);
    status.appendChild(badge);

    tr.append(
      nome,
      status,
      criarCelula(formatarTipoProjeto(projeto.tipo)),
      criarCelula(formatarAcesso(projeto.compartilhamento?.visibilidade)),
      criarCelula(formatarDataCatalogo(projeto.atualizado_em))
    );
    corpo.appendChild(tr);
  }
}

async function carregarInfraestrutura() {
  const status = document.getElementById("status-infraestrutura");
  try {
    const { listarBasesDisponiveis } = await import("../services/baseService.js");
    const bases = await listarBasesDisponiveis();
    const linhas = bases.reduce((total, base) => total + Number(base.qtd_linhas || 0), 0);
    const tamanho = bases.reduce((total, base) => total + Number(base.tamanho_bytes || 0), 0);
    const originais = bases.filter((base) => Boolean(base.caminho_storage)).length;

    preencher("kpi-bases", formatarNumero(bases.length));
    preencher("kpi-linhas", formatarNumero(linhas));
    preencher("kpi-armazenamento", formatarBytes(tamanho));
    preencher("kpi-originais", formatarNumero(originais));
    status.textContent = "Dados carregados do Supabase.";
  } catch (erro) {
    ["kpi-bases", "kpi-linhas", "kpi-armazenamento", "kpi-originais"].forEach((id) =>
      preencher(id, "—")
    );
    status.textContent = "Infraestrutura indisponível. O catálogo de projetos continua funcionando.";
    console.warn("[Megabrain] Não foi possível carregar as bases:", erro);
  }
}

async function iniciar() {
  try {
    const catalogo = await carregarCatalogo();
    renderizarStatusProjetos(catalogo);
  } catch (erro) {
    preencher("status-atualizado", `Falha ao carregar catálogo: ${erro.message}`);
    console.error(erro);
  }
  await carregarInfraestrutura();
}

iniciar();
