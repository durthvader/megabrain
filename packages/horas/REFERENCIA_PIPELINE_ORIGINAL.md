# Custo de Horas — apresentação executiva (Alloha)

Máquina de 2 camadas para gerar o PPTX de **redução de custo de horas** por regional,
a partir dos exports do Power BI (HUB de Horas Extras). Dinâmica dos 4 slides:
**Fato** (indicador) → **Causa** (ociosidade de sobreaviso) → **Causa** (por GA) →
**Ação** (proposta do próximo ciclo + FCA).

Meta padrão: **−50% sobre o orçado do ciclo**.

## Como funciona

```
pasta da regional (exports .xlsx)          projects/horas-<regiao>/content/narrativa.json
  └─ subpastas = assuntos                    (textos: títulos, causas, ações)
     (sobreaviso, horaextra, feriados, …)          │
            │                                       │
            ▼                                       ▼
   extrair_horas.py  ──►  data/processed/dados.json  ──►  build_horas.py  ──►  deliverables/Horas_<Regiao>_Executivo.pptx
        (números)                                 (números + textos)
```

- **`packages/horas/extrair_horas.py`** — lê a pasta de exports e normaliza tudo num JSON
  (`projects/horas-<regiao>/data/processed/dados.json`). Tolera acento/cp1252, cabeçalho na linha 1 ou 3,
  legenda "Filtros aplicados", número como texto e nomes de arquivo com sufixo "(1)".
- **`projects/horas-<regiao>/content/narrativa.json`** — só os **textos** (títulos, decisão, causas, ações,
  FCA). Números aparecem como `{tokens}` (ex.: `{meta}`, `{sobreaviso_pct}`) e são preenchidos
  automaticamente na hora de montar. Editar aqui é seguro: não mexe em número.
- **`packages/horas/build_horas.py`** — junta JSON + narrativa e gera o `.pptx` no padrão Alloha.

## Atualizar a foto (mesma regional, base nova)

Semana que vem, com os `.xlsx` atualizados na mesma pasta:

```bash
python packages/horas/extrair_horas.py --pasta "C:/.../hubhoras/ce" --regiao ceara
python packages/horas/build_horas.py --regiao ceara
```

Pronto — números atualizados, textos preservados. Ajuste a `data_foto`/`mes_foto` na narrativa
se quiser refletir a nova data.

## Nova regional (ex.: Piauí)

```bash
# 1. crie o sandbox e copie os textos
Copy-Item projects/horas-ceara/content/narrativa.json projects/horas-piaui/content/narrativa.json
#    (troque regiao, codigo, data_foto e revise títulos/causas/ações)

# 2. extraia os dados da pasta da nova regional
python packages/horas/extrair_horas.py --pasta "C:/.../hubhoras/pi" --regiao piaui

# 3. monte
python packages/horas/build_horas.py --regiao piaui
```

As apresentações são **independentes** — cada regional tem seu sandbox com
`data/processed/dados.json`, `content/narrativa.json` e `deliverables/`.

## Conferir o resultado (renderizar em PNG)

Sem abrir o PowerPoint na mão:

```powershell
$ppt = New-Object -ComObject PowerPoint.Application
$pres = $ppt.Presentations.Open("...\Horas_Ceara_Executivo.pptx", $true, $false, $false)
$pres.Export("...\render", "PNG", 1600, 900); $pres.Close(); $ppt.Quit()
```

## O que cada slide usa dos dados

| Slide | Conteúdo | Campos do JSON |
|-------|----------|----------------|
| 1 · Indicador | Orçado × Meta × Real, série mensal, composição da cesta | `real_orcado_mes`, `meta`, `serie_total`, `cesta` |
| 2 · Ociosidade | HC/dia e horas em espera × acionamento, faixa horária | `ociosidade`, `faixa_horaria` |
| 3 · Por GA | Ranking de horas de sobreaviso por gestor, concentração | `sobreaviso_por_ga` |
| 4 · Proposta + FCA | Orçado→Proposta, alavancas, tabela FCA | `meta` + narrativa (`s4`) |

> Flag opcional `--fator-meta 0.5` no extrator controla a redução (0.5 = −50%).
