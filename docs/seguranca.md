# Segurança

## Fronteiras de acesso

O Megabrain central e cada portal de projeto são aplicações diferentes. Ocultar
um card, usar uma subpasta ou acrescentar token à URL não restringe acesso.

- mantenha o catálogo central privado;
- implante cada `public/` separadamente;
- aplique autenticação e uma lista explícita de usuários/grupos na hospedagem;
- compartilhe arquivos por links de "pessoas específicas" no OneDrive ou
  SharePoint;
- teste sempre a negação de acesso.

## Manifests

`project.json` é seguro para versionamento e não pode conter tokens, caminhos
absolutos ou URLs assinadas. `project.local.json` é ignorado e serve ao catálogo
local, mas não é cofre de produção.

Dados, entregáveis, código específico e snapshots dos sandboxes também estão
ignorados no repositório central público atual. Projetos que precisem de histórico
devem usar repositório privado próprio.

## Supabase

| Credencial | Regra |
|---|---|
| anon/publishable | pode existir no frontend somente com RLS realmente restritiva |
| service_role/secret | nunca no frontend ou Git |
| senha/connection string | somente em ambiente local/cofre |

As policies permissivas do MVP legado não atendem ao requisito de compartilhar
com pessoas específicas. Enquanto não forem substituídas por autenticação e RLS
por usuário/grupo, trate Escala, Duplas, formulários e bases como infraestrutura
interna não apropriada para dados sensíveis.

## Dados

- não envie CPF, endereço, salário, informação médica ou bancária sem base legal
  e autorização;
- use apenas as colunas necessárias;
- aplique mascaramento quando possível;
- lembre que CSV, PPTX e cache do navegador herdam a sensibilidade da fonte;
- rotacione imediatamente credenciais ou tokens que tenham vazado.

## Antes de compartilhar

- [ ] O projeto está em aplicação independente?
- [ ] O acesso exige identidade?
- [ ] Somente usuários/grupos autorizados foram atribuídos?
- [ ] Uma conta sem permissão recebeu bloqueio?
- [ ] Não há token, caminho local ou dado sensível no manifesto público?
- [ ] Existe plano de revogação/encerramento?
