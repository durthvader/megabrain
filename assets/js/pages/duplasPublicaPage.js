// ============================================================
// MEGABRAIN — pages/duplasPublicaPage.js
// Painel PÚBLICO de duplas (sem login, via token na URL).
// duplas-publica.html?token=TOKEN
//
// Filtra a base "hierarquia" por GO/GA e permite marcar, por
// toque, quem trabalha duplado com quem (ou sozinho).
// ============================================================

import { buscarDemandaPorToken } from "../services/demandaService.js";
import {
  carregarDadosDuplas,
  listarGOs,
  listarGAs,
  mapaNomesOcupados,
  buscarNaHierarquia,
  infoOcupacao,
  salvarDupla,
  salvarSozinho,
  salvarAfastado,
  desfazerRegistro,
  chaveNome,
} from "../services/duplasService.js";
import { obterParametroUrl } from "../utils/tokens.js";
import { preencherSelect } from "../utils/filtros.js";
import { mostrarSucesso, mostrarErro } from "../utils/mensagens.js";

const blocoCarregando = document.getElementById("bloco-carregando");
const blocoErro = document.getElementById("bloco-erro");
const blocoPainel = document.getElementById("bloco-painel");
const tituloDemanda = document.getElementById("titulo-demanda");
const inputSeuNome = document.getElementById("input-seu-nome");

const filtroGo = document.getElementById("filtro-go");
const filtroGa = document.getElementById("filtro-ga");

const secaoDuplas = document.getElementById("secao-duplas");
const duplasInstrucao = document.getElementById("duplas-instrucao");

const listaDisponiveis = document.getElementById("lista-disponiveis");
const disponiveisVazio = document.getElementById("disponiveis-vazio");
const dicaSelecao = document.getElementById("dica-selecao");
const acaoSozinho = document.getElementById("acao-sozinho");
const botaoMarcarSozinho = document.getElementById("btn-marcar-sozinho");
const botaoMarcarAfastado = document.getElementById("btn-marcar-afastado");

const listaDuplas = document.getElementById("lista-duplas");
const duplasVazio = document.getElementById("duplas-vazio");

const alertaForaHierarquia = document.getElementById("alerta-fora-hierarquia");
const textoForaHierarquia = document.getElementById("texto-fora-hierarquia");

const inputBuscaFora = document.getElementById("input-busca-fora");
const resultadosBuscaFora = document.getElementById("resultados-busca-fora");
const inputNomeManual = document.getElementById("input-nome-manual");
const botaoAdicionarManual = document.getElementById("btn-adicionar-manual");
const linkResultadoDuplas = document.getElementById("link-resultado-duplas");

let demandaAtual = null;
let hierarquia = [];
let duplas = [];
let solos = [];
let afastados = [];
let selecionado = null;
let operacaoEmAndamento = false;

function mostrarErroToken(mensagem) {
  blocoCarregando.classList.add("oculto");
  blocoPainel.classList.add("oculto");
  blocoErro.classList.remove("oculto");
  document.getElementById("mensagem-erro-token").textContent = mensagem;
}

function pessoaPorNome(nome) {
  return hierarquia.find((pessoa) => chaveNome(pessoa.nome) === chaveNome(nome));
}

function limparSelecao() {
  selecionado = null;
  acaoSozinho.classList.add("oculto");
  dicaSelecao.textContent = "Toque em um nome e depois no colega dele para formar a dupla.";
}

async function recarregarDados() {
  const dados = await carregarDadosDuplas(demandaAtual.id);
  hierarquia = dados.hierarquia;
  duplas = dados.duplas;
  solos = dados.solos;
  afastados = dados.afastados;
}

function montarChipPessoa(pessoa, { foraHierarquia = false, ocupacao = null } = {}) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "duplas-pessoa";
  if (foraHierarquia) botao.classList.add("fora-hierarquia");
  if (selecionado && chaveNome(selecionado.nome) === chaveNome(pessoa.nome)) {
    botao.classList.add("selecionada");
  }

  let notaFuncao = pessoa.funcao || "—";
  if (foraHierarquia) notaFuncao += " · fora do GA";

  if (ocupacao) {
    botao.classList.add("ocupado");
    botao.disabled = true;
    if (ocupacao.tipoFormulario === "dupla") {
      notaFuncao = `já duplado com ${ocupacao.parceiro}`;
    } else if (ocupacao.tipoFormulario === "dupla_afastado") {
      notaFuncao = "já marcado como afastado/desligado";
    } else {
      notaFuncao = "já marcado como sozinho";
    }
  }

  botao.innerHTML = `
    <span class="duplas-pessoa-nome">${pessoa.nome}</span>
    <span class="duplas-pessoa-funcao">${notaFuncao}</span>
  `;
  if (!ocupacao) botao.addEventListener("click", () => aoTocarPessoa(pessoa, foraHierarquia));
  return botao;
}

function montarAvisoForaHierarquia(registros) {
  const nomes = new Set();
  for (const registro of registros) {
    for (const nome of registro.dados?.fora_da_hierarquia || []) nomes.add(nome);
  }
  if (!nomes.size) {
    alertaForaHierarquia.classList.add("oculto");
    return;
  }
  const detalhes = [...nomes].map((nome) => {
    const pessoa = pessoaPorNome(nome);
    return pessoa
      ? `${nome} (é do GA "${pessoa.ga}", GO "${pessoa.go}")`
      : `${nome} (não encontrado em nenhuma hierarquia)`;
  });
  textoForaHierarquia.textContent = `${detalhes.join("; ")} — atualize a base de hierarquia.`;
  alertaForaHierarquia.classList.remove("oculto");
}

function montarCardRegistro(registro, tipo) {
  const card = document.createElement("div");
  card.className = `duplas-card ${tipo}`;

  const manuais = registro.dados?.adicionado_manualmente || [];
  const tagManual = manuais.length ? ` · adicionado manualmente (${manuais.join(", ")})` : "";

  if (tipo === "dupla") {
    card.innerHTML = `
      <div>
        <div class="duplas-card-nomes">${registro.tecnico} + ${registro.dados?.parceiro || "?"}</div>
        <div class="duplas-card-tag">Dupla${tagManual}</div>
      </div>
      <div class="duplas-card-desfazer">toque para desfazer</div>
    `;
  } else if (tipo === "afastado") {
    card.innerHTML = `
      <div>
        <div class="duplas-card-nomes">${registro.tecnico}</div>
        <div class="duplas-card-tag">Afastado/desligado${tagManual}</div>
      </div>
      <div class="duplas-card-desfazer">toque para desfazer</div>
    `;
  } else {
    card.innerHTML = `
      <div>
        <div class="duplas-card-nomes">${registro.tecnico}</div>
        <div class="duplas-card-tag">Sozinho (sem dupla)${tagManual}</div>
      </div>
      <div class="duplas-card-desfazer">toque para desfazer</div>
    `;
  }

  card.addEventListener("click", () => aoDesfazer(registro.id));
  return card;
}

function renderizarGA() {
  const go = filtroGo.value;
  const ga = filtroGa.value;

  if (!go || !ga) {
    secaoDuplas.classList.add("oculto");
    duplasInstrucao.classList.remove("oculto");
    return;
  }

  duplasInstrucao.classList.add("oculto");
  secaoDuplas.classList.remove("oculto");

  const ocupados = mapaNomesOcupados(duplas, solos, afastados);
  const pessoasGA = hierarquia.filter((pessoa) => pessoa.ga === ga);
  const disponiveis = pessoasGA.filter((pessoa) => !ocupados.has(chaveNome(pessoa.nome)));
  const duplasGA = duplas.filter((registro) => registro.dados?.ga === ga);
  const solosGA = solos.filter((registro) => registro.dados?.ga === ga);
  const afastadosGA = afastados.filter((registro) => registro.dados?.ga === ga);

  listaDisponiveis.innerHTML = "";
  disponiveisVazio.classList.toggle("oculto", disponiveis.length > 0);
  for (const pessoa of disponiveis) {
    listaDisponiveis.appendChild(montarChipPessoa(pessoa));
  }

  listaDuplas.innerHTML = "";
  const registros = [
    ...duplasGA.map((r) => ({ r, tipo: "dupla" })),
    ...solosGA.map((r) => ({ r, tipo: "sozinho" })),
    ...afastadosGA.map((r) => ({ r, tipo: "afastado" })),
  ].sort((a, b) => (a.r.tecnico || "").localeCompare(b.r.tecnico || "", "pt-BR"));
  duplasVazio.classList.toggle("oculto", registros.length > 0);
  for (const { r, tipo } of registros) {
    listaDuplas.appendChild(montarCardRegistro(r, tipo));
  }

  montarAvisoForaHierarquia([...duplasGA, ...solosGA, ...afastadosGA]);

  acaoSozinho.classList.toggle("oculto", !selecionado);

  resultadosBuscaFora.innerHTML = "";
  inputBuscaFora.value = "";
}

async function aoTocarPessoa(pessoa, foraHierarquia, manual = false) {
  if (operacaoEmAndamento) return;

  if (!selecionado) {
    selecionado = { ...pessoa, foraHierarquia, manual };
    dicaSelecao.textContent = `${pessoa.nome} selecionado(a). Toque no colega para formar a dupla, ou marque como sozinho abaixo.`;
    renderizarGA();
    return;
  }

  if (chaveNome(selecionado.nome) === chaveNome(pessoa.nome)) {
    limparSelecao();
    renderizarGA();
    return;
  }

  const primeiro = selecionado;
  const segundo = { ...pessoa, foraHierarquia, manual };
  operacaoEmAndamento = true;
  try {
    const foraDaHierarquia = [primeiro, segundo].filter((p) => p.foraHierarquia).map((p) => p.nome);
    const adicionadoManualmente = [primeiro, segundo].filter((p) => p.manual).map((p) => p.nome);
    await salvarDupla({
      demandaId: demandaAtual.id,
      tokenPublico: demandaAtual.token_publico,
      go: filtroGo.value,
      ga: filtroGa.value,
      nomeA: primeiro.nome,
      nomeB: segundo.nome,
      respondenteNome: inputSeuNome.value.trim(),
      foraDaHierarquia,
      adicionadoManualmente,
    });
    limparSelecao();
    await recarregarDados();
    renderizarGA();
    mostrarSucesso(`Dupla formada: ${primeiro.nome} + ${segundo.nome}`);
  } catch (erro) {
    mostrarErro(`Erro ao salvar dupla: ${erro.message}`);
  } finally {
    operacaoEmAndamento = false;
  }
}

async function aoDesfazer(respostaId) {
  if (operacaoEmAndamento) return;
  operacaoEmAndamento = true;
  try {
    await desfazerRegistro(respostaId);
    await recarregarDados();
    renderizarGA();
    mostrarSucesso("Desfeito.");
  } catch (erro) {
    mostrarErro(`Erro ao desfazer: ${erro.message}`);
  } finally {
    operacaoEmAndamento = false;
  }
}

botaoMarcarSozinho.addEventListener("click", async () => {
  if (!selecionado || operacaoEmAndamento) return;
  operacaoEmAndamento = true;
  try {
    await salvarSozinho({
      demandaId: demandaAtual.id,
      tokenPublico: demandaAtual.token_publico,
      go: filtroGo.value,
      ga: filtroGa.value,
      nome: selecionado.nome,
      respondenteNome: inputSeuNome.value.trim(),
      foraDaHierarquia: selecionado.foraHierarquia ? [selecionado.nome] : [],
      adicionadoManualmente: selecionado.manual ? [selecionado.nome] : [],
    });
    const nome = selecionado.nome;
    limparSelecao();
    await recarregarDados();
    renderizarGA();
    mostrarSucesso(`${nome} marcado(a) como sozinho(a).`);
  } catch (erro) {
    mostrarErro(`Erro ao marcar sozinho: ${erro.message}`);
  } finally {
    operacaoEmAndamento = false;
  }
});

botaoMarcarAfastado.addEventListener("click", async () => {
  if (!selecionado || operacaoEmAndamento) return;
  if (!window.confirm(`Marcar ${selecionado.nome} como afastado/desligado?`)) return;
  operacaoEmAndamento = true;
  try {
    await salvarAfastado({
      demandaId: demandaAtual.id,
      tokenPublico: demandaAtual.token_publico,
      go: filtroGo.value,
      ga: filtroGa.value,
      nome: selecionado.nome,
      respondenteNome: inputSeuNome.value.trim(),
      foraDaHierarquia: selecionado.foraHierarquia ? [selecionado.nome] : [],
      adicionadoManualmente: selecionado.manual ? [selecionado.nome] : [],
    });
    const nome = selecionado.nome;
    limparSelecao();
    await recarregarDados();
    renderizarGA();
    mostrarSucesso(`${nome} marcado(a) como afastado/desligado.`);
  } catch (erro) {
    mostrarErro(`Erro ao marcar afastado: ${erro.message}`);
  } finally {
    operacaoEmAndamento = false;
  }
});

inputBuscaFora.addEventListener("input", () => {
  const texto = inputBuscaFora.value.trim();
  resultadosBuscaFora.innerHTML = "";
  if (!texto) return;

  const ga = filtroGa.value;
  const encontrados = buscarNaHierarquia(hierarquia, texto)
    .filter((pessoa) => pessoa.ga !== ga)
    .slice(0, 20);

  if (!encontrados.length) {
    resultadosBuscaFora.innerHTML = '<p class="texto-mudo">Ninguém encontrado com esse nome fora deste GA.</p>';
    return;
  }
  for (const pessoa of encontrados) {
    const ocupacao = infoOcupacao(pessoa.nome, duplas, solos, afastados);
    resultadosBuscaFora.appendChild(montarChipPessoa(pessoa, { foraHierarquia: true, ocupacao }));
  }
});

botaoAdicionarManual.addEventListener("click", () => {
  const nome = inputNomeManual.value.trim();
  if (!nome) return;

  const ocupacao = infoOcupacao(nome, duplas, solos, afastados);
  if (ocupacao) {
    let motivo = "já está marcado como sozinho";
    if (ocupacao.tipoFormulario === "dupla") motivo = `já está duplado com ${ocupacao.parceiro}`;
    else if (ocupacao.tipoFormulario === "dupla_afastado") motivo = "já está marcado como afastado/desligado";
    mostrarErro(`${nome} ${motivo}.`);
    return;
  }

  aoTocarPessoa({ nome, funcao: "", go: "", ga: "" }, true, true);
  inputNomeManual.value = "";
});

filtroGo.addEventListener("change", () => {
  const gas = listarGAs(hierarquia, filtroGo.value);
  preencherSelect(filtroGa, gas, "Selecione…");
  limparSelecao();
  renderizarGA();
});

filtroGa.addEventListener("change", () => {
  limparSelecao();
  renderizarGA();
});

async function iniciar() {
  const token = obterParametroUrl("token");
  if (!token) {
    mostrarErroToken("Link incompleto: o parâmetro ?token= não foi informado.");
    return;
  }

  try {
    demandaAtual = await buscarDemandaPorToken(token);
  } catch (erro) {
    mostrarErroToken(`Erro ao consultar a demanda: ${erro.message}`);
    return;
  }

  if (!demandaAtual) {
    mostrarErroToken("Token inválido ou demanda não encontrada. Confira o link recebido.");
    return;
  }

  if (demandaAtual.status !== "ativa") {
    mostrarErroToken(`Esta demanda está com status "${demandaAtual.status}" e não aceita mais alterações.`);
    return;
  }

  if (demandaAtual.tipo !== "duplas") {
    mostrarErroToken("Este link é de um painel de duplas, mas a demanda informada não é do tipo duplas.");
    return;
  }

  tituloDemanda.textContent = demandaAtual.nome;
  linkResultadoDuplas.href = `duplas-resultado.html?token=${encodeURIComponent(token)}`;

  try {
    await recarregarDados();
    if (!hierarquia.length) {
      mostrarErroToken('Esta demanda ainda não tem uma base do tipo "hierarquia" cadastrada.');
      return;
    }

    preencherSelect(filtroGo, listarGOs(hierarquia), "Selecione…");

    blocoCarregando.classList.add("oculto");
    blocoPainel.classList.remove("oculto");
  } catch (erro) {
    mostrarErroToken(`Erro ao montar o painel: ${erro.message}`);
  }
}

iniciar();
