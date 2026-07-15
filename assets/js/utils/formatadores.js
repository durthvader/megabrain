// ============================================================
// MEGABRAIN — utils/formatadores.js
// Números, moeda, percentual e rótulos de status em pt-BR.
// ============================================================

export function converterNumero(valor) {
  if (valor === null || valor === undefined || valor === "") return 0;
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;

  let texto = String(valor).trim().replace(/[R$\s]/g, "");
  if (/,\d{1,2}$/.test(texto)) {
    // Formato brasileiro: 1.234,56
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else {
    texto = texto.replace(/,/g, "");
  }
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : 0;
}

export function formatarNumero(valor, casas = 0) {
  return converterNumero(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

export function formatarMoeda(valor) {
  return converterNumero(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarPercentual(valor, casas = 1) {
  return `${formatarNumero(valor, casas)}%`;
}

const ROTULOS_STATUS = {
  ativa: "Ativa",
  concluida: "Concluída",
  arquivada: "Arquivada",
  apagada: "Apagada",
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  importada: "Importada",
};

export function formatarStatus(status) {
  return ROTULOS_STATUS[status] || status || "—";
}
