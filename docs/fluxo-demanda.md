# Fluxo de uma demanda

O ciclo de vida completo, do início ao fim:

```
1. Criar demanda  →  2. Token gerado  →  3. Subir bases  →  4. Painel/página
       →  5. Coletar respostas  →  6. Consolidar  →  7. Exportar  →  8. Limpar
```

## 1. Criar a demanda

**Demandas → Nova demanda.** Informe nome, tipo (`escala`, `custos`, `indicadores`, `formulario`, `analise_livre`), responsável, período e descrição. Status inicial: `ativa`.

## 2. Token público

Gerado automaticamente (12 caracteres, sem ambiguidade visual). Aparece na lista e no detalhe da demanda, junto com o link pronto:
`formulario.html?token=SEU_TOKEN`

## 3. Subir bases

**Upload de bases** (ou botão *Ir para upload* no detalhe). Uma base por arquivo, com tipo (`tecnicos`, `ferias`, `custos`, …). Prévia de 20 linhas antes de confirmar. Detalhes em [fluxo-upload.md](fluxo-upload.md).

## 4. Painel ou página da demanda

- Demanda `escala` → **Escala** monta a grade de 30 dias sozinha.
- Demanda `custos` → **Custos** consolida cards, gráficos e ofensores.
- Outra necessidade → peça ao Codex uma página auxiliar ([prompts-codex.md](prompts-codex.md), prompt 5).

## 5. Coletar respostas

Envie o link público para supervisores/técnicos (WhatsApp, e-mail). Eles preenchem **sem login**. As respostas chegam em tempo real no detalhe da demanda e nos painéis.

## 6. Consolidar

- Escala: grade + consolidado por dia + lista de conflitos.
- Custos: cards por tipo + gráficos + tabela de ofensores.
- Análise qualitativa: registre em **Análises** e gere planos em **Planos de ação**.

## 7. Exportar

Botões *Exportar CSV* em cada painel, no detalhe da demanda (respostas e bases). O CSV é o registro permanente do resultado.

## 8. Limpar

Quando a demanda acabar:

1. Confirme que tudo que importa foi exportado.
2. Detalhe da demanda → **Limpar dados da demanda** (digite `LIMPAR`).
3. **Arquivar demanda**.
4. Periodicamente: Configurações → **Apagar demandas arquivadas**.

Assim o banco volta ao tamanho mínimo e o projeto segue no plano gratuito.
