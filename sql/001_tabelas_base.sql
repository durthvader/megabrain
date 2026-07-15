-- ============================================================
-- MEGABRAIN — 001: Tabelas base
-- Onde executar: Supabase → SQL Editor → New query → colar → Run
-- Pode ser executado mais de uma vez (idempotente).
-- ============================================================

-- ------------------------------------------------------------
-- DEMANDAS: unidade central de organização do Megabrain.
-- Cada trabalho legado armazenado aqui é uma demanda.
-- ------------------------------------------------------------
create table if not exists public.demandas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null,                     -- identificador livre da categoria
  descricao text,
  responsavel text,
  token_publico text unique not null,     -- usado nos links públicos: formulario.html?token=...
  data_inicio date,
  data_fim date,
  status text default 'ativa',            -- ativa | concluida | arquivada | apagada
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- ------------------------------------------------------------
-- BASES: metadados de cada arquivo importado (o conteúdo vai
-- para base_linhas). Apagar a demanda apaga tudo em cascata.
-- ------------------------------------------------------------
create table if not exists public.bases (
  id uuid primary key default gen_random_uuid(),
  demanda_id uuid references public.demandas(id) on delete cascade,
  nome_arquivo text not null,
  tipo_base text not null,                -- tecnicos | ferias | treinamentos | exames | folgas | custos | ...
  descricao text,
  qtd_linhas int default 0,
  qtd_colunas int default 0,
  tamanho_bytes bigint,
  colunas_originais jsonb,
  colunas_normalizadas jsonb,
  guardar_arquivo_original boolean default false,
  caminho_storage text,                   -- preenchido só se o original foi guardado no Storage
  status text default 'importada',
  criado_em timestamptz default now()
);

-- ------------------------------------------------------------
-- BASE_LINHAS: dados importados, uma linha do arquivo por
-- registro, em JSONB.
--
-- ATENÇÃO: este modelo é flexível e ótimo para o MVP no plano
-- gratuito, mas NÃO é performático para grande escala. Se uma
-- demanda passar de ~50 mil linhas com consultas frequentes,
-- crie uma tabela específica com colunas tipadas para ela.
-- ------------------------------------------------------------
create table if not exists public.base_linhas (
  id bigserial primary key,
  demanda_id uuid references public.demandas(id) on delete cascade,
  base_id uuid references public.bases(id) on delete cascade,
  tipo_base text not null,
  linha_numero int,
  dados jsonb not null,
  criado_em timestamptz default now()
);

-- ------------------------------------------------------------
-- FORMULARIO_RESPOSTAS: respostas das páginas públicas
-- (formulario.html?token=...), sem autenticação.
-- ------------------------------------------------------------
create table if not exists public.formulario_respostas (
  id uuid primary key default gen_random_uuid(),
  demanda_id uuid references public.demandas(id) on delete cascade,
  token_publico text not null,
  tipo_formulario text,                   -- generico | dupla | dupla_sozinho | ...
  respondente_nome text,
  respondente_perfil text,
  supervisor text,
  tecnico text,
  empresa text,
  cidade text,
  data_referencia date,
  dados jsonb not null,
  criado_em timestamptz default now()
);

-- ------------------------------------------------------------
-- ANALISES: análises registradas por demanda (feitas manualmente
-- ou com apoio do Codex/Claude no VS Code).
-- ------------------------------------------------------------
create table if not exists public.analises (
  id uuid primary key default gen_random_uuid(),
  demanda_id uuid references public.demandas(id) on delete cascade,
  titulo text not null,
  pergunta text,
  resumo text,
  evidencias text,
  hipoteses text,
  sugestoes text,
  proximos_passos text,
  criado_em timestamptz default now()
);

-- ------------------------------------------------------------
-- PLANOS_ACAO: gestão simples de plano de ação por demanda.
-- ------------------------------------------------------------
create table if not exists public.planos_acao (
  id uuid primary key default gen_random_uuid(),
  demanda_id uuid references public.demandas(id) on delete cascade,
  tema text,
  problema text,
  causa text,
  acao text not null,
  responsavel text,
  prazo date,
  status text default 'pendente',         -- pendente | em_andamento | concluido | cancelado
  impacto_esperado text,
  impacto_realizado text,
  observacao text,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- ------------------------------------------------------------
-- LOGS: trilha simples de importações e eventos.
-- ------------------------------------------------------------
create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  demanda_id uuid references public.demandas(id) on delete cascade,
  base_id uuid references public.bases(id) on delete cascade,
  tipo text,                              -- upload | limpeza | erro | ...
  mensagem text,
  detalhes jsonb,
  criado_em timestamptz default now()
);

-- ------------------------------------------------------------
-- Índices para as consultas do portal.
-- ------------------------------------------------------------
create index if not exists idx_bases_demanda on public.bases (demanda_id);
create index if not exists idx_base_linhas_demanda_tipo on public.base_linhas (demanda_id, tipo_base);
create index if not exists idx_base_linhas_base on public.base_linhas (base_id);
create index if not exists idx_respostas_demanda on public.formulario_respostas (demanda_id);
create index if not exists idx_respostas_token on public.formulario_respostas (token_publico);
create index if not exists idx_analises_demanda on public.analises (demanda_id);
create index if not exists idx_planos_demanda on public.planos_acao (demanda_id);
create index if not exists idx_logs_demanda on public.logs (demanda_id);

-- ------------------------------------------------------------
-- Trigger: mantém atualizado_em automático.
-- ------------------------------------------------------------
create or replace function public.atualizar_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists trg_demandas_atualizado on public.demandas;
create trigger trg_demandas_atualizado
  before update on public.demandas
  for each row execute function public.atualizar_timestamp();

drop trigger if exists trg_planos_atualizado on public.planos_acao;
create trigger trg_planos_atualizado
  before update on public.planos_acao
  for each row execute function public.atualizar_timestamp();
