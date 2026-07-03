# Segurança

## As chaves do Supabase

| Chave | Onde pode ficar | Por quê |
|---|---|---|
| **anon / publishable** (`sb_publishable_…`) | ✅ no frontend (`config.js`), versionada | é pública por design; o que ela pode fazer é limitado pelas policies de RLS |
| **service_role / secret** | ❌ NUNCA no frontend, NUNCA no repositório | ignora RLS completamente; quem a tiver controla o banco inteiro |
| **senha do banco / connection string** | ❌ NUNCA no frontend nem no git | acesso direto ao Postgres. Fica só no `.env` local (gitignorado) |

Se a service_role ou a senha vazarem: **Project Settings → API → rotacionar** imediatamente.

## RLS é obrigatório

Sem Row Level Security ativado, a anon key dá acesso irrestrito às tabelas. O `sql/002_rls.sql` ativa RLS em todas as tabelas do Megabrain. **Nunca desative** ("disable RLS") para "resolver" um erro — corrija a policy.

## O modelo do MVP e seus limites (leia com atenção)

O MVP **não tem autenticação**. Consequências:

- As policies são permissivas: quem tiver a URL do projeto + anon key (ambas públicas) pode ler e escrever nas tabelas do Megabrain via API.
- O token público controla o fluxo da interface e o INSERT de respostas (única regra dura no banco: só demanda **ativa** aceita resposta).
- **Links públicos com token não são segurança perfeita**: podem ser repassados, aparecem em histórico e prints, e não impedem envios repetidos.

Isso é um trade-off consciente para uma ferramenta leve, interna e de dados temporários. É aceitável **somente** enquanto valerem as três condições:

1. os dados não são sensíveis;
2. o uso é interno e de curto prazo;
3. tudo é descartável (exporta → apaga).

Se alguma deixar de valer → implemente a Fase 6 do [roadmap](roadmap.md) (Supabase Auth + policies restritas — modelos já comentados no fim de `sql/002_rls.sql`).

## Dados sensíveis

- **Não suba** CPF, RG, telefone, endereço, salário, dados médicos ou bancários sem autorização formal (LGPD).
- Prefira **matrícula ou nome** como identificador do técnico.
- **Mascare sempre que possível**: "J. Silva" resolve tanto quanto "João Silva" na maior parte das análises; para exame periódico, a data importa, o resultado não.
- Antes de subir uma planilha, **delete as colunas sensíveis** — além de seguro, economiza espaço.
- Ao exportar CSVs, lembre que eles herdam a sensibilidade dos dados: não deixe em pasta pública.

## Checklist rápido antes de compartilhar um link

- [ ] A demanda contém apenas dados operacionais não sensíveis?
- [ ] O formulário pede só o necessário?
- [ ] A demanda será concluída/limpa quando a coleta acabar?
- [ ] `config.js` contém apenas URL + anon key? (`git grep service_role` deve retornar vazio)
