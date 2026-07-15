# Roadmap

## Concluído nesta reorganização

- Megabrain convertido em catálogo de projetos.
- Criação de demandas e Análises removidas da navegação.
- Cards de resultado com destinos locais ou web.
- Um manifesto e um sandbox para cada projeto atual.
- Catálogo gerado automaticamente dos sandboxes.
- Metadados privados separados e ignorados pelo Git.
- Código compartilhado de 3Ps e Custo de Horas iniciado em `packages/`.
- Cópias legadas de `outputs/`, scripts e documentação removidas da raiz; a
  versão intermediária do PPT Nordeste foi preservada no `archive/` do sandbox.

## Próxima prioridade

1. Tornar o repositório central privado e revisar o histórico que já expôs
   entregáveis/tokens.
2. Escolher a hospedagem protegida por projeto — preferência: Azure Static Web
   Apps + Microsoft Entra.
3. Implantar um projeto piloto e validar concessão/revogação de acesso.
4. Corrigir RLS/autenticação das ferramentas Supabase antes de uso sensível.

## Depois

- extrair completamente Escala, Duplas e Custos para pacotes independentes;
- automatizar build de `public/` sem dependências externas ao sandbox;
- inventariar recursos externos no manifesto privado e criar exclusão assistida;
- criar template de novo sandbox;
- adicionar validação visual automatizada dos portais.
