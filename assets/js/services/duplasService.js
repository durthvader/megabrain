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
      funcao: textoOu(dados.funcao),
      go: textoOu(dados.go),
      ga: textoOu(dados.ga),
    }))
    .filter((pessoa) => pessoa.nome && !FUNCOES_EXCLUIDAS.includes(chaveNome(pessoa.funcao)));

  const duplas = respostas.filter((resposta) => resposta.tipo_formulario === "dupla");
  const solos = respostas.filter((resposta) => resposta.tipo_formulario === "dupla_sozinho");

  return { hierarquia, duplas, solos };
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

// Nomes já usados em alguma dupla ou marcados como sozinho, em QUALQUER
// GA da demanda — o mesmo nome não pode aparecer em duas duplas diferentes.
export function mapaNomesOcupados(duplas, solos) {
  const mapa = new Map();
  for (const resposta of duplas) {
    mapa.set(chaveNome(resposta.tecnico), { tipoFormulario: "dupla", respostaId: resposta.id });
    const parceiro = resposta.dados?.parceiro;
    if (parceiro) mapa.set(chaveNome(parceiro), { tipoFormulario: "dupla", respostaId: resposta.id });
  }
  for (const resposta of solos) {
    mapa.set(chaveNome(resposta.tecnico), { tipoFormulario: "dupla_sozinho", respostaId: resposta.id });
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

export async function desfazerRegistro(respostaId) {
  await removerRespostaPorId(respostaId);
}
