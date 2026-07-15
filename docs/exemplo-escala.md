# Exemplo: escala dos próximos 30 dias

## Projeto

Peça ao Codex para criar um sandbox `escala-AAAA-MM`, registrar período,
responsável e público, e usar a ferramenta compartilhada de escala.

## Bases

Quando a interface precisar consultar os dados online, envie pelo Upload as
bases `tecnicos`, `ferias`, `treinamentos`, `exames` e, opcionalmente, `folgas`.
O vínculo técnico com a instância ainda utiliza IDs do Supabase; registre-os
somente no contexto privado do sandbox.

## Resultado

O snapshot implantável fica em `projects/<id>/public/`. O link com token deve
ficar em `project.local.json`, nunca em `project.json`.

Antes de compartilhar:

1. valide a vinculação das bases;
2. implante o snapshot como aplicação independente;
3. proteja a aplicação com autenticação e usuários/grupos explícitos;
4. teste com uma conta autorizada e outra não autorizada;
5. só então envie o link.

O token seleciona a instância no banco, mas não substitui autenticação.

## Encerramento

Exporte o resultado, atualize o status do manifesto e sincronize o catálogo. Se
for excluir o projeto, inventarie antes registros, respostas, bases vinculadas e
deploy; apagar a pasta não remove esses recursos externos.
