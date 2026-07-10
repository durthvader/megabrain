"""Extrai os exports do Power BI do HUB de Horas Extras para um JSON normalizado.

Camada 1 da máquina (extrator). Lê uma pasta de regional cujas SUBPASTAS são os
assuntos do HUB (sobreaviso, horaextra, feriados, bancodehoras, sintetico,
analitogeral, "infração de ponto") e produz outputs/horas/dados_<regiao>.json.

O montador (build_horas.py) consome esse JSON. Trocar de regional / atualizar a
foto = reapontar --pasta e rodar de novo. Nenhum número é digitado à mão.

Uso:
    python scripts/horas/extrair_horas.py --pasta "C:/.../hubhoras/ce" --regiao ceara
"""

from __future__ import annotations

import argparse
import json
import unicodedata
from datetime import datetime, time
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[2]

MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho",
         "agosto", "setembro", "outubro", "novembro", "dezembro"]


# ----------------------------------------------------------------- utilidades
def norm(value) -> str:
    """minúsculas, sem acento, sem espaço duplo — para casar cabeçalhos/nomes."""
    if value is None:
        return ""
    text = str(value).strip().lower()
    text = "".join(c for c in unicodedata.normalize("NFKD", text)
                   if not unicodedata.combining(c))
    return " ".join(text.split())


# índices de mês insensíveis a acento ("março" -> "marco"); canoniza para exibição
MES_ORD = {norm(m): i for i, m in enumerate(MESES)}
MES_CANON = {norm(m): m for m in MESES}


def mes_chave(cell):
    """Retorna (índice, nome canônico) do mês, ou (None, None) se não for mês."""
    k = norm(cell)
    return (MES_ORD.get(k), MES_CANON.get(k))


def num(value):
    """string/float do Power BI -> float; vazio/NaN -> None."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    if text == "" or text.lower() == "nan":
        return None
    text = text.replace(" ", "").replace(" ", "")
    # export vem en-US (ponto decimal); tolera vírgula decimal por segurança
    if "," in text and "." not in text:
        text = text.replace(",", ".")
    try:
        return float(text)
    except ValueError:
        return None


def to_minutes(value):
    """HORA_INICIO / HORA_FIM -> minutos do dia. Aceita time, datetime, 'HH:MM(:SS)'."""
    if value is None or value == "":
        return None
    if isinstance(value, time):
        return value.hour * 60 + value.minute
    if isinstance(value, datetime):
        return value.hour * 60 + value.minute
    parts = str(value).strip().split(":")
    try:
        h = int(parts[0]); m = int(parts[1]) if len(parts) > 1 else 0
        return h * 60 + m
    except (ValueError, IndexError):
        return None


class Pasta:
    """Localiza e lê os xlsx da regional, tolerante a nome/acentos/sufixo '(1)'."""

    def __init__(self, raiz: Path):
        self.raiz = raiz
        # LISTA (não dict): "Relatório Analítico" existe em várias subpastas e
        # colidiria num dict keyed por nome. Guardamos todos os caminhos.
        self.arquivos = sorted(raiz.rglob("*.xlsx"))

    def achar(self, *tokens, sub=None):
        alvo = [norm(t) for t in tokens]
        candidatos = []
        for caminho in self.arquivos:
            if sub and norm(sub) not in norm(caminho.parent.name):
                continue
            chave = norm(caminho.stem)
            if all(t in chave for t in alvo):
                candidatos.append(caminho)
        # prefere o nome mais curto (sem sufixos como "(1)") quando ambíguo
        candidatos.sort(key=lambda p: len(p.stem))
        return candidatos

    def grade(self, caminho: Path):
        wb = openpyxl.load_workbook(caminho, data_only=True)
        ws = wb.active
        return [list(r) for r in ws.iter_rows(values_only=True)]


def achar_cabecalho(linhas, *obrigatorios):
    """Índice da linha de cabeçalho: 1ª que casa todos os tokens em células curtas.

    Ignora a legenda 'Filtros aplicados: ...' (frase longa que pode conter, por
    acaso, palavras como 'Gerente' ou 'Mês') e só aceita match em células de
    cabeçalho de verdade (texto curto).
    """
    alvo = [norm(t) for t in obrigatorios]
    for i, linha in enumerate(linhas):
        celulas = [norm(c) for c in linha]
        if celulas and celulas[0].startswith("filtros aplicados"):
            continue
        if all(any(t in c and len(c) <= 40 for c in celulas) for t in alvo):
            return i
    return None


def coluna(cabecalho, *nomes):
    alvo = [norm(n) for n in nomes]
    for i, celula in enumerate(cabecalho):
        cn = norm(celula)
        if any(t == cn or (t and t in cn) for t in alvo):
            return i
    return None


# --------------------------------------------------------------- parsers
def parse_cesta(pasta: Pasta):
    """IMPACTO R$ (~): componentes da cesta do mês-foto."""
    achados = pasta.achar("impacto", sub="horaextra") or pasta.achar("impacto")
    if not achados:
        return None
    linhas = pasta.grade(achados[0])
    # linha 0 = super-cabeçalho com os grupos; escolhe a linha de total
    grupos = [str(c).strip() if c else "" for c in linhas[0]]
    alvo = None
    for linha in linhas[1:]:
        c0, c1 = norm(linha[0]) if linha else "", norm(linha[1]) if len(linha) > 1 else ""
        if "r6" in c1 or "total" in c1 or (c0 == "total"):
            alvo = linha
            if "r6" in c1:  # prioriza a linha da própria SUB BU
                break
    if alvo is None:
        return None
    cesta = {}
    for i, g in enumerate(grupos):
        if g and norm(g) not in ("grupo", "bu", "sub bu") and num(alvo[i]) is not None:
            cesta[g] = num(alvo[i])
    return cesta


def parse_real_orcado_mes(pasta: Pasta):
    """REAL x ORÇADO (valor único do mês-foto): Real, Orçado, Var."""
    for cam in pasta.achar("real", "orcado", sub="horaextra") + pasta.achar("projecao", sub="horaextra"):
        linhas = pasta.grade(cam)
        h = achar_cabecalho(linhas, "real", "var") or achar_cabecalho(linhas, "previsao", "var")
        if h is None:
            continue
        cab = linhas[h]
        ir = coluna(cab, "real", "previsao")
        io = coluna(cab, "orcado")
        iv = coluna(cab, "var")
        # pega a linha da SUB BU alvo (a que tem Real preenchido)
        melhor = None
        for linha in linhas[h + 1:]:
            r = num(linha[ir]) if ir is not None else None
            if r is not None:
                melhor = linha
                sub = norm(linha[1]) if len(linha) > 1 else ""
                if "r6" in sub or "ceara" in sub:
                    break
        if melhor is not None:
            return {"real": num(melhor[ir]),
                    "orcado": num(melhor[io]) if io is not None else None,
                    "var": num(melhor[iv]) if iv is not None else None}
    return None


def parse_serie_total(pasta: Pasta):
    """Série mensal do custo total: Real 2026, Orçado e (se houver) Real 2025."""
    cands = pasta.achar("real", "orcado", sub="horaextra") + pasta.achar("realizado", "orcado", sub="horaextra")
    for cam in cands:
        linhas = pasta.grade(cam)
        h = achar_cabecalho(linhas, "mes", "orcado")
        if h is None:
            continue
        cab = linhas[h]
        im = coluna(cab, "mes", "date - mes")
        ir = coluna(cab, "totalvalorhorasreal", "realizado", "real 2026")
        io = coluna(cab, "orcado")
        i25 = coluna(cab, "real 2025", "2025")
        serie = []
        for linha in linhas[h + 1:]:
            cell = linha[im] if im is not None and im < len(linha) else None
            idx, nome = mes_chave(cell)
            if idx is None:
                continue
            item = {"mes": nome,
                    "real": num(linha[ir]) if ir is not None else None,
                    "orcado": num(linha[io]) if io is not None else None}
            if i25 is not None and i25 < len(linha):
                item["real_2025"] = num(linha[i25])
            serie.append((idx, item))
        if serie:
            serie.sort(key=lambda x: x[0])
            return [it for _, it in serie]
    return None


def parse_serie_sobreaviso(pasta: Pasta):
    """Série mensal do sobreaviso (Acionamento+Espera): Real vs Orçado."""
    for cam in pasta.achar("realizado", "orcado", sub="sobreaviso") + pasta.achar("real", "orcado", sub="sobreaviso"):
        linhas = pasta.grade(cam)
        h = achar_cabecalho(linhas, "mes", "orcado")
        if h is None:
            continue
        cab = linhas[h]
        im, ir, io = coluna(cab, "mes"), coluna(cab, "totalvalorhorasreal", "realizado"), coluna(cab, "orcado")
        serie = []
        for linha in linhas[h + 1:]:
            cell = linha[im] if im is not None and im < len(linha) else None
            idx, nome = mes_chave(cell)
            if idx is None:
                continue
            serie.append((idx, {"mes": nome,
                                "real": num(linha[ir]) if ir is not None else None,
                                "orcado": num(linha[io]) if io is not None else None}))
        if serie:
            serie.sort(key=lambda x: x[0])
            return [it for _, it in serie]
    return None


def parse_faixa_horaria(pasta: Pasta):
    """Horas de acionamento por faixa horária (Dia/Tarde/Noite/Madrugada)."""
    achados = pasta.achar("faixa", sub="sobreaviso")
    if not achados:
        return None
    linhas = pasta.grade(achados[0])
    h = achar_cabecalho(linhas, "faixa")
    if h is None:
        return None
    cab = linhas[h]
    i_f, i_h = coluna(cab, "faixa"), coluna(cab, "totalhoras", "horas")
    out = []
    for linha in linhas[h + 1:]:
        f = linha[i_f] if i_f is not None and i_f < len(linha) else None
        v = num(linha[i_h]) if i_h is not None and i_h < len(linha) else None
        if f and v is not None:
            out.append({"faixa": str(f).strip(), "horas": v})
    out.sort(key=lambda x: -x["horas"])
    return out or None


def parse_ociosidade(pasta: Pasta, por_ga=None):
    """Ociosidade do sobreaviso: HC/horas em espera vs efetivamente acionados.

    Horas totais vêm da soma do analítico nominal (mesma fonte do slide por GA),
    o que é consistente e bate com a faixa horária de acionamento.
    """
    resultado = {}

    if por_ga:
        te = round(sum(g["horas_espera"] for g in por_ga), 1)
        ta = round(sum(g["horas_acionamento"] for g in por_ga), 1)
        if te or ta:
            resultado["horas_espera_total"] = te
            resultado["horas_acionamento_total"] = ta
            resultado["pct_horas_acionamento"] = round(ta / (te + ta), 4) if (te + ta) else None

    # headcount por dia: Escala VS Acionamento de Sobreaviso por Dia (contagem)
    for cam in pasta.achar("escala", "acionamento", sub="sobreaviso"):
        linhas = pasta.grade(cam)
        h = achar_cabecalho(linhas, "counthc") or achar_cabecalho(linhas, "hcespera")
        if h is None:
            continue
        cab = linhas[h]
        ie = coluna(cab, "counthcespera", "hcespera")
        ia = coluna(cab, "counthcaciona", "hcaciona")
        esp, aci = [], []
        for linha in linhas[h + 1:]:
            e = num(linha[ie]) if ie is not None and ie < len(linha) else None
            a = num(linha[ia]) if ia is not None and ia < len(linha) else None
            if e is not None:
                esp.append(e)
            if a is not None:
                aci.append(a)
        if esp:
            resultado["hc_espera_medio"] = round(sum(esp) / len(esp), 1)
            resultado["hc_acionado_medio"] = round(sum(aci) / len(aci), 1) if aci else None
            resultado["dias"] = len(esp)
            if resultado.get("hc_espera_medio"):
                resultado["pct_acionamento_hc"] = round(
                    (resultado.get("hc_acionado_medio") or 0) / resultado["hc_espera_medio"], 4)
        break
    return resultado or None


def parse_sobreaviso_por_ga(pasta: Pasta):
    """Agrega horas de sobreaviso por GESTOR (GA) a partir do analítico nominal."""
    achados = pasta.achar("analitico", sub="sobreaviso") or pasta.achar("analitico", sub="sobreaviso")
    if not achados:
        return None
    linhas = pasta.grade(achados[0])
    h = achar_cabecalho(linhas, "gestor", "hora_inicio") or achar_cabecalho(linhas, "gestor")
    if h is None:
        return None
    cab = linhas[h]
    ig = coluna(cab, "gestor")
    it = coluna(cab, "tipo_ocorrencia", "tipo")
    ini = coluna(cab, "hora_inicio")
    fim = coluna(cab, "hora_fim")
    ifu = coluna(cab, "funcid")
    agg = {}
    for linha in linhas[h + 1:]:
        if ig is None or ig >= len(linha) or not linha[ig]:
            continue
        g = str(linha[ig]).strip()
        d = agg.setdefault(g, {"espera": 0.0, "acionamento": 0.0, "ocorr": 0, "tec": set()})
        mi = to_minutes(linha[ini]) if ini is not None and ini < len(linha) else None
        mf = to_minutes(linha[fim]) if fim is not None and fim < len(linha) else None
        horas = None
        if mi is not None and mf is not None:
            dur = mf - mi
            if dur < 0:
                dur += 24 * 60
            horas = dur / 60.0
        tipo = norm(linha[it]) if it is not None and it < len(linha) else ""
        if "aciona" in tipo:
            d["acionamento"] += horas or 0.0
        else:
            d["espera"] += horas or 0.0
        d["ocorr"] += 1
        if ifu is not None and ifu < len(linha) and linha[ifu]:
            d["tec"].add(str(linha[ifu]))
    saida = [{"gestor": g,
              "horas_espera": round(v["espera"], 1),
              "horas_acionamento": round(v["acionamento"], 1),
              "horas_total": round(v["espera"] + v["acionamento"], 1),
              "ocorrencias": v["ocorr"],
              "tecnicos": len(v["tec"])}
             for g, v in agg.items()]
    saida.sort(key=lambda x: -x["horas_total"])
    return saida or None


def parse_ocorrencias_por_gestor(pasta: Pasta):
    achados = pasta.achar("ocorrencias", "gestor", sub="analitogeral") or pasta.achar("por gestor")
    if not achados:
        return None
    linhas = pasta.grade(achados[0])
    h = achar_cabecalho(linhas, "gerente")
    if h is None:
        return None
    cab = linhas[h]
    ig, ip = coluna(cab, "gerente"), coluna(cab, "%gt", "%", "infracoes")
    out = []
    for linha in linhas[h + 1:]:
        g = linha[ig] if ig is not None and ig < len(linha) else None
        p = num(linha[ip]) if ip is not None and ip < len(linha) else None
        if g and norm(g) != "total" and p is not None:
            out.append({"gerente": str(g).strip(), "pct": round(p, 4)})
    out.sort(key=lambda x: -x["pct"])
    return out or None


def parse_regional_cluster(pasta: Pasta):
    achados = pasta.achar("regional", "cluster", sub="analitogeral")
    if not achados:
        return None
    linhas = pasta.grade(achados[0])
    h = achar_cabecalho(linhas, "regional", "cluster")
    if h is None:
        return None
    cab = linhas[h]
    ir, ic, ip = coluna(cab, "regional"), coluna(cab, "cluster"), coluna(cab, "%", "infracoes")
    out = []
    for linha in linhas[h + 1:]:
        r = linha[ir] if ir is not None and ir < len(linha) else None
        p = num(linha[ip]) if ip is not None and ip < len(linha) else None
        if r and p is not None:
            out.append({"regional": str(r).strip(),
                        "cluster": str(linha[ic]).strip() if ic is not None and ic < len(linha) and linha[ic] else "",
                        "pct": round(p, 4)})
    out.sort(key=lambda x: -x["pct"])
    return out or None


def parse_sintetico_regiao(pasta: Pasta):
    """Linha da SUB BU alvo no sintético: orçado, HE real, HC c/ HE, R$ médio/HC."""
    achados = pasta.achar("analitico", sub="sintetico")
    if not achados:
        return None
    linhas = pasta.grade(achados[0])
    h = achar_cabecalho(linhas, "orcado total", "he real") or achar_cabecalho(linhas, "orcado", "gerente")
    if h is None:
        return None
    cab = linhas[h]
    ish = coluna(cab, "sub bu")
    ige = coluna(cab, "gerente")
    io = coluna(cab, "orcado total", "orcado")
    ihe = coluna(cab, "he real total", "he real")
    ihc = coluna(cab, "hc c/ he", "hc c")
    imd = coluna(cab, "r$ medio por hc", "medio por hc")
    melhor, melhor_he = None, -1
    for linha in linhas[h + 1:]:
        sub = norm(linha[ish]) if ish is not None and ish < len(linha) and linha[ish] else ""
        if sub in ("", "total"):  # ignora a linha de total geral (todas as regiões)
            continue
        he = num(linha[ihe]) if ihe is not None and ihe < len(linha) else None
        if he is not None and he > melhor_he:
            melhor_he, melhor = he, linha
    if melhor is None:
        return None
    return {"sub_bu": str(melhor[ish]).strip() if ish is not None and melhor[ish] else None,
            "gerente": str(melhor[ige]).strip() if ige is not None and melhor[ige] else None,
            "orcado_total": num(melhor[io]) if io is not None else None,
            "he_real_total": melhor_he,
            "hc_c_he": num(melhor[ihc]) if ihc is not None else None,
            "rs_medio_hc": num(melhor[imd]) if imd is not None else None}


# ------------------------------------------------------------------- main
def extrair(pasta_dir: Path, regiao: str, fator_meta: float = 0.5) -> dict:
    pasta = Pasta(pasta_dir)
    dados: dict = {
        "regiao": regiao,
        "cesta": parse_cesta(pasta),
        "real_orcado_mes": parse_real_orcado_mes(pasta),
        "serie_total": parse_serie_total(pasta),
        "serie_sobreaviso": parse_serie_sobreaviso(pasta),
        "faixa_horaria": parse_faixa_horaria(pasta),
        "sobreaviso_por_ga": parse_sobreaviso_por_ga(pasta),
        "ocorrencias_por_gestor": parse_ocorrencias_por_gestor(pasta),
        "regional_cluster": parse_regional_cluster(pasta),
        "sintetico_regiao": parse_sintetico_regiao(pasta),
    }
    dados["ociosidade"] = parse_ociosidade(pasta, dados["sobreaviso_por_ga"])

    # meta = redução de <fator> sobre o orçado do ciclo
    orcado = None
    if dados["real_orcado_mes"] and dados["real_orcado_mes"].get("orcado"):
        orcado = dados["real_orcado_mes"]["orcado"]
    elif dados["sintetico_regiao"] and dados["sintetico_regiao"].get("orcado_total"):
        orcado = dados["sintetico_regiao"]["orcado_total"]
    if orcado:
        dados["meta"] = {"base": "orcado", "fator": fator_meta,
                         "orcado_mes": round(orcado, 2),
                         "meta_mes": round(orcado * (1 - fator_meta), 2)}

    dados["_fonte"] = {"pasta": str(pasta_dir),
                       "arquivos": len(pasta.arquivos),
                       "gerado_em": datetime.now().isoformat(timespec="seconds")}
    return dados


def main():
    ap = argparse.ArgumentParser(description="Extrai o HUB de Horas Extras para JSON normalizado.")
    ap.add_argument("--pasta", required=True, help="Pasta da regional (com as subpastas de assunto).")
    ap.add_argument("--regiao", required=True, help="Slug da regional, ex.: ceara, piaui.")
    ap.add_argument("--fator-meta", type=float, default=0.5, help="Fator de redução da meta (0.5 = -50%).")
    ap.add_argument("--saida", default=None, help="Caminho do JSON de saída.")
    args = ap.parse_args()

    pasta_dir = Path(args.pasta)
    if not pasta_dir.exists():
        raise SystemExit(f"Pasta não encontrada: {pasta_dir}")

    dados = extrair(pasta_dir, args.regiao, args.fator_meta)
    saida = Path(args.saida) if args.saida else ROOT / "outputs" / "horas" / f"dados_{args.regiao}.json"
    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")

    faltando = [k for k, v in dados.items() if v is None and not k.startswith("_")]
    print(f"OK -> {saida}")
    print(f"   arquivos lidos: {dados['_fonte']['arquivos']}")
    if faltando:
        print(f"   ATENCAO campos vazios: {', '.join(faltando)}")


if __name__ == "__main__":
    main()
