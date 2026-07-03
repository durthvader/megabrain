-- ============================================================
-- MEGABRAIN — 002: Row Level Security (RLS)
-- Onde executar: Supabase → SQL Editor (depois do 001).
--
-- ⚠️ LEIA ANTES DE EXECUTAR — modelo de segurança do MVP:
--
-- O Megabrain MVP não tem autenticação: o portal administrativo
-- e os formulários públicos usam a MESMA chave anon. Por isso as
-- policies abaixo são PERMISSIVAS (anon pode ler/escrever).
--
-- O que isso significa na prática:
--   • Qualquer pessoa que descubra a URL do projeto Supabase +
--     anon key (que é pública) consegue ler e alterar as tabelas.
--   • O token público na URL controla APENAS o fluxo da interface,
--     não é uma barreira criptográfica no banco (exceto no INSERT
--     de respostas, que exige token de demanda ativa).
--   • Aceitável para dados operacionais NÃO sensíveis e uso
--     interno de curto prazo. NÃO use para dados pessoais.
--
-- A única regra "de verdade" imposta ao público neste MVP:
--   → INSERT em formulario_respostas exige token de demanda ATIVA.
--
-- Evolução recomendada (Fase 6 do roadmap): ativar Supabase Auth,
-- restringir escrita a usuários autenticados e manter para anon
-- apenas SELECT por token + INSERT de respostas. Modelos prontos
-- comentados no fim deste arquivo.
-- ============================================================

alter table public.demandas enable row level security;
alter table public.bases enable row level security;
alter table public.base_linhas enable row level security;
alter table public.formulario_respostas enable row level security;
alter table public.analises enable row level security;
alter table public.planos_acao enable row level security;
alter table public.logs enable row level security;

-- ------------------------------------------------------------
-- DEMANDAS — MVP: leitura e escrita abertas (risco documentado).
-- O SELECT aberto também é necessário para o formulário público
-- localizar a demanda pelo token.
-- ------------------------------------------------------------
drop policy if exists mvp_demandas_select on public.demandas;
create policy mvp_demandas_select on public.demandas
  for select to anon, authenticated using (true);

drop policy if exists mvp_demandas_insert on public.demandas;
create policy mvp_demandas_insert on public.demandas
  for insert to anon, authenticated with check (true);

drop policy if exists mvp_demandas_update on public.demandas;
create policy mvp_demandas_update on public.demandas
  for update to anon, authenticated using (true) with check (true);

drop policy if exists mvp_demandas_delete on public.demandas;
create policy mvp_demandas_delete on public.demandas
  for delete to anon, authenticated using (true);

-- ------------------------------------------------------------
-- BASES e BASE_LINHAS — MVP: aberto (o painel de escala público
-- por token precisaria de SELECT; custos não precisa ser público,
-- mas sem auth não há como diferenciar — risco documentado).
-- Evite subir bases sensíveis.
-- ------------------------------------------------------------
drop policy if exists mvp_bases_tudo on public.bases;
create policy mvp_bases_tudo on public.bases
  for all to anon, authenticated using (true) with check (true);

drop policy if exists mvp_base_linhas_tudo on public.base_linhas;
create policy mvp_base_linhas_tudo on public.base_linhas
  for all to anon, authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- FORMULARIO_RESPOSTAS
-- INSERT público: SOMENTE com token de demanda ativa e coerente
-- com o demanda_id enviado. Esta é a policy "de verdade" do MVP.
-- ------------------------------------------------------------
drop policy if exists respostas_insert_publico on public.formulario_respostas;
create policy respostas_insert_publico on public.formulario_respostas
  for insert to anon, authenticated
  with check (
    exists (
      select 1
      from public.demandas d
      where d.token_publico = formulario_respostas.token_publico
        and d.id = formulario_respostas.demanda_id
        and d.status = 'ativa'
    )
  );

-- SELECT — MVP: aberto para o portal consolidar (risco documentado:
-- qualquer pessoa com um token pode listar respostas da demanda;
-- sem auth não há como restringir mais sem quebrar o portal).
drop policy if exists mvp_respostas_select on public.formulario_respostas;
create policy mvp_respostas_select on public.formulario_respostas
  for select to anon, authenticated using (true);

drop policy if exists mvp_respostas_delete on public.formulario_respostas;
create policy mvp_respostas_delete on public.formulario_respostas
  for delete to anon, authenticated using (true);

-- ------------------------------------------------------------
-- ANALISES, PLANOS_ACAO, LOGS — MVP: aberto (uso interno).
-- ------------------------------------------------------------
drop policy if exists mvp_analises_tudo on public.analises;
create policy mvp_analises_tudo on public.analises
  for all to anon, authenticated using (true) with check (true);

drop policy if exists mvp_planos_tudo on public.planos_acao;
create policy mvp_planos_tudo on public.planos_acao
  for all to anon, authenticated using (true) with check (true);

drop policy if exists mvp_logs_tudo on public.logs;
create policy mvp_logs_tudo on public.logs
  for all to anon, authenticated using (true) with check (true);

-- ============================================================
-- MODELO FUTURO (Fase 6) — deixe comentado até ativar o Supabase
-- Auth. Exemplo de como ficaria a versão restrita:
--
-- -- Remove as policies permissivas:
-- -- drop policy mvp_demandas_insert on public.demandas;
-- -- drop policy mvp_demandas_update on public.demandas;
-- -- drop policy mvp_demandas_delete on public.demandas;
--
-- -- Público só enxerga demandas ativas (para validar o token):
-- -- create policy demandas_select_publico on public.demandas
-- --   for select to anon using (status = 'ativa');
--
-- -- Escrita só para autenticados:
-- -- create policy demandas_escrita_auth on public.demandas
-- --   for all to authenticated using (true) with check (true);
--
-- -- base_linhas público apenas para bases de escala:
-- -- create policy linhas_escala_publico on public.base_linhas
-- --   for select to anon
-- --   using (tipo_base in ('tecnicos','ferias','treinamentos','exames','folgas'));
-- ============================================================
