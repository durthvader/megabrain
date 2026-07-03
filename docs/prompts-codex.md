# Prompts prontos para o Codex/Claude no VS Code

O fluxo Megabrain: os dados ficam no Supabase, e a análise pesada é feita pelo assistente de código no VS Code, que consulta as tabelas e (quando útil) gera páginas auxiliares novas.

**Antes de usar:** abra a pasta do projeto no VS Code e tenha em mãos o **UUID da demanda** (aparece na URL do detalhe: `demanda-detalhe.html?id=UUID`). As credenciais de conexão direta ao banco ficam no `.env` local (não versionado).

---

## Prompt 1 — Diagnóstico das bases

> Analise as bases da demanda `UUID_DA_DEMANDA` no Supabase (tabelas `bases` e `base_linhas`, campo JSONB `dados`; consulte `docs/modelo-dados.md`). Identifique: inconsistências de dados (datas inválidas, valores vazios, nomes de técnico escritos de formas diferentes), duplicidades, colunas relevantes e irrelevantes, e oportunidades de melhoria na qualidade da base. Resuma em uma lista objetiva que eu possa registrar na página de Análises.

## Prompt 2 — Dashboard auxiliar

> Com base na demanda `UUID_DA_DEMANDA`, crie um dashboard auxiliar em HTML/CSS/JS puro seguindo a arquitetura do Megabrain (página em `*.html` na raiz + módulo em `assets/js/pages/`, reutilizando os services existentes e o Chart.js via CDN como em `custos.html`). O dashboard deve mostrar: [DESCREVA OS GRÁFICOS/TABELAS]. Não use React, Vite, Next, TypeScript nem backend próprio.

## Prompt 3 — Conflitos de escala

> Analise a escala da demanda `UUID_DA_DEMANDA`: cruze as bases `ferias`, `treinamentos`, `exames`, `folgas` (em `base_linhas`) e as respostas em `formulario_respostas` (view `view_respostas_escala`). Encontre técnicos com mais de um evento no mesmo dia, férias sobrepostas a treinamentos e folgas em dias já ocupados. Gere um consolidado por supervisor com os conflitos que ele precisa resolver, em formato de tabela.

## Prompt 4 — Ofensores de custos

> Analise os custos da demanda `UUID_DA_DEMANDA` (tipo_base `custos`, `horas_extras`, `banco_horas`, `sobreaviso`, `adicional_noturno` em `base_linhas`). Identifique os maiores ofensores de hora extra, banco de horas, sobreaviso e adicional noturno por técnico, supervisor e empresa; detecte padrões (concentração em dias/rotas/períodos) e gere sugestões objetivas de redução com impacto estimado. Estruture a resposta nos campos da página Análises: resumo, evidências, hipóteses, sugestões, próximos passos.

## Prompt 5 — Página auxiliar por demanda

> Crie uma página auxiliar para a demanda `UUID_DA_DEMANDA` que faça: [DESCREVA A NECESSIDADE]. Mantenha a arquitetura simples do Megabrain: HTML puro na raiz, CSS reutilizando `assets/css/`, módulo ES em `assets/js/pages/`, acesso a dados somente pelos services em `assets/js/services/`. Sem React, Vite, Next, TypeScript, build system ou backend próprio. A página deve funcionar no Live Server e respeitar as limitações do plano gratuito do Supabase (consultas paginadas, sem duplicar dados).

---

## Dicas

- Cole junto o trecho relevante de `docs/modelo-dados.md` quando o assistente não conhecer o schema.
- Peça sempre **consultas paginadas** e com filtro por `demanda_id` — nunca `select *` global.
- Ao gerar páginas novas, peça para adicionar o link em `assets/js/navigation.js` apenas se a página for permanente; páginas de demanda pontual podem viver fora do menu.
- Depois da análise, registre o resultado na página **Análises** para ficar vinculado à demanda.
