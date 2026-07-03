# Estratégia para caber no plano gratuito do Supabase

O plano Free (referência 2026) dá aproximadamente: **500 MB de banco**, **1 GB de Storage**, **5 GB de tráfego/mês**, e **pausa projetos após ~7 dias sem uso**. O Megabrain foi desenhado para viver dentro disso.

## As 9 regras

1. **Dados temporários por demanda.** O Megabrain não é um data warehouse. Cada demanda nasce, coleta, consolida, **exporta e morre**.
2. **Apagar demandas antigas.** Ao concluir: exporte os CSVs → arquive a demanda → use *Configurações → Apagar demandas arquivadas* (ou `sql/006_limpeza.sql`).
3. **Não guardar o arquivo original por padrão.** A opção no upload vem desmarcada de propósito: os dados já ficam em `base_linhas`; o arquivo original no Storage é redundância cara.
4. **Evitar bases enormes.** Referência prática com JSONB (~1 KB/linha):
   - até 10 mil linhas por base: tranquilo;
   - 10–50 mil: ok, mas limpe logo após o uso;
   - acima de 50 mil: repense — filtre antes de subir ou crie tabela específica.
5. **Importar apenas colunas úteis.** Antes de subir, delete colunas irrelevantes da planilha. Menos colunas = menos JSONB = menos espaço.
6. **Exportar antes de apagar.** O CSV exportado é o registro permanente; o banco é só área de trabalho.
7. **Evitar anexos e imagens.** O Megabrain não tem (de propósito) upload de fotos/PDFs. Não adicione sem migrar de plano.
8. **Uma demanda grande por vez.** Se o volume for alto, conclua e limpe uma demanda antes de abrir a próxima.
9. **Rotina de limpeza.** Uma vez por mês, rode a seção 0 de `sql/006_limpeza.sql` para conferir tamanhos e apague o que já foi exportado. Logs com +30 dias podem ser apagados sempre.

## Evitar bases duplicadas

- Antes de reimportar uma base corrigida, **apague a versão anterior** (detalhe da demanda → Apagar base).
- O log de importação (`logs`) mostra o que já subiu.

## Monitoramento

- **Configurações** no portal mostra contagens aproximadas e estimativa de MB.
- No painel do Supabase: *Project Settings → Usage* mostra o consumo real de banco, Storage e tráfego.

## Sinais de que o limite está chegando

- Aviso de uso no dashboard do Supabase (e-mail).
- Erros de INSERT por falta de espaço.

**O que fazer:** exportar tudo que importa → limpar demandas concluídas → `vacuum` (seção 4 do 006) → se recorrente, avaliar plano pago ou reduzir escopo por demanda.

## Pausa por inatividade

Projetos Free pausam após ~7 dias sem requisições. Sintoma: o portal mostra erro de conexão. Solução: abrir o dashboard do Supabase e clicar em **Restore/Resume**. Se o Megabrain for usado semanalmente, isso raramente acontece.
