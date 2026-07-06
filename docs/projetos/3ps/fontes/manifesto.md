# Projeto 3Ps — Manifesto de fontes

## Fonte principal

- **Arquivo:** `Tecnicos B2C sem produção em Maio.26 - Até 22.05 - Versao Daily 1.xlsx`
- **Papel:** arquivo principal da análise e da apresentação executiva.
- **Tamanho:** 211.573 bytes.
- **SHA-256:** `4b56b2b81f4935125cfe74fa16d62343b9a82f8249cd3622e5b9f9efa91bd31d`
- **Abas:** 13.
- **Data da incorporação:** 06/07/2026.

## Persistência no Megabrain

- **Demanda:** `3Ps`
- **ID da demanda:** `cc16c475-4a95-4597-9f56-455642c59aac`
- **Status:** ativa.
- **Início:** 06/07/2026.

### Base bruta

- **ID:** `f54285e5-d5cf-4317-a9c3-fc9b31c27a69`
- **Linhas armazenadas:** 577.
- **Colunas máximas:** 98.
- **Conteúdo:** valores calculados e fórmulas de todas as 13 abas, preservados por aba e linha.
- **Arquivo original no Storage:** `indicadores/3ps/4b56b2b81f49_Tecnicos_B2C_sem_produ_o_em_Maio.26_-_At_22.05_-_Versao_Daily_1.xlsx`

### Base analítica Ceará

- **ID:** `b84703a6-7167-48ec-a224-32c7045d6945`
- **Linhas armazenadas:** 310.
- **Escopo:** Ceará, com C.26 Ceará Interior e C.27 Fortaleza.
- **Conteúdo:** indicadores executivos, presença diária, histórico de backlog e acompanhamento B2C dos técnicos.
- **Filtro B2C:** registros explicitamente marcados como B2B foram mantidos apenas na base bruta e excluídos da camada analítica.

## Abas incorporadas

1. Sem Produção
2. DIN
3. novo
4. painel
5. painel produtividade
6. produtividade
7. presença
8. hist Backlog
9. Versão Daily
10. Planilha4
11. Análise Final
12. BI
13. Just Operações

## Leitura preliminar da S27

| Cluster | Presença | Produção até 59d | Produção 60–89d | Produção acima de 90d | Prazo 24h |
|---|---:|---:|---:|---:|---:|
| C.26 Ceará Interior | 102,5% | sem dado | 3,11 | 3,26 | 85,2% |
| C.27 Fortaleza | 94,5% | 2,40 | 2,50 | 3,10 | 83,2% |
| Meta | 95,0% | 3,00 | 3,50 | 4,00 | 85,0% |

### Implicação executiva preliminar

- **C.27 Fortaleza:** fora da meta nos três Ps; é a prioridade principal do diagnóstico e do FCA.
- **C.26 Ceará Interior:** Presença acima da meta, Prazo apenas 0,2 p.p. acima da meta e Produção abaixo da meta nas faixas com dados da S27.
- A S27 de Produção em C.26 não apresenta valor para técnicos com até 59 dias; isso deve ser tratado como ausência de dado, não como zero.

## Alertas de qualidade da fonte

- O workbook contém 105 fórmulas com vínculo externo ao arquivo `[1]RH`; os valores calculados em cache foram preservados na importação.
- Há erros `#VALUE!` em cálculos de duração de linhas sem datas completas nas abas de acompanhamento. Eles não foram utilizados nos indicadores executivos.
- Há um `#DIV/0!` no Mato Grosso do Sul; está fora do escopo Ceará.
- O histórico de presença usa planejamento estático por cluster e inclui finais de semana e feriado. A apresentação deve utilizar o indicador executivo já consolidado da aba `painel` para comparação com a meta de 95%.
- As causas apontadas em observações — ferramental, estoque, treinamento, operação assistida e RH — permanecem como hipóteses até o cruzamento com as próximas bases e validação dos gestores.

### Correção — fila/estoque de 06/07 estava atribuída ao cluster errado

A análise e a apresentação inicial (06/07) atribuíam 1,125 dia de fila ao C.26 Ceará Interior e 0,820 dia ao C.27 Fortaleza. Ao reconciliar com o registro bruto (`base_linhas`, base `b84703a6-7167-48ec-a224-32c7045d6945`, tipo `backlog_diario`, fonte `hist Backlog!CT24`/`CT25`), os dois valores estavam trocados entre os clusters:

- `cluster_codigo: "C.26"`, `cluster: "Ceara Interior"` → `valor: 0,8198` → `status_meta: "atingida"`.
- `cluster_codigo: "C.27"`, `cluster: "Fortaleza"` → `valor: 1,1250` → `status_meta: "abaixo"`.

Ou seja, **C.27 Fortaleza é quem estourou o limite de 1 dia**, e **C.26 Interior está dentro do limite**. Corrigido em 06/07 em todos os materiais (análise executiva, portal e PPTX). Os demais indicadores (Presença, Produção, Prazo, via `indicador_executivo`) foram conferidos contra a mesma base e batem com o que já estava publicado — o erro estava isolado ao backlog.

## Fontes complementares de produtividade

As cinco fontes abaixo foram incorporadas em 06/07/2026. Todas estão filtradas para R6 Ceará e usam o período de 01/07/2026 a 03/07/2026, embora o arquivo de share identifique o recorte como S27.

| Fonte | SHA-256 | Base bruta | Linhas armazenadas |
|---|---|---|---:|
| Analítico Nominal por Quartil de Produtividade 11 OK dos Técnicos — Período Filtrado | `fd13a13bc48cf5153cad0b47b18753c7d1375a2e254154ddd5b46ecf4affb686` | `3b78129e-b0ed-4ed7-8138-8d2bfbaf2dbf` | 130 |
| Share por Quartil de Produtividade 11 OK dos Técnicos — WoW | `56d9308519799c959e2b40d9732c4d697dee71553bec605a00240e9765966994` | `d0ca6213-6bae-4f3e-b346-f84cba9c3867` | 7 |
| Analítico Acompanhamento Técnicos | `f4f4868aa6a576049192fbe96eb6cc3976fc2d284596368ae2ad33832156ef26` | `6c664d01-1988-47c7-89c5-68d1cc2171c8` | 493 |
| Analítico Nominal — Período Filtrado | `d56bbb680e4a19a97f2d413bca674db2ba0aab18350e66bee3d2ef63cde673a8` | `dbcc83af-9e02-4403-89c9-269a2d152aa6` | 131 |
| Acompanhamento Técnicos — Segmento B2C | `049bb60c76ee15677824566b1760222bb266d97252472d8844ab31cd80cd0f42` | `e0b67e31-7b62-4d53-a418-b972557ca6d7` | 6 |

Os cinco arquivos originais foram preservados no Storage `megabrain-bases`, em `indicadores/3ps/`.

### Camada analítica consolidada

- **Base:** `10007154-8266-4eb7-aae3-bd095040cd03`
- **Linhas:** 523.
- **Conteúdo:** 127 técnicos elegíveis, 381 registros técnico/dia, resumos por cluster, tempo de casa e quartil, além dos três dias de acompanhamento consolidado.
- **Vínculo:** a demanda `3Ps` possui agora oito bases vinculadas — duas da fonte principal e seis deste conjunto complementar.

## Diagnóstico complementar de Produção

### Resultado por cluster — 01 a 03/07/2026

| Cluster | Técnicos elegíveis | Produtividade ponderada | Abaixo da meta individual | Sem produção | Gap estimado para a meta |
|---|---:|---:|---:|---:|---:|
| C.26 Ceará Interior | 46 | 3,63 OS/dia | 25 (54,3%) | 3 | 83,5 OS |
| C.27 Fortaleza | 81 | 3,24 OS/dia | 61 (75,3%) | 5 | 162,0 OS |
| **Ceará** | **127** | **3,38 OS/dia** | **86 (67,7%)** | **8** | **245,5 OS** |

O gap é calculado por técnico como `máximo(meta por tempo de casa × dias trabalhados − volume produtivo, 0)`. É uma estimativa de oportunidade, não uma previsão financeira.

### Concentração do desvio

- Fortaleza concentra **61 dos 86 técnicos abaixo da meta** e **66,0% do gap estimado de OS**.
- Técnicos acima de 90 dias respondem por **222 das 245,5 OS de gap**, aproximadamente **90,4%** do total.
- Nos técnicos acima de 90 dias, há 52 casos abaixo da meta em Fortaleza e 24 no Interior.
- Os quartis Q3, Q4 e NP somam 29 técnicos, mas não capturam todo o problema: **46 dos 47 técnicos Q2 também ficaram abaixo da meta absoluta por tempo de casa**.
- Portanto, quartil é útil para priorização relativa, mas a régua de gestão deve continuar sendo a meta definida por tempo de casa.

### Conversão diária da capacidade

| Data | Folha | Trabalharam | Produtivos | Produtivos / trabalharam | Sem baixa no dia |
|---|---:|---:|---:|---:|---:|
| 01/07 | 135 | 107 | 97 | 90,7% | 28 |
| 02/07 | 135 | 110 | 103 | 93,6% | 25 |
| 03/07 | 135 | 110 | 99 | 90,0% | 25 |

O universo de produtividade tem 127 técnicos elegíveis, enquanto o acompanhamento de folha tem 135. A diferença decorre dos filtros registrados nos relatórios, incluindo exclusão de férias e exigência de tempo de treinamento ultrapassado. Esses denominadores não devem ser misturados.

### Implicação para o FCA

- **Fato prioritário:** C.27 Fortaleza está abaixo das metas nos três Ps e concentra o maior desvio nominal de Produção.
- **Público prioritário:** técnicos acima de 90 dias, seguidos dos oito técnicos NP.
- **Causa:** ainda em validação. As bases permitem localizar apoio, outros segmentos, ausência de baixa e status operacionais por FUNCID, mas não comprovam isoladamente a causa raiz.
- **Ação sugerida para validação:** gestão nominal diária dos 86 técnicos abaixo da meta, com separação entre falta de presença, dia trabalhado sem produção, desvio de atividade e baixa produção apesar de dia produtivo.

## Terceiro lote — séries BI, Baremo OK e improdutividade

### Arquivos incorporados

| Fonte | SHA-256 | Base bruta | Linhas armazenadas |
|---|---|---|---:|
| Produtividade B2C — Qtd. H.C | `3ac4f094ac77e4a56350f55dbc8219f254fbf5beaecbcfc8e5274957d7317ea3` | `f4c596fd-e40f-4efe-bdb0-ac07268ac1f4` | 37 |
| Produtividade B2C — OK e NOK | `92098f10d0664a7e73146a019a1a18183a3f4de93dba49a4fb2e58cf6adedbdc` | `47506470-8ad1-4689-82cf-b66aa39c474b` | 37 |
| Produtividade B2C — OK | `836ce4f98eda87c318eb3bbd5b3cdd8e531c1207d5dd6265ebef4c583912842f` | `cd85c161-6e62-45e9-b227-d082ee695c1e` | 37 |
| Analítico Nominal por Quartil — Baremo OK | `bfef0f20727d3edfa6c52535cbbbe650784638cd6462c5f320315354cfc63699` | `867521c8-345f-4b96-944e-01fc1919b384` | 138 |

- **Camada analítica reconciliada:** `f1bb4590-f692-4454-a256-dee2aa3f2685`.
- **Linhas analíticas:** 283.
- **Total de bases vinculadas ao projeto após o lote:** 13.
- Os quatro arquivos originais foram preservados no Storage.

### Regra de reconciliação

- Indicadores iguais para o mesmo cluster e período são tratados como **atualização**, nunca como soma.
- A exportação BI mais recente tem precedência sobre o snapshot anterior para o fechamento da S27.
- `Produtividade OK`, `Produtividade OK e NOK` e `Baremo OK` são métricas diferentes e permanecem separadas.
- O Baremo OK se sobrepõe nominalmente a 127 técnicos da base 11 OK e acrescenta oito técnicos; seus volumes não são adicionados aos da outra metodologia.
- Os rankings do print repetem exatamente as 328 improdutivas já existentes e servem apenas como validação.

### Fechamento atualizado da S27

| Cluster | H.C trabalhado | Produtividade OK | Produtividade OK e NOK |
|---|---:|---:|---:|
| C.26 Ceará Interior | 43 | 3,5 | 4,2 |
| C.27 Fortaleza | 81 | 3,2 | 4,3 |
| **Ceará** | **124** | **3,3** | **4,3** |

Esses valores substituem, sem acumulação, o snapshot anterior da S27 para a leitura agregada. A análise por tempo de casa continua usando as bases nominais e a régua definida na ata.

### Comparação do Baremo OK

- Universo: 135 técnicos — 46 no Interior e 89 em Fortaleza.
- Dos 135, 127 também estão na metodologia 11 OK; os oito adicionais pertencem a Fortaleza, sendo sete NP e um Q3.
- Nos 127 comparáveis, o Baremo eleva a produtividade em média **0,27 OS/dia**.
- 18 técnicos mudam para um quartil superior: 11 de Q2 para Q1 e sete de Q3 para Q2.
- O Baremo é uma lente complementar e não altera a métrica executiva oficial sem decisão explícita da gestão.

### Evidência causal do dashboard

- O volume de 328 improdutivas foi validado pelo ranking do painel: 213 sob Jose Nilton, 95 sob Jose Geraldo e 20 sob Jefferson. Esse total também bate, de forma independente, com a soma do campo `volume_improdutivo` na base nominal por técnico.
- A transcrição inicial do print está em `evidencia-dashboard-improdutividade-2026-07-06.md` e mostrava 212 baixas com motivo classificado, com a ressalva de que a lista podia estar cortada pela rolagem da tela.
- Em 06/07 foram obtidos os arquivos reais do BI (`Improdutivas Motivos Baixa.xlsx` e `Improdutivas Submotivos Baixa.xlsx`), documentados em `motivos-submotivos-improdutividade-2026-07-06.md`. Eles confirmam a suspeita: o total real é **217**, não 212 — 5 motivos adicionais (1 ocorrência cada) não apareciam no print.
- Abertura indevida, cliente ausente, reagendamento e falha massiva somam 170 registros — **78,3%** das 217 baixas classificadas.
- Como 217 é menor que 328, ainda restam 111 improdutivas (33,8%) sem motivo nem submotivo atribuído. Agora que a fonte é um arquivo completo do BI, essa lacuna é uma pendência real de classificação no sistema, não mais uma limitação de transcrição — e continua sem reconciliação.
