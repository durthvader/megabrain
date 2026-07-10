"""Monta o PPTX executivo de Custo de Horas a partir do JSON + narrativa.

Camada 2 da máquina (montador). Consome:
  - outputs/horas/dados_<regiao>.json   (números — gerado pelo extrair_horas.py)
  - docs/horas/narrativa_<regiao>.json  (textos — títulos, causas, ações)
e gera outputs/horas/Horas_<Regiao>_Executivo.pptx no padrão Alloha.

Dinâmica dos 4 slides: Fato (indicador) -> Causa (ociosidade) -> Causa (por GA)
-> Ação (proposta do próximo ciclo + FCA).

Uso:
    python scripts/horas/build_horas.py --regiao ceara
"""

from __future__ import annotations

import argparse
import json
import unicodedata
from pathlib import Path

from pptx import Presentation
from pptx.chart.data import CategoryChartData
from pptx.dml.color import RGBColor
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION, XL_TICK_MARK
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Emu, Pt

ROOT = Path(__file__).resolve().parents[2]

# ------------------------------------------------------------ identidade Alloha
NAVY = "081551"
BLUE = "1476C9"
BLUE_MID = "3E6FB0"
BLUE_LIGHT = "DCECF9"
GREEN = "42DF4B"
GREEN_DARK = "13853A"
RED = "D94545"
RED_LIGHT = "FDE2DF"
ORANGE = "F08A24"
AMBER = "E4BD30"
WARN = "9A6200"
INK = "182238"
MUTED = "667085"
LINE = "D9E0EA"
WASH = "F3F6FA"
WHITE = "FFFFFF"

MES_ABREV = {"janeiro": "Jan", "fevereiro": "Fev", "março": "Mar", "abril": "Abr",
             "maio": "Mai", "junho": "Jun", "julho": "Jul", "agosto": "Ago",
             "setembro": "Set", "outubro": "Out", "novembro": "Nov", "dezembro": "Dez"}


# ------------------------------------------------------------------- primitivas
def px(value: float) -> Emu:
    return Emu(int(value * 9525))


def rgb(hex_code: str) -> RGBColor:
    return RGBColor.from_string(hex_code)


def add_rect(slide, left, top, width, height, fill, line=None, line_width=1.0, round_corners=False):
    shape_type = MSO_SHAPE.ROUNDED_RECTANGLE if round_corners else MSO_SHAPE.RECTANGLE
    shape = slide.shapes.add_shape(shape_type, px(left), px(top), px(width), px(height))
    if round_corners:
        shape.adjustments[0] = 0.06
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


def add_notes(slide, text):
    slide.notes_slide.notes_text_frame.text = text


def chrome(slide, number, total, source):
    add_rect(slide, 0, 0, 1100, 8, NAVY)
    add_rect(slide, 1100, 0, 180, 8, GREEN)
    add_text(slide, "alloha", 1090, 30, 130, 36, size=27, color=NAVY,
             align=PP_ALIGN.RIGHT, font="Aptos Display")
    add_text(slide, "F I B R A", 1090, 66, 130, 14, size=8, color=GREEN_DARK,
             bold=True, align=PP_ALIGN.RIGHT)
    add_text(slide, source, 56, 690, 1040, 16, size=9, color="8B94A6")
    add_text(slide, f"{number} / {total}", 1150, 690, 74, 16, size=9,
             color="8B94A6", align=PP_ALIGN.RIGHT)


def title_block(slide, eyebrow, title, lead=None, title_size=30, lead_top=None):
    add_text(slide, eyebrow, 56, 34, 980, 20, size=12, color=BLUE, bold=True)
    add_text(slide, title, 56, 58, 1050, 76, size=title_size, color=NAVY,
             bold=True, font="Aptos Display", line_spacing=1.0)
    if lead:
        add_text(slide, lead, 56, lead_top or 128, 1160, 46, size=14.5, color="45516A")


def set_cell(cell, lines, fill=None, anchor=MSO_ANCHOR.MIDDLE, v_margin=5):
    if fill:
        cell.fill.solid()
        cell.fill.fore_color.rgb = rgb(fill)
    cell.vertical_anchor = anchor
    cell.margin_left = px(9)
    cell.margin_right = px(8)
    cell.margin_top = px(v_margin)
    cell.margin_bottom = px(v_margin)
    tf = cell.text_frame
    tf.word_wrap = True
    for index, (text, opts) in enumerate(lines):
        paragraph = tf.paragraphs[0] if index == 0 else tf.add_paragraph()
        paragraph.alignment = opts.get("align", PP_ALIGN.LEFT)
        paragraph.line_spacing = opts.get("line_spacing", 1.04)
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
         color=BLUE, track="E7EDF5", bar_height=13, val_color=INK):
    add_text(slide, label, left, top - 2, label_width, 16, size=10.5, color=INK)
    track_left = left + label_width + 8
    add_rect(slide, track_left, top, bar_width, bar_height, track)
    add_rect(slide, track_left, top, max(bar_width * ratio, 3), bar_height, color)
    add_text(slide, value_text, track_left + bar_width + 8, top - 2, 70, 16,
             size=11, color=val_color, bold=True)


# --------------------------------------------------------------------- formato
def moeda(v):
    if v is None:
        return "—"
    return "R$ " + f"{v / 1000:.1f}".replace(".", ",") + " mil"


def pct(x, casas=0):
    if x is None:
        return "—"
    return f"{x * 100:.{casas}f}".replace(".", ",") + "%"


def encurtar_nome(nome, n=2):
    if not nome:
        return "—"
    partes = str(nome).strip().split()
    sel = partes[:n]
    conect = {"da", "de", "do", "das", "dos", "e"}
    while len(sel) > 1 and sel[-1].lower() in conect:
        sel = sel[:-1]
    return " ".join(sel).title()


def cesta_get(cesta, *chaves):
    """Casa uma chave da cesta ignorando acento/caixa."""
    def nrm(s):
        s = str(s).lower()
        return "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c))
    alvo = [nrm(c) for c in chaves]
    for k, v in cesta.items():
        if nrm(k) in alvo:
            return v
    return None


class SafeDict(dict):
    def __missing__(self, key):
        return "{" + key + "}"


def fmt(texto, ctx):
    return str(texto).format_map(SafeDict(ctx))


# ---------------------------------------------------------------------- charts
def line_chart(slide, series, categorias, left, top, width, height):
    """Gráfico de linhas nativo (valores em R$ mil). series = [(nome, [vals], cor, largura)]."""
    cd = CategoryChartData()
    cd.categories = categorias
    for nome, vals, _c, _w in series:
        cd.add_series(nome, [None if v is None else v / 1000.0 for v in vals])
    graphic = slide.shapes.add_chart(XL_CHART_TYPE.LINE_MARKERS, px(left), px(top),
                                     px(width), px(height), cd)
    chart = graphic.chart
    chart.has_title = False
    chart.font.name = "Aptos"
    chart.font.size = Pt(9)
    chart.has_legend = True
    chart.legend.position = XL_LEGEND_POSITION.BOTTOM
    chart.legend.include_in_layout = False
    chart.legend.font.size = Pt(9)
    for s, (nome, vals, cor, largura) in zip(chart.series, series):
        s.format.line.color.rgb = rgb(cor)
        s.format.line.width = Pt(largura)
        s.smooth = False
        s.marker.style = 8 if nome.lower().startswith("real") else 2  # circle p/ real
        s.marker.size = 5
        s.marker.format.fill.solid()
        s.marker.format.fill.fore_color.rgb = rgb(cor)
        s.marker.format.line.color.rgb = rgb(cor)
    cat = chart.category_axis
    cat.tick_labels.font.size = Pt(9)
    cat.has_major_gridlines = False
    cat.major_tick_mark = XL_TICK_MARK.OUTSIDE
    cat.format.line.color.rgb = rgb(LINE)
    val = chart.value_axis
    val.has_major_gridlines = True
    val.major_gridlines.format.line.color.rgb = rgb("EDF1F6")
    val.tick_labels.font.size = Pt(9)
    val.tick_labels.number_format = '#,##0'
    val.tick_labels.number_format_is_linked = False
    val.format.line.fill.background()
    return chart


def stacked_horizontal(slide, itens, left, top, width, height):
    """Barra horizontal empilhada. itens = [(valor, cor)]. Retorna limites de cada segmento."""
    total = sum(v for v, _ in itens) or 1
    x = left
    limites = []
    for valor, cor in itens:
        w = width * valor / total
        add_rect(slide, x, top, w, height, cor)
        limites.append((x, w))
        x += w
    return limites


# ---------------------------------------------------------------------- slides
def slide1(prs, dados, nar, ctx, blank):
    slide = prs.slides.add_slide(blank)
    s = nar["s1"]
    chrome(slide, 1, 4, fmt(nar["fonte"], ctx))
    title_block(slide, fmt(s["eyebrow"], ctx), fmt(s["titulo"], ctx), title_size=28)

    # --- três KPIs
    cards = [
        ("ORÇADO DO CICLO", ctx["orcado"], "por mês", False),
        ("META · −50%", ctx["meta"], "compromisso do próximo ciclo", True),
        ("REALIZADO (FOTO)", ctx["real"], f"{ctx['var_orcado']} vs orçado · falta cortar {ctx['gap_pct']}", False),
    ]
    cx = 56
    for titulo, valor, sub, destaque in cards:
        w = 372
        fill = NAVY if destaque else WHITE
        add_rect(slide, cx, 178, w, 96, fill, line=None if destaque else LINE, round_corners=True)
        add_text(slide, titulo, cx + 18, 192, w - 36, 16, size=10.5,
                 color="9FC9EE" if destaque else BLUE, bold=True)
        add_text(slide, valor, cx + 18, 210, w - 36, 40, size=30, bold=True,
                 color=WHITE if destaque else NAVY, font="Aptos Display")
        add_text(slide, sub, cx + 18, 250, w - 36, 18, size=10,
                 color="C9D6EF" if destaque else MUTED)
        cx += w + 20

    # --- gráfico de tendência (esquerda)
    serie = [m for m in dados["serie_total"] if m["real"] is not None]
    cats = [MES_ABREV.get(m["mes"], m["mes"][:3]) for m in serie]
    reais = [m["real"] for m in serie]
    orcs = [m["orcado"] for m in serie]
    metas = [ctx["meta_val"]] * len(serie)
    add_text(slide, "Custo mensal de horas — R$ mil", 56, 296, 560, 18, size=12.5,
             color=NAVY, bold=True)
    line_chart(slide, [("Realizado", reais, NAVY, 2.5),
                       ("Orçado", orcs, MUTED, 1.75),
                       ("Meta −50%", metas, GREEN_DARK, 1.75)],
               cats, 44, 316, 585, 336)

    # --- composição da cesta (direita)
    add_text(slide, "Composição do custo (mês-foto)", 660, 296, 560, 18, size=12.5,
             color=NAVY, bold=True)
    ordem = [("DSR", cesta_get(dados["cesta"], "DSR"), BLUE),
             ("Acionamento sobreaviso", cesta_get(dados["cesta"], "ACIONAMENTO SOBRE AVISO"), NAVY),
             ("Espera sobreaviso", cesta_get(dados["cesta"], "ESPERA SOBRE AVISO"), BLUE_MID),
             ("Banco de horas", cesta_get(dados["cesta"], "BH"), "98A2B5"),
             ("Feriados", cesta_get(dados["cesta"], "FERIADOS"), "C9D6E6")]
    ordem = [(n, v or 0, c) for n, v, c in ordem]
    total = sum(v for _, v, _ in ordem) or 1
    limites = stacked_horizontal(slide, [(v, c) for _, v, c in ordem], 660, 320, 562, 34)

    # colchete "Sobreaviso" SOB Acionamento + Espera — abaixo da barra p/ nunca
    # colidir com o título, independente do tamanho do DSR
    x_ac = limites[1][0]
    w_se = limites[1][1] + limites[2][1]
    add_rect(slide, x_ac, 358, w_se, 3, GREEN_DARK)
    add_text(slide, f"Sobreaviso = {ctx['sobreaviso_pct']}",
             x_ac, 362, w_se, 16, size=10.5, color=GREEN_DARK, bold=True, align=PP_ALIGN.CENTER)

    # legenda
    ly = 388
    for nome, valor, cor in ordem:
        add_rect(slide, 660, ly + 2, 12, 12, cor)
        add_text(slide, nome, 680, ly, 300, 16, size=10.5, color=INK)
        add_text(slide, f"{moeda(valor)}  ·  {pct(valor / total)}", 680, ly, 552, 16,
                 size=10.5, color=MUTED, align=PP_ALIGN.RIGHT)
        ly += 22

    # decisão
    add_rect(slide, 660, 512, 562, 128, WASH, line=LINE, round_corners=True)
    add_text(slide, "DECISÃO", 680, 524, 300, 16, size=10.5, color=BLUE, bold=True)
    add_text(slide, fmt(s["decisao"], ctx), 680, 544, 524, 90, size=13, color=INK, bold=True,
             line_spacing=1.08)

    add_notes(slide, "SLIDE 1 — INDICADOR (Fato). Números vêm de dados_<regiao>.json; "
                     "textos de narrativa_<regiao>.json (s1). Meta = -50% do orçado.")


def slide2(prs, dados, nar, ctx, blank):
    slide = prs.slides.add_slide(blank)
    s = nar["s2"]
    o = dados["ociosidade"]
    chrome(slide, 2, 4, fmt(nar["fonte"], ctx))
    title_block(slide, fmt(s["eyebrow"], ctx), fmt(s["titulo"], ctx), title_size=27)

    # painel A — ociosidade por headcount
    add_rect(slide, 56, 150, 560, 250, WHITE, line=LINE, round_corners=True)
    add_text(slide, "Técnicos por dia: em espera x acionados", 78, 166, 520, 18,
             size=13, color=NAVY, bold=True)
    add_text(slide, "Média por dia no período de sobreaviso", 78, 188, 520, 14,
             size=10, color=MUTED)
    he, ha = o["hc_espera_medio"], o["hc_acionado_medio"]
    hbar(slide, "Em espera", f"{he:.1f}".replace(".", ",").rstrip("0").rstrip(","),
         78, 232, 130, 300, 1.0, color=BLUE_MID)
    hbar(slide, "Acionados", f"{ha:.1f}".replace(".", ",").rstrip("0").rstrip(","),
         78, 268, 130, 300, ha / he if he else 0, color=NAVY)
    add_rect(slide, 78, 312, 520, 66, WASH, round_corners=True)
    add_text(slide, ctx["ocio_pct_hc"], 96, 322, 150, 46, size=30, color=GREEN_DARK,
             bold=True, font="Aptos Display", anchor=MSO_ANCHOR.MIDDLE)
    add_text(slide, "dos técnicos de sobreaviso são de fato acionados por dia — "
                    "o restante é plantão pago em espera.",
             250, 322, 332, 48, size=11.5, color=INK, anchor=MSO_ANCHOR.MIDDLE)

    # painel B — ociosidade em horas
    add_rect(slide, 636, 150, 586, 250, WHITE, line=LINE, round_corners=True)
    add_text(slide, "Horas de sobreaviso: espera x acionamento", 658, 166, 540, 18,
             size=13, color=NAVY, bold=True)
    add_text(slide, "Soma do período (analítico nominal)", 658, 188, 540, 14,
             size=10, color=MUTED)
    esp, aci = o["horas_espera_total"], o["horas_acionamento_total"]
    tot = esp + aci
    add_text(slide, "Espera", 658, 210, 120, 16, size=10.5, color=INK)
    add_rect(slide, 658, 228, 540, 26, "E7EDF5")
    add_rect(slide, 658, 228, 540, 26, BLUE_MID)
    add_text(slide, f"{esp:,.0f} h".replace(",", "."), 658, 231, 528, 18, size=11,
             color=WHITE, bold=True, align=PP_ALIGN.RIGHT)
    add_text(slide, "Acionamento efetivo", 658, 266, 200, 16, size=10.5, color=INK)
    add_rect(slide, 658, 284, 540, 26, "E7EDF5")
    add_rect(slide, 658, 284, max(540 * aci / tot, 6), 26, NAVY)
    add_text(slide, f"{aci:,.0f} h".replace(",", "."), 658 + max(540 * aci / tot, 6) + 8,
             287, 120, 18, size=11, color=NAVY, bold=True)
    add_rect(slide, 658, 332, 540, 54, NAVY, round_corners=True)
    add_text(slide, ctx["ocio_pct_horas"], 676, 332, 96, 54, size=24, color=GREEN,
             bold=True, font="Aptos Display", anchor=MSO_ANCHOR.MIDDLE)
    add_text(slide, "do custo de sobreaviso vira acionamento — o resto é plantão em espera.",
             776, 332, 406, 54, size=11.5, color=WHITE, anchor=MSO_ANCHOR.MIDDLE)

    # painel C — faixa horária
    add_rect(slide, 56, 416, 1166, 218, WHITE, line=LINE, round_corners=True)
    add_text(slide, "Quando o acionamento realmente acontece — horas por faixa horária",
             78, 430, 800, 18, size=13, color=NAVY, bold=True)
    add_text(slide, "Base para redimensionar a escala: manter plantão onde a demanda existe, "
                    "enxugar nas faixas de baixo acionamento.", 78, 452, 900, 16, size=10.5, color=MUTED)
    faixas = dados["faixa_horaria"]
    maxh = max(f["horas"] for f in faixas) or 1
    total_faixa = sum(f["horas"] for f in faixas) or 1
    fy = 486
    for f in faixas:
        hbar(slide, f["faixa"], f"{f['horas']:.0f} h", 78, fy, 96, 470, f["horas"] / maxh,
             color=BLUE if f["horas"] < maxh else NAVY)
        add_text(slide, pct(f["horas"] / total_faixa), 748, fy - 2, 70, 16, size=10.5,
                 color=MUTED, bold=True)
        fy += 34

    # insight lateral
    add_rect(slide, 930, 486, 268, 130, WASH, round_corners=True)
    add_text(slide, "POR QUE IMPORTA", 950, 498, 230, 14, size=10, color=BLUE, bold=True)
    add_text(slide, fmt(s["insight"], ctx), 950, 516, 232, 96, size=10.5, color=INK,
             line_spacing=1.08)

    add_notes(slide, "SLIDE 2 — CAUSA/ondе (ociosidade). HC/dia e horas de espera x acionamento; "
                     "faixa horária orienta o redimensionamento. Números do JSON (ociosidade, faixa_horaria).")


def slide3(prs, dados, nar, ctx, blank):
    slide = prs.slides.add_slide(blank)
    s = nar["s3"]
    chrome(slide, 3, 4, fmt(nar["fonte"], ctx))
    title_block(slide, fmt(s["eyebrow"], ctx), fmt(s["titulo"], ctx), title_size=27)

    gas = dados["sobreaviso_por_ga"][:8]
    maxt = max(g["horas_total"] for g in gas) or 1

    # ranking à esquerda (barras empilhadas espera+acionamento)
    add_text(slide, "Horas de sobreaviso por Área de Gestão (GA)", 56, 152, 620, 18,
             size=13, color=NAVY, bold=True)
    add_text(slide, "Barra = espera + acionamento · maior no topo",
             56, 174, 620, 14, size=10, color=MUTED)
    y = 202
    barmax = 380
    for g in gas:
        add_text(slide, encurtar_nome(g["gestor"]), 56, y - 2, 170, 16, size=10.5, color=INK)
        w_tot = barmax * g["horas_total"] / maxt
        w_esp = w_tot * (g["horas_espera"] / g["horas_total"] if g["horas_total"] else 0)
        add_rect(slide, 232, y, max(w_tot, 3), 15, BLUE_MID)
        add_rect(slide, 232, y, max(w_esp, 2), 15, NAVY)
        add_text(slide, f"{g['horas_total']:.0f} h", 232 + max(w_tot, 3) + 8, y - 2, 70, 16,
                 size=10.5, color=INK, bold=True)
        y += 30

    # legenda mini
    add_rect(slide, 232, y + 4, 11, 11, NAVY)
    add_text(slide, "espera", 248, y + 2, 70, 14, size=9.5, color=MUTED)
    add_rect(slide, 312, y + 4, 11, 11, BLUE_MID)
    add_text(slide, "acionamento", 328, y + 2, 100, 14, size=9.5, color=MUTED)

    # painel direito — Pareto + tabela
    add_rect(slide, 700, 150, 522, 150, NAVY, round_corners=True)
    add_text(slide, "CONCENTRAÇÃO", 722, 166, 300, 14, size=10.5, color="9FC9EE", bold=True)
    add_text(slide, ctx["top3_ga_pct"], 722, 186, 160, 48, size=38, color=GREEN,
             bold=True, font="Aptos Display")
    add_text(slide, fmt(s["callout"], ctx), 722, 240, 480, 50, size=12, color=WHITE,
             line_spacing=1.06)

    # tabela top GAs
    top = dados["sobreaviso_por_ga"][:6]
    table = add_table(slide, len(top) + 1, 4, 700, 320, 522, 300, [230, 88, 100, 104])
    cabec = ["Área de gestão (GA)", "Técnicos", "Horas", "% acion."]
    for c, h in enumerate(cabec):
        set_cell(table.cell(0, c), [(h, {"size": 10.5, "bold": True, "color": WHITE})],
                 fill=NAVY, anchor=MSO_ANCHOR.MIDDLE)
    for r, g in enumerate(top, start=1):
        pac = g["horas_acionamento"] / g["horas_total"] if g["horas_total"] else 0
        fill = WHITE if r % 2 else WASH
        set_cell(table.cell(r, 0), [(encurtar_nome(g["gestor"], 3), {"size": 10.5})], fill=fill)
        set_cell(table.cell(r, 1), [(f"{g['tecnicos']}", {"size": 10.5, "align": PP_ALIGN.CENTER})], fill=fill)
        set_cell(table.cell(r, 2), [(f"{g['horas_total']:.0f} h", {"size": 10.5, "align": PP_ALIGN.CENTER, "bold": True})], fill=fill)
        set_cell(table.cell(r, 3), [(pct(pac), {"size": 10.5, "align": PP_ALIGN.CENTER,
                 "color": GREEN_DARK if pac >= 0.3 else RED})], fill=fill)

    add_notes(slide, "SLIDE 3 — CAUSA/quem (por GA). Ranking de horas de sobreaviso por gestor, "
                     "espera x acionamento, e a concentração nas 3 primeiras áreas. Do JSON (sobreaviso_por_ga).")


def slide4(prs, dados, nar, ctx, blank):
    slide = prs.slides.add_slide(blank)
    s = nar["s4"]
    chrome(slide, 4, 4, fmt(nar["fonte"], ctx))
    title_block(slide, fmt(s["eyebrow"], ctx), fmt(s["titulo"], ctx), title_size=27)

    # comparativo Orçado -> Proposta
    add_rect(slide, 56, 150, 360, 150, WHITE, line=LINE, round_corners=True)
    add_text(slide, "DO ORÇADO À PROPOSTA", 76, 162, 320, 14, size=10.5, color=BLUE, bold=True)
    add_text(slide, "Orçado do ciclo", 76, 188, 200, 16, size=11, color=MUTED)
    add_text(slide, ctx["orcado"], 76, 204, 320, 22, size=17, bold=True, color=INK)
    add_text(slide, "Proposta · −50%", 76, 234, 200, 16, size=11, color=MUTED)
    add_text(slide, ctx["meta"], 76, 250, 240, 28, size=21, bold=True, color=GREEN_DARK,
             font="Aptos Display")
    add_rect(slide, 300, 250, 96, 26, "E8F6EC", round_corners=True)
    add_text(slide, f"−{ctx['gap']}", 300, 250, 92, 26, size=11, bold=True, color=GREEN_DARK,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

    # alavancas
    ax = 436
    for al in s["alavancas"]:
        add_rect(slide, ax, 150, 256, 150, WASH, round_corners=True)
        add_text(slide, al["n"], ax + 18, 162, 60, 30, size=22, color=GREEN_DARK, bold=True, font="Aptos Display")
        add_text(slide, fmt(al["t"], ctx), ax + 18, 196, 224, 40, size=12, color=NAVY, bold=True, line_spacing=1.03)
        add_text(slide, fmt(al["d"], ctx), ax + 18, 236, 224, 58, size=9.5, color=INK, line_spacing=1.05)
        ax += 262

    # tabela FCA
    add_text(slide, "FCA — Fato · Causa · Ação", 56, 320, 600, 18, size=12.5, color=NAVY, bold=True)
    fca = s["fca"]
    table = add_table(slide, len(fca) + 1, 6, 56, 344, 1166, 288,
                      [250, 300, 316, 110, 150, 40])
    cab = ["Fato", "Causa", "Ação", "Prazo", "Responsável", ""]
    for c, h in enumerate(cab):
        set_cell(table.cell(0, c), [(h, {"size": 10.5, "bold": True, "color": WHITE})],
                 fill=NAVY, anchor=MSO_ANCHOR.MIDDLE)
    cores_status = {"urgent": (RED, "Imediato"), "start": (BLUE, "A iniciar"),
                    "watch": (WARN, "Atenção"), "validate": (AMBER, "Validar")}
    for r, item in enumerate(fca, start=1):
        fill = WHITE if r % 2 else WASH
        set_cell(table.cell(r, 0), [(fmt(item["fato"], ctx), {"size": 10, "bold": True, "color": NAVY})], fill=fill, anchor=MSO_ANCHOR.TOP)
        set_cell(table.cell(r, 1), [(fmt(item["causa"], ctx), {"size": 9.5})], fill=fill, anchor=MSO_ANCHOR.TOP)
        set_cell(table.cell(r, 2), [(fmt(item["acao"], ctx), {"size": 9.5})], fill=fill, anchor=MSO_ANCHOR.TOP)
        set_cell(table.cell(r, 3), [(fmt(item["prazo"], ctx), {"size": 9.5, "bold": True})], fill=fill, anchor=MSO_ANCHOR.TOP)
        set_cell(table.cell(r, 4), [(fmt(item["resp"], ctx), {"size": 9.5})], fill=fill, anchor=MSO_ANCHOR.TOP)
        cor, rotulo = cores_status.get(item.get("status", "start"), (BLUE, "A iniciar"))
        set_cell(table.cell(r, 5), [("●", {"size": 12, "color": cor, "align": PP_ALIGN.CENTER})],
                 fill=fill, anchor=MSO_ANCHOR.MIDDLE)

    add_notes(slide, "SLIDE 4 — AÇÃO (proposta + FCA). Orçado->Proposta (-50%), 3 alavancas e a "
                     "tabela FCA. Edite textos em narrativa_<regiao>.json (s4).")


# ------------------------------------------------------------------- contexto
def montar_contexto(dados, nar):
    m = dados["meta"]
    ro = dados["real_orcado_mes"]
    cesta = dados["cesta"]
    total_cesta = cesta_get(cesta, "Total") or sum(
        v for k, v in cesta.items() if str(k).lower() != "total")
    sobreaviso = (cesta_get(cesta, "ACIONAMENTO SOBRE AVISO") or 0) + (cesta_get(cesta, "ESPERA SOBRE AVISO") or 0)
    dsr = cesta_get(cesta, "DSR") or 0
    real = ro["real"]
    orcado = m["orcado_mes"]
    meta_val = m["meta_mes"]
    gap = real - meta_val
    o = dados["ociosidade"]
    ga = dados["sobreaviso_por_ga"]
    tot_ga = sum(g["horas_total"] for g in ga) or 1
    top3 = sum(g["horas_total"] for g in ga[:3]) / tot_ga

    ctx = {
        "regiao": nar["regiao"], "codigo": nar["codigo"],
        "mes_foto": nar["mes_foto"], "data_foto": nar["data_foto"],
        "orcado": moeda(orcado), "meta": moeda(meta_val), "real": moeda(real),
        "meta_val": meta_val,
        "gap": moeda(gap), "gap_pct": pct(gap / real if real else 0),
        "var_orcado": pct(abs((real - orcado) / orcado) if orcado else 0) + (" abaixo" if real < orcado else " acima"),
        "sobreaviso": moeda(sobreaviso), "sobreaviso_pct": pct(sobreaviso / total_cesta if total_cesta else 0),
        "dsr_pct": pct(dsr / total_cesta if total_cesta else 0),
        "ocio_hc_espera": f"{o['hc_espera_medio']:.1f}".replace(".", ","),
        "ocio_hc_acion": f"{o['hc_acionado_medio']:.1f}".replace(".", ","),
        "ocio_pct_hc": pct(o.get("pct_acionamento_hc")),
        "ocio_horas_espera": f"{o['horas_espera_total']:,.0f} h".replace(",", "."),
        "ocio_horas_acion": f"{o['horas_acionamento_total']:,.0f} h".replace(",", "."),
        "ocio_pct_horas": pct(o.get("pct_horas_acionamento")),
        "top3_ga_pct": pct(top3),
    }

    # faixa horária de maior/menor acionamento (data-driven, já ordenada desc)
    faixas = dados.get("faixa_horaria") or []
    if faixas:
        tot_f = sum(f["horas"] for f in faixas) or 1
        ctx["faixa_top"] = faixas[0]["faixa"]
        ctx["faixa_top_pct"] = pct(faixas[0]["horas"] / tot_f)
        ctx["faixa_baixas"] = " e ".join(f["faixa"].lower() for f in faixas[-2:])
    else:
        ctx["faixa_top"] = ctx["faixa_top_pct"] = ctx["faixa_baixas"] = "—"
    return ctx


def main():
    ap = argparse.ArgumentParser(description="Monta o PPTX de Custo de Horas (Alloha).")
    ap.add_argument("--regiao", required=True, help="Slug, ex.: ceara. Usa dados_<slug>.json e narrativa_<slug>.json.")
    ap.add_argument("--dados", default=None)
    ap.add_argument("--narrativa", default=None)
    ap.add_argument("--saida", default=None)
    args = ap.parse_args()

    dados_path = Path(args.dados) if args.dados else ROOT / "outputs" / "horas" / f"dados_{args.regiao}.json"
    nar_path = Path(args.narrativa) if args.narrativa else ROOT / "docs" / "horas" / f"narrativa_{args.regiao}.json"
    dados = json.loads(dados_path.read_text(encoding="utf-8"))
    nar = json.loads(nar_path.read_text(encoding="utf-8"))
    ctx = montar_contexto(dados, nar)

    prs = Presentation()
    prs.slide_width = px(1280)
    prs.slide_height = px(720)
    blank = prs.slide_layouts[6]
    slide1(prs, dados, nar, ctx, blank)
    slide2(prs, dados, nar, ctx, blank)
    slide3(prs, dados, nar, ctx, blank)
    slide4(prs, dados, nar, ctx, blank)

    slug = "".join(c for c in unicodedata.normalize("NFKD", args.regiao)
                   if not unicodedata.combining(c)).replace(" ", "_")
    saida = Path(args.saida) if args.saida else ROOT / "outputs" / "horas" / f"Horas_{slug.capitalize()}_Executivo.pptx"
    saida.parent.mkdir(parents=True, exist_ok=True)
    prs.save(str(saida))
    print(f"OK -> {saida}")


if __name__ == "__main__":
    main()
