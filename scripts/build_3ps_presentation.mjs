import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const ROOT = nodeRepl.cwd;
const SCRATCH = path.join(nodeRepl.tmpDir, "codex-presentations", "manual-3ps", "3ps-executivo", "tmp");
const PREVIEW = path.join(SCRATCH, "preview");
const LAYOUT = path.join(SCRATCH, "layout");
const OUTPUT_DIR = path.join(ROOT, "outputs", "3ps");
const OUTPUT = path.join(OUTPUT_DIR, "3Ps_Ceara_Executivo.pptx");

const C = {
  navy: "#081551",
  navy2: "#102667",
  blue: "#1476C9",
  blueLight: "#DCECF9",
  green: "#42DF4B",
  greenDark: "#13853A",
  red: "#D94545",
  redLight: "#FDE2DF",
  orange: "#F08A24",
  amber: "#E4BD30",
  ink: "#182238",
  muted: "#667085",
  line: "#D9E0EA",
  wash: "#F3F6FA",
  white: "#FFFFFF",
};

const pres = Presentation.create({ slideSize: { width: 1280, height: 720 } });

function rect(slide, name, left, top, width, height, fill, lineFill = fill, lineWidth = 0, geometry = "rect") {
  return slide.shapes.add({
    geometry,
    name,
    position: { left, top, width, height },
    fill,
    line: { style: "solid", fill: lineFill, width: lineWidth },
  });
}

function text(slide, name, value, left, top, width, height, opts = {}) {
  const shape = rect(slide, name, left, top, width, height, opts.fill ?? "#00000000", opts.lineFill ?? "#00000000", opts.lineWidth ?? 0);
  shape.text = value;
  shape.text.style = {
    fontSize: opts.fontSize ?? 18,
    color: opts.color ?? C.ink,
    bold: opts.bold ?? false,
    typeface: opts.typeface ?? "Aptos",
    alignment: opts.align ?? "left",
    verticalAlignment: opts.valign ?? "top",
  };
  shape.text.insets = opts.insets ?? { left: 0, right: 0, top: 0, bottom: 0 };
  return shape;
}

function brand(slide) {
  text(slide, "brand-alloha", "alloha", 1090, 34, 120, 34, { fontSize: 30, color: C.navy, align: "right", typeface: "Aptos Display" });
  text(slide, "brand-fibra", "F I B R A", 1128, 67, 82, 14, { fontSize: 9, color: C.greenDark, bold: true, align: "right" });
}

function chrome(slide, number, source) {
  slide.background.fill = C.white;
  rect(slide, "top-rule-navy", 0, 0, 1100, 8, C.navy);
  rect(slide, "top-rule-green", 1100, 0, 180, 8, C.green);
  brand(slide);
  text(slide, "source", source, 56, 686, 1080, 15, { fontSize: 10, color: "#8B94A6" });
  text(slide, "page", `${number} / 3`, 1170, 686, 52, 15, { fontSize: 10, color: "#8B94A6", align: "right" });
}

function titleBlock(slide, eyebrow, titleValue, lead) {
  text(slide, "eyebrow", eyebrow, 56, 42, 760, 22, { fontSize: 13, color: C.blue, bold: true });
  text(slide, "slide-title", titleValue, 56, 69, 1000, 82, { fontSize: 38, color: C.navy, bold: true, typeface: "Aptos Display" });
  if (lead) text(slide, "lead", lead, 56, 151, 1110, 48, { fontSize: 18, color: "#45516A" });
}

function styleTable(table, { headerSize = 15, bodySize = 16, rowFills = [] } = {}) {
  table.borders.assign({ style: "solid", fill: C.line, width: 1 });
  table.cells.block({ row: 0, column: 0, rowCount: 1, columnCount: table.columns.items.length }).assign({
    fill: C.navy,
    textStyle: { fontSize: headerSize, bold: true, color: C.white },
    margins: { left: 10, right: 8, top: 8, bottom: 8 },
    anchor: "middle",
  });
  for (let row = 1; row < table.rows.length; row += 1) {
    table.cells.block({ row, column: 0, rowCount: 1, columnCount: table.columns.items.length }).assign({
      fill: rowFills[row - 1] ?? (row % 2 ? C.white : "#F8FAFD"),
      textStyle: { fontSize: bodySize, color: C.ink },
      margins: { left: 10, right: 8, top: 7, bottom: 7 },
      anchor: "middle",
    });
  }
}

// Slide 1 — visão executiva
{
  const slide = pres.slides.add();
  chrome(slide, 1, "Fonte: BI operacional e bases nominais do projeto 3Ps");
  titleBlock(
    slide,
    "OPERAÇÕES · CEARÁ · 06/07/2026",
    "Fortaleza concentra o risco; o Interior precisa proteger Prazo",
    "C.27 está abaixo nos três Ps. C.26 mantém Presença e fechou Prazo por apenas 0,2 p.p., mas abriu 06/07 com backlog acima de um dia.",
  );

  const values = [
    ["Cluster", "Presença\nmeta 95%", "Produção OK\nS27", "Prazo 24h\nmeta 85%", "Backlog\n06/07", "Leitura executiva"],
    ["C.26\nCeará Interior", "102,5%\nacima", "3,5\ndesvio nos maduros", "85,2%\n+0,2 p.p.", "1,125 dia\nacima do limite", "Proteger Prazo"],
    ["C.27\nFortaleza", "94,5%\n−0,5 p.p.", "3,2\n61/81 abaixo", "83,2%\n−1,8 p.p.", "0,820 dia\ndentro do limite", "Prioridade nos 3 Ps"],
  ];
  const table = slide.tables.add({ rows: 3, columns: 6, left: 56, top: 214, width: 1168, height: 226, columnWidths: [176, 150, 180, 160, 160, 342], values });
  styleTable(table, { headerSize: 15, bodySize: 16, rowFills: [C.white, "#EAF2FB"] });
  table.getCell(1, 0).text.style = { fontSize: 17, bold: true, color: C.navy };
  table.getCell(2, 0).text.style = { fontSize: 17, bold: true, color: C.navy };
  table.getCell(1, 1).text.style = { fontSize: 18, bold: true, color: C.greenDark };
  table.getCell(1, 2).text.style = { fontSize: 18, bold: true, color: "#9A6200" };
  table.getCell(1, 3).text.style = { fontSize: 18, bold: true, color: "#9A6200" };
  table.getCell(1, 4).text.style = { fontSize: 18, bold: true, color: C.red };
  table.getCell(2, 1).text.style = { fontSize: 18, bold: true, color: C.red };
  table.getCell(2, 2).text.style = { fontSize: 18, bold: true, color: C.red };
  table.getCell(2, 3).text.style = { fontSize: 18, bold: true, color: C.red };
  table.getCell(2, 4).text.style = { fontSize: 18, bold: true, color: C.greenDark };

  rect(slide, "decision-box", 56, 466, 555, 142, C.navy, C.navy, 0, "roundRect");
  text(slide, "decision-label", "DECISÃO OPERACIONAL", 80, 484, 300, 20, { fontSize: 12, color: "#9FC9EE", bold: true });
  text(slide, "decision-copy", "Priorizar C.27 nos três indicadores e abrir proteção específica de Prazo em C.26.", 80, 515, 500, 70, { fontSize: 23, color: C.white, bold: true });

  const kpis = [
    ["86", "de 127 técnicos\nabaixo da meta"],
    ["245,5", "OS de gap estimado\nem 01–03/07"],
    ["90,4%", "do gap nos técnicos\nacima de 90 dias"],
  ];
  kpis.forEach((item, index) => {
    const left = 635 + index * 196;
    rect(slide, `kpi-${index}`, left, 466, 180, 142, C.white, C.line, 1, "roundRect");
    text(slide, `kpi-value-${index}`, item[0], left + 16, 486, 148, 38, { fontSize: 30, color: C.blue, bold: true });
    text(slide, `kpi-label-${index}`, item[1], left + 16, 534, 148, 46, { fontSize: 15, color: C.muted });
  });
}

// Slide 2 — diagnóstico e solução
{
  const slide = pres.slides.add();
  chrome(slide, 2, "Nota: Baremo OK é sensibilidade; Produtividade OK permanece como métrica executiva");
  titleBlock(slide, "DIAGNÓSTICO DE PRODUÇÃO", "Técnicos maduros e demanda explicam o gap de Produção");

  text(slide, "workforce-label", "127 técnicos elegíveis · 67,7% abaixo da meta", 56, 155, 560, 28, { fontSize: 18, color: C.navy, bold: true });
  text(slide, "workforce-counts", "41 na meta  ·  10 com menos de 90d abaixo  ·  68 maduros abaixo  ·  8 NP", 56, 181, 560, 20, { fontSize: 12, color: C.muted });
  slide.charts.add("bar", {
    position: { left: 56, top: 202, width: 558, height: 112 },
    categories: ["Técnicos"],
    series: [
      { name: "Na meta", values: [41], fill: C.greenDark },
      { name: "<90d abaixo", values: [10], fill: C.amber },
      { name: ">90d abaixo", values: [68], fill: C.orange },
      { name: "NP", values: [8], fill: C.red },
    ],
    barOptions: { direction: "bar", grouping: "stacked", gapWidth: 55 },
    dataLabels: {
      showValue: false,
      showSeriesName: false,
      showCategoryName: false,
      showPercent: false,
      showLegendKey: false,
      showLeaderLines: false,
    },
    hasLegend: true,
    legend: { position: "bottom", overlay: false, textStyle: { fontSize: 12, fill: C.muted } },
    xAxis: { visible: false, majorGridlines: null },
    yAxis: { visible: false, majorGridlines: null },
    chartFill: C.white,
    chartLine: { style: "solid", fill: C.white, width: 0 },
    plotAreaFill: C.white,
    plotAreaLine: { style: "solid", fill: C.white, width: 0 },
  });

  text(slide, "gap-label", "Gap estimado para a meta · 245,5 OS", 56, 326, 560, 26, { fontSize: 18, color: C.navy, bold: true });
  slide.charts.add("bar", {
    position: { left: 56, top: 352, width: 558, height: 170 },
    categories: ["C.27 Fortaleza · 162", "C.26 Interior · 83,5"],
    series: [{ name: "Gap OS", values: [162, 83.5], fill: C.blue }],
    barOptions: { direction: "bar", grouping: "clustered", gapWidth: 50 },
    dataLabels: {
      showValue: false,
      showSeriesName: false,
      showCategoryName: false,
      showPercent: false,
      showLegendKey: false,
      showLeaderLines: false,
    },
    hasLegend: false,
    xAxis: { visible: false, majorGridlines: null },
    yAxis: { textStyle: { fill: C.muted, fontSize: 14 }, line: { style: "solid", fill: C.line, width: 1 } },
    chartFill: C.white,
    chartLine: { style: "solid", fill: C.white, width: 0 },
    plotAreaFill: C.white,
    plotAreaLine: { style: "solid", fill: C.white, width: 0 },
  });

  text(slide, "cause-label", "212 baixas com motivo visível · 80,2% nos quatro principais", 656, 155, 568, 32, { fontSize: 18, color: C.navy, bold: true });
  slide.charts.add("bar", {
    position: { left: 656, top: 194, width: 568, height: 270 },
    categories: ["Abertura indevida · 59", "Cliente ausente · 52", "Reagendamento · 36", "Falha massiva · 23"],
    series: [{ name: "Baixas", values: [59, 52, 36, 23], fill: C.orange }],
    barOptions: { direction: "bar", grouping: "clustered", gapWidth: 40 },
    dataLabels: {
      showValue: false,
      showSeriesName: false,
      showCategoryName: false,
      showPercent: false,
      showLegendKey: false,
      showLeaderLines: false,
    },
    hasLegend: false,
    xAxis: { visible: false, majorGridlines: null },
    yAxis: { textStyle: { fill: C.muted, fontSize: 13 }, line: { style: "solid", fill: C.line, width: 1 } },
    chartFill: C.white,
    chartLine: { style: "solid", fill: C.white, width: 0 },
    plotAreaFill: C.white,
    plotAreaLine: { style: "solid", fill: C.white, width: 0 },
  });

  const levers = [
    ["01", "Gestão por exceção", "Cortes às 09h, 12h e 16h30"],
    ["02", "Plano nominal", "8 NP em 24h; 68 maduros em 1:1"],
    ["03", "Qualidade da demanda", "Bloquear abertura inválida, confirmar cliente e integrar massivas"],
  ];
  levers.forEach((item, index) => {
    const left = 656 + index * 190;
    rect(slide, `lever-${index}`, left, 490, 178, 134, C.wash, C.line, 1, "roundRect");
    rect(slide, `lever-rule-${index}`, left, 490, 178, 4, C.blue);
    text(slide, `lever-num-${index}`, item[0], left + 14, 507, 38, 26, { fontSize: 23, color: "#A2B2C6", bold: true });
    text(slide, `lever-title-${index}`, item[1], left + 14, 538, 150, 32, { fontSize: 16, color: C.navy, bold: true });
    text(slide, `lever-body-${index}`, item[2], left + 14, 574, 150, 40, { fontSize: 13, color: C.muted });
  });
}

// Slide 3 — FCA
{
  const slide = pres.slides.add();
  chrome(slide, 3, "Causas não comprovadas permanecem explicitamente “em validação”");
  titleBlock(slide, "FCA EXECUTIVO", "Quatro frentes colocam a recuperação em execução");

  const values = [
    ["Fato", "Causa", "Ação", "Prazo", "Responsável", "Status"],
    ["C.27 abaixo nos 3 Ps\n94,5% · 3,2 · 83,2%", "61/81 abaixo em Produção; Presença e Prazo em validação", "Ritual 09h/12h/16h30 e recuperação nominal semanal", "07/07\nRevisão 13/07", "Jose Nilton, Jefferson Oliveira e GAs C.27", "A iniciar"],
    ["76 maduros abaixo\n8 sem produção", "Conversão baixa e causas individuais ainda não classificadas", "8 NP em 24h; 1:1 para os outros 68 maduros", "08/07\nPlano 10/07", "GAs C.26/C.27, com os respectivos GOs", "Imediato"],
    ["328 improdutivas\n212 motivos visíveis", "Demanda, cliente, reagendamento e massivas; cobertura incompleta", "Reconciliar 328×212 e atacar os quatro motivos prioritários", "08/07\nAções 10/07", "Biondillo, Davi dos Reis Luz e GOs Ceará", "Em validação"],
    ["C.26 com 1,125 dia\nPrazo semanal no limite", "Inflow e capacidade por hora ainda não disponíveis", "Aging D-1, fila >20h e limpeza diária até ≤1 dia", "07/07\nEstabilizar 10/07", "Jose Geraldo, Francisco Cleiton e GAs C.26", "Atenção"],
  ];
  const table = slide.tables.add({ rows: 5, columns: 6, left: 42, top: 152, width: 1196, height: 450, columnWidths: [190, 235, 265, 130, 235, 141], values });
  styleTable(table, { headerSize: 14, bodySize: 16, rowFills: [C.white, "#F8FAFD", C.white, "#F8FAFD"] });
  for (let row = 1; row < 5; row += 1) {
    table.getCell(row, 0).text.style = { fontSize: 16, bold: true, color: C.navy };
    table.getCell(row, 3).text.style = { fontSize: 15, bold: true, color: C.navy };
  }
  table.getCell(1, 5).fill = C.blueLight;
  table.getCell(1, 5).text.style = { fontSize: 14, bold: true, color: "#114F88", alignment: "center" };
  table.getCell(2, 5).fill = C.redLight;
  table.getCell(2, 5).text.style = { fontSize: 14, bold: true, color: "#8A1717", alignment: "center" };
  table.getCell(3, 5).fill = "#FFF0C7";
  table.getCell(3, 5).text.style = { fontSize: 14, bold: true, color: "#765400", alignment: "center" };
  table.getCell(4, 5).fill = "#FFE5CB";
  table.getCell(4, 5).text.style = { fontSize: 14, bold: true, color: "#8A4C00", alignment: "center" };

  rect(slide, "decision-request", 42, 620, 1196, 48, C.navy);
  rect(slide, "decision-accent", 42, 620, 7, 48, C.green);
  text(slide, "decision-request-title", "DECISÕES SOLICITADAS", 62, 635, 190, 18, { fontSize: 13, color: C.white, bold: true });
  text(slide, "decision-request-items", "Confirmar donos e prazos  ·  Ratificar 85% como meta de Prazo  ·  Manter Produtividade OK como métrica oficial", 268, 634, 930, 20, { fontSize: 14, color: "#D5DEF3" });
}

await fs.mkdir(PREVIEW, { recursive: true });
await fs.mkdir(LAYOUT, { recursive: true });
await fs.mkdir(OUTPUT_DIR, { recursive: true });

for (const [index, slide] of pres.slides.items.entries()) {
  const stem = `slide-${String(index + 1).padStart(2, "0")}`;
  const png = await pres.export({ slide, format: "png", scale: 1 });
  await fs.writeFile(path.join(PREVIEW, `${stem}.png`), new Uint8Array(await png.arrayBuffer()));
  const layout = await slide.export({ format: "layout" });
  await fs.writeFile(path.join(LAYOUT, `${stem}.layout.json`), await layout.text(), "utf8");
}

const montage = await pres.export({ format: "png", montage: true, scale: 1 });
await fs.writeFile(path.join(PREVIEW, "montage.png"), new Uint8Array(await montage.arrayBuffer()));

const inspection = await pres.inspect({ kind: "slide,textbox,shape,table,chart,layout", maxChars: 20000 });
await fs.writeFile(path.join(SCRATCH, "inspection.txt"), inspection.ndjson, "utf8");

const pptx = await PresentationFile.exportPptx(pres);
await pptx.save(OUTPUT);

export const result = { output: OUTPUT, scratch: SCRATCH, preview: PREVIEW, slides: pres.slides.items.length };
