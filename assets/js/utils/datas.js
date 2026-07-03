// ============================================================
// MEGABRAIN — utils/datas.js
// Datas sem dependências. Strings "YYYY-MM-DD" e "DD/MM/YYYY"
// são interpretadas no fuso local (evita o off-by-one do UTC).
// ============================================================

export function converterParaData(valor) {
  if (!valor && valor !== 0) return null;
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;

  const texto = String(valor).trim();

  let m = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

  m = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));

  const data = new Date(texto);
  return Number.isNaN(data.getTime()) ? null : data;
}

export function gerarProximos30Dias(dataInicial = new Date()) {
  const base = converterParaData(dataInicial) || new Date();
  base.setHours(0, 0, 0, 0);
  const dias = [];
  for (let i = 0; i < 30; i++) {
    const dia = new Date(base);
    dia.setDate(base.getDate() + i);
    dias.push(dia);
  }
  return dias;
}

export function formatarDataISO(valor) {
  const data = converterParaData(valor);
  if (!data) return "";
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

export function formatarDataBR(valor) {
  const data = converterParaData(valor);
  return data ? data.toLocaleDateString("pt-BR") : "";
}

export function obterCompetenciaAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

export function nomeDiaSemanaCurto(valor) {
  const data = converterParaData(valor);
  if (!data) return "";
  return data.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}
