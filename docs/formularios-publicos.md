# Páginas com token — infraestrutura legada

Duplas e o formulário genérico ainda usam um token na URL para selecionar uma
demanda do Supabase. Esse mecanismo faz parte da infraestrutura anterior e
não é o cadastro oficial do portfólio.

O token:

- identifica qual instância/dados carregar;
- pode aparecer no histórico, logs e capturas de tela;
- pode ser repassado;
- não comprova a identidade da pessoa;
- não impede chamadas diretas à API quando as policies são permissivas.

Portanto, trate esses links como não listados, não como privados. O link com token
fica apenas em `project.local.json` e deve usar `noindex`/`no-referrer`. Tokens
novos usam 16 caracteres; os existentes de 12 caracteres continuam válidos para
não quebrar instâncias ativas.

Enquanto a migração não estiver concluída, use somente dados operacionais mínimos
e não sensíveis. Ao encerrar uma instância, revogue o acesso, invalide o token e
limpe os recursos externos explicitamente.
