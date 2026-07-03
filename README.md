# Megabrain

## Estrutura

- `index.html` — página inicial
- `home.html` — página home
- `css/` — folhas de estilo
- `js/` — scripts do front-end
- `assets/` — imagens, fontes e outros recursos estáticos
- `docs/` — documentação
- `scripts/` — scripts auxiliares (build, deploy, etc.)

## Setup

1. Copie `.env.example` para `.env` e preencha com as credenciais do Supabase.
2. Em `js/supabaseClient.js`, preencha `SUPABASE_ANON_KEY` com a chave anon/public
   (Supabase Dashboard > Project Settings > API).
3. **Nunca** exponha `SUPABASE_DB_URL` (connection string com senha) em código
   client-side — ela fica só no `.env`, que é ignorado pelo Git.

## Git

Remoto configurado: `https://github.com/durthvader/megabrain.git`
