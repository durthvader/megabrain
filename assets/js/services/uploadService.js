// ============================================================
// MEGABRAIN — services/uploadService.js
// Leitura de CSV/Excel no navegador (PapaParse/SheetJS via CDN),
// normalização de colunas e importação para base_linhas.
// ============================================================

import { supabase } from "../supabaseClient.js";
import {
  validarArquivoObrigatorio,
  validarExtensao,
  validarTamanhoArquivo,
  obterExtensao,
} from "../utils/validarArquivo.js";
import { normalizarLinhas } from "../utils/normalizarColunas.js";
import { criarBase } from "./baseService.js";

const TAMANHO_LOTE = 500;
const BUCKET = "megabrain-bases";

export function validarArquivo(arquivo) {
  const obrigatorio = validarArquivoObrigatorio(arquivo);
  if (!obrigatorio.valido) return obrigatorio;

  const extensao = validarExtensao(arquivo);
  if (!extensao.valido) return extensao;

  return validarTamanhoArquivo(arquivo);
}

export function lerCsv(arquivo) {
  return new Promise((resolve, reject) => {
    if (!window.Papa) {
      reject(new Error("PapaParse não carregado. Verifique a tag <script> do CDN."));
      return;
    }
    window.Papa.parse(arquivo, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (resultado) => resolve(resultado.data),
      error: reject,
    });
  });
}

export function lerExcel(arquivo) {
  return new Promise((resolve, reject) => {
    if (!window.XLSX) {
      reject(new Error("SheetJS não carregado. Verifique a tag <script> do CDN."));
      return;
    }
    const leitor = new FileReader();
    leitor.onload = (evento) => {
      try {
        const pasta = window.XLSX.read(new Uint8Array(evento.target.result), { type: "array" });
        const primeiraAba = pasta.Sheets[pasta.SheetNames[0]];
        resolve(window.XLSX.utils.sheet_to_json(primeiraAba, { defval: "" }));
      } catch (erro) {
        reject(erro);
      }
    };
    leitor.onerror = reject;
    leitor.readAsArrayBuffer(arquivo);
  });
}

export function lerArquivo(arquivo) {
  return obterExtensao(arquivo) === "csv" ? lerCsv(arquivo) : lerExcel(arquivo);
}

export function detectarColunas(dados) {
  return dados && dados.length ? Object.keys(dados[0]) : [];
}

export function obterPrevia(dados, limite = 20) {
  return (dados || []).slice(0, limite);
}

export async function importarDados(demandaId, baseId, tipoBase, dados) {
  let importadas = 0;
  let erros = 0;
  const mensagensErro = [];

  for (let i = 0; i < dados.length; i += TAMANHO_LOTE) {
    const lote = dados.slice(i, i + TAMANHO_LOTE).map((linha, indice) => ({
      demanda_id: demandaId,
      base_id: baseId,
      tipo_base: tipoBase,
      linha_numero: i + indice + 1,
      dados: linha,
    }));

    const { error } = await supabase.from("base_linhas").insert(lote);
    if (error) {
      erros += lote.length;
      mensagensErro.push(`Lote ${i / TAMANHO_LOTE + 1}: ${error.message}`);
    } else {
      importadas += lote.length;
    }
  }

  return { importadas, erros, mensagensErro };
}

export async function salvarArquivoStorage(arquivo, demandaId) {
  const nomeSeguro = arquivo.name.replace(/[^\w.\-]+/g, "_");
  const caminho = `${demandaId}/${Date.now()}_${nomeSeguro}`;

  const { error } = await supabase.storage.from(BUCKET).upload(caminho, arquivo);
  if (error) throw error;
  return caminho;
}

export async function registrarLog(demandaId, baseId, tipo, mensagem, detalhes = null) {
  // Log é auxiliar: falha aqui não deve derrubar a importação.
  const { error } = await supabase
    .from("logs")
    .insert({ demanda_id: demandaId, base_id: baseId, tipo, mensagem, detalhes });
  if (error) console.warn("[Megabrain] Falha ao registrar log:", error.message);
}

export async function processarUpload({ demandaId, tipoBase, descricao, arquivo, guardarArquivo }) {
  const validacao = validarArquivo(arquivo);
  if (!validacao.valido) throw new Error(validacao.erro);

  const dadosBrutos = await lerArquivo(arquivo);
  if (!dadosBrutos.length) throw new Error("O arquivo não tem linhas de dados.");

  const colunasOriginais = detectarColunas(dadosBrutos);
  const linhas = normalizarLinhas(dadosBrutos);
  const colunasNormalizadas = detectarColunas(linhas);

  let caminhoStorage = null;
  if (guardarArquivo) {
    caminhoStorage = await salvarArquivoStorage(arquivo, demandaId);
  }

  const base = await criarBase({
    demanda_id: demandaId,
    nome_arquivo: arquivo.name,
    tipo_base: tipoBase,
    descricao: descricao || null,
    qtd_linhas: linhas.length,
    qtd_colunas: colunasNormalizadas.length,
    tamanho_bytes: arquivo.size,
    colunas_originais: colunasOriginais,
    colunas_normalizadas: colunasNormalizadas,
    guardar_arquivo_original: Boolean(guardarArquivo),
    caminho_storage: caminhoStorage,
  });

  const resultado = await importarDados(demandaId, base.id, tipoBase, linhas);

  await registrarLog(
    demandaId,
    base.id,
    "upload",
    `Importação de "${arquivo.name}": ${resultado.importadas} linhas, ${resultado.erros} erros.`,
    {
      tipo_base: tipoBase,
      tamanho_bytes: arquivo.size,
      importadas: resultado.importadas,
      erros: resultado.erros,
    }
  );

  return { base, totalLinhas: linhas.length, ...resultado };
}
