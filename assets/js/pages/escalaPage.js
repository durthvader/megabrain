// ============================================================
// MEGABRAIN — pages/escalaPage.js
// Grade visual de 30 dias: técnicos × dias, com férias,
// treinamentos, exames, folgas e conflitos.
// ============================================================

import "../main.js";
import { listarDemandas, buscarDemandaPorId } from "../services/demandaService.js";
import {
  carregarDadosEscala,
  montarGrade30Dias,
  identificarConflitos,
  consolidarPorDia,
  exportarEscalaCsv,
} from "../services/escalaService.js";
import { salvarFolgaEscala } from "../services/formularioService.js";
import { baixarCsv } from "../utils/csv.js";
import { formatarDataBR, nomeDiaSemanaCurto } from "../utils/datas.js";
import { obterValoresUnicos, preencherSelect } from "../utils/filtros.js";
import { obterParametroUrl } from "../utils/tokens.js";
import { mostrarSucesso, mostrarErro, mostrarAviso } from "../utils/mensagens.js";

const selectDemanda = document.getElementById("select-demanda");
const filtroSupervisor = document.getElementById("filtro-supervisor");
const filtroEmpresa = document.getElementById("filtro-empresa");
const filtroCidade = document.getElementById("filtro-cidade");
const secaoEscala = document.getElementById("secao-escala");
const tabelaGrade = document.getElementById("grade-escala");
const corpoConsolidado = document.getElementById("tabela-consolidado-corpo");
const corpoConflitos = document.getElementById("tabela-conflitos-corpo");
const editorFolga = document.getElementById("editor-folga");
const formFolga = document.getElementById("form-folga");

const ROTULO_STATUS = {
  disponivel: { letra: "", titulo: "Disponível" },
  ferias: { letra: "FE", titulo: "Férias" },
  treinamento: { letra: "T", titulo: "Treinamento" },
  exame: { letra: "EX", titulo: "Exame periódico" },
  folga: { letra: "FO", titulo: "Folga" },
  conflito: { letra: "!", titulo: "Conflito" },
};

let demandaAtual = null;
let dadosEscala = null;
let gradeCompleta = null;

async function carregarDemandas() {
  try {
    const demandas = await listarDemandas({ tipo: "escala" });
    selectDemanda.innerHTML = '<option value="">Selecione uma demanda de escala…</option>';
    for (const demanda of demandas) {
      const opcao = document.createElement("option");
      opcao.value = demanda.id;
      opcao.textContent = demanda.nome;
      selectDemanda.appendChild(opcao);
    }

    const demandaUrl = obterParametroUrl("demanda");
    if (demandaUrl) {
      selectDemanda.value = demandaUrl;
      if (selectDemanda.value === demandaUrl) await carregarEscala();
    }
  } catch (erro) {
    mostrarErro(`Erro ao carregar demandas: ${erro.message}`);
  }
}

function linhasFiltradas() {
  const supervisor = filtroSupervisor.value.toLowerCase();
  const empresa = filtroEmpresa.value.toLowerCase();
  const cidade = filtroCidade.value.toLowerCase();

  return gradeCompleta.linhas.filter(
    (linha) =>
      (!supervisor || linha.supervisor.toLowerCase() === supervisor) &&
      (!empresa || linha.empresa.toLowerCase() === empresa) &&
      (!cidade || linha.cidade.toLowerCase() === cidade)
  );
}

function renderizarGrade() {
  const linhas = linhasFiltradas();
  const gradeVisivel = { dias: gradeCompleta.dias, linhas };

  // Cabeçalho: dias nas colunas
  const thead = `
    <thead>
      <tr>
        <th class="col-tecnico">Técnico</th>
        ${gradeCompleta.dias
          .map(
            (dia) => `
          <th title="${formatarDataBR(dia)}">
            ${dia.slice(8)}<span class="dia-semana">${nomeDiaSemanaCurto(dia)}</span>
          </th>`
          )
          .join("")}
      </tr>
    </thead>`;

  // Corpo: técnicos nas linhas
  const tbody = `
    <tbody>
      ${linhas
        .map(
          (linha, indiceLinha) => `
        <tr>
          <td class="col-tecnico">
            <span class="tecnico-nome">${linha.tecnico}</span>
            <span class="tecnico-detalhe">${[linha.supervisor, linha.empresa, linha.cidade]
              .filter(Boolean)
              .join(" · ")}</span>
          </td>
          ${linha.celulas
            .map((celula, indiceCelula) => {
              const rotulo = ROTULO_STATUS[celula.status] || ROTULO_STATUS.disponivel;
              const detalhes = celula.eventos.map((evento) => evento.descricao).join(" + ");
              return `
              <td class="celula celula-${celula.status}"
                  data-linha="${indiceLinha}" data-celula="${indiceCelula}"
                  title="${linha.tecnico} · ${formatarDataBR(celula.data)} · ${rotulo.titulo}${detalhes ? ` (${detalhes})` : ""}">
                ${rotulo.letra}
              </td>`;
            })
            .join("")}
        </tr>`
        )
        .join("")}
    </tbody>`;

  tabelaGrade.innerHTML = thead + tbody;

  // Clique numa célula abre o editor de folga
  tabelaGrade.querySelectorAll("td.celula").forEach((celula) => {
    celula.addEventListener("click", () => {
      const linha = linhas[Number(celula.dataset.linha)];
      const dia = linha.celulas[Number(celula.dataset.celula)];
      abrirEditorFolga(linha, dia);
    });
  });

  renderizarConsolidado(gradeVisivel);
  renderizarConflitos(gradeVisivel);
}

function renderizarConsolidado(grade) {
  const consolidado = consolidarPorDia(grade);
  corpoConsolidado.innerHTML = consolidado
    .map(
      (dia) => `
      <tr>
        <td>${formatarDataBR(dia.data)} <span class="texto-mudo">${nomeDiaSemanaCurto(dia.data)}</span></td>
        <td class="numero">${dia.disponivel}</td>
        <td class="numero">${dia.ferias}</td>
        <td class="numero">${dia.treinamento}</td>
        <td class="numero">${dia.exame}</td>
        <td class="numero">${dia.folga}</td>
        <td class="numero">${dia.conflito}</td>
      </tr>`
    )
    .join("");
}

function renderizarConflitos(grade) {
  const conflitos = identificarConflitos(grade);
  document.getElementById("secao-conflitos").classList.toggle("oculto", conflitos.length === 0);
  corpoConflitos.innerHTML = conflitos
    .map(
      (conflito) => `
      <tr>
        <td>${conflito.tecnico}</td>
        <td>${conflito.supervisor || "—"}</td>
        <td>${formatarDataBR(conflito.data)}</td>
        <td>${conflito.eventos}</td>
      </tr>`
    )
    .join("");
}

function abrirEditorFolga(linha, celula) {
  editorFolga.classList.remove("oculto");
  formFolga.elements.tecnico.value = linha.tecnico;
  formFolga.elements.supervisor.value = linha.supervisor;
  formFolga.elements.data.value = celula.data;
  formFolga.elements.observacao.value = "";
  editorFolga.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

formFolga.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const dados = new FormData(formFolga);

  try {
    await salvarFolgaEscala({
      demandaId: demandaAtual.id,
      tokenPublico: demandaAtual.token_publico,
      supervisor: dados.get("supervisor").trim(),
      tecnico: dados.get("tecnico").trim(),
      data: dados.get("data"),
      tipoFolga: dados.get("tipo_folga"),
      observacao: dados.get("observacao").trim(),
    });
    mostrarSucesso("Folga registrada.");
    editorFolga.classList.add("oculto");
    await carregarEscala();
  } catch (erro) {
    mostrarErro(`Erro ao registrar folga: ${erro.message}`);
  }
});

document.getElementById("btn-fechar-editor").addEventListener("click", () => {
  editorFolga.classList.add("oculto");
});

async function carregarEscala() {
  const demandaId = selectDemanda.value;
  secaoEscala.classList.add("oculto");
  editorFolga.classList.add("oculto");
  document.getElementById("escala-instrucao").classList.toggle("oculto", Boolean(demandaId));
  if (!demandaId) return;

  try {
    demandaAtual = await buscarDemandaPorId(demandaId);
    dadosEscala = await carregarDadosEscala(demandaId);

    if (!dadosEscala.tecnicos.length) {
      mostrarAviso(
        'Esta demanda ainda não tem base do tipo "tecnicos". Suba a base na página de Upload.'
      );
      return;
    }

    gradeCompleta = montarGrade30Dias(dadosEscala.tecnicos, dadosEscala.eventos);

    preencherSelect(filtroSupervisor, obterValoresUnicos(gradeCompleta.linhas, "supervisor"));
    preencherSelect(filtroEmpresa, obterValoresUnicos(gradeCompleta.linhas, "empresa"));
    preencherSelect(filtroCidade, obterValoresUnicos(gradeCompleta.linhas, "cidade"));

    secaoEscala.classList.remove("oculto");
    renderizarGrade();
  } catch (erro) {
    mostrarErro(`Erro ao montar a escala: ${erro.message}`);
  }
}

selectDemanda.addEventListener("change", carregarEscala);
[filtroSupervisor, filtroEmpresa, filtroCidade].forEach((filtro) =>
  filtro.addEventListener("change", () => gradeCompleta && renderizarGrade())
);

document.getElementById("btn-exportar-escala").addEventListener("click", () => {
  if (!gradeCompleta) return mostrarAviso("Carregue uma escala primeiro.");
  const csv = exportarEscalaCsv({ dias: gradeCompleta.dias, linhas: linhasFiltradas() });
  baixarCsv(`escala_${demandaAtual?.nome || "30dias"}`, csv);
  mostrarSucesso("Escala exportada em CSV.");
});

carregarDemandas();
