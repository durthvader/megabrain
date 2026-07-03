# Formulários públicos com token

## Como funcionam

Cada demanda nasce com um `token_publico` único. Existem três páginas públicas, cada uma com seu próprio propósito — todas usam o mesmo token:

| Link | O que abre | Quando usar |
|---|---|---|
| `resultado.html?token=abc123` | título + descrição da demanda; um botão "Ver resultado" se `demandas.pagina_resultado` estiver preenchido, senão um aviso de "ainda em branco" | É o link gerado **automaticamente** na criação da demanda (`montarLinkPublico`) — o ponto de entrada padrão |
| `escala-publica.html?token=abc123` | painel completo de escala (grade + clique instantâneo), sem menu do portal | Compartilhe manualmente com supervisores quando a demanda for do tipo `escala` (também acessível pelo botão "Abrir painel público de escala" no detalhe da demanda) |
| `formulario.html?token=abc123` | formulário genérico linha a linha | Compartilhe manualmente quando a demanda precisar de respostas via formulário (botão "Abrir link público (resultado)" no detalhe aponta para `resultado.html`; o link do formulário em si é copiado à parte) |

As três páginas são **sem login** e seguem o mesmo contrato:

1. Lêem o token da URL.
2. Buscam a demanda pelo token (`buscarDemandaPorToken`).
3. Token inválido ou demanda não-ativa/apagada → mensagem de erro, nada é exibido.
4. Token válido → exibe só o que aquele link permite (resultado, painel de escala ou formulário genérico — nunca o menu do portal, nunca outras demandas).
5. `formulario.html` grava em `formulario_respostas` vinculado à demanda.

Um link antigo de `formulario.html?token=...` para uma demanda `escala` continua funcionando: a página redireciona automaticamente para `escala-publica.html?token=...`.

No banco, a única regra imposta de verdade ao público é: **INSERT de resposta exige token de demanda ativa** (policy `respostas_insert_publico`).

### O painel de escala público

`escala-publica.html` é a mesma grade e o mesmo gráfico do painel administrativo (`escala.html`), só que restrita a uma única demanda (fixada pelo token) e sem acesso a nenhuma outra página do portal — quem recebe o link só enxerga aquele painel.

Fluxo pensado para o mínimo de cliques: o supervisor escolhe o tipo de ocorrência num seletor (Disponível, Férias, Folga, Treinamento, Exame) e depois clica direto nas células da grade — a marcação é salva instantaneamente, sem formulário nem botão de confirmar. Clicar de novo na mesma célula desmarca.

**Importante para segurança dos dados:** o clique só grava/apaga registros em `formulario_respostas` (o que o próprio supervisor marcou). Ele nunca altera os eventos vindos de bases importadas (férias, treinamentos e exames subidos via planilha) — esses só podem ser corrigidos reimportando a base.

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
