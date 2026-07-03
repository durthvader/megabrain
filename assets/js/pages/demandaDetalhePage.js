// ============================================================
// MEGABRAIN — pages/demandaDetalhePage.js
// Tudo de uma demanda: dados, token, bases, respostas, análises,
// planos e ações (exportar, limpar, arquivar).
// demanda-detalhe.html?id=UUID
// ============================================================

import "../main.js";
import { buscarDemandaPorId, arquivarDemanda } from "../services/demandaService.js";
import { listarBasesPorDemanda, listarLinhasPorBase, apagarBase } from "../services/baseService.js";
import { listarRespostasPorDemanda } from "../services/formularioService.js";
import { listarAnalisesPorDemanda } from "../services/analiseService.js";
import { listarPlanosPorDemanda } from "../services/planoService.js";
import { limparDemanda } from "../services/limpezaService.js";
import { exportarArrayParaCsv } from "../services/exportService.js";
import { montarLinkPublico, obterParametroUrl } from "../utils/tokens.js";
import { formatarDataBR } from "../utils/datas.js";
import { formatarNumero, formatarStatus } from "../utils/formatadores.js";
import { mostrarSucesso, mostrarErro, mostrarAviso } from "../utils/mensagens.js";

const demandaId = obterParametroUrl("id");
let demanda = null;

function el(id) {
  return document.getElementById(id);
}

function renderizarCabecalho() {
  el("demanda-nome").textContent = demanda.nome;
  el("demanda-tipo").textContent = demanda.tipo;
  el("demanda-status").innerHTML =
    `<span class="badge badge-${demanda.status}">${formatarStatus(demanda.status)}</span>`;
  el("demanda-responsavel").textContent = demanda.responsavel || "—";
  el("demanda-periodo").textContent =
    demanda.data_inicio || demanda.data_fim
      ? `${formatarDataBR(demanda.data_inicio) || "…"} → ${formatarDataBR(demanda.data_fim) || "…"}`
      : "—";
  el("demanda-descricao").textContent = demanda.descricao || "—";
  el("demanda-token").textContent = demanda.token_publico;

  const link = montarLinkPublico(demanda);
  const linkEl = el("demanda-link");
  linkEl.href = link;
  linkEl.textContent = link;

  // Botões de navegação contextual
  el("btn-ir-upload").href = `upload.html?demanda=${demanda.id}`;
  const botaoAbrirLink = el("btn-abrir-formulario");
  botaoAbrirLink.href = link;
  botaoAbrirLink.textContent =
    demanda.tipo === "escala" ? "🗓️ Abrir painel público de escala" : "📝 Abrir formulário público";
  el("btn-abrir-escala").href = `escala.html?demanda=${demanda.id}`;
  el("btn-abrir-custos").href = `custos.html?demanda=${demanda.id}`;
}

async function renderizarBases() {
  const bases = await listarBasesPorDemanda(demanda.id);
  const corpo = el("tabela-bases-corpo");
  corpo.innerHTML = "";
  el("bases-vazio").classList.toggle("oculto", bases.length > 0);

  for (const base of bases) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${base.nome_arquivo}</td>
      <td>${base.tipo_base}</td>
      <td class="numero">${formatarNumero(base.qtd_linhas)}</td>
      <td class="numero">${base.tamanho_bytes ? (base.tamanho_bytes / 1024).toFixed(0) + " KB" : "—"}</td>
      <td>${formatarDataBR(base.criado_em)}</td>
      <td></td>
    `;

    const acoes = document.createElement("div");
    acoes.className = "tabela-acoes";

    const botaoExportar = document.createElement("button");
    botaoExportar.className = "btn btn-pequeno";
    botaoExportar.textContent = "Exportar CSV";
    botaoExportar.addEventListener("click", async () => {
      try {
        const linhas = await listarLinhasPorBase(base.id);
        const registros = linhas.map((linha) => ({
          linha: linha.linha_numero,
          ...linha.dados,
        }));
        exportarArrayParaCsv(`${base.tipo_base}_${demanda.nome}`, registros);
      } catch (erro) {
        mostrarErro(`Erro ao exportar: ${erro.message}`);
      }
    });

    const botaoApagar = document.createElement("button");
    botaoApagar.className = "btn btn-pequeno btn-perigo";
    botaoApagar.textContent = "Apagar";
    botaoApagar.addEventListener("click", async () => {
      if (!window.confirm(`Apagar a base "${base.nome_arquivo}" e todas as suas linhas?`)) return;
      try {
        await apagarBase(base.id);
        mostrarSucesso("Base apagada.");
        await renderizarBases();
      } catch (erro) {
        mostrarErro(`Erro ao apagar base: ${erro.message}`);
      }
    });

    acoes.append(botaoExportar, botaoApagar);
    tr.lastElementChild.appendChild(acoes);
    corpo.appendChild(tr);
  }
}

async function renderizarRespostas() {
  const respostas = await listarRespostasPorDemanda(demanda.id);
  const corpo = el("tabela-respostas-corpo");
  corpo.innerHTML = "";
  el("respostas-vazio").classList.toggle("oculto", respostas.length > 0);

  for (const resposta of respostas) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatarDataBR(resposta.criado_em)}</td>
      <td>${resposta.respondente_nome || "—"}</td>
      <td>${resposta.tecnico || "—"}</td>
      <td>${resposta.supervisor || "—"}</td>
      <td>${formatarDataBR(resposta.data_referencia) || "—"}</td>
      <td><code>${JSON.stringify(resposta.dados || {})}</code></td>
    `;
    corpo.appendChild(tr);
  }

  const botaoExportar = el("btn-exportar-respostas");
  botaoExportar.onclick = () => {
    try {
      const registros = respostas.map((resposta) => ({
        criado_em: resposta.criado_em,
        respondente: resposta.respondente_nome,
        perfil: resposta.respondente_perfil,
        supervisor: resposta.supervisor,
        tecnico: resposta.tecnico,
        empresa: resposta.empresa,
        cidade: resposta.cidade,
        data_referencia: resposta.data_referencia,
        ...resposta.dados,
      }));
      exportarArrayParaCsv(`respostas_${demanda.nome}`, registros);
    } catch (erro) {
      mostrarErro(erro.message);
    }
  };
}

async function renderizarAnalises() {
  const analises = await listarAnalisesPorDemanda(demanda.id);
  const lista = el("lista-analises");
  lista.innerHTML = "";
  el("analises-vazio").classList.toggle("oculto", analises.length > 0);

  for (const analise of analises) {
    const item = document.createElement("div");
    item.className = "cartao-item";
    item.innerHTML = `
      <div class="cartao-item-topo">
        <h3>${analise.titulo}</h3>
        <span class="texto-mudo">${formatarDataBR(analise.criado_em)}</span>
      </div>
      <p class="texto-suave">${analise.resumo || analise.pergunta || ""}</p>
    `;
    lista.appendChild(item);
  }
}

async function renderizarPlanos() {
  const planos = await listarPlanosPorDemanda(demanda.id);
  const corpo = el("tabela-planos-corpo");
  corpo.innerHTML = "";
  el("planos-vazio").classList.toggle("oculto", planos.length > 0);

  for (const plano of planos) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${plano.tema || "—"}</td>
      <td>${plano.acao}</td>
      <td>${plano.responsavel || "—"}</td>
      <td>${formatarDataBR(plano.prazo) || "—"}</td>
      <td><span class="badge badge-${plano.status}">${formatarStatus(plano.status)}</span></td>
    `;
    corpo.appendChild(tr);
  }
}

function configurarAcoes() {
  el("btn-copiar-link").addEventListener("click", async () => {
    const link = montarLinkPublico(demanda);
    try {
      await navigator.clipboard.writeText(link);
      mostrarSucesso("Link copiado.");
    } catch {
      window.prompt("Copie o link público:", link);
    }
  });

  el("btn-limpar-demanda").addEventListener("click", async () => {
    const confirmacao = window.prompt(
      `Isso apaga TODAS as bases, linhas, respostas, análises, planos, logs e arquivos desta demanda (a demanda em si permanece).\n\nExporte antes, se precisar. Digite LIMPAR para confirmar:`
    );
    if (confirmacao !== "LIMPAR") {
      mostrarAviso("Limpeza cancelada.");
      return;
    }
    try {
      await limparDemanda(demanda.id);
      mostrarSucesso("Dados da demanda apagados.");
      await Promise.all([
        renderizarBases(),
        renderizarRespostas(),
        renderizarAnalises(),
        renderizarPlanos(),
      ]);
    } catch (erro) {
      mostrarErro(`Erro na limpeza: ${erro.message}`);
    }
  });

  el("btn-arquivar").addEventListener("click", async () => {
    if (!window.confirm(`Arquivar a demanda "${demanda.nome}"?`)) return;
    try {
      demanda = await arquivarDemanda(demanda.id);
      mostrarSucesso("Demanda arquivada.");
      renderizarCabecalho();
    } catch (erro) {
      mostrarErro(`Erro ao arquivar: ${erro.message}`);
    }
  });
}

async function iniciar() {
  if (!demandaId) {
    mostrarErro("URL sem o parâmetro ?id=. Abra a demanda a partir da lista.");
    return;
  }

  try {
    demanda = await buscarDemandaPorId(demandaId);
    if (!demanda) {
      mostrarErro("Demanda não encontrada.");
      return;
    }

    renderizarCabecalho();
    configurarAcoes();
    await Promise.all([
      renderizarBases(),
      renderizarRespostas(),
      renderizarAnalises(),
      renderizarPlanos(),
    ]);
  } catch (erro) {
    mostrarErro(`Erro ao carregar a demanda: ${erro.message}`);
  }
}

iniciar();
