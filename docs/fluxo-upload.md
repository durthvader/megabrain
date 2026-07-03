# Fluxo de upload de bases

```
Selecionar demanda → escolher tipo de base → selecionar arquivo
   → leitura NO NAVEGADOR → prévia + colunas normalizadas
   → importar para o banco → log → usar/exportar
```

## Passo a passo

1. **Selecionar demanda.** Só demandas não arquivadas aparecem. (Vindo do detalhe da demanda, já chega selecionada via `?demanda=`.)
2. **Tipo de base.** Define como os painéis interpretam as linhas: `tecnicos`, `ferias`, `treinamentos`, `exames`, `folgas`, `custos`, `horas_extras`, `banco_horas`, `sobreaviso`, `adicional_noturno`, `indicadores`, `ordens_servico`, `outros`.
3. **Arquivo.** CSV, XLSX ou XLS, até 10 MB, primeira linha = cabeçalho. A leitura acontece **inteira no navegador** (PapaParse/SheetJS) — nada sobe ainda.
4. **Prévia.** O portal mostra:
   - chips das colunas detectadas (destacando renomeações, ex.: `Técnico → tecnico`);
   - as primeiras 20 linhas já normalizadas;
   - total de linhas e tamanho do arquivo.
5. **Normalização de colunas.** Acentos removidos, minúsculas, espaços → `_`, e sinônimos mapeados (`colaborador→tecnico`, `municipio→cidade`, `empreiteira→empresa`, `inicio→data_inicio`…). Mapa completo em `assets/js/utils/normalizarColunas.js` — adicione sinônimos novos lá.
6. **Arquivo original no Storage?** Desmarcado por padrão. Marque só se precisar guardar a evidência do arquivo bruto; isso consome o 1 GB do plano gratuito.
7. **Importar.** As linhas entram em `base_linhas` em lotes de 500, com `demanda_id`, `base_id`, `tipo_base` e `linha_numero`. Os metadados ficam em `bases`.
8. **Log e resultado.** Um registro em `logs` + resumo na tela: linhas importadas, erros, tamanho, se o original foi guardado.

## Erros comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| "Extensão não suportada" | arquivo .txt/.pdf | converta para CSV/XLSX |
| Prévia com colunas erradas | separador incomum no CSV | salve como CSV padrão (`;` ou `,`) ou XLSX |
| Erros em todos os lotes | SQLs não executados / RLS bloqueando | rode `sql/001` e `sql/002` no Supabase |
| Datas viram números | célula formatada como número no Excel | formate a coluna como texto/data antes de exportar |

## Reimportar uma base corrigida

Apague a base antiga primeiro (detalhe da demanda → **Apagar**) para não duplicar dados — o painel soma tudo que encontra.
