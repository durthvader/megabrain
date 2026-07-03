// ============================================================
// MEGABRAIN — pages/uploadPage.js
// Upload de bases: seleção, prévia, normalização e importação.
// ============================================================

import "../main.js";
import { listarDemandas } from "../services/demandaService.js";
import {
  validarArquivo,
  lerArquivo,
  detectarColunas,
  obterPrevia,
  processarUpload,
} from "../services/uploadService.js";
import { normalizarNomeColuna, normalizarLinhas } from "../utils/normalizarColunas.js";
import { formatarNumero } from "../utils/formatadores.js";
import { obterParametroUrl } from "../utils/tokens.js";
import { mostrarSucesso, mostrarErro, mostrarAviso } from "../utils/mensagens.js";

const selectDemanda = document.getElementById("select-demanda");
const selectTipo = document.getElementById("select-tipo");
const inputDescricao = document.getElementById("input-descricao");
const inputArquivo = document.getElementById("input-arquivo");
const areaArquivo = document.getElementById("area-arquivo");
const checkboxGuardar = document.getElementById("check-guardar-arquivo");
const botaoImportar = document.getElementById("btn-importar");
const secaoPrevia = document.getElementById("secao-previa");
const chipsColunas = document.getElementById("chips-colunas");
const tabelaPrevia = document.getElementById("tabela-previa");
const secaoResumo = document.getElementById("secao-resumo");

let dadosBrutos = null;

async function carregarDemandas() {
  try {
    const demandas = await listarDemandas();
    selectDemanda.innerHTML = '<option value="">Selecione…</option>';
    for (const demanda of demandas) {
      if (demanda.status === "arquivada") continue;
      const opcao = document.createElement("option");
      opcao.value = demanda.id;
      opcao.textContent = `${demanda.nome} (${demanda.tipo})`;
      selectDemanda.appendChild(opcao);
    }

    const demandaUrl = obterParametroUrl("demanda");
    if (demandaUrl) selectDemanda.value = demandaUrl;
  } catch (erro) {
    mostrarErro(`Erro ao carregar demandas: ${erro.message}`);
  }
}

function renderizarChipsColunas(colunasOriginais) {
  chipsColunas.innerHTML = "";
  for (const original of colunasOriginais) {
    const normalizada = normalizarNomeColuna(original);
    const chip = document.createElement("span");
    const renomeada = normalizada !== String(original).toLowerCase().trim();
    chip.className = `chip${renomeada ? " chip-renomeada" : ""}`;
    chip.textContent = renomeada ? `${original} → ${normalizada}` : normalizada;
    chipsColunas.appendChild(chip);
  }
}

function renderizarPrevia(linhasNormalizadas) {
  const previa = obterPrevia(linhasNormalizadas, 20);
  const colunas = detectarColunas(previa);

  const thead = `<thead><tr>${colunas.map((coluna) => `<th>${coluna}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${previa
    .map(
      (linha) =>
        `<tr>${colunas.map((coluna) => `<td>${linha[coluna] ?? ""}</td>`).join("")}</tr>`
    )
    .join("")}</tbody>`;

  tabelaPrevia.innerHTML = thead + tbody;
}

inputArquivo.addEventListener("change", async () => {
  const arquivo = inputArquivo.files[0];
  dadosBrutos = null;
  botaoImportar.disabled = true;
  secaoPrevia.classList.add("oculto");
  secaoResumo.classList.add("oculto");
  areaArquivo.classList.toggle("com-arquivo", Boolean(arquivo));

  if (!arquivo) return;

  const validacao = validarArquivo(arquivo);
  if (!validacao.valido) {
    mostrarErro(validacao.erro);
    inputArquivo.value = "";
    areaArquivo.classList.remove("com-arquivo");
    return;
  }

  try {
    dadosBrutos = await lerArquivo(arquivo);
    if (!dadosBrutos.length) {
      mostrarAviso("O arquivo foi lido, mas não tem linhas de dados.");
      return;
    }

    renderizarChipsColunas(detectarColunas(dadosBrutos));
    renderizarPrevia(normalizarLinhas(obterPrevia(dadosBrutos, 20)));

    document.getElementById("previa-info").textContent =
      `${formatarNumero(dadosBrutos.length)} linhas detectadas · ` +
      `${(arquivo.size / 1024).toFixed(0)} KB · mostrando as primeiras 20`;

    secaoPrevia.classList.remove("oculto");
    botaoImportar.disabled = false;
  } catch (erro) {
    mostrarErro(`Erro ao ler o arquivo: ${erro.message}`);
  }
});

botaoImportar.addEventListener("click", async () => {
  const arquivo = inputArquivo.files[0];
  const demandaId = selectDemanda.value;
  const tipoBase = selectTipo.value;

  if (!demandaId) return mostrarAviso("Selecione a demanda.");
  if (!tipoBase) return mostrarAviso("Selecione o tipo de base.");
  if (!arquivo || !dadosBrutos) return mostrarAviso("Selecione e leia um arquivo primeiro.");

  botaoImportar.disabled = true;
  botaoImportar.textContent = "Importando…";

  try {
    const resultado = await processarUpload({
      demandaId,
      tipoBase,
      descricao: inputDescricao.value.trim(),
      arquivo,
      guardarArquivo: checkboxGuardar.checked,
    });

    document.getElementById("resumo-linhas").textContent = formatarNumero(resultado.importadas);
    document.getElementById("resumo-erros").textContent = formatarNumero(resultado.erros);
    document.getElementById("resumo-tamanho").textContent = `${(arquivo.size / 1024).toFixed(0)} KB`;
    document.getElementById("resumo-storage").textContent = resultado.base.caminho_storage
      ? "Sim"
      : "Não";
    secaoResumo.classList.remove("oculto");

    if (resultado.erros > 0) {
      mostrarAviso(
        `Importação concluída com erros: ${resultado.importadas} linhas ok, ${resultado.erros} com falha.`
      );
      console.warn("[Megabrain] Erros de importação:", resultado.mensagensErro);
    } else {
      mostrarSucesso(`Importação concluída: ${resultado.importadas} linhas.`);
    }
  } catch (erro) {
    mostrarErro(`Erro na importação: ${erro.message}`);
  } finally {
    botaoImportar.disabled = false;
    botaoImportar.textContent = "Importar para o Supabase";
  }
});

carregarDemandas();
