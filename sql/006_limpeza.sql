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
-- 1) Função de limpeza por demanda: DESVINCULA as bases (sem
--    apagá-las — são reutilizáveis por outras demandas, ver
--    sql/007) e apaga respostas, análises, planos e logs. A
--    demanda em si permanece (mude o status depois, se quiser).
-- ------------------------------------------------------------
create or replace function public.limpar_demanda(p_demanda_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.demanda_bases where demanda_id = p_demanda_id;
  delete from public.formulario_respostas where demanda_id = p_demanda_id;
  delete from public.analises where demanda_id = p_demanda_id;
  delete from public.planos_acao where demanda_id = p_demanda_id;
  delete from public.logs where demanda_id = p_demanda_id;
end;
$$;

-- Uso:
-- select public.limpar_demanda('COLE-AQUI-O-UUID-DA-DEMANDA');

-- ------------------------------------------------------------
-- 2) Apagar completamente as demandas ARQUIVADAS (a própria
--    demanda + vínculos/respostas/análises/planos/logs via
--    cascata). As bases NÃO são apagadas — continuam disponíveis
--    para qualquer outra demanda que as use.
-- ------------------------------------------------------------
delete from public.demandas where status = 'arquivada';

-- ------------------------------------------------------------
-- 2b) Apagar bases "órfãs" (sem nenhuma demanda vinculada) e seus
--     arquivos no Storage — rode só se quiser liberar espaço de
--     bases que não serão mais usadas por ninguém.
-- ------------------------------------------------------------
-- Confira antes quais seriam apagadas:
-- select id, nome_arquivo, tipo_base, caminho_storage from public.bases b
--  where not exists (select 1 from public.demanda_bases db where db.base_id = b.id);

-- delete from storage.objects
--  where bucket_id = 'megabrain-bases'
--    and name in (
--      select caminho_storage from public.bases b
--       where caminho_storage is not null
--         and not exists (select 1 from public.demanda_bases db where db.base_id = b.id)
--    );
--
-- delete from public.bases b
--  where not exists (select 1 from public.demanda_bases db where db.base_id = b.id);

-- ------------------------------------------------------------
-- 3) Limpezas pontuais úteis.
-- ------------------------------------------------------------
-- Apagar as linhas de uma base específica (mantém metadados da base):
-- delete from public.base_linhas where base_id = 'UUID-DA-BASE';

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
