# Exemplo completo: escala dos próximos 30 dias

Cenário real: montar o cronograma de escala dos técnicos para os próximos 30 dias, cruzando férias, treinamentos e exames já marcados, e coletando as folgas com os supervisores.

## 1. Criar a demanda

**Demandas → Nova demanda**
- Nome: `Escala próximos 30 dias`
- Tipo: `escala`
- Responsável: você
- Período: hoje → hoje + 30

O token público é gerado (ex.: `k7m2p9x4w3ab`).

## 2. Subir as bases

**Upload de bases**, uma por vez, sempre nesta demanda:

| Tipo | Colunas esperadas (após normalização) |
|---|---|
| `tecnicos` | `tecnico`, `supervisor`, `empresa`, `cidade`, `cargo`, `status` |
| `ferias` | `tecnico`, `data_inicio`, `data_fim` |
| `treinamentos` | `tecnico`, `data_inicio`, `data_fim`, `treinamento` |
| `exames` | `tecnico`, `data`, `tipo_exame` |
| `folgas` (opcional) | `tecnico`, `data`, `tipo_folga`, `observacao` |

As planilhas podem vir com cabeçalhos diferentes (`Colaborador`, `Município`, `Data Início`…) — o normalizador converte automaticamente. **Importante:** o nome do técnico deve ser escrito igual em todas as bases (é a chave de cruzamento).

## 3. Coletar ocorrências com os supervisores

Envie o link `escala-publica.html?token=k7m2p9x4w3ab`. Ele abre um **painel completo**, sem login e sem o menu do portal — só o painel de escala fica visível. Uso pensado para ser rápido:

1. O supervisor filtra pelo próprio nome (supervisor/empresa/cidade), se quiser ver só o time dele.
2. Escolhe o tipo de ocorrência no seletor: **Disponível, Férias, Folga, Treinamento ou Exame**.
3. Clica nas células da grade (técnico × dia) para marcar aquele tipo — a marcação é salva na hora, sem precisar abrir formulário ou clicar em "salvar".
4. Clicar de novo na mesma célula desmarca (volta para disponível).
5. Trocar o tipo no seletor e clicar numa célula já marcada substitui a marcação anterior.

O clique só afeta o que o próprio supervisor marcou — nunca apaga férias, treinamentos ou exames importados via planilha (esses continuam vindo das bases e aparecem na grade normalmente, inclusive gerando conflito `!` se um supervisor marcar algo no mesmo dia).

## 4. Acompanhar a grade

**Escala** (menu do portal) → selecionar a demanda. É o mesmo painel do link público, com a mesma UX de clique instantâneo, mais o seletor de demanda:

- técnicos nas linhas (com supervisor/empresa/cidade), 30 dias nas colunas;
- células coloridas + letra: `FE` férias, `T` treinamento, `EX` exame, `FO` folga, `!` conflito (dois eventos no mesmo dia), branco = disponível;
- filtros por supervisor, empresa e cidade;
- **consolidado por dia** como gráfico de colunas agrupadas (Chart.js), uma série por tipo de ocorrência;
- tabela de conflitos para resolver com o supervisor.

## 5. Exportar e encerrar

1. **Exportar CSV** — matriz técnico × dia com o status de cada célula, pronta para o Excel.
2. Resolver conflitos, reexportar a versão final.
3. Detalhe da demanda → **Limpar dados** → **Arquivar**.

## Testar sem dados reais

Rode `sql/005_dados_exemplo.sql`: cria a demanda demo `DEMO — Escala próximos 30 dias` (token `escala-demo-2026`) com 4 técnicos, férias, treinamento, exame, folga via formulário e um conflito proposital no dia +8. Abra `escala-publica.html?token=escala-demo-2026` para ver o painel público.
