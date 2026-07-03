# Roadmap

## Fase 1 — Portal base ✅ (este MVP)
- Estrutura HTML/CSS/JS modular sem build
- Demandas com token público
- Upload de bases (CSV/Excel) com prévia e normalização
- Formulário público sem login
- Exportação CSV
- Rotinas de limpeza (portal + SQL)

## Fase 2 — Escala visual 30 dias ✅ (este MVP)
- Grade técnico × dia com férias, treinamento, exame, folga e conflito
- Filtros por supervisor, empresa e cidade
- Registro de folga pela grade e pelo formulário público
- Consolidado por dia + exportação

## Fase 3 — Custos operacionais ✅ (este MVP)
- Cards por tipo de custo e ofensores
- Gráficos (tipo, supervisor, empresa, técnico, evolução)
- Filtros e exportação
- Dados simulados quando não há base

## Fase 4 — Análises salvas ✅ (este MVP)
- Registro estruturado (pergunta, resumo, evidências, hipóteses, sugestões, próximos passos)
- Integração com o fluxo Codex no VS Code

## Fase 5 — Planos de ação ✅ (este MVP)
- CRUD com status, responsável, prazo e impactos
- Criação a partir de sugestões de análises

## Fase 6 — Melhorias de segurança (próxima prioridade)
- Supabase Auth (e-mail/senha ou magic link) para o portal administrativo
- Policies restritas: anon só valida token + insere resposta (modelos já comentados em `sql/002_rls.sql`)
- Rate limiting/validações extras no formulário público
- Auditoria mínima de alterações

## Fase 7 — Migração para React/Vite (somente se necessário)
Critérios objetivos para justificar a migração — antes disso, não:
- múltiplos usuários simultâneos com papéis diferentes;
- páginas por demanda passando de ~15 com muita lógica repetida;
- necessidade real de componentes complexos (tabelas editáveis grandes, drag & drop).

A separação atual (utils/services/pages) foi pensada para que os services sejam portáveis para qualquer framework futuro.
