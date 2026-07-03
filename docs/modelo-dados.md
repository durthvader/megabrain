# Modelo de dados

Todas as tabelas vivem no schema `public` e são criadas por `sql/001_tabelas_base.sql`. Tudo gira em torno de **demandas**: apagar uma demanda apaga o restante em cascata (FK `on delete cascade`).

## demandas

Unidade central de organização.

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| nome | text | obrigatório |
| tipo | text | `escala` \| `custos` \| `indicadores` \| `formulario` \| `analise_livre` |
| descricao, responsavel | text | livres |
| token_publico | text unique | usado em `formulario.html?token=…` |
| data_inicio, data_fim | date | período da demanda |
| status | text | `ativa` \| `concluida` \| `arquivada` \| `apagada` |
| pagina_resultado | text | nome do arquivo `.html` gerado pela IA para o resultado desta demanda (`null` = ainda em branco) |
| criado_em, atualizado_em | timestamptz | `atualizado_em` mantido por trigger |

## bases

Metadados de cada arquivo importado (o conteúdo vai para `base_linhas`). Guarda contagens, colunas originais/normalizadas (jsonb) e, se o usuário optou, o `caminho_storage` do arquivo original. **Bases são independentes de demanda** (upload não exige escolher uma demanda) e podem ser reutilizadas por várias demandas via `demanda_bases`. Os campos `bases.demanda_id` e `base_linhas.demanda_id` continuam existindo só por compatibilidade com dados anteriores à migração `007`.

## demanda_bases

Tabela de junção N:N entre `demandas` e `bases` — define quais bases uma demanda usa. Apagar a demanda remove só o vínculo (a base continua existindo); apagar a base remove o vínculo em qualquer demanda que a usasse.

## base_linhas

Os dados importados, **uma linha da planilha por registro**, no campo `dados jsonb`.

**Por que JSONB?** Cada demanda tem bases com estruturas diferentes; JSONB evita criar tabela nova a cada demanda. **Trade-off:** consultas em JSONB são mais lentas e ocupam mais espaço que colunas tipadas. Adequado para o MVP e para o plano gratuito. **Se o volume crescer** (>50 mil linhas consultadas com frequência), crie uma tabela específica tipada para aquela demanda e migre com `insert … select dados->>'campo' …`.

Índice principal: `(demanda_id, tipo_base)` — é assim que o portal consulta.

## formulario_respostas

Respostas dos formulários públicos. Campos estruturados de uso comum (respondente, supervisor, tecnico, empresa, cidade, data_referencia) + `dados jsonb` para campos dinâmicos (`tipo_folga`, `observacao`, extras).

## analises

Registro textual de análises por demanda: titulo, pergunta, resumo, evidencias, hipoteses, sugestoes, proximos_passos. O botão "Transformar sugestão em plano" cria um registro em `planos_acao`.

## planos_acao

Plano de ação simples: tema, problema, causa, **acao** (obrigatória), responsavel, prazo, status (`pendente` \| `em_andamento` \| `concluido` \| `cancelado`), impactos e observacao. `atualizado_em` por trigger.

## logs

Trilha de importações/limpezas: tipo, mensagem, detalhes (jsonb). Pode ser apagada a qualquer momento (>30 dias: apague sempre).

## Views (`sql/004_views.sql`)

| View | Conteúdo |
|---|---|
| `view_resumo_demandas` | contagens de bases/linhas/respostas/análises/planos por demanda |
| `view_base_linhas_flat` | `base_linhas` pronta para consultas ad hoc (`dados->>'campo'`) |
| `view_respostas_escala` | respostas de escala com `tipo_folga` e `observacao` já extraídos do JSONB |

## Consultas úteis (para o Codex)

```sql
-- Estrutura de uma base importada
select tipo_base, dados from view_base_linhas_flat
where demanda_id = 'UUID' limit 5;

-- Campos distintos usados numa base
select distinct jsonb_object_keys(dados) from base_linhas
where demanda_id = 'UUID' and tipo_base = 'custos';

-- Custo total por técnico direto no SQL
select dados->>'tecnico' as tecnico,
       sum((dados->>'valor')::numeric) as total
from base_linhas
where demanda_id = 'UUID' and tipo_base = 'custos'
group by 1 order by 2 desc;
```
