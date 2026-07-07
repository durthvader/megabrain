// ============================================================
// MEGABRAIN — services/duplasService.js
// Regras da demanda "duplas": quem trabalha duplado com quem,
// filtrado por GO/GA, a partir da base "hierarquia".
// ============================================================

import { listarLinhasPorTipo } from "./baseService.js";
import { listarRespostasPorDemanda, salvarResposta, removerRespostaPorId } from "./formularioService.js";

// Gerente/gestor não entram na classificação de duplas.
const FUNCOES_EXCLUIDAS = ["gerente", "gestor"];

export function chaveNome(nome) {
  return String(nome || "").trim().toLowerCase();
}

function textoOu(...valores) {
  for (const valor of valores) {
    const texto = String(valor ?? "").trim();
    if (texto) return texto;
  }
  return "";
}

export async function carregarDadosDuplas(demandaId) {
  const [linhasHierarquia, respostas] = await Promise.all([
    listarLinhasPorTipo(demandaId, "hierarquia"),
    listarRespostasPorDemanda(demandaId),
  ]);

  const hierarquia = linhasHierarquia
    .map((linha) => linha.dados || {})
    .map((dados) => ({
      nome: textoOu(dados.nome, dados.tecnico, dados.colaborador),
      funcao: textoOu(dados.funcao, dados.cargo, dados.cargo_funcao, dados.nome_da_funcao, dados.nome_funcao),
      go: textoOu(dados.go),
      ga: textoOu(dados.ga),
    }))
    .filter((pessoa) => pessoa.nome && !FUNCOES_EXCLUIDAS.includes(chaveNome(pessoa.funcao)))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const duplas = respostas.filter((resposta) => resposta.tipo_formulario === "dupla");
  const solos = respostas.filter((resposta) => resposta.tipo_formulario === "dupla_sozinho");
  const afastados = respostas.filter((resposta) => resposta.tipo_formulario === "dupla_afastado");

  return { hierarquia, duplas, solos, afastados };
}

export function listarGOs(hierarquia) {
  return [...new Set(hierarquia.map((pessoa) => pessoa.go).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
}

export function listarGAs(hierarquia, go) {
  return [...new Set(hierarquia.filter((pessoa) => !go || pessoa.go === go).map((pessoa) => pessoa.ga).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "pt-BR")
  );
}

// Nomes já usados em alguma dupla, marcados como sozinho ou como
// afastado/desligado, em QUALQUER GA da demanda — o mesmo nome não pode
// aparecer em duas duplas diferentes.
export function mapaNomesOcupados(duplas, solos, afastados = []) {
  const mapa = new Map();
  for (const resposta of duplas) {
    mapa.set(chaveNome(resposta.tecnico), { tipoFormulario: "dupla", respostaId: resposta.id });
    const parceiro = resposta.dados?.parceiro;
    if (parceiro) mapa.set(chaveNome(parceiro), { tipoFormulario: "dupla", respostaId: resposta.id });
  }
  for (const resposta of solos) {
    mapa.set(chaveNome(resposta.tecnico), { tipoFormulario: "dupla_sozinho", respostaId: resposta.id });
  }
  for (const resposta of afastados) {
    mapa.set(chaveNome(resposta.tecnico), { tipoFormulario: "dupla_afastado", respostaId: resposta.id });
  }
  return mapa;
}

// Procura uma pessoa em toda a hierarquia (qualquer GO/GA), usada quando o
// parceiro não está na lista do GA selecionado.
export function buscarNaHierarquia(hierarquia, texto) {
  const alvo = chaveNome(texto);
  if (!alvo) return [];
  return hierarquia.filter((pessoa) => chaveNome(pessoa.nome).includes(alvo));
}

// Se o nome já está em uma dupla, marcado como sozinho ou como
// afastado/desligado (em qualquer GA), retorna com quem/o quê — usado
// para mostrar (sem deixar marcar) na busca.
export function infoOcupacao(nome, duplas, solos, afastados = []) {
  const alvo = chaveNome(nome);
  const dupla = duplas.find(
    (resposta) => chaveNome(resposta.tecnico) === alvo || chaveNome(resposta.dados?.parceiro) === alvo
  );
  if (dupla) {
    const parceiro = chaveNome(dupla.tecnico) === alvo ? dupla.dados?.parceiro : dupla.tecnico;
    return { tipoFormulario: "dupla", parceiro };
  }
  const solo = solos.find((resposta) => chaveNome(resposta.tecnico) === alvo);
  if (solo) return { tipoFormulario: "dupla_sozinho" };
  const afastado = afastados.find((resposta) => chaveNome(resposta.tecnico) === alvo);
  if (afastado) return { tipoFormulario: "dupla_afastado" };
  return null;
}

// Resumo completo por GO/GA: duplas formadas, sozinhos, afastados e
// quem ainda falta classificar — base para a página pública de resultado.
export function montarResumoPorGA(hierarquia, duplas, solos, afastados = []) {
  const ocupados = mapaNomesOcupados(duplas, solos, afastados);
  const grupos = new Map();

  for (const pessoa of hierarquia) {
    const chave = `${pessoa.go}|||${pessoa.ga}`;
    if (!grupos.has(chave)) grupos.set(chave, { go: pessoa.go, ga: pessoa.ga, pessoas: [] });
    grupos.get(chave).pessoas.push(pessoa);
  }

  const porNome = (a, b) => (a.tecnico || "").localeCompare(b.tecnico || "", "pt-BR");

  const resumo = [...grupos.values()].map((grupo) => {
    const duplasGA = duplas.filter((r) => r.dados?.ga === grupo.ga && r.dados?.go === grupo.go).sort(porNome);
    const solosGA = solos.filter((r) => r.dados?.ga === grupo.ga && r.dados?.go === grupo.go).sort(porNome);
    const afastadosGA = afastados.filter((r) => r.dados?.ga === grupo.ga && r.dados?.go === grupo.go).sort(porNome);
    const faltando = grupo.pessoas.filter((pessoa) => !ocupados.has(chaveNome(pessoa.nome)));
    return { ...grupo, duplas: duplasGA, solos: solosGA, afastados: afastadosGA, faltando };
  });

  return resumo.sort((a, b) => a.go.localeCompare(b.go, "pt-BR") || a.ga.localeCompare(b.ga, "pt-BR"));
}

// Uma linha por pessoa/situação, pronta para exportar (Excel/CSV).
export function montarLinhasExportacao(hierarquia, duplas, solos, afastados = []) {
  const linhas = [];

  for (const resposta of duplas) {
    linhas.push({
      GO: resposta.dados?.go || "",
      GA: resposta.dados?.ga || "",
      "Nome 1": resposta.tecnico || "",
      "Nome 2": resposta.dados?.parceiro || "",
      Status: "Dupla",
      "Fora da hierarquia": (resposta.dados?.fora_da_hierarquia || []).join(", "),
      ID: resposta.id,
    });
  }

  for (const resposta of solos) {
    linhas.push({
      GO: resposta.dados?.go || "",
      GA: resposta.dados?.ga || "",
      "Nome 1": resposta.tecnico || "",
      "Nome 2": "",
      Status: "Sozinho",
      "Fora da hierarquia": (resposta.dados?.fora_da_hierarquia || []).join(", "),
      ID: resposta.id,
    });
  }

  for (const resposta of afastados) {
    linhas.push({
      GO: resposta.dados?.go || "",
      GA: resposta.dados?.ga || "",
      "Nome 1": resposta.tecnico || "",
      "Nome 2": "",
      Status: "Afastado/desligado",
      "Fora da hierarquia": (resposta.dados?.fora_da_hierarquia || []).join(", "),
      ID: resposta.id,
    });
  }

  const ocupados = mapaNomesOcupados(duplas, solos, afastados);
  for (const pessoa of hierarquia) {
    if (ocupados.has(chaveNome(pessoa.nome))) continue;
    linhas.push({
      GO: pessoa.go,
      GA: pessoa.ga,
      "Nome 1": pessoa.nome,
      "Nome 2": "",
      Status: "Faltando classificar",
      "Fora da hierarquia": "",
      ID: "",
    });
  }

  return linhas.sort(
    (a, b) =>
      a.GO.localeCompare(b.GO, "pt-BR") || a.GA.localeCompare(b.GA, "pt-BR") || a["Nome 1"].localeCompare(b["Nome 1"], "pt-BR")
  );
}

export function montarTotais(hierarquia, duplas, solos, afastados = []) {
  const ocupados = mapaNomesOcupados(duplas, solos, afastados);
  const faltando = hierarquia.filter((pessoa) => !ocupados.has(chaveNome(pessoa.nome)));
  return {
    totalPessoas: hierarquia.length,
    totalDuplas: duplas.length,
    totalEmDupla: duplas.length * 2,
    totalSozinhos: solos.length,
    totalAfastados: afastados.length,
    totalFaltando: faltando.length,
  };
}

export async function salvarDupla({
  demandaId,
  tokenPublico,
  go,
  ga,
  nomeA,
  nomeB,
  respondenteNome,
  foraDaHierarquia,
}) {
  return salvarResposta({
    demanda_id: demandaId,
    token_publico: tokenPublico,
    tipo_formulario: "dupla",
    respondente_nome: respondenteNome || null,
    respondente_perfil: "supervisor",
    tecnico: nomeA,
    dados: {
      go: go || "",
      ga: ga || "",
      parceiro: nomeB,
      fora_da_hierarquia: foraDaHierarquia || [],
    },
  });
}

export async function salvarSozinho({ demandaId, tokenPublico, go, ga, nome, respondenteNome, foraDaHierarquia }) {
  return salvarResposta({
    demanda_id: demandaId,
    token_publico: tokenPublico,
    tipo_formulario: "dupla_sozinho",
    respondente_nome: respondenteNome || null,
    respondente_perfil: "supervisor",
    tecnico: nome,
    dados: {
      go: go || "",
      ga: ga || "",
      fora_da_hierarquia: foraDaHierarquia || [],
    },
  });
}

export async function salvarAfastado({ demandaId, tokenPublico, go, ga, nome, respondenteNome, foraDaHierarquia }) {
  return salvarResposta({
    demanda_id: demandaId,
    token_publico: tokenPublico,
    tipo_formulario: "dupla_afastado",
    respondente_nome: respondenteNome || null,
    respondente_perfil: "supervisor",
    tecnico: nome,
    dados: {
      go: go || "",
      ga: ga || "",
      fora_da_hierarquia: foraDaHierarquia || [],
    },
  });
}

export async function desfazerRegistro(respostaId) {
  await removerRespostaPorId(respostaId);
}
