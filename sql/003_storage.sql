-- ============================================================
-- MEGABRAIN — 003: Storage
-- Onde executar: Supabase → SQL Editor (depois do 002).
--
-- Recomendação padrão: NÃO guardar o arquivo original.
-- Os dados já ficam importados em base_linhas; o Storage do
-- plano gratuito (1 GB) deve ser poupado. O upload só grava
-- aqui se a opção "Guardar arquivo original" for marcada.
-- Arquivos são organizados por demanda: <demanda_id>/<arquivo>.
-- ============================================================

-- Bucket privado (acesso via anon key + policies abaixo).
insert into storage.buckets (id, name, public)
values ('megabrain-bases', 'megabrain-bases', false)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- Policy da tabela storage.buckets: sem isso, a API de Storage
-- responde "Bucket not found" para a anon key mesmo com o bucket
-- existindo — storage.buckets também tem RLS própria, separada
-- de storage.objects.
-- ------------------------------------------------------------
drop policy if exists megabrain_buckets_select on storage.buckets;
create policy megabrain_buckets_select on storage.buckets
  for select to anon, authenticated
  using (id = 'megabrain-bases');

-- ------------------------------------------------------------
-- Policies do bucket (MVP: anon pode gravar, listar e apagar
-- dentro do bucket — mesmo modelo permissivo do 002_rls.sql).
--
-- ⚠️ Se algum CREATE POLICY abaixo falhar por permissão, crie as
-- mesmas regras pelo painel: Storage → megabrain-bases → Policies.
-- ------------------------------------------------------------
drop policy if exists megabrain_bases_select on storage.objects;
create policy megabrain_bases_select on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'megabrain-bases');

drop policy if exists megabrain_bases_insert on storage.objects;
create policy megabrain_bases_insert on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'megabrain-bases');

drop policy if exists megabrain_bases_delete on storage.objects;
create policy megabrain_bases_delete on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'megabrain-bases');
