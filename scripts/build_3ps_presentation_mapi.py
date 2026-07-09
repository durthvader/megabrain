"""Gera outputs/3ps/3Ps_MaranhaoPiaui_Executivo.pptx com a identidade visual Alloha.

Espelha build_3ps_presentation.py, adaptado para a regional R7.2 (MA/PI).
Uso: python scripts/build_3ps_presentation_mapi.py
"""

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Emu, Pt

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "outputs" / "3ps" / "3Ps_MaranhaoPiaui_Executivo.pptx"

NAVY = "081551"
BLUE = "1476C9"
BLUE_LIGHT = "DCECF9"
GREEN = "42DF4B"
GREEN_DARK = "13853A"
RED = "D94545"
RED_LIGHT = "FDE2DF"
ORANGE = "F08A24"
AMBER = "E4BD30"
INK = "182238"
MUTED = "667085"
LINE = "D9E0EA"
WASH = "F3F6FA"
WHITE = "FFFFFF"


def px(value: float) -> Emu:
    return Emu(int(value * 9525))


def rgb(hex_code: str) -> RGBColor:
    return RGBColor.from_string(hex_code)


def add_rect(slide, left, top, width, height, fill, line=None, line_width=1.0, round_corners=False):
    shape_type = MSO_SHAPE.ROUNDED_RECTANGLE if round_corners else MSO_SHAPE.RECTANGLE
    shape = slide.shapes.add_shape(shape_type, px(left), px(top), px(width), px(height))
    if round_corners:
        shape.adjustments[0] = 0.07
    if fill is None:
        shape.fill.background()
    else:
        shape.fill.solid()
        shape.fill.fore_color.rgb = rgb(fill)
    if line is None:
        shape.line.fill.background()
    else:
        shape.line.color.rgb = rgb(line)
        shape.line.width = Pt(line_width)
    shape.shadow.inherit = False
    return shape


def add_text(slide, value, left, top, width, height, size=14, color=INK, bold=False,
             align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, font="Aptos", line_spacing=1.06):
    box = slide.shapes.add_textbox(px(left), px(top), px(width), px(height))
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    for margin in ("margin_left", "margin_right", "margin_top", "margin_bottom"):
        setattr(tf, margin, 0)
    lines = value if isinstance(value, list) else [(value, {})]
    for index, (text, opts) in enumerate(lines):
        paragraph = tf.paragraphs[0] if index == 0 else tf.add_paragraph()
        paragraph.alignment = opts.get("align", align)
        paragraph.line_spacing = opts.get("line_spacing", line_spacing)
        if index > 0:
            paragraph.space_before = Pt(opts.get("space_before", 2))
        run = paragraph.add_run()
        run.text = text
        run.font.size = Pt(opts.get("size", size))
        run.font.bold = opts.get("bold", bold)
        run.font.color.rgb = rgb(opts.get("color", color))
        run.font.name = opts.get("font", font)
    return box


def chrome(slide, number, total, source):
    add_rect(slide, 0, 0, 1100, 8, NAVY)
    add_rect(slide, 1100, 0, 180, 8, GREEN)
    add_text(slide, "alloha", 1090, 30, 130, 36, size=27, color=NAVY,
             align=PP_ALIGN.RIGHT, font="Aptos Display")
    add_text(slide, "F I B R A", 1090, 66, 130, 14, size=8, color=GREEN_DARK,
             bold=True, align=PP_ALIGN.RIGHT)
    add_text(slide, source, 56, 688, 1040, 16, size=9, color="8B94A6")
    add_text(slide, f"{number} / {total}", 1150, 688, 74, 16, size=9,
             color="8B94A6", align=PP_ALIGN.RIGHT)


def title_block(slide, eyebrow, title, lead=None, title_size=34, lead_top=138):
    add_text(slide, eyebrow, 56, 36, 900, 20, size=12, color=BLUE, bold=True)
    add_text(slide, title, 56, 60, 1000, 76, size=title_size, color=NAVY,
             bold=True, font="Aptos Display", line_spacing=1.0)
    if lead:
        add_text(slide, lead, 56, lead_top, 1120, 44, size=15, color="45516A")


def set_cell(cell, lines, fill=None, anchor=MSO_ANCHOR.MIDDLE, v_margin=6):
    if fill:
        cell.fill.solid()
        cell.fill.fore_color.rgb = rgb(fill)
    cell.vertical_anchor = anchor
    cell.margin_left = px(10)
    cell.margin_right = px(8)
    cell.margin_top = px(v_margin)
    cell.margin_bottom = px(v_margin)
    tf = cell.text_frame
    tf.word_wrap = True
    for index, (text, opts) in enumerate(lines):
        paragraph = tf.paragraphs[0] if index == 0 else tf.add_paragraph()
        paragraph.alignment = opts.get("align", PP_ALIGN.LEFT)
        paragraph.line_spacing = opts.get("line_spacing", 1.05)
        run = paragraph.add_run()
        run.text = text
        run.font.size = Pt(opts.get("size", 11))
        run.font.bold = opts.get("bold", False)
        run.font.color.rgb = rgb(opts.get("color", INK))
        run.font.name = opts.get("font", "Aptos")


def add_table(slide, rows, cols, left, top, width, height, col_widths):
    frame = slide.shapes.add_table(rows, cols, px(left), px(top), px(width), px(height))
    table = frame.table
    table.first_row = False
    table.horz_banding = False
    for index, cw in enumerate(col_widths):
        table.columns[index].width = px(cw)
    return table


def hbar(slide, label, value_text, left, top, label_width, bar_width, ratio,
         color=BLUE, track="E7EDF5", bar_height=12):
    add_text(slide, label, left, top - 2, label_width, 16, size=10.5, color=INK)
    track_left = left + label_width + 8
    add_rect(slide, track_left, top, bar_width, bar_height, track)
    add_rect(slide, track_left, top, max(bar_width * ratio, 4), bar_height, color)
    add_text(slide, value_text, track_left + bar_width + 8, top - 2, 44, 16,
             size=11, color=INK, bold=True)


prs = Presentation()
prs.slide_width = px(1280)
prs.slide_height = px(720)
blank = prs.slide_layouts[6]

# ---------------------------------------------------------------- Slide 1
slide = prs.slides.add_slide(blank)
chrome(slide, 1, 4, "Fonte: exportações de BI operacional da regional R7.2 (MA/PI), 01–09/07/2026 · OS = ordem de serviço concluída com baixa OK")
title_block(
    slide,
    "OPERAÇÕES · MARANHÃO/PIAUÍ (R7.2) · 09/07/2026",
    "Maranhão volta a cumprir o Prazo 24h; Produção e Cumprimento de Agenda seguem abaixo do ideal",
    "No fechamento de 08/07, o Maranhão (C.32) passou a cumprir a meta de Prazo 24h, mas segue abaixo do esperado "
    "em Produção; o Piauí (C.31) está com folga confortável em Produção e Prazo. O Cumprimento de Agenda caiu nos "
    "dois clusters e é hoje o principal ponto de atenção. Na visão semanal, a Produção 11 OK da regional caiu de "
    "3,25 para 3,02 OS/dia (-7,1%) entre a semana fechada (S27) e a semana em curso (S28).",
    title_size=28,
    lead_top=152,
)

table = add_table(slide, 3, 4, 56, 202, 1168, 204, [230, 306, 306, 326])
headers = [
    ("Cluster", ""),
    ("Baixando serviço", "vs. folha meta, 08/07"),
    ("Produção", "% da meta esperada, 08/07"),
    ("Prazo 24h", "meta 85% das ordens"),
]
for col, (head, sub) in enumerate(headers):
    lines = [(head, {"size": 13, "bold": True, "color": WHITE})]
    if sub:
        lines.append((sub, {"size": 9.5, "color": "BFC9E3"}))
    set_cell(table.cell(0, col), lines, fill=NAVY)

row_c31 = [
    [("C.31", {"size": 16, "bold": True, "color": NAVY}), ("Piauí", {"size": 10, "color": MUTED})],
    [("78,9%", {"size": 16, "bold": True, "color": GREEN_DARK}), ("15 de 19 da folha meta", {"size": 10, "color": MUTED})],
    [("144,8%", {"size": 16, "bold": True, "color": GREEN_DARK}), ("acima do esperado", {"size": 10, "color": MUTED})],
    [("92,0%", {"size": 16, "bold": True, "color": GREEN_DARK}), ("7,0 p.p. acima da meta", {"size": 10, "color": MUTED})],
]
row_c32 = [
    [("C.32", {"size": 16, "bold": True, "color": NAVY}), ("Maranhão", {"size": 10, "color": MUTED})],
    [("78,2%", {"size": 16, "bold": True, "color": "9A6200"}), ("43 de 55 da folha meta", {"size": 10, "color": MUTED})],
    [("88,4%", {"size": 16, "bold": True, "color": RED}), ("abaixo do esperado", {"size": 10, "color": MUTED})],
    [("89,4%", {"size": 16, "bold": True, "color": GREEN_DARK}), ("4,4 p.p. acima da meta", {"size": 10, "color": MUTED})],
]
for col, lines in enumerate(row_c31):
    set_cell(table.cell(1, col), lines, fill=WHITE)
for col, lines in enumerate(row_c32):
    set_cell(table.cell(2, col), lines, fill="EAF2FB")

add_text(
    slide,
    "Como ler: Baixando Serviço mede quantos técnicos da folha meta estão de fato executando ordens no dia. A "
    "regional R7.2 fechou 08/07 com Prazo 24h em 90,3% (acima da meta) e Cumprimento de Agenda em 75,0% — abaixo "
    "da meta de 85%, puxado pelo Maranhão.",
    56, 416, 1130, 34, size=10.5, color=MUTED,
)

add_rect(slide, 56, 470, 545, 168, NAVY, round_corners=True)
add_text(slide, "DECISÃO OPERACIONAL", 80, 484, 320, 18, size=11, color="9FC9EE", bold=True)
add_text(
    slide,
    "Manter o foco no Maranhão — Produção segue abaixo do esperado e Cumprimento de Agenda caiu nos dois clusters "
    "— sustentando o ganho recém-conquistado em Prazo 24h. Execução também nominal: 1 GA concentra o maior gap, "
    "8 técnicos concentram os maiores desvios.",
    80, 506, 498, 118, size=14, color=WHITE, bold=True,
)

kpis = [
    ("20 de 69", "técnicos estão em Q1/NP (produtividade baixa ou sem classificação) no quartil 11 OK"),
    ("419 OS", "de gap estimado em 9 dias (01–09/07), considerando meta por tempo de casa"),
    ("-7,1%", "queda de Produção 11 OK entre a semana fechada e a semana em curso"),
]
for index, (value, label) in enumerate(kpis):
    left = 625 + index * 202
    add_rect(slide, left, 470, 190, 168, WHITE, line=LINE, round_corners=True)
    add_text(slide, value, left + 15, 486, 162, 32, size=23, color=BLUE, bold=True)
    add_text(slide, label, left + 15, 522, 162, 104, size=11, color=MUTED)

# ---------------------------------------------------------------- Slide 2
slide = prs.slides.add_slide(blank)
chrome(slide, 2, 4, "Fonte: Analítico Nominal 01–09/07/2026, Quartil de Produtividade S27/S28 e exportações de motivo/submotivo de improdutividade da R7.2")
title_block(
    slide,
    "DIAGNÓSTICO DE PRODUÇÃO",
    "A produtividade está concentrada na faixa mediana — o problema é a cauda, não o time inteiro",
    title_size=27,
)

add_rect(slide, 56, 150, 610, 372, WHITE, line=LINE, round_corners=True)
add_text(slide, "69 técnicos elegíveis", 78, 166, 330, 20, size=15, color=NAVY, bold=True)
add_text(slide, "Perfil quase todo veterano", 340, 168, 306, 18, size=12, color=MUTED, align=PP_ALIGN.RIGHT)
add_text(
    slide,
    "Quartil de produtividade (11 OK), média das semanas S27 e S28. Quadro concentrado em >90 dias de casa: "
    "16 de 18 no Piauí, 47 de 51 no Maranhão.",
    78, 190, 566, 28, size=10, color=MUTED,
)
segments = [(34.1, GREEN_DARK), (29.7, AMBER), (27.5, ORANGE), (8.7, RED)]
bar_left, bar_width = 78, 566
offset = bar_left
for pct, color in segments:
    seg_width = bar_width * pct / 100
    add_rect(slide, offset, 222, seg_width, 20, color)
    offset += seg_width
legend = [
    ("34,1%", "Q3 — acima da mediana", GREEN_DARK),
    ("29,7%", "Q2 — mediana", AMBER),
    ("27,5%", "Q1 — abaixo da mediana", ORANGE),
    ("8,7%", "NP — sem produção", RED),
]
for index, (count, label, color) in enumerate(legend):
    left = 78 + index * 144
    add_rect(slide, left, 252, 7, 28, color)
    add_text(slide, [(count, {"size": 14, "bold": True}), (label, {"size": 8.5, "color": MUTED})],
             left + 12, 250, 132, 34)
add_rect(slide, 78, 292, 566, 46, "FDF4EA")
add_rect(slide, 78, 292, 5, 46, ORANGE)
add_text(
    slide,
    "Diferente do Ceará (68% do time abaixo da meta), a maior parte do quadro aqui está em Q2/Q3. O risco não é "
    "generalizado: está concentrado em poucos nomes e em uma área específica.",
    92, 298, 544, 36, size=10.5, color="5A4632",
)
add_text(slide, "Gap estimado por cluster (01–09/07)", 78, 350, 380, 18, size=13, color=NAVY, bold=True)
add_text(slide, "419 OS em 9 dias", 430, 351, 216, 16, size=12, color=RED, bold=True, align=PP_ALIGN.RIGHT)
hbar(slide, "C.32 Maranhão", "369", 78, 378, 120, 380, 1.0)
hbar(slide, "C.31 Piauí", "50", 78, 402, 120, 380, 0.136, color="78A9D8")
add_text(
    slide,
    "Gap = máximo(meta por faixa de tempo de casa × dias trabalhados − volume OK, 0), estimado a partir do "
    "Analítico Nominal (dias trabalhados inferidos por Volume OK / Prod. OK).",
    78, 430, 566, 30, size=9.5, color=MUTED,
)
add_text(
    slide,
    "2 técnicos (Israel Costa da Silva e Luis Henrique Mendes Costa, C.32) ficaram sem nenhuma baixa no período "
    "inteiro — confirmar com RH/escala.",
    78, 462, 566, 30, size=9.5, color=MUTED,
)

add_rect(slide, 686, 150, 538, 372, WHITE, line=LINE, round_corners=True)
add_text(slide, "273 visitas improdutivas", 708, 166, 320, 20, size=15, color=NAVY, bold=True)
add_text(slide, "174 com motivo registrado", 866, 168, 338, 18, size=12, color=RED, bold=True, align=PP_ALIGN.RIGHT)
add_text(
    slide,
    "Motivos registrados nos 4 maiores grupos (01–09/07):",
    708, 190, 494, 30, size=10, color=MUTED,
)
causes = [
    ("Abertura indevida", "39", 1.0),
    ("Falha massiva", "37", 0.949),
    ("Cliente ausente", "20", 0.513),
    ("Solicitação de reagendamento", "17", 0.436),
]
for index, (label, value, ratio) in enumerate(causes):
    hbar(slide, label, value, 708, 236 + index * 34, 190, 240, ratio, color=ORANGE)
add_rect(slide, 708, 380, 494, 92, "F1F9F1")
add_rect(slide, 708, 380, 5, 92, GREEN)
add_text(slide, "74%", 724, 392, 90, 30, size=19, color=GREEN_DARK, bold=True)
add_text(
    slide,
    "das improdutivas classificadas estão nos 5 principais motivos, com “Abertura indevida” e “Falha massiva” à "
    "frente — mesmo padrão do Ceará: parte relevante nasce antes do despacho.",
    822, 388, 368, 48, size=10.5, color="4A5B52",
)
solutions = [
    ("01", "Reverter a queda S27→S28",
     "Produção 11 OK caiu de 3,25 para 3,02 OS/dia. Acompanhamento diário para retomar o patamar da semana "
     "anterior até o fim da S28."),
    ("02", "Plano individual nominal",
     "Foco nos 8 maiores gaps individuais e na GA com maior concentração de perda. Detalhe na página seguinte."),
    ("03", "Qualidade da demanda",
     "Mesma frente do Ceará: travar abertura de OS sem validação técnica e tratar falha massiva antes do despacho "
     "— os dois motivos somam 76 das 174 baixas classificadas."),
]
for index, (number, head, body) in enumerate(solutions):
    left = 56 + index * 398
    add_rect(slide, left, 540, 382, 118, WASH)
    add_rect(slide, left, 540, 382, 3, BLUE)
    add_text(slide, number, left + 14, 552, 40, 26, size=20, color="A2B2C6", bold=True)
    add_text(slide, head, left + 54, 552, 316, 20, size=13, color=NAVY, bold=True)
    add_text(slide, body, left + 54, 574, 316, 78, size=10, color=MUTED)

# ---------------------------------------------------------------- Slide 3
slide = prs.slides.add_slide(blank)
chrome(slide, 3, 4, "Fonte: Analítico Nominal por técnico, 01 a 09/07/2026 · 69 técnicos elegíveis · gap estimado, dias trabalhados inferidos")
title_block(
    slide,
    "GESTÃO NOMINAL · 01 A 09/07/2026",
    "Uma área e oito técnicos concentram a maior parte do gap do Maranhão",
    title_size=27,
)

add_rect(slide, 56, 148, 452, 400, WHITE, line=LINE, round_corners=True)
add_text(slide, "Gap por área de gestão (GA)", 78, 164, 300, 20, size=14, color=NAVY, bold=True)
add_text(slide, "em OS não executadas (estimado)", 300, 166, 188, 18, size=9.5, color=MUTED, align=PP_ALIGN.RIGHT)
gas = [
    ("Naan Carlos Cabral Oliveira · C.32", "95", 1.0, BLUE),
    ("Leonardo Cardoso Silva · C.31/C.32", "23 + 60", 0.874, BLUE),
    ("Francisco Sales Furtado Jr. · C.32", "80", 0.842, BLUE),
    ("Roberval Silva Rodrigues · C.32", "76", 0.8, "78A9D8"),
    ("Ruan Labre Gabriel da Silva · C.32", "49", 0.516, "78A9D8"),
]
for index, (label, value, ratio, color) in enumerate(gas):
    hbar(slide, label, value, 78, 202 + index * 32, 172, 180, ratio, color=color)
add_rect(slide, 78, 366, 408, 168, "F1F9F1")
add_rect(slide, 78, 366, 5, 168, GREEN)
add_text(slide, "2 técnicos", 94, 378, 120, 30, size=18, color=GREEN_DARK, bold=True)
add_text(
    slide,
    "ficaram sem nenhuma baixa no período inteiro (01–09/07): Israel Costa da Silva (C.32, GA Naan Carlos Cabral "
    "Oliveira) e Luis Henrique Mendes Costa (C.32, GA Francisco Sales Furtado Jr.) — capacidade fora de campo a "
    "confirmar com RH/escala, mesmo padrão do Ceará, mas em escala muito menor (2 casos, não 7).",
    94, 410, 376, 116, size=10.5, color="4A5B52",
)

table = add_table(slide, 4, 3, 528, 148, 696, 396, [232, 240, 224])
set_cell(table.cell(0, 0), [("TÉCNICOS", {"size": 9.5, "bold": True, "color": WHITE})], fill=NAVY, v_margin=4)
set_cell(table.cell(0, 1), [("O QUE OS DADOS MOSTRAM", {"size": 9.5, "bold": True, "color": WHITE})], fill=NAVY, v_margin=4)
set_cell(table.cell(0, 2), [("AÇÃO IMEDIATA", {"size": 9.5, "bold": True, "color": WHITE})], fill=NAVY, v_margin=4)
nominal_rows = [
    (
        [("2 técnicos sem baixa no período", {"size": 10, "bold": True, "color": NAVY}),
         ("Israel Costa da Silva e Luis Henrique Mendes Costa (C.32)", {"size": 8, "color": MUTED})],
        [("Nenhuma OS concluída entre 01 e 09/07. Não é baixa produtividade: é capacidade fora de campo.", {"size": 8.5})],
        [("Confirmar com RH e escala em 24h se é férias, atestado ou vaga a repor.", {"size": 8.5})],
        WHITE,
    ),
    (
        [("8 maiores desvios individuais", {"size": 10, "bold": True, "color": NAVY}),
         ("Andre Santos Pereira e Natan Padilha Pinheiro (gap 19); David Wesllem de Sousa Baldez (17); Marcio Andre Cutrim Costa e Lucas dos Santos Cutrim (14); Antonio Pedro de Oliveira, Gabriel Leite Barbosa e Felipe Sousa Quirino (13) — todos C.32", {"size": 8, "color": MUTED})],
        [("Concentram boa parte do gap do Maranhão; a maioria com poucos dias trabalhados no período (4 a 7 de 9).", {"size": 8.5})],
        [("Conversa individual gestor-técnico esta semana, com plano simples de recuperação e verificação da escala real.", {"size": 8.5})],
        "F8FAFD",
    ),
    (
        [("Referências a replicar", {"size": 10, "bold": True, "color": GREEN_DARK}),
         ("Emisson Barbosa Paiva (5,86) e Lucas Sousa Silva (5,29) — C.32; Werbert Pereira dos Santos (5,57), Claudiomir de Sousa (5,50) e Rafael Costa Lima (5,43) — C.31", {"size": 8, "color": MUTED})],
        [("Bem acima da meta de 4 OS/dia, nas mesmas condições de campo.", {"size": 8.5})],
        [("Mapear rota, carga e método desses técnicos e usar como padrão, priorizando a GA de Naan Carlos Cabral Oliveira.", {"size": 8.5})],
        "F1F9F1",
    ),
]
for row_index, (col_a, col_b, col_c, fill) in enumerate(nominal_rows, start=1):
    set_cell(table.cell(row_index, 0), col_a, fill=fill, v_margin=4)
    set_cell(table.cell(row_index, 1), col_b, fill=fill, v_margin=4)
    set_cell(table.cell(row_index, 2), col_c, fill=fill, v_margin=4)
for row in table.rows:
    row.height = px(88)

tiers = [
    ("2", "sem baixa no período — resolver em 24h", RED),
    ("8", "maior desvio individual — plano já", RED),
    ("38", "Q1 — abaixo da mediana", ORANGE),
    ("41", "Q2 — na mediana", AMBER),
    ("47", "Q3 — acima da mediana, usar de referência", GREEN_DARK),
]
for index, (count, label, color) in enumerate(tiers):
    left = 56 + index * 238
    add_rect(slide, left, 588, 226, 78, WASH)
    add_rect(slide, left, 588, 226, 3, color)
    add_text(slide, count, left + 14, 602, 52, 30, size=22, color=color, bold=True)
    add_text(slide, label, left + 70, 598, 148, 60, size=9.5, color=MUTED)

# ---------------------------------------------------------------- Slide 4
slide = prs.slides.add_slide(blank)
chrome(slide, 4, 4, "Causas não comprovadas pelos dados permanecem marcadas como “em validação”")
title_block(
    slide,
    "FCA · FATO, CAUSA E AÇÃO",
    "Quatro frentes colocam a recuperação do Maranhão/Piauí em execução nesta semana",
    title_size=27,
)

table = add_table(slide, 5, 6, 42, 148, 1196, 452, [200, 258, 268, 116, 216, 138])
fca_heads = ["FATO", "CAUSA", "AÇÃO", "PRAZO", "RESPONSÁVEL", "STATUS"]
for col, head in enumerate(fca_heads):
    set_cell(table.cell(0, col), [(head, {"size": 10.5, "bold": True, "color": WHITE})], fill=NAVY)

fca_rows = [
    (
        [("Maranhão volta a cumprir o Prazo 24h, mas Produção e Agenda seguem abaixo", {"size": 11, "bold": True, "color": NAVY}),
         ("Prazo 24h 89,4% (meta 85%) · Produção 88,4% do esperado · Cumprimento de Agenda 72,3%, em 08/07", {"size": 9, "color": MUTED})],
        [("O gap de produção segue concentrado em poucas áreas de gestão e técnicos específicos, detalhados na página anterior; a queda de Cumprimento de Agenda é mais recente e ainda em apuração.", {"size": 9.5})],
        [("Controle diário de Produção e Agenda nas áreas críticas, sustentando o ganho de Prazo 24h, com lista nominal e providência no mesmo dia.", {"size": 9.5})],
        [("10/07", {"size": 11, "bold": True, "color": NAVY}), ("1ª revisão 17/07", {"size": 9, "color": MUTED})],
        [("Gestores de operação do Maranhão", {"size": 9.5})],
        ("Em andamento", BLUE_LIGHT, "114F88"),
        WHITE,
    ),
    (
        [("419 OS de gap estimado em 9 dias", {"size": 11, "bold": True, "color": NAVY}),
         ("concentrado em 1 GA e 8 técnicos críticos", {"size": 9, "color": MUTED})],
        [("2 técnicos sem nenhuma baixa no período; 8 com maior desvio individual, a maioria com 4 a 7 dos 9 dias trabalhados.", {"size": 9.5})],
        [("Confirmar com RH a situação dos 2 técnicos parados; plano individual para os 8 críticos; ajuste de carga e rota para os demais.", {"size": 9.5})],
        [("10/07", {"size": 11, "bold": True, "color": NAVY}), ("planos até 12/07", {"size": 9, "color": MUTED})],
        [("GA Naan Carlos Cabral Oliveira e GO Walmir Fernandes da Silva", {"size": 9.5})],
        ("Imediato", RED_LIGHT, "8A1717"),
        "F8FAFD",
    ),
    (
        [("273 visitas improdutivas no período", {"size": 11, "bold": True, "color": NAVY}),
         ("174 com motivo registrado", {"size": 9, "color": MUTED})],
        [("Abertura indevida (39) e Falha massiva (37) lideram os motivos registrados — 74% das classificadas nascem antes do despacho.", {"size": 9.5})],
        [("Travar abertura de OS sem validação técnica; confirmar o cliente antes do despacho; suspender despacho em área com falha massiva ativa.", {"size": 9.5})],
        [("10/07", {"size": 11, "bold": True, "color": NAVY}), ("travas até 12/07", {"size": 9, "color": MUTED})],
        [("Equipe de BI/Performance regional", {"size": 9.5})],
        ("Em validação", "FFF0C7", "765400"),
        WHITE,
    ),
    (
        [("Recuperação parcial da Produção 11 OK (S27→S28)", {"size": 11, "bold": True, "color": NAVY}),
         ("3,25 → 3,02 OS/dia (-7,1%)", {"size": 9, "color": MUTED})],
        [("Concentrada no Maranhão, mesma regional que segue abaixo da meta de Produção e de Cumprimento de Agenda no fechamento diário.", {"size": 9.5})],
        [("Acompanhar o fechamento da S28 frente à S27, priorizando as GAs com maior gap identificado (Naan Carlos Cabral Oliveira, Leonardo Cardoso Silva, Francisco Sales Furtado Jr.).", {"size": 9.5})],
        [("12/07", {"size": 11, "bold": True, "color": NAVY}), ("fechamento da S28", {"size": 9, "color": MUTED})],
        [("Gestores de operação da regional R7.2", {"size": 9.5})],
        ("Atenção", "FFE5CB", "8A4C00"),
        "F8FAFD",
    ),
]
for row_index, (fato, causa, acao, prazo, resp, status, fill) in enumerate(fca_rows, start=1):
    set_cell(table.cell(row_index, 0), fato, fill=fill)
    set_cell(table.cell(row_index, 1), causa, fill=fill)
    set_cell(table.cell(row_index, 2), acao, fill=fill)
    set_cell(table.cell(row_index, 3), prazo, fill=fill)
    set_cell(table.cell(row_index, 4), resp, fill=fill)
    status_text, status_fill, status_color = status
    set_cell(
        table.cell(row_index, 5),
        [(status_text, {"size": 10, "bold": True, "color": status_color, "align": PP_ALIGN.CENTER})],
        fill=status_fill,
    )

add_rect(slide, 42, 618, 1196, 48, NAVY)
add_rect(slide, 42, 618, 7, 48, GREEN)
add_text(slide, "DECISÕES SOLICITADAS", 64, 634, 200, 18, size=11.5, color=WHITE, bold=True)
add_text(
    slide,
    "Confirmar responsáveis e prazos   ·   Ratificar 85% como meta do Prazo 24h e do Cumprimento de Agenda para a regional   ·   "
    "Priorizar a GA de Naan Carlos Cabral Oliveira na recuperação",
    270, 634, 940, 18, size=10.5, color="D5DEF3",
)

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
prs.save(OUTPUT)
print(f"OK: {OUTPUT}")
