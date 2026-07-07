// ============================================================
// MEGABRAIN — utils/normalizarColunas.js
// Normaliza nomes de colunas de bases que chegam com cabeçalhos
// diferentes ("Técnico", "nome_tecnico", "Colaborador" → tecnico).
// ============================================================

const SINONIMOS = {
  // Pessoas
  nome_tecnico: "tecnico",
  colaborador: "tecnico",
  nome_colaborador: "tecnico",
  nome_do_tecnico: "tecnico",
  supervisor_responsavel: "supervisor",
  cargo: "funcao",
  cargo_funcao: "funcao",
  nome_da_funcao: "funcao",
  nome_funcao: "funcao",
  // Organização
  empreiteira: "empresa",
  fornecedor: "empresa",
  municipio: "cidade",
  localidade: "cidade",
  // Datas
  inicio: "data_inicio",
  data_de_inicio: "data_inicio",
  fim: "data_fim",
  data_de_fim: "data_fim",
  termino: "data_fim",
  dia: "data",
  data_da_folga: "data",
  data_folga: "data",
  // Custos
  tipo_de_custo: "tipo_custo",
  qtd_horas: "quantidade_horas",
  horas: "quantidade_horas",
  quantidade_de_horas: "quantidade_horas",
  valor_total: "valor",
  custo: "valor",
  // Outros
  obs: "observacao",
  observacoes: "observacao",
};

export function removerAcentos(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function normalizarNomeColuna(nome) {
  const limpo = removerAcentos(nome)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return SINONIMOS[limpo] || limpo;
}

export function normalizarObjeto(objeto) {
  const resultado = {};
  for (const [chave, valor] of Object.entries(objeto || {})) {
    const nome = normalizarNomeColuna(chave);
    if (!nome) continue;
    resultado[nome] = typeof valor === "string" ? valor.trim() : valor;
  }
  return resultado;
}

export function normalizarLinhas(linhas) {
  return (linhas || []).map(normalizarObjeto);
}
