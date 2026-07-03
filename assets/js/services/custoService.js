// ============================================================
// MEGABRAIN — services/custoService.js
// Consolidação de custos operacionais (hora extra, banco de
// horas, sobreaviso, acionamento, adicional noturno).
// ============================================================

import { listarLinhasPorTipo } from "./baseService.js";
import { converterNumero } from "../utils/formatadores.js";
import { removerAcentos } from "../utils/normalizarColunas.js";
import { formatarDataISO } from "../utils/datas.js";

const TIPOS_BASE_CUSTO = ["custos", "horas_extras", "banco_horas", "sobreaviso", "adicional_noturno"];

export const TIPOS_CUSTO = [
  "hora_extra",
  "banco_horas",
  "sobreaviso",
  "acionamento_sobreaviso",
  "adicional_noturno",
  "outros",
];

export function normalizarTipoCusto(valor, tipoBase = "") {
  const texto = removerAcentos(String(valor || tipoBase)).toLowerCase();
  if (!texto) return "outros";
  if (texto.includes("acionamento")) return "acionamento_sobreaviso";
  if (texto.includes("sobreaviso")) return "sobreaviso";
  if (texto.includes("banco")) return "banco_horas";
  if (texto.includes("extra")) return "hora_extra";
  if (texto.includes("noturno")) return "adicional_noturno";
  return "outros";
}

export async function carregarDadosCustos(demandaId) {
  const resultados = await Promise.all(
    TIPOS_BASE_CUSTO.map((tipo) => listarLinhasPorTipo(demandaId, tipo))
  );

  const registros = [];
  resultados.forEach((linhas, indice) => {
    const tipoBase = TIPOS_BASE_CUSTO[indice];
    for (const linha of linhas) {
      const dados = linha.dados || {};
      registros.push({
        tecnico: dados.tecnico || "",
        supervisor: dados.supervisor || "",
        empresa: dados.empresa || "",
        cidade: dados.cidade || "",
        regional: dados.regional || "",
        data: formatarDataISO(dados.data) || "",
        tipo_custo: normalizarTipoCusto(dados.tipo_custo, tipoBase),
        quantidade_horas: converterNumero(dados.quantidade_horas),
        valor: converterNumero(dados.valor),
        observacao: dados.observacao || "",
      });
    }
  });

  return registros;
}

function consolidarPorCampo(linhas, campo) {
  const grupos = new Map();
  for (const linha of linhas || []) {
    const chave = String(linha[campo] || "").trim() || "(não informado)";
    const grupo = grupos.get(chave) || { chave, valor: 0, horas: 0, registros: 0 };
    grupo.valor += linha.valor;
    grupo.horas += linha.quantidade_horas;
    grupo.registros += 1;
    grupos.set(chave, grupo);
  }
  return [...grupos.values()].sort((a, b) => b.valor - a.valor);
}

export function consolidarCustosPorTipo(linhas) {
  return consolidarPorCampo(linhas, "tipo_custo");
}

export function consolidarCustosPorTecnico(linhas) {
  return consolidarPorCampo(linhas, "tecnico");
}

export function consolidarCustosPorSupervisor(linhas) {
  return consolidarPorCampo(linhas, "supervisor");
}

export function consolidarCustosPorEmpresa(linhas) {
  return consolidarPorCampo(linhas, "empresa");
}

export function consolidarPorCompetencia(linhas) {
  const grupos = new Map();
  for (const linha of linhas || []) {
    const competencia = String(linha.data || "").slice(0, 7); // YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(competencia)) continue;
    grupos.set(competencia, (grupos.get(competencia) || 0) + linha.valor);
  }
  return [...grupos.entries()]
    .map(([competencia, valor]) => ({ competencia, valor }))
    .sort((a, b) => a.competencia.localeCompare(b.competencia));
}

export function identificarOfensores(linhas, campo = "tecnico", limite = 10) {
  return consolidarPorCampo(linhas, campo).slice(0, limite);
}
