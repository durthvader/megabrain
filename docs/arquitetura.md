# Arquitetura do Megabrain

## Visão geral

```
HTML/CSS/JS modular (estático, sem build)
        │  ES Modules + CDN (supabase-js, Chart.js, PapaParse, SheetJS)
        ▼
supabaseClient.js  ←  config.js (URL + anon/publishable key)
        │  HTTPS (PostgREST / Storage API)
        ▼
Supabase (plano gratuito)
        │  Row Level Security (002_rls.sql)
        ▼
Tabelas temporárias por demanda (demandas, bases, base_linhas,
formulario_respostas, analises, planos_acao, logs)
        │
        ├─ Páginas/painéis por demanda (escala.html, custos.html, …)
        ├─ Formulário público por token (formulario.html?token=…)
        └─ Exportação CSV → limpeza (006_limpeza.sql / Configurações)
```

## Princípios

1. **Sem build, sem backend próprio.** Tudo roda no navegador; qualquer servidor estático serve (Live Server, GitHub Pages).
2. **Conexão centralizada.** Só `supabaseClient.js` cria o client; todos os services importam dali.
3. **Camadas simples:**
   - `assets/js/utils/` — funções puras (datas, CSV, normalização, filtros).
   - `assets/js/services/` — todo acesso ao Supabase.
   - `assets/js/pages/` — um módulo por página; só orquestra DOM + services.
4. **Dados temporários por demanda.** `demanda_id` amarra tudo; FK `on delete cascade` garante que apagar a demanda limpa o restante.
5. **JSONB flexível.** `base_linhas.dados` guarda qualquer estrutura de planilha. Trade-off documentado em [modelo-dados.md](modelo-dados.md).
6. **Token público como chave de acesso da interface**, não como criptografia. Riscos em [seguranca.md](seguranca.md).

## Estrutura de pastas

Veja a árvore completa no [README](../README.md). Regra prática:

- Novo tipo de painel para uma demanda → nova página `*.html` + `assets/js/pages/*Page.js`, reutilizando os services.
- Nova consulta ao banco → função em um service existente (ou novo service), nunca direto na página.

## Bibliotecas CDN

| Lib | Onde | Uso |
|---|---|---|
| `@supabase/supabase-js@2` (ESM) | `supabaseClient.js` | banco + storage |
| `papaparse@5` | `upload.html` | leitura de CSV |
| `xlsx@0.18` (SheetJS) | `upload.html` | leitura de Excel |
| `chart.js@4` | `custos.html` | gráficos |

Se um CDN cair, o portal continua abrindo — apenas a função específica (upload/gráfico) falha com mensagem clara.
