// ============================================================
// MEGABRAIN — pages/demandaDetalhePage.js
// Ferramenta administrativa legada: dados, token, bases, respostas,
// planos e ações (exportar, limpar, arquivar). Não aparece no catálogo.
// demanda-detalhe.html?id=UUID
// ============================================================

import "../main.js";
import { buscarDemandaPorId, arquivarDemanda, atualizarDemanda } from "../services/demandaService.js";
import {
  listarBasesVinculadas,
  listarBasesDisponiveis,
  listarLinhasPorBase,
  apagarBase,
  vincularBases,
  desvincularBase,
} from "../services/baseService.js";
import { listarRespostasPorDemanda } from "../services/formularioService.js";
import { listarPlanosPorDemanda } from "../services/planoService.js";
import {
  limparDemanda,
  apagarDemandaCompleta,
  resumirImpactoDemanda,
} from "../services/limpezaService.js";
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

  el("demanda-pagina-resultado").value = demanda.pagina_resultado || "";

  // Botões de navegação contextual
  el("btn-ir-upload").href = `upload.html?demanda=${demanda.id}`;
  el("btn-abrir-formulario").href = link;

  const botaoEscalaPublica = el("btn-abrir-escala-publica");
  botaoEscalaPublica.classList.toggle("oculto", demanda.tipo !== "escala");
  if (demanda.tipo === "escala") {
    botaoEscalaPublica.href = `escala-publica.html?token=${encodeURIComponent(demanda.token_publico)}`;
  }

  const botaoDuplasPublica = el("btn-abrir-duplas-publica");
  botaoDuplasPublica.classList.toggle("oculto", demanda.tipo !== "duplas");
  if (demanda.tipo === "duplas") {
    botaoDuplasPublica.href = `duplas-publica.html?token=${encodeURIComponent(demanda.token_publico)}`;
  }

  const botaoDuplasResultado = el("btn-abrir-duplas-resultado");
  botaoDuplasResultado.classList.toggle("oculto", demanda.tipo !== "duplas");
  if (demanda.tipo === "duplas") {
    botaoDuplasResultado.href = `duplas-resultado.html?token=${encodeURIComponent(demanda.token_publico)}`;
  }

  el("btn-abrir-escala").href = `escala.html?demanda=${demanda.id}`;
  el("btn-abrir-custos").href = `custos.html?demanda=${demanda.id}`;
  el("link-novo-plano").href = `planos.html?demanda=${demanda.id}`;
}

async function renderizarBases() {
  const bases = await listarBasesVinculadas(demanda.id);
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

    const botaoDesvincular = document.createElement("button");
    botaoDesvincular.className = "btn btn-pequeno";
    botaoDesvincular.textContent = "Desvincular";
    botaoDesvincular.addEventListener("click", async () => {
      if (!window.confirm(`Desvincular "${base.nome_arquivo}" desta demanda? A base continua existindo.`)) return;
      try {
        await desvincularBase(demanda.id, base.id);
        mostrarSucesso("Base desvinculada.");
        await Promise.all([renderizarBases(), renderizarSelecaoVincular()]);
      } catch (erro) {
        mostrarErro(`Erro ao desvincular base: ${erro.message}`);
      }
    });

    const botaoApagar = document.createElement("button");
    botaoApagar.className = "btn btn-pequeno btn-perigo";
    botaoApagar.textContent = "Apagar";
    botaoApagar.addEventListener("click", async () => {
      if (
        !window.confirm(
          `Apagar a base "${base.nome_arquivo}" e todas as suas linhas? Isso afeta QUALQUER demanda que use esta base.`
        )
      )
        return;
      try {
        await apagarBase(base.id);
        mostrarSucesso("Base apagada.");
        await Promise.all([renderizarBases(), renderizarSelecaoVincular()]);
      } catch (erro) {
        mostrarErro(`Erro ao apagar base: ${erro.message}`);
      }
    });

    acoes.append(botaoExportar, botaoDesvincular, botaoApagar);
    tr.lastElementChild.appendChild(acoes);
    corpo.appendChild(tr);
  }
}

async function renderizarSelecaoVincular() {
  const [todasBases, basesVinculadas] = await Promise.all([
    listarBasesDisponiveis(),
    listarBasesVinculadas(demanda.id),
  ]);
  const idsVinculados = new Set(basesVinculadas.map((base) => base.id));
  const disponiveis = todasBases.filter((base) => !idsVinculados.has(base.id));

  const select = el("select-vincular-base");
  select.innerHTML = '<option value="">Selecione…</option>';
  for (const base of disponiveis) {
    const opcao = document.createElement("option");
    opcao.value = base.id;
    opcao.textContent = `${base.nome_arquivo} — ${base.tipo_base}`;
    select.appendChild(opcao);
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
  el("btn-salvar-pagina-resultado").addEventListener("click", async () => {
    const valor = el("demanda-pagina-resultado").value.trim();
    try {
      demanda = await atualizarDemanda(demanda.id, { pagina_resultado: valor || null });
      mostrarSucesso(valor ? "Página de resultado salva." : "Página de resultado removida — link volta ao estado em branco.");
    } catch (erro) {
      mostrarErro(`Erro ao salvar página de resultado: ${erro.message}`);
    }
  });

  el("btn-vincular-base").addEventListener("click", async () => {
    const baseId = el("select-vincular-base").value;
    if (!baseId) return mostrarAviso("Selecione uma base para vincular.");
    try {
      await vincularBases(demanda.id, [baseId]);
      mostrarSucesso("Base vinculada.");
      await Promise.all([renderizarBases(), renderizarSelecaoVincular()]);
    } catch (erro) {
      mostrarErro(`Erro ao vincular base: ${erro.message}`);
    }
  });

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
      `Isso desvincula todas as bases desta demanda (sem apagá-las — elas continuam disponíveis para outras demandas) e apaga respostas, análises, planos e logs desta demanda (a demanda em si permanece).\n\nExporte antes, se precisar. Digite LIMPAR para confirmar:`
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
        renderizarSelecaoVincular(),
        renderizarRespostas(),
        renderizarPlanos(),
      ]);
    } catch (erro) {
      mostrarErro(`Erro na limpeza: ${erro.message}`);
    }
  });

  el("btn-apagar-demanda").addEventListener("click", async () => {
    let resumo;
    try {
      resumo = await resumirImpactoDemanda(demanda.id);
    } catch (erro) {
      mostrarErro(`Erro ao calcular o impacto: ${erro.message}`);
      return;
    }

    // Só lista o que existe, para a confirmação não virar um muro de zeros.
    const itens = [
      [resumo.bases, `${resumo.bases} base(s) e ${formatarNumero(resumo.linhas)} linha(s)`],
      [resumo.arquivos, `${resumo.arquivos} arquivo(s) no Storage`],
      [resumo.respostas, `${formatarNumero(resumo.respostas)} resposta(s)`],
      [resumo.analises, `${resumo.analises} análise(s)`],
      [resumo.planos, `${resumo.planos} plano(s) de ação`],
    ]
      .filter(([quantidade]) => quantidade > 0)
      .map(([, texto]) => `· ${texto}`);

    const detalhe = itens.length ? itens.join("\n") : "· nada além da própria demanda (ela está vazia)";
    const mantidas = resumo.basesMantidas
      ? `\n\n${resumo.basesMantidas} base(s) serão mantidas: outras demandas ainda as usam.`
      : "";

    const confirmacao = window.prompt(
      `APAGAR a demanda "${demanda.nome}" de vez. Isto é irreversível e vai remover:\n\n${detalhe}${mantidas}\n\nExporte antes, se precisar. Digite o nome da demanda para confirmar:`
    );
    if (confirmacao === null) return;
    if (confirmacao.trim() !== demanda.nome.trim()) {
      mostrarAviso("Nome não confere. Exclusão cancelada.");
      return;
    }

    try {
      await apagarDemandaCompleta(demanda.id);
      mostrarSucesso("Demanda apagada. Voltando para a lista…");
      window.location.href = "resultados.html";
    } catch (erro) {
      mostrarErro(`Erro ao apagar: ${erro.message}`);
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
      renderizarSelecaoVincular(),
      renderizarRespostas(),
      renderizarPlanos(),
    ]);
  } catch (erro) {
    mostrarErro(`Erro ao carregar a demanda: ${erro.message}`);
  }
}

iniciar();
