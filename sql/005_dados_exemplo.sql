-- ============================================================
-- MEGABRAIN — 005: Dados de exemplo (OPCIONAL)
-- Onde executar: Supabase → SQL Editor (depois do 001–004).
--
-- Cria duas demandas de demonstração com UUIDs fixos:
--   • Escala (token demo: escala-demo-2026)
--   • Custos (token demo: custos-demo-2026)
-- As datas da escala são relativas a current_date, então a grade
-- de 30 dias sempre mostra os eventos.
--
-- Para remover tudo depois:
--   delete from public.demandas where id in
--     ('a1111111-1111-1111-1111-111111111111',
--      'a2222222-2222-2222-2222-222222222222');
-- ============================================================

-- ------------------------------------------------------------
-- Demandas
-- ------------------------------------------------------------
insert into public.demandas (id, nome, tipo, descricao, responsavel, token_publico, data_inicio, data_fim, status)
values
  ('a1111111-1111-1111-1111-111111111111',
   'DEMO — Escala próximos 30 dias', 'escala',
   'Demanda de demonstração: escala de técnicos com férias, treinamento, exame e folgas.',
   'Rogério Fonseca', 'escala-demo-2026', current_date, current_date + 30, 'ativa'),
  ('a2222222-2222-2222-2222-222222222222',
   'DEMO — Redução de custos operacionais', 'custos',
   'Demanda de demonstração: hora extra, banco de horas, sobreaviso e adicional noturno.',
   'Rogério Fonseca', 'custos-demo-2026', current_date - 90, current_date, 'ativa')
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- Bases da demanda de ESCALA
-- ------------------------------------------------------------
insert into public.bases (id, demanda_id, nome_arquivo, tipo_base, descricao, qtd_linhas, qtd_colunas)
values
  ('b1111111-1111-1111-1111-111111111101', 'a1111111-1111-1111-1111-111111111111', 'demo_tecnicos.csv', 'tecnicos', 'Base demo de técnicos', 4, 6),
  ('b1111111-1111-1111-1111-111111111102', 'a1111111-1111-1111-1111-111111111111', 'demo_ferias.csv', 'ferias', 'Férias programadas', 1, 3),
  ('b1111111-1111-1111-1111-111111111103', 'a1111111-1111-1111-1111-111111111111', 'demo_treinamentos.csv', 'treinamentos', 'Treinamentos programados', 1, 4),
  ('b1111111-1111-1111-1111-111111111104', 'a1111111-1111-1111-1111-111111111111', 'demo_exames.csv', 'exames', 'Exames periódicos', 1, 3),
  ('b1111111-1111-1111-1111-111111111105', 'a1111111-1111-1111-1111-111111111111', 'demo_folgas.csv', 'folgas', 'Folgas já registradas', 1, 4)
on conflict (id) do nothing;

-- Técnicos
insert into public.base_linhas (demanda_id, base_id, tipo_base, linha_numero, dados)
select 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111101', 'tecnicos', n, dados
from (values
  (1, jsonb_build_object('tecnico','João Silva','supervisor','Carlos','empresa','Alfa Telecom','cidade','Salvador','cargo','Técnico I','status','ativo')),
  (2, jsonb_build_object('tecnico','Maria Souza','supervisor','Carlos','empresa','Alfa Telecom','cidade','Salvador','cargo','Técnico II','status','ativo')),
  (3, jsonb_build_object('tecnico','André Pereira','supervisor','Fernanda','empresa','Beta Redes','cidade','Feira de Santana','cargo','Técnico I','status','ativo')),
  (4, jsonb_build_object('tecnico','Clara Santos','supervisor','Fernanda','empresa','Beta Redes','cidade','Ilhéus','cargo','Técnico III','status','ativo'))
) as t(n, dados)
where not exists (
  select 1 from public.base_linhas where base_id = 'b1111111-1111-1111-1111-111111111101'
);

-- Férias (João, começando em 5 dias, por 10 dias)
insert into public.base_linhas (demanda_id, base_id, tipo_base, linha_numero, dados)
select 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111102', 'ferias', 1,
  jsonb_build_object('tecnico','João Silva',
    'data_inicio', to_char(current_date + 5, 'YYYY-MM-DD'),
    'data_fim', to_char(current_date + 14, 'YYYY-MM-DD'))
where not exists (
  select 1 from public.base_linhas where base_id = 'b1111111-1111-1111-1111-111111111102'
);

-- Treinamento (Maria, dias +8 a +9)
insert into public.base_linhas (demanda_id, base_id, tipo_base, linha_numero, dados)
select 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111103', 'treinamentos', 1,
  jsonb_build_object('tecnico','Maria Souza',
    'data_inicio', to_char(current_date + 8, 'YYYY-MM-DD'),
    'data_fim', to_char(current_date + 9, 'YYYY-MM-DD'),
    'treinamento','NR-35 Reciclagem')
where not exists (
  select 1 from public.base_linhas where base_id = 'b1111111-1111-1111-1111-111111111103'
);

-- Exame (André, dia +3)
insert into public.base_linhas (demanda_id, base_id, tipo_base, linha_numero, dados)
select 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111104', 'exames', 1,
  jsonb_build_object('tecnico','André Pereira',
    'data', to_char(current_date + 3, 'YYYY-MM-DD'),
    'tipo_exame','Periódico')
where not exists (
  select 1 from public.base_linhas where base_id = 'b1111111-1111-1111-1111-111111111104'
);

-- Folga em conflito proposital (Maria, dia +8 — mesmo dia do treinamento)
insert into public.base_linhas (demanda_id, base_id, tipo_base, linha_numero, dados)
select 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111105', 'folgas', 1,
  jsonb_build_object('tecnico','Maria Souza',
    'data', to_char(current_date + 8, 'YYYY-MM-DD'),
    'tipo_folga','folga','observacao','Conflito proposital para demonstração')
where not exists (
  select 1 from public.base_linhas where base_id = 'b1111111-1111-1111-1111-111111111105'
);

-- Resposta de formulário (folga da Clara no dia +6)
insert into public.formulario_respostas (demanda_id, token_publico, tipo_formulario, respondente_nome, respondente_perfil, supervisor, tecnico, data_referencia, dados)
select 'a1111111-1111-1111-1111-111111111111', 'escala-demo-2026', 'escala_folga',
  'Fernanda', 'supervisor', 'Fernanda', 'Clara Santos', current_date + 6,
  jsonb_build_object('tipo_folga','folga','observacao','Registrada pelo formulário público (demo)')
where not exists (
  select 1 from public.formulario_respostas
  where demanda_id = 'a1111111-1111-1111-1111-111111111111'
);

-- ------------------------------------------------------------
-- Base da demanda de CUSTOS (últimos 3 meses)
-- ------------------------------------------------------------
insert into public.bases (id, demanda_id, nome_arquivo, tipo_base, descricao, qtd_linhas, qtd_colunas)
values
  ('b2222222-2222-2222-2222-222222222201', 'a2222222-2222-2222-2222-222222222222', 'demo_custos.csv', 'custos', 'Base demo de custos', 12, 9)
on conflict (id) do nothing;

insert into public.base_linhas (demanda_id, base_id, tipo_base, linha_numero, dados)
select 'a2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222201', 'custos', n,
  jsonb_build_object(
    'tecnico', tecnico, 'supervisor', supervisor, 'empresa', empresa,
    'cidade', cidade, 'regional', 'Nordeste',
    'data', to_char(current_date - dias, 'YYYY-MM-DD'),
    'tipo_custo', tipo, 'quantidade_horas', horas, 'valor', valor, 'observacao', '')
from (values
  (1,  'João Silva',   'Carlos',   'Alfa Telecom', 'Salvador',          75, 'hora_extra',             8,  420.50),
  (2,  'João Silva',   'Carlos',   'Alfa Telecom', 'Salvador',          45, 'hora_extra',            12,  610.00),
  (3,  'João Silva',   'Carlos',   'Alfa Telecom', 'Salvador',          15, 'hora_extra',            10,  545.90),
  (4,  'Maria Souza',  'Carlos',   'Alfa Telecom', 'Salvador',          70, 'banco_horas',            6,  310.00),
  (5,  'Maria Souza',  'Carlos',   'Alfa Telecom', 'Salvador',          20, 'adicional_noturno',      9,  280.40),
  (6,  'André Pereira','Fernanda', 'Beta Redes',   'Feira de Santana',  60, 'sobreaviso',            24,  190.00),
  (7,  'André Pereira','Fernanda', 'Beta Redes',   'Feira de Santana',  30, 'acionamento_sobreaviso', 4,  260.00),
  (8,  'André Pereira','Fernanda', 'Beta Redes',   'Feira de Santana',  10, 'hora_extra',             7,  395.00),
  (9,  'Clara Santos', 'Fernanda', 'Beta Redes',   'Ilhéus',            55, 'sobreaviso',            24,  190.00),
  (10, 'Clara Santos', 'Fernanda', 'Beta Redes',   'Ilhéus',            25, 'adicional_noturno',     11,  340.75),
  (11, 'Clara Santos', 'Fernanda', 'Beta Redes',   'Ilhéus',             5, 'banco_horas',            5,  255.00),
  (12, 'João Silva',   'Carlos',   'Alfa Telecom', 'Salvador',           2, 'acionamento_sobreaviso', 3,  195.00)
) as t(n, tecnico, supervisor, empresa, cidade, dias, tipo, horas, valor)
where not exists (
  select 1 from public.base_linhas where base_id = 'b2222222-2222-2222-2222-222222222201'
);

-- ------------------------------------------------------------
-- Análise e plano de exemplo (demanda de custos)
-- ------------------------------------------------------------
insert into public.analises (demanda_id, titulo, pergunta, resumo, evidencias, hipoteses, sugestoes, proximos_passos)
select 'a2222222-2222-2222-2222-222222222222',
  'DEMO — Ofensores de hora extra',
  'Quem concentra o custo de hora extra no trimestre?',
  'João Silva concentra a maior parte da hora extra da regional.',
  'Três lançamentos de HE somando mais de R$ 1.500 em 90 dias.',
  'Rota com demanda acima da capacidade da equipe no turno normal.',
  'Redistribuir ordens de serviço da rota Salvador-Centro e avaliar remanejamento de escala.',
  'Validar com o supervisor Carlos e acompanhar por 30 dias.'
where not exists (
  select 1 from public.analises where demanda_id = 'a2222222-2222-2222-2222-222222222222'
);

insert into public.planos_acao (demanda_id, tema, problema, causa, acao, responsavel, prazo, status, impacto_esperado)
select 'a2222222-2222-2222-2222-222222222222',
  'Redução de hora extra',
  'Hora extra concentrada em um técnico',
  'Distribuição desigual de ordens de serviço',
  'Redistribuir OS da rota Salvador-Centro entre a equipe',
  'Carlos', current_date + 30, 'pendente',
  'Reduzir 40% da hora extra do técnico ofensor'
where not exists (
  select 1 from public.planos_acao where demanda_id = 'a2222222-2222-2222-2222-222222222222'
);
