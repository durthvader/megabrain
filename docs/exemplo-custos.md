# Exemplo completo: redução de custos operacionais

Cenário real: a companhia precisa reduzir banco de horas, hora extra, sobreaviso, acionamento em sobreaviso e adicional noturno. O Megabrain consolida as bases e aponta os ofensores.

## 1. Criar a demanda

**Demandas → Nova demanda**
- Nome: `Redução de custos Q3`
- Tipo: `custos`
- Período: o trimestre em análise

## 2. Subir as bases

**Upload de bases.** Duas formas aceitas:

**a) Uma base única** com tipo `custos` e a coluna `tipo_custo` preenchida por linha:

| Colunas esperadas |
|---|
| `tecnico`, `supervisor`, `empresa`, `cidade`, `regional`, `data`, `tipo_custo`, `quantidade_horas`, `valor`, `observacao` |

**b) Bases separadas** por tipo: `horas_extras`, `banco_horas`, `sobreaviso`, `adicional_noturno` — o painel infere o `tipo_custo` a partir do tipo da base quando a coluna não existir.

Valores em formato brasileiro (`1.234,56`) são convertidos automaticamente. Os tipos são normalizados para: `hora_extra`, `banco_horas`, `sobreaviso`, `acionamento_sobreaviso`, `adicional_noturno`, `outros`.

## 3. Analisar no painel

**Custos → selecionar a demanda:**

- **Cards:** total por tipo de custo + técnico e supervisor ofensores nº 1;
- **Gráficos:** custo por tipo, por supervisor (top 10), por empresa, por técnico (top 10) e evolução mensal;
- **Tabela de ofensores:** top 15 técnicos com horas, registros, valor e % do total;
- **Filtros:** período, regional, cidade, empresa, supervisor, técnico e tipo de custo.

Sem demanda selecionada (ou sem dados), o painel mostra **dados simulados** com selo indicativo — útil para conhecer o layout.

## 4. Aprofundar com o Codex

Use o prompt 4 de [prompts-codex.md](prompts-codex.md) para investigar padrões (fim de semana? uma rota específica? sobreaviso acionado demais?). Registre as conclusões em **Análises**.

## 5. Plano de ação e encerramento

1. Em **Análises**, botão *Transformar sugestão em plano de ação* — ou crie direto em **Planos de ação** (tema, problema, causa, ação, responsável, prazo, impacto esperado).
2. Acompanhe os status (`pendente → em_andamento → concluido`).
3. **Exportar CSV** dos registros filtrados.
4. Exporte → limpe → arquive a demanda.

## Testar sem dados reais

`sql/005_dados_exemplo.sql` cria a demanda `DEMO — Redução de custos operacionais` com 12 lançamentos nos últimos 3 meses, incluindo um ofensor claro de hora extra, além de uma análise e um plano de exemplo.
