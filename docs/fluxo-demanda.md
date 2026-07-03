# Fluxo de uma demanda

O ciclo de vida completo, do início ao fim:

```
1. Subir bases (biblioteca)  →  2. Criar demanda + vincular bases  →  3. Token gerado
      →  4. Link de resultado (em branco)  →  5. Pedir a análise/página no Claude Code
      →  6. Registrar a página de resultado  →  7. Coletar respostas (se aplicável)
      →  8. Consolidar/exportar  →  9. Limpar
```

## 1. Subir bases

**Upload de bases** é o primeiro passo e **não depende de nenhuma demanda** — a base
(planilha de técnicos, férias, custos, hierarquia, etc.) fica disponível numa
biblioteca reutilizável. Uma mesma base pode ser usada por várias demandas depois.
Detalhes em [fluxo-upload.md](fluxo-upload.md).

## 2. Criar a demanda e vincular bases

**Demandas → Nova demanda.** Informe nome, tipo (`escala`, `custos`, `indicadores`,
`formulario`, `analise_livre`), responsável, período (com opção "indeterminada", sem
data de término) e descrição. Marque no checklist quais bases já importadas esta
demanda vai usar — dá para vincular mais depois, no detalhe da demanda. Status
inicial: `ativa`.

## 3. Token público

Gerado automaticamente (12 caracteres, sem ambiguidade visual).

## 4. Link de resultado

O link gerado (`resultado.html?token=SEU_TOKEN`) começa **em branco** — só mostra
título e descrição da demanda. Ele não redireciona automaticamente para nenhum
formulário ou painel: o conteúdo é gerado sob demanda (próximo passo).

## 5. Pedir a análise/página no Claude Code

Com o UUID da demanda em mãos (URL do detalhe: `demanda-detalhe.html?id=UUID`), peça
para analisar as bases vinculadas e, se fizer sentido, gerar uma página nova (ver
[prompts-codex.md](prompts-codex.md)). Duas páginas já existem prontas para
reaproveitar quando a demanda for desse tipo:

- Tipo `escala` → **Escala** (`escala.html?demanda=UUID`) monta a grade de 30 dias.
- Tipo `custos` → **Custos** (`custos.html?demanda=UUID`) consolida cards e gráficos.

Ambas ficam acessíveis pelos botões *Painel de escala (admin)* / *Painel de custos
(admin)* no detalhe da demanda — não aparecem mais no menu principal.

## 6. Registrar a página de resultado

No detalhe da demanda, campo **"Página de resultado (gerada pela IA)"**: informe o
nome do arquivo criado (ex.: `resultado-escala-abc.html`) e salve. A partir daí, o
link público passa a mostrar um botão "Ver resultado" apontando para essa página.

## 7. Coletar respostas (quando aplicável)

Para demandas que precisam de preenchimento manual, compartilhe
`formulario.html?token=SEU_TOKEN` (ou, para escala, `escala-publica.html?token=...`)
diretamente — esses links continuam funcionando independente do link de resultado.

## 8. Consolidar/exportar

Botões *Exportar CSV* em cada painel e no detalhe da demanda (respostas e bases). O
CSV é o registro permanente do resultado. Análise qualitativa: registre em
**Análises** e gere planos em **Planos de ação**.

## 9. Limpar

Quando a demanda acabar:

1. Confirme que tudo que importa foi exportado.
2. Detalhe da demanda → **Limpar dados da demanda** (digite `LIMPAR`) — isso
   desvincula as bases (sem apagá-las: continuam disponíveis para outras demandas) e
   apaga respostas, análises, planos e logs desta demanda.
3. **Arquivar demanda**.
4. Periodicamente: Configurações → **Apagar demandas arquivadas** (bases não são
   afetadas) e, se quiser liberar espaço, `sql/006_limpeza.sql` tem uma consulta
   comentada para apagar bases órfãs (sem nenhuma demanda vinculada).

Assim o banco volta ao tamanho mínimo e o projeto segue no plano gratuito.
