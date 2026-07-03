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

## 3. Coletar folgas com os supervisores

Envie o link `formulario.html?token=k7m2p9x4w3ab`. O supervisor preenche, sem login: supervisor, técnico, data da folga, tipo, observação. Cada envio vira uma linha em `formulario_respostas`.

## 4. Montar a grade

**Escala → selecionar a demanda.** A grade mostra:

- técnicos nas linhas (com supervisor/empresa/cidade), 30 dias nas colunas;
- células coloridas + letra: `FE` férias, `T` treinamento, `EX` exame, `FO` folga, `!` conflito (dois eventos no mesmo dia), branco = disponível;
- filtros por supervisor, empresa e cidade;
- clique em qualquer célula para registrar folga direto pelo portal;
- consolidado por dia (disponíveis, férias, treinamento, exame, folga, conflitos);
- tabela de conflitos para resolver com o supervisor.

## 5. Exportar e encerrar

1. **Exportar CSV** — matriz técnico × dia com o status de cada célula, pronta para o Excel.
2. Resolver conflitos, reexportar a versão final.
3. Detalhe da demanda → **Limpar dados** → **Arquivar**.

## Testar sem dados reais

Rode `sql/005_dados_exemplo.sql`: cria a demanda demo `DEMO — Escala próximos 30 dias` (token `escala-demo-2026`) com 4 técnicos, férias, treinamento, exame, folga via formulário e um conflito proposital no dia +8.
