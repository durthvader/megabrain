# Formulários públicos com token

## Como funcionam

Cada demanda nasce com um `token_publico` único. O link:

```
https://…/formulario.html?token=abc123xyz456
```

abre uma página **sem login** que:

1. Lê o token da URL.
2. Busca a demanda pelo token (`buscarDemandaPorToken`).
3. Token inválido ou demanda não-ativa → mensagem de erro, nada é exibido.
4. Token válido → exibe o formulário conforme o tipo:
   - demanda `escala` → formulário de folga (supervisor, técnico, data, tipo, observação);
   - demais tipos → formulário genérico (nome, perfil, supervisor, técnico, empresa, cidade, data, observação + campos dinâmicos `campo: valor`).
5. Grava em `formulario_respostas` vinculado à demanda.

No banco, a única regra imposta de verdade ao público é: **INSERT de resposta exige token de demanda ativa** (policy `respostas_insert_publico`).

## O que é público neste MVP

Como o portal não tem autenticação, as policies são permissivas. Considere público:

- os dados da demanda (nome, descrição, período);
- as respostas já enviadas;
- as linhas das bases importadas.

**Portanto: não suba dados sensíveis.** Veja [seguranca.md](seguranca.md).

## Riscos do link com token

- Quem tem o link pode **preencher quantas vezes quiser** (não há deduplicação nem captcha).
- O link pode ser **repassado** para terceiros.
- O token aparece no histórico do navegador e em prints.

## Como reduzir a exposição

1. **Escopo mínimo:** só suba as colunas necessárias; nada de CPF/telefone/endereço.
2. **Vida curta:** ao encerrar a coleta, mude o status da demanda para `concluida` — o formulário para de aceitar respostas na hora (a policy de INSERT exige status `ativa`).
3. **Limpeza:** exporte e apague respostas antigas.
4. **Token novo se vazar:** atualize `token_publico` na tabela `demandas` (SQL Editor) e reenvie o link correto.
5. **Evolução (Fase 6):** Supabase Auth para o portal administrativo, mantendo público apenas o INSERT de respostas.
