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
demandas ←→ bases (N:N via demanda_bases) → base_linhas
        │        (bases são reutilizáveis, não pertencem a 1 demanda)
        ├─ formulario_respostas, analises, planos_acao, logs (por demanda,
        │  apagados junto com ela)
        │
        ├─ Link público de resultado (resultado.html?token=…), em branco
        │  até `demandas.pagina_resultado` apontar para uma página gerada
        ├─ Páginas/painéis reutilizáveis (escala.html, custos.html, …),
        │  acessadas a partir do detalhe da demanda, não do menu principal
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
4. **Bases reutilizáveis, dados de demanda temporários.** Bases (`bases`/`base_linhas`) são independentes de demanda e vinculadas via `demanda_bases`; apagar uma demanda remove só o vínculo. Já `formulario_respostas`, `analises`, `planos_acao` e `logs` têm `demanda_id` com FK `on delete cascade` — apagar a demanda limpa esses.
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
