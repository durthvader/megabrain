// ============================================================
// MEGABRAIN — pages/escalaGrade.js
// Renderização da grade de escala, do seletor de ocorrência e do
// gráfico consolidado. Não é uma página própria: é compartilhado
// entre escalaPage.js (admin) e escalaPublicaPage.js (link público),
// que têm o mesmo painel com chrome diferente.
// ============================================================

import { formatarDataBR, nomeDiaSemanaCurto } from "../utils/datas.js";

// Tipos que o supervisor pode pintar na grade. "conflito" não entra aqui:
// é um estado derivado (dois eventos no mesmo dia), nunca selecionado.
export const TIPOS_OCORRENCIA = [
  { valor: "disponivel", rotulo: "Disponível", cor: "#ffffff" },
  { valor: "ferias", rotulo: "Férias", cor: "#b7d3f6" },
  { valor: "folga", rotulo: "Folga", cor: "#bfe8c5" },
  { valor: "treinamento", rotulo: "Treinamento", cor: "#ffd28a" },
  { valor: "exame", rotulo: "Exame", cor: "#d9cff2" },
];

export const ROTULO_STATUS = {
  disponivel: { letra: "", titulo: "Disponível" },
  ferias: { letra: "FE", titulo: "Férias" },
  treinamento: { letra: "T", titulo: "Treinamento" },
  exame: { letra: "EX", titulo: "Exame periódico" },
  folga: { letra: "FO", titulo: "Folga" },
  conflito: { letra: "!", titulo: "Conflito" },
};

// Cores sólidas (paleta categórica validada) para o gráfico — os tons
// pastel acima são para o fundo das células, aqui usamos tons mais
// saturados para as barras terem contraste e identidade clara.
const COR_GRAFICO = {
  disponivel: "#c3c2b7",
  ferias: "#2a78d6",
  treinamento: "#eda100",
  exame: "#4a3aa7",
  folga: "#1baf7a",
  conflito: "#e34948",
};

export function renderizarSeletorOcorrencia({ container, tipoSelecionado, aoMudar }) {
  container.innerHTML = TIPOS_OCORRENCIA.map(
    (tipo) => `
      <button type="button" class="opcao-ocorrencia${tipo.valor === tipoSelecionado ? " ativa" : ""}"
              data-valor="${tipo.valor}" style="--cor-opcao: ${tipo.cor}">
        ${tipo.rotulo}
      </button>`
  ).join("");

  container.querySelectorAll(".opcao-ocorrencia").forEach((botao) => {
    botao.addEventListener("click", () => aoMudar(botao.dataset.valor));
  });
}

export function marcarSeletorAtivo(container, tipoSelecionado) {
  container.querySelectorAll(".opcao-ocorrencia").forEach((botao) => {
    botao.classList.toggle("ativa", botao.dataset.valor === tipoSelecionado);
  });
}

export function renderizarGradeEscala({ tabela, grade, aoClicarCelula }) {
  const thead = `
    <thead>
      <tr>
        <th class="col-tecnico">Técnico</th>
        ${grade.dias
          .map(
            (dia) => `
          <th title="${formatarDataBR(dia)}">
            ${dia.slice(8)}<span class="dia-semana">${nomeDiaSemanaCurto(dia)}</span>
          </th>`
          )
          .join("")}
      </tr>
    </thead>`;

  const tbody = `
    <tbody>
      ${grade.linhas
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

  tabela.innerHTML = thead + tbody;

  tabela.querySelectorAll("td.celula").forEach((celulaEl) => {
    celulaEl.addEventListener("click", () => {
      const linha = grade.linhas[Number(celulaEl.dataset.linha)];
      const celula = linha.celulas[Number(celulaEl.dataset.celula)];
      aoClicarCelula(linha, celula);
    });
  });
}

const graficosAtivos = new WeakMap();

export function renderizarGraficoConsolidado(canvas, consolidado) {
  if (!canvas || !window.Chart) return;

  const anterior = graficosAtivos.get(canvas);
  if (anterior) anterior.destroy();

  const tipos = ["disponivel", "ferias", "treinamento", "exame", "folga", "conflito"];

  const grafico = new window.Chart(canvas, {
    type: "bar",
    data: {
      labels: consolidado.map((dia) => dia.data.slice(8)),
      datasets: tipos.map((tipo) => ({
        label: ROTULO_STATUS[tipo].titulo,
        data: consolidado.map((dia) => dia[tipo] || 0),
        backgroundColor: COR_GRAFICO[tipo],
        borderRadius: 3,
        maxBarThickness: 14,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { color: "#52514e", boxWidth: 12 } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#898781" }, border: { color: "#e1e0d9" } },
        y: {
          grid: { color: "#e1e0d9" },
          ticks: { color: "#898781", precision: 0 },
          border: { display: false },
          beginAtZero: true,
        },
      },
    },
  });

  graficosAtivos.set(canvas, grafico);
}

export function renderizarConflitos(corpoTabela, conflitos) {
  corpoTabela.innerHTML = conflitos
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
