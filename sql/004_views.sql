-- ============================================================
-- MEGABRAIN — 004: Views úteis
-- Onde executar: Supabase → SQL Editor (depois do 001).
-- security_invoker: a view respeita as policies de quem consulta.
-- ============================================================

-- ------------------------------------------------------------
-- Resumo por demanda: contagens de bases, linhas, respostas,
-- análises e planos. Útil para o Codex e para conferências.
-- ------------------------------------------------------------
create or replace view public.view_resumo_demandas
  with (security_invoker = true) as
select
  d.id as demanda_id,
  d.nome,
  d.tipo,
  d.status,
  (select count(*) from public.bases b where b.demanda_id = d.id) as total_bases,
  (select count(*) from public.base_linhas bl where bl.demanda_id = d.id) as total_linhas,
  (select count(*) from public.formulario_respostas r where r.demanda_id = d.id) as total_respostas,
  (select count(*) from public.analises a where a.demanda_id = d.id) as total_analises,
  (select count(*) from public.planos_acao p where p.demanda_id = d.id) as total_planos
from public.demandas d;

-- ------------------------------------------------------------
-- Linhas importadas "achatadas" — ponto de partida para análises
-- ad hoc (o JSONB fica na coluna dados; use dados->>'campo').
-- ------------------------------------------------------------
create or replace view public.view_base_linhas_flat
  with (security_invoker = true) as
select
  id,
  demanda_id,
  base_id,
  tipo_base,
  linha_numero,
  dados,
  criado_em
from public.base_linhas;

-- ------------------------------------------------------------
-- Respostas de escala com os campos úteis já extraídos do JSONB.
-- ------------------------------------------------------------
create or replace view public.view_respostas_escala
  with (security_invoker = true) as
select
  demanda_id,
  supervisor,
  tecnico,
  empresa,
  cidade,
  data_referencia,
  coalesce(dados->>'tipo_folga', 'folga') as tipo_folga,
  dados->>'observacao' as observacao
from public.formulario_respostas
where tipo_formulario in ('escala', 'escala_folga');
