// ============================================================
// MEGABRAIN — pages/custosPage.js
// Painel de custos operacionais: cards, gráficos (Chart.js via
// CDN), tabela de ofensores, filtros e exportação.
// ============================================================

import "../main.js";
import { listarDemandas } from "../services/demandaService.js";
import {
  carregarDadosCustos,
  consolidarCustosPorTipo,
  consolidarCustosPorTecnico,
  consolidarCustosPorSupervisor,
  consolidarCustosPorEmpresa,
  consolidarPorCompetencia,
  identificarOfensores,
} from "../services/custoService.js";
import { exportarArrayParaCsv } from "../services/exportService.js";
import { formatarMoeda, formatarNumero, formatarTipoCusto } from "../utils/formatadores.js";
import { obterValoresUnicos, preencherSelect, aplicarFiltros, filtrarPorPeriodo } from "../utils/filtros.js";
import { obterParametroUrl } from "../utils/tokens.js";
import { mostrarErro, mostrarAviso, mostrarSucesso } from "../utils/mensagens.js";

// Cores por tipo de custo: paleta categórica fixa (segue a entidade,
// nunca a posição — validada para daltonismo).
const COR_POR_TIPO = {
  hora_extra: "#2a78d6",
  banco_horas: "#1baf7a",
  sobreaviso: "#eda100",
  acionamento_sobreaviso: "#eb6834",
  adicional_noturno: "#4a3aa7",
  outros: "#898781",
};
const COR_SERIE_UNICA = "#2a78d6";
const COR_GRADE = "#e1e0d9";
const COR_TICKS = "#898781";

const selectDemanda = document.getElementById("select-demanda");
const seloSimulado = document.getElementById("selo-simulado");
const graficos = {};

let registrosCompletos = [];
let registrosVisiveis = [];

// ---------- Dados simulados (quando não há dados reais) ----------

function gerarDadosSimulados() {
  const tecnicos = ["J. Silva", "M. Souza", "A. Pereira", "C. Santos", "R. Lima", "P. Alves"];
  const supervisores = ["Carlos", "Fernanda", "Marcos"];
  const empresas = ["Alfa Telecom", "Beta Redes"];
  const cidades = ["Salvador", "Feira de Santana", "Ilhéus"];
  const tipos = ["hora_extra", "banco_horas", "sobreaviso", "acionamento_sobreaviso", "adicional_noturno"];

  const registros = [];
  const hoje = new Date();
  for (let mes = 5; mes >= 0; mes--) {
    for (let i = 0; i < 25; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - mes, 1 + (i % 28));
      const indiceTecnico = i % tecnicos.length;
      registros.push({
        tecnico: tecnicos[indiceTecnico],
        supervisor: supervisores[indiceTecnico % supervisores.length],
        empresa: empresas[i % empresas.length],
        cidade: cidades[i % cidades.length],
        regional: "Nordeste",
        data: data.toISOString().slice(0, 10),
        tipo_custo: tipos[i % tipos.length],
        quantidade_horas: 2 + (i % 6),
        valor: Math.round((80 + (i * 37) % 400) * (1 + indiceTecnico * 0.15)),
        observacao: "",
      });
    }
  }
  return registros;
}

// ---------- Filtros ----------

function aplicarTodosFiltros() {
  const filtros = {
    regional: document.getElementById("filtro-regional").value,
    cidade: document.getElementById("filtro-cidade").value,
    empresa: document.getElementById("filtro-empresa").value,
    supervisor: document.getElementById("filtro-supervisor").value,
    tecnico: document.getElementById("filtro-tecnico").value,
    tipo_custo: document.getElementById("filtro-tipo").value,
  };
  const inicio = document.getElementById("filtro-inicio").value;
  const fim = document.getElementById("filtro-fim").value;

  registrosVisiveis = filtrarPorPeriodo(
    aplicarFiltros(registrosCompletos, filtros),
    "data",
    inicio,
    fim
  );
  renderizarPainel();
}

function preencherFiltros() {
  preencherSelect(document.getElementById("filtro-regional"), obterValoresUnicos(registrosCompletos, "regional"));
  preencherSelect(document.getElementById("filtro-cidade"), obterValoresUnicos(registrosCompletos, "cidade"));
  preencherSelect(document.getElementById("filtro-empresa"), obterValoresUnicos(registrosCompletos, "empresa"));
  preencherSelect(document.getElementById("filtro-supervisor"), obterValoresUnicos(registrosCompletos, "supervisor"));
  preencherSelect(document.getElementById("filtro-tecnico"), obterValoresUnicos(registrosCompletos, "tecnico"));

  const selectTipo = document.getElementById("filtro-tipo");
  const tipos = obterValoresUnicos(registrosCompletos, "tipo_custo");
  selectTipo.innerHTML = '<option value="">Todos</option>';
  for (const tipo of tipos) {
    const opcao = document.createElement("option");
    opcao.value = tipo;
    opcao.textContent = formatarTipoCusto(tipo);
    selectTipo.appendChild(opcao);
  }
}

// ---------- Cards ----------

function renderizarCards() {
  const porTipo = consolidarCustosPorTipo(registrosVisiveis);
  const total = (tipo) => porTipo.find((grupo) => grupo.chave === tipo)?.valor || 0;

  document.getElementById("card-hora-extra").textContent = formatarMoeda(total("hora_extra"));
  document.getElementById("card-banco-horas").textContent = formatarMoeda(total("banco_horas"));
  document.getElementById("card-sobreaviso").textContent = formatarMoeda(total("sobreaviso"));
  document.getElementById("card-acionamento").textContent = formatarMoeda(total("acionamento_sobreaviso"));
  document.getElementById("card-noturno").textContent = formatarMoeda(total("adicional_noturno"));

  const ofensorTecnico = identificarOfensores(registrosVisiveis, "tecnico", 1)[0];
  const ofensorSupervisor = identificarOfensores(registrosVisiveis, "supervisor", 1)[0];
  document.getElementById("card-ofensor-tecnico").textContent = ofensorTecnico?.chave || "—";
  document.getElementById("card-ofensor-tecnico-valor").textContent = ofensorTecnico
    ? formatarMoeda(ofensorTecnico.valor)
    : "";
  document.getElementById("card-ofensor-supervisor").textContent = ofensorSupervisor?.chave || "—";
  document.getElementById("card-ofensor-supervisor-valor").textContent = ofensorSupervisor
    ? formatarMoeda(ofensorSupervisor.valor)
    : "";
}

// ---------- Gráficos ----------

function criarGrafico(idCanvas, configuracao) {
  if (graficos[idCanvas]) graficos[idCanvas].destroy();
  const contexto = document.getElementById(idCanvas);
  if (!contexto || !window.Chart) return;
  graficos[idCanvas] = new window.Chart(contexto, configuracao);
}

function opcoesBase(eixoMoeda = true) {
  const formato = (valor) =>
    eixoMoeda ? `R$ ${formatarNumero(valor)}` : formatarNumero(valor);
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (item) => ` ${formatarMoeda(item.parsed.y ?? item.parsed.x)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: COR_TICKS, autoSkip: true, maxRotation: 45 },
        border: { color: COR_GRADE },
      },
      y: {
        grid: { color: COR_GRADE },
        ticks: { color: COR_TICKS, callback: formato },
        border: { display: false },
        beginAtZero: true,
      },
    },
  };
}

function graficoBarras(idCanvas, grupos, corPorChave = null, limite = 10) {
  const dados = grupos.slice(0, limite);
  criarGrafico(idCanvas, {
    type: "bar",
    data: {
      labels: dados.map((grupo) =>
        corPorChave ? formatarTipoCusto(grupo.chave) : grupo.chave
      ),
      datasets: [
        {
          data: dados.map((grupo) => Math.round(grupo.valor * 100) / 100),
          backgroundColor: dados.map((grupo) =>
            corPorChave ? corPorChave[grupo.chave] || COR_SERIE_UNICA : COR_SERIE_UNICA
          ),
          borderRadius: 4,
          maxBarThickness: 42,
        },
      ],
    },
    options: opcoesBase(),
  });
}

function graficoEvolucao(registros) {
  const serie = consolidarPorCompetencia(registros);
  criarGrafico("grafico-evolucao", {
    type: "line",
    data: {
      labels: serie.map((ponto) => ponto.competencia),
      datasets: [
        {
          data: serie.map((ponto) => Math.round(ponto.valor * 100) / 100),
          borderColor: COR_SERIE_UNICA,
          backgroundColor: COR_SERIE_UNICA,
          borderWidth: 2,
          pointRadius: 4,
          tension: 0.15,
        },
      ],
    },
    options: opcoesBase(),
  });
}

// ---------- Tabela de ofensores ----------

function renderizarOfensores() {
  const ofensores = identificarOfensores(registrosVisiveis, "tecnico", 15);
  const totalGeral = registrosVisiveis.reduce((soma, registro) => soma + registro.valor, 0);

  document.getElementById("tabela-ofensores-corpo").innerHTML = ofensores
    .map(
      (ofensor, indice) => `
      <tr>
        <td class="numero">${indice + 1}</td>
        <td>${ofensor.chave}</td>
        <td class="numero">${formatarNumero(ofensor.horas, 1)}</td>
        <td class="numero">${formatarNumero(ofensor.registros)}</td>
        <td class="numero">${formatarMoeda(ofensor.valor)}</td>
        <td class="numero">${totalGeral ? ((ofensor.valor / totalGeral) * 100).toFixed(1) : 0}%</td>
      </tr>`
    )
    .join("");
}

// ---------- Pipeline ----------

function renderizarPainel() {
  renderizarCards();
  graficoBarras("grafico-tipo", consolidarCustosPorTipo(registrosVisiveis), COR_POR_TIPO);
  graficoBarras("grafico-supervisor", consolidarCustosPorSupervisor(registrosVisiveis));
  graficoBarras("grafico-empresa", consolidarCustosPorEmpresa(registrosVisiveis));
  graficoBarras("grafico-tecnico", consolidarCustosPorTecnico(registrosVisiveis));
  graficoEvolucao(registrosVisiveis);
  renderizarOfensores();
}

async function carregarCustos() {
  const demandaId = selectDemanda.value;

  try {
    if (demandaId) {
      registrosCompletos = await carregarDadosCustos(demandaId);
      if (!registrosCompletos.length) {
        mostrarAviso(
          "Esta demanda não tem bases de custos importadas. Mostrando dados simulados."
        );
        registrosCompletos = gerarDadosSimulados();
        seloSimulado.classList.remove("oculto");
      } else {
        seloSimulado.classList.add("oculto");
      }
    } else {
      registrosCompletos = gerarDadosSimulados();
      seloSimulado.classList.remove("oculto");
    }

    preencherFiltros();
    aplicarTodosFiltros();
  } catch (erro) {
    mostrarErro(`Erro ao carregar custos: ${erro.message}`);
  }
}

async function carregarDemandas() {
  try {
    const demandas = await listarDemandas({ tipo: "custos" });
    selectDemanda.innerHTML = '<option value="">— Sem demanda (dados simulados) —</option>';
    for (const demanda of demandas) {
      const opcao = document.createElement("option");
      opcao.value = demanda.id;
      opcao.textContent = demanda.nome;
      selectDemanda.appendChild(opcao);
    }

    const demandaUrl = obterParametroUrl("demanda");
    if (demandaUrl) selectDemanda.value = demandaUrl;
  } catch (erro) {
    mostrarErro(`Erro ao carregar demandas: ${erro.message}`);
  }
  await carregarCustos();
}

selectDemanda.addEventListener("change", carregarCustos);
document.getElementById("btn-aplicar-filtros").addEventListener("click", aplicarTodosFiltros);
document.getElementById("btn-limpar-filtros").addEventListener("click", () => {
  document
    .querySelectorAll(".filtros select, .filtros input")
    .forEach((campo) => (campo.value = ""));
  aplicarTodosFiltros();
});

document.getElementById("btn-exportar-custos").addEventListener("click", () => {
  try {
    exportarArrayParaCsv("custos_filtrados", registrosVisiveis);
    mostrarSucesso("Análise exportada em CSV.");
  } catch (erro) {
    mostrarErro(erro.message);
  }
});

carregarDemandas();
