# Segurança

## Fronteiras de acesso

O Megabrain central e cada portal de projeto são aplicações diferentes.

- execute o catálogo central somente em `127.0.0.1`;
- implante cada `public/` separadamente;
- use link não listado somente para página estática, leitura e conteúdo não
  sensível;
- aplique autenticação real quando houver dados sensíveis, escrita ou acesso por
  pessoa;
- trate o link como uma chave: quem o recebe pode abrir e repassar.

O identificador padrão possui 16 caracteres aleatórios. `noindex`, `robots.txt`
e `Referrer-Policy` reduzem descoberta e vazamento acidentais, mas não transformam
o link em autenticação.

## Manifests

`project.json` é seguro para versionamento e não pode conter tokens, caminhos
absolutos ou URLs assinadas. `project.local.json` é ignorado e serve ao catálogo
local. A URL não listada completa deve ficar somente nele.

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
- [ ] O conteúdo é compatível com acesso por qualquer pessoa que receba o link?
- [ ] A página usa identificador aleatório de 16 caracteres?
- [ ] A página usa `noindex` e não envia o endereço como referência?
- [ ] Não há token, caminho local ou dado sensível no manifesto público?
- [ ] APIs e bancos não permitem operações além das necessárias?
- [ ] Existe plano de revogação/encerramento?
