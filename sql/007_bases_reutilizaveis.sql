-- ============================================================
-- MEGABRAIN — 007: Bases reutilizáveis entre demandas
-- Onde executar: Supabase → SQL Editor → New query → colar → Run
-- Pode ser executado mais de uma vez (idempotente).
--
-- Antes desta migração, uma base (arquivo importado) só podia
-- pertencer a UMA demanda (bases.demanda_id). A partir de agora,
-- upload é independente de demanda e uma mesma base pode ser usada
-- por várias demandas via a tabela de junção abaixo.
--
-- bases.demanda_id e base_linhas.demanda_id continuam existindo
-- (já eram nullable) só por compatibilidade com dados antigos —
-- novos uploads gravam demanda_id = null e usam apenas base_id.
-- ============================================================

create table if not exists public.demanda_bases (
  demanda_id uuid references public.demandas(id) on delete cascade,
  base_id uuid references public.bases(id) on delete cascade,
  criado_em timestamptz default now(),
  primary key (demanda_id, base_id)
);

create index if not exists idx_demanda_bases_base on public.demanda_bases (base_id);

-- ------------------------------------------------------------
-- Nome do arquivo (na raiz do projeto) da página de resultado
-- gerada pela IA para esta demanda, ex.: "resultado-escala-abc.html".
-- Enquanto for null, o link público (resultado.html?token=...)
-- mostra só título + descrição, sem conteúdo gerado.
-- ------------------------------------------------------------
alter table public.demandas add column if not exists pagina_resultado text;

-- ------------------------------------------------------------
-- RLS — mesmo modelo permissivo do MVP (ver sql/002_rls.sql).
-- ------------------------------------------------------------
alter table public.demanda_bases enable row level security;

drop policy if exists mvp_demanda_bases_tudo on public.demanda_bases;
create policy mvp_demanda_bases_tudo on public.demanda_bases
  for all to anon, authenticated using (true) with check (true);
