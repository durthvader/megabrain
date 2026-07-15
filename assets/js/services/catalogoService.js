// ============================================================
// MEGABRAIN — services/catalogoService.js
// Catálogo curado de projetos. Metadados seguros ficam no JSON
// versionado; tokens, URLs privadas e caminhos locais ficam no
// catalogo-projetos.local.json, ignorado pelo Git.
// ============================================================

const URL_CATALOGO = new URL("../../../data/catalogo-projetos.json", import.meta.url);
const URL_CATALOGO_LOCAL = new URL("../../../data/catalogo-projetos.local.json", import.meta.url);

const ORDEM_STATUS = {
  em_andamento: 0,
  aguardando: 1,
  publicado: 2,
  backlog: 3,
  concluido: 4,
  arquivado: 5,
  cancelado: 6,
};

const ROTULOS_STATUS = {
  backlog: "Backlog",
  em_andamento: "Em andamento",
  aguardando: "Aguardando",
  concluido: "Concluído",
  publicado: "Publicado",
  arquivado: "Arquivado",
  cancelado: "Cancelado",
};

const ROTULOS_TIPO = {
  portal: "Portal",
  pptx: "PowerPoint",
  planilha: "Planilha",
  documento: "Documento",
  dashboard: "Dashboard",
  formulario: "Formulário",
  ferramenta: "Ferramenta",
  pasta: "Pasta",
  pdf: "PDF",
  arquivo: "Arquivo",
  outro: "Outro",
};

const ROTULOS_ACESSO = {
  privado: "Privado",
  restrito: "Restrito",
  nao_listado: "Não listado",
  publico: "Público",
};

let cacheCatalogo = null;

async function buscarJson(url, obrigatorio = true) {
  try {
    const resposta = await fetch(url, { cache: "no-store" });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    return await resposta.json();
  } catch (erro) {
    if (obrigatorio) throw new Error(`Não foi possível carregar ${url.pathname}: ${erro.message}`);
    return null;
  }
}

function mesclarProjeto(base, local) {
  if (!local) return base;
  return {
    ...base,
    ...local,
    compartilhamento: {
      ...(base.compartilhamento || {}),
      ...(local.compartilhamento || {}),
    },
    resultado_principal:
      local.resultado_principal === undefined
        ? base.resultado_principal
        : local.resultado_principal,
    artefatos: local.artefatos === undefined ? base.artefatos || [] : local.artefatos,
  };
}

function ordenarProjetos(projetos) {
  return [...projetos].sort((a, b) => {
    const status = (ORDEM_STATUS[a.status] ?? 99) - (ORDEM_STATUS[b.status] ?? 99);
    if (status !== 0) return status;
    return String(b.atualizado_em || "").localeCompare(String(a.atualizado_em || ""));
  });
}

export async function carregarCatalogo({ atualizar = false } = {}) {
  if (cacheCatalogo && !atualizar) return cacheCatalogo;

  const [catalogo, catalogoLocal] = await Promise.all([
    buscarJson(URL_CATALOGO),
    buscarJson(URL_CATALOGO_LOCAL, false),
  ]);

  const locaisPorId = new Map(
    (catalogoLocal?.projetos || []).map((projeto) => [projeto.id, projeto])
  );
  const projetos = (catalogo.projetos || []).map((projeto) =>
    mesclarProjeto(projeto, locaisPorId.get(projeto.id))
  );

  cacheCatalogo = {
    ...catalogo,
    projetos: ordenarProjetos(projetos),
    usaConfiguracaoLocal: Boolean(catalogoLocal),
  };
  return cacheCatalogo;
}

export function calcularResumo(projetos) {
  const contar = (status) => projetos.filter((projeto) => projeto.status === status).length;
  return {
    total: projetos.length,
    emAndamento: contar("em_andamento") + contar("aguardando"),
    publicados: contar("publicado"),
    concluidos: contar("concluido"),
    restritos: projetos.filter((projeto) =>
      ["privado", "restrito"].includes(projeto.compartilhamento?.visibilidade)
    ).length,
  };
}

export function formatarStatusProjeto(status) {
  return ROTULOS_STATUS[status] || status || "—";
}

export function formatarTipoProjeto(tipo) {
  return ROTULOS_TIPO[tipo] || tipo || "—";
}

export function formatarAcesso(visibilidade) {
  return ROTULOS_ACESSO[visibilidade] || visibilidade || "—";
}

export function formatarDataCatalogo(valor) {
  if (!valor) return "—";
  const [ano, mes, dia] = String(valor).slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : valor;
}

export function formatarBytes(bytes) {
  const valor = Number(bytes || 0);
  if (!valor) return "0 B";
  const unidades = ["B", "KB", "MB", "GB"];
  const indice = Math.min(Math.floor(Math.log(valor) / Math.log(1024)), unidades.length - 1);
  return `${(valor / 1024 ** indice).toLocaleString("pt-BR", {
    maximumFractionDigits: indice > 1 ? 1 : 0,
  })} ${unidades[indice]}`;
}

export function listarDestinos(projeto) {
  return [projeto.resultado_principal, ...(projeto.artefatos || [])].filter(Boolean);
}

export function caminhoParaFileUrl(caminho) {
  if (!caminho) return null;
  if (!/^[a-zA-Z]:[\\/]/.test(caminho)) return null;
  return encodeURI(`file:///${caminho.replaceAll("\\", "/")}`);
}
