-- ============================================================
-- MEGABRAIN — 006: Limpeza manual
-- Onde executar: Supabase → SQL Editor, POR DEMANDA, quando ela
-- terminar. Regra de ouro: EXPORTE ANTES DE APAGAR.
--
-- O portal também faz limpeza (Configurações / detalhe da
-- demanda); este arquivo é a alternativa manual e a fonte das
-- consultas de conferência.
-- ============================================================

-- ------------------------------------------------------------
-- 0) Conferir o uso atual (rode primeiro).
-- ------------------------------------------------------------
select * from public.view_resumo_demandas order by total_linhas desc;

-- Tamanho aproximado das tabelas do Megabrain:
select
  relname as tabela,
  pg_size_pretty(pg_total_relation_size(relid)) as tamanho
from pg_catalog.pg_statio_user_tables
where schemaname = 'public'
order by pg_total_relation_size(relid) desc;

-- ------------------------------------------------------------
-- 1) Função de limpeza por demanda: apaga bases, linhas,
--    respostas, análises, planos, logs e arquivos do Storage.
--    A demanda em si permanece (mude o status depois, se quiser).
-- ------------------------------------------------------------
create or replace function public.limpar_demanda(p_demanda_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.base_linhas where demanda_id = p_demanda_id;
  delete from public.bases where demanda_id = p_demanda_id;
  delete from public.formulario_respostas where demanda_id = p_demanda_id;
  delete from public.analises where demanda_id = p_demanda_id;
  delete from public.planos_acao where demanda_id = p_demanda_id;
  delete from public.logs where demanda_id = p_demanda_id;
  -- Arquivos do Storage guardados como <demanda_id>/<arquivo>:
  delete from storage.objects
   where bucket_id = 'megabrain-bases'
     and name like p_demanda_id::text || '/%';
end;
$$;

-- Uso:
-- select public.limpar_demanda('COLE-AQUI-O-UUID-DA-DEMANDA');

-- ------------------------------------------------------------
-- 2) Apagar completamente as demandas ARQUIVADAS (dados + a
--    própria demanda). O delete em cascata cuida dos vínculos.
-- ------------------------------------------------------------
-- Primeiro os arquivos do Storage das arquivadas:
delete from storage.objects
 where bucket_id = 'megabrain-bases'
   and split_part(name, '/', 1) in (
     select id::text from public.demandas where status = 'arquivada'
   );

-- Depois as demandas (cascata apaga o resto):
delete from public.demandas where status = 'arquivada';

-- ------------------------------------------------------------
-- 3) Limpezas pontuais úteis.
-- ------------------------------------------------------------
-- Apagar só as linhas importadas de uma demanda (mantém metadados):
-- delete from public.base_linhas where demanda_id = 'UUID-DA-DEMANDA';

-- Apagar logs com mais de 30 dias:
delete from public.logs where criado_em < now() - interval '30 days';

-- Apagar os dados de demonstração do 005:
-- delete from public.demandas where id in
--   ('a1111111-1111-1111-1111-111111111111',
--    'a2222222-2222-2222-2222-222222222222');

-- ------------------------------------------------------------
-- 4) Recuperar espaço físico depois de apagar muita coisa.
-- ------------------------------------------------------------
vacuum (analyze) public.base_linhas;
vacuum (analyze) public.formulario_respostas;
vacuum (analyze) public.logs;
