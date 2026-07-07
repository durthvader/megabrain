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
chrome(slide, 1, 4, "Fonte: exportações de BI operacional da regional R7.2 (MA/PI), 01–07/07/2026 · OS = ordem de serviço concluída com baixa OK")
title_block(
    slide,
    "OPERAÇÕES · MARANHÃO/PIAUÍ (R7.2) · 07/07/2026",
    "Maranhão está abaixo da meta de Prazo; Piauí está com folga, mas a produtividade da semana caiu 30%",
    "No fechamento de 06/07, o Maranhão (C.32) ficou abaixo da meta de Prazo 24h e de Produção; o Piauí (C.31) está "
    "com folga confortável nos dois indicadores. Na visão semanal, a Produção 11 OK da regional caiu de 3,25 para "
    "2,27 OS/dia (-30%) entre a semana fechada (S27) e a semana em curso (S28). Ainda não há dado de fila acumulada "
    "para esta regional nesta leva de arquivos.",
    title_size=28,
    lead_top=152,
)

table = add_table(slide, 3, 4, 56, 202, 1168, 204, [230, 306, 306, 326])
headers = [
    ("Cluster", ""),
    ("Baixando serviço", "vs. folha meta, 06/07"),
    ("Produção", "% da meta esperada, 06/07"),
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
    [("128,5%", {"size": 16, "bold": True, "color": GREEN_DARK}), ("acima do esperado", {"size": 10, "color": MUTED})],
    [("100%", {"size": 16, "bold": True, "color": GREEN_DARK}), ("fechou o dia sem estouro", {"size": 10, "color": MUTED})],
]
row_c32 = [
    [("C.32", {"size": 16, "bold": True, "color": NAVY}), ("Maranhão", {"size": 10, "color": MUTED})],
    [("78,2%", {"size": 16, "bold": True, "color": "9A6200"}), ("43 de 55 da folha meta", {"size": 10, "color": MUTED})],
    [("82,1%", {"size": 16, "bold": True, "color": RED}), ("abaixo do esperado", {"size": 10, "color": MUTED})],
    [("77,6%", {"size": 16, "bold": True, "color": RED}), ("7,4 p.p. abaixo da meta", {"size": 10, "color": MUTED})],
]
for col, lines in enumerate(row_c31):
    set_cell(table.cell(1, col), lines, fill=WHITE)
for col, lines in enumerate(row_c32):
    set_cell(table.cell(2, col), lines, fill="EAF2FB")

add_text(
    slide,
    "Como ler: regional R7.2 consolidada em 06/07: Prazo 24h 81,2%, Cumprimento de Agenda 79,7% — abaixo da meta "
    "de 85%, puxado pelo Maranhão. Não confundir com o “Total” nacional que aparece na mesma planilha (71,1%/68,9%), "
    "que soma todas as regionais do país.",
    56, 416, 1130, 34, size=10.5, color=MUTED,
)

add_rect(slide, 56, 470, 545, 168, NAVY, round_corners=True)
add_text(slide, "DECISÃO OPERACIONAL", 80, 484, 320, 18, size=11, color="9FC9EE", bold=True)
add_text(
    slide,
    "Concentrar a semana no Maranhão — Prazo e Produção abaixo da meta — e monitorar diariamente a queda de "
    "produtividade da S28 antes que vire tendência. Execução também nominal: 1 GA concentra o maior gap, 8 técnicos "
    "concentram os maiores desvios.",
    80, 506, 498, 118, size=14, color=WHITE, bold=True,
)

kpis = [
    ("29 de 70", "técnicos estão em Q1/NP (produtividade baixa ou sem classificação) no quartil 11 OK"),
    ("364 OS", "de gap estimado em 7 dias (01–07/07), considerando meta por tempo de casa"),
    ("-30%", "queda de Produção 11 OK entre a semana fechada e a semana em curso"),
]
for index, (value, label) in enumerate(kpis):
    left = 625 + index * 202
    add_rect(slide, left, 470, 190, 168, WHITE, line=LINE, round_corners=True)
    add_text(slide, value, left + 15, 486, 162, 32, size=23, color=BLUE, bold=True)
    add_text(slide, label, left + 15, 522, 162, 104, size=11, color=MUTED)

# ---------------------------------------------------------------- Slide 2
slide = prs.slides.add_slide(blank)
chrome(slide, 2, 4, "Fonte: Analítico Nominal 01–07/07/2026, Quartil de Produtividade S27/S28 e exportações de motivo/submotivo de improdutividade da R7.2")
title_block(
    slide,
    "DIAGNÓSTICO DE PRODUÇÃO",
    "A produtividade está concentrada na faixa mediana — o problema é a cauda, não o time inteiro",
    title_size=27,
)

add_rect(slide, 56, 150, 610, 372, WHITE, line=LINE, round_corners=True)
add_text(slide, "70 técnicos elegíveis", 78, 166, 330, 20, size=15, color=NAVY, bold=True)
add_text(slide, "Perfil quase todo veterano", 340, 168, 306, 18, size=12, color=MUTED, align=PP_ALIGN.RIGHT)
add_text(
    slide,
    "Quartil de produtividade (11 OK), média das semanas S27 e S28. Quadro concentrado em >90 dias de casa: "
    "16 de 18 no Piauí, 48 de 52 no Maranhão.",
    78, 190, 566, 28, size=10, color=MUTED,
)
segments = [(38.6, GREEN_DARK), (22.9, AMBER), (18.6, ORANGE), (10.7, RED)]
bar_left, bar_width = 78, 566
offset = bar_left
for pct, color in segments:
    seg_width = bar_width * pct / 100
    add_rect(slide, offset, 222, seg_width, 20, color)
    offset += seg_width
legend = [
    ("38,6%", "Q3 — acima da mediana", GREEN_DARK),
    ("22,9%", "Q2 — mediana", AMBER),
    ("18,6%", "Q1 — abaixo da mediana", ORANGE),
    ("10,7%", "NP — sem produção", RED),
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
add_text(slide, "Gap estimado por cluster (01–07/07)", 78, 350, 380, 18, size=13, color=NAVY, bold=True)
add_text(slide, "364 OS em 7 dias", 430, 351, 216, 16, size=12, color=RED, bold=True, align=PP_ALIGN.RIGHT)
hbar(slide, "C.32 Maranhão", "309", 78, 378, 120, 380, 1.0)
hbar(slide, "C.31 Piauí", "55", 78, 402, 120, 380, 0.178, color="78A9D8")
add_text(
    slide,
    "Gap = máximo(meta por faixa de tempo de casa × dias trabalhados − volume OK, 0), estimado a partir do "
    "Analítico Nominal (dias trabalhados inferidos por Volume OK / Prod. OK).",
    78, 430, 566, 30, size=9.5, color=MUTED,
)
add_text(
    slide,
    "1 técnico (Adrian Viana de França, C.32) ficou sem nenhuma baixa no período inteiro — confirmar com RH/escala.",
    78, 462, 566, 30, size=9.5, color=MUTED,
)

add_rect(slide, 686, 150, 538, 372, WHITE, line=LINE, round_corners=True)
add_text(slide, "125 baixas com motivo", 708, 166, 320, 20, size=15, color=NAVY, bold=True)
add_text(slide, "123 com submotivo", 926, 168, 278, 18, size=12, color=RED, bold=True, align=PP_ALIGN.RIGHT)
add_text(
    slide,
    "Motivo e submotivo não fecham entre si (diferença de 2). Motivos registrados nos 4 maiores grupos (01–07/07):",
    708, 190, 494, 30, size=10, color=MUTED,
)
causes = [
    ("Abertura indevida", "30", 1.0),
    ("Falha massiva", "26", 0.867),
    ("Cliente ausente", "14", 0.467),
    ("Desistiu do serviço", "12", 0.4),
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
add_text(
    slide,
    "189 improdutivas no período total, mas só 125/123 têm motivo/submotivo — 64 (34%) seguem sem classificação.",
    724, 438, 466, 32, size=9, color="4A5B52",
)

solutions = [
    ("01", "Investigar a queda S27→S28",
     "Produção 11 OK caiu de 3,25 para 2,27 OS/dia. Confirmar se é dado parcial da semana em curso ou queda real "
     "antes de tratar como tendência."),
    ("02", "Plano individual nominal",
     "Foco nos 8 maiores gaps individuais e na GA com maior concentração de perda. Detalhe na página seguinte."),
    ("03", "Qualidade da demanda",
     "Mesma frente do Ceará: travar abertura de OS sem validação técnica e tratar falha massiva antes do despacho "
     "— os dois motivos somam 56 das 125 baixas classificadas."),
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
chrome(slide, 3, 4, "Fonte: Analítico Nominal por técnico, 01 a 07/07/2026 · 70 técnicos elegíveis · gap estimado, dias trabalhados inferidos")
title_block(
    slide,
    "GESTÃO NOMINAL · 01 A 07/07/2026",
    "Uma área e oito técnicos concentram a maior parte do gap do Maranhão",
    title_size=27,
)

add_rect(slide, 56, 148, 452, 400, WHITE, line=LINE, round_corners=True)
add_text(slide, "Gap por área de gestão (GA)", 78, 164, 300, 20, size=14, color=NAVY, bold=True)
add_text(slide, "em OS não executadas (estimado)", 300, 166, 188, 18, size=9.5, color=MUTED, align=PP_ALIGN.RIGHT)
gas = [
    ("Naan Carlos Cabral Oliveira · C.32", "76", 1.0, BLUE),
    ("Roberval Silva Rodrigues · C.32", "72", 0.947, BLUE),
    ("Francisco Sales Furtado Jr. · C.32", "65", 0.855, BLUE),
    ("Ruan Labre Gabriel da Silva · C.32", "43", 0.566, "78A9D8"),
    ("Leonardo Cardoso Silva · C.31/C.32", "77", 0.5, "78A9D8"),
]
for index, (label, value, ratio, color) in enumerate(gas):
    hbar(slide, label, value, 78, 202 + index * 32, 172, 180, ratio, color=color)
add_rect(slide, 78, 366, 408, 168, "F1F9F1")
add_rect(slide, 78, 366, 5, 168, GREEN)
add_text(slide, "1 técnico", 94, 378, 120, 30, size=18, color=GREEN_DARK, bold=True)
add_text(
    slide,
    "ficou sem nenhuma baixa no período inteiro (01–07/07): Adrian Viana de França (C.32, GA Roberval Silva "
    "Rodrigues) — capacidade fora de campo a confirmar com RH/escala, mesmo padrão do Ceará, mas em escala muito "
    "menor (1 caso, não 7).",
    94, 410, 376, 116, size=10.5, color="4A5B52",
)

table = add_table(slide, 4, 3, 528, 148, 696, 396, [232, 240, 224])
set_cell(table.cell(0, 0), [("TÉCNICOS", {"size": 9.5, "bold": True, "color": WHITE})], fill=NAVY, v_margin=4)
set_cell(table.cell(0, 1), [("O QUE OS DADOS MOSTRAM", {"size": 9.5, "bold": True, "color": WHITE})], fill=NAVY, v_margin=4)
set_cell(table.cell(0, 2), [("AÇÃO IMEDIATA", {"size": 9.5, "bold": True, "color": WHITE})], fill=NAVY, v_margin=4)
nominal_rows = [
    (
        [("1 técnico sem baixa no período", {"size": 10, "bold": True, "color": NAVY}),
         ("Adrian Viana de França (C.32)", {"size": 8, "color": MUTED})],
        [("Nenhuma OS concluída entre 01 e 07/07. Não é baixa produtividade: é capacidade fora de campo.", {"size": 8.5})],
        [("Confirmar com RH e escala em 24h se é férias, atestado ou vaga a repor.", {"size": 8.5})],
        WHITE,
    ),
    (
        [("8 maiores desvios individuais", {"size": 10, "bold": True, "color": NAVY}),
         ("David Wesllem de Sousa Baldez e Natan Padilha Pinheiro (gap 15); Antonio Pedro de Oliveira (13); Alex Henrique Carvalho Duarte e Andre Santos Pereira (12); Felipe Sousa Quirino e Flavio Antonio Estevam Arouche (11); Emanuel Bezerra Lima (10) — todos C.32", {"size": 8, "color": MUTED})],
        [("Concentram boa parte do gap do Maranhão; todos com poucos dias trabalhados no período (4 a 5 de 7).", {"size": 8.5})],
        [("Conversa individual gestor-técnico esta semana, com plano simples de recuperação e verificação da escala real.", {"size": 8.5})],
        "F8FAFD",
    ),
    (
        [("Referências a replicar", {"size": 10, "bold": True, "color": GREEN_DARK}),
         ("Emisson Barbosa Paiva (5,6) e Lucas Sousa Silva (5,4) — C.32; Werbert Pereira dos Santos (5,6), Claudiomir de Sousa (5,25) e Rafael Costa Lima (5,0) — C.31", {"size": 8, "color": MUTED})],
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
    ("1", "sem baixa no período — resolver em 24h", RED),
    ("8", "maior desvio individual — plano já", RED),
    ("32", "Q1 — abaixo da mediana", ORANGE),
    ("32", "Q2 — na mediana", AMBER),
    ("54", "Q3 — acima da mediana, usar de referência", GREEN_DARK),
]
for index, (count, label, color) in enumerate(tiers):
    left = 56 + index * 238
    add_rect(slide, left, 588, 226, 78, WASH)
    add_rect(slide, left, 588, 226, 3, color)
    add_text(slide, count, left + 14, 602, 52, 30, size=22, color=color, bold=True)
    add_text(slide, label, left + 70, 598, 148, 60, size=9.5, color=MUTED)

# ---------------------------------------------------------------- Slide 4
slide = prs.slides.add_slide(blank)
chrome(slide, 4, 4, "Causas não comprovadas pelos dados permanecem marcadas como “em validação” · Dados enviados em 07/07/2026, sem fila/backlog nesta leva")
title_block(
    slide,
    "FCA · FATO, CAUSA E AÇÃO",
    "Três frentes iniciais para o Maranhão/Piauí, com pendências de dado a resolver antes de fechar metas",
    title_size=25,
)

table = add_table(slide, 5, 6, 42, 148, 1196, 452, [200, 258, 268, 116, 216, 138])
fca_heads = ["FATO", "CAUSA", "AÇÃO", "PRAZO", "RESPONSÁVEL", "STATUS"]
for col, head in enumerate(fca_heads):
    set_cell(table.cell(0, col), [(head, {"size": 10.5, "bold": True, "color": WHITE})], fill=NAVY)

fca_rows = [
    (
        [("Maranhão abaixo em Prazo e Produção", {"size": 11, "bold": True, "color": NAVY}),
         ("Prazo 24h 77,6% · Produção 82,1% do esperado, em 06/07", {"size": 9, "color": MUTED})],
        [("Em levantamento — não há ainda quebra por área de gestão para Prazo/Presença nesta leva de arquivos, diferente do que foi possível para Produção.", {"size": 9.5})],
        [("Estender o controle nominal diário (visto no Ceará) para Prazo e Presença assim que houver base por técnico/GA equivalente.", {"size": 9.5})],
        [("a definir", {"size": 11, "bold": True, "color": NAVY}), ("depende de nova exportação", {"size": 9, "color": MUTED})],
        [("Gestores de operação do Maranhão", {"size": 9.5})],
        ("A iniciar", BLUE_LIGHT, "114F88"),
        WHITE,
    ),
    (
        [("364 OS de gap estimado em 7 dias", {"size": 11, "bold": True, "color": NAVY}),
         ("concentrado em 1 GA e 8 técnicos críticos", {"size": 9, "color": MUTED})],
        [("1 técnico sem nenhuma baixa no período; 8 com maior desvio individual, a maioria com só 4–5 dos 7 dias trabalhados.", {"size": 9.5})],
        [("Confirmar com RH a situação do técnico parado; plano individual para os 8 críticos; verificar escala real dos que trabalharam poucos dias.", {"size": 9.5})],
        [("a definir", {"size": 11, "bold": True, "color": NAVY}), ("plano em até 5 dias úteis", {"size": 9, "color": MUTED})],
        [("GA Naan Carlos Cabral Oliveira e GO Walmir Fernandes da Silva", {"size": 9.5})],
        ("Imediato", RED_LIGHT, "8A1717"),
        "F8FAFD",
    ),
    (
        [("189 improdutivas no período, só 125/123 classificadas", {"size": 11, "bold": True, "color": NAVY}),
         ("64 baixas (34%) sem motivo/submotivo", {"size": 9, "color": MUTED})],
        [("Abertura indevida (30) e Falha massiva (26) lideram; motivo e submotivo não reconciliam entre si (diferença de 2) — sinal de qualidade de dado a investigar.", {"size": 9.5})],
        [("Reconciliar com o BI a divergência motivo×submotivo e a lacuna de 64 baixas sem classificação; travar abertura de OS sem validação técnica.", {"size": 9.5})],
        [("a definir", {"size": 11, "bold": True, "color": NAVY}), ("reconciliação antes do próximo corte", {"size": 9, "color": MUTED})],
        [("Equipe de BI/Performance regional", {"size": 9.5})],
        ("Em validação", "FFF0C7", "765400"),
        WHITE,
    ),
    (
        [("Queda de 30% na Produção 11 OK (S27→S28)", {"size": 11, "bold": True, "color": NAVY}),
         ("3,25 → 2,27 OS/dia", {"size": 9, "color": MUTED})],
        [("Ainda não confirmado se é dado parcial da semana em curso ou queda real. Também não há dado de fila acumulada para cruzar com a queda de produção.", {"size": 9.5})],
        [("Acompanhar o fechamento da S28 antes de tratar como tendência; solicitar exportação de fila/backlog equivalente à do Ceará.", {"size": 9.5})],
        [("~12/07", {"size": 11, "bold": True, "color": NAVY}), ("após fechamento S28", {"size": 9, "color": MUTED})],
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
    "Confirmar responsáveis e prazos definitivos   ·   Solicitar exportação de fila/backlog para MA/PI   ·   "
    "Validar reconciliação de improdutividade antes de publicar números fechados",
    270, 634, 940, 18, size=10.5, color="D5DEF3",
)

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
prs.save(OUTPUT)
print(f"OK: {OUTPUT}")
