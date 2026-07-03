# 🧠 Megabrain

Portal leve de demandas operacionais e análises com bases de dados.

Megabrain **não** é um sistema corporativo gigante. É uma ferramenta rápida para:

1. Criar uma **demanda** operacional (ex.: "Escala próximos 30 dias", "Redução de custos Q3").
2. **Subir bases** (CSV/Excel) relacionadas à demanda.
3. Guardar os dados no **Supabase** de forma **temporária**.
4. Gerar **páginas públicas de preenchimento** (sem login, via token na URL).
5. **Consolidar** respostas e dados.
6. Exibir **painéis simples** (escala 30 dias, custos operacionais).
7. **Exportar** resultados em CSV.
8. **Limpar** tudo quando a demanda acabar, para caber no plano gratuito do Supabase.

**Stack:** HTML puro + CSS puro + JavaScript modular (ES Modules) + Supabase + Chart.js/PapaParse/SheetJS via CDN. Sem React, sem build, sem backend próprio.

---

## 1. O que é o Megabrain

Um portal estático (abre direto no navegador) que conversa com o Supabase usando a chave pública (anon/publishable). Cada trabalho é uma **demanda**, com token público próprio. Bases, respostas de formulário, análises e planos de ação ficam vinculados à demanda — e são apagados juntos quando ela termina.

## 2. Como abrir no VS Code

1. Abra o VS Code → `File → Open Folder` → selecione a pasta `megabrain`.
2. Instale a extensão **Live Server** (Ritwick Dey) se ainda não tiver.

## 3. Como rodar com Live Server

1. Clique com o botão direito em `index.html` → **Open with Live Server**.
2. O portal abre em `http://127.0.0.1:5500/index.html` (ou porta similar).
3. Todas as páginas usam caminhos relativos — funciona também em qualquer servidor estático simples.

> ⚠️ Abrir o arquivo com duplo clique (`file://`) **não funciona** porque os módulos ES exigem um servidor HTTP.

## 4. Como criar o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) → crie conta gratuita → **New project**.
2. Escolha nome (ex.: `megabrain`), senha do banco e região (São Paulo / `sa-east-1`).
3. Aguarde o provisionamento (~2 min).
4. Em **Project Settings → API**, copie:
   - **Project URL** (ex.: `https://xxxx.supabase.co`)
   - **Publishable/anon key** (chave pública — pode ficar no frontend)

## 5. Como preencher o config.js

Edite [assets/js/config.js](assets/js/config.js):

```js
export const SUPABASE_URL = "https://SEU_PROJETO.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_...";
```

Use `assets/js/config.example.js` como referência. **Nunca** coloque ali a `service_role` key nem a senha do banco.

## 6. Onde executar os SQLs

No painel do Supabase: **SQL Editor → New query**. Cole e execute **na ordem**:

| Ordem | Arquivo | O que faz |
|---|---|---|
| 1 | `sql/001_tabelas_base.sql` | Tabelas, índices e triggers |
| 2 | `sql/002_rls.sql` | Row Level Security e policies |
| 3 | `sql/003_storage.sql` | Bucket `megabrain-bases` e policies |
| 4 | `sql/004_views.sql` | Views de resumo |
| 5 | `sql/005_dados_exemplo.sql` | (Opcional) dados de demonstração |
| 6 | `sql/006_limpeza.sql` | Função e consultas de limpeza manual |

## 7. Como criar a primeira demanda

1. Abra **Demandas** no menu lateral.
2. Preencha nome (ex.: "Escala próximos 30 dias"), tipo (`escala`), responsável e período.
3. Clique em **Criar demanda**. Um token público é gerado automaticamente.
4. O link público do formulário aparece na lista — botão **Copiar link**.

## 8. Como subir a primeira base

1. Abra **Upload de bases**.
2. Selecione a demanda, o tipo de base (ex.: `tecnicos`) e o arquivo CSV/Excel.
3. Confira a prévia (primeiras 20 linhas) e as colunas normalizadas.
4. Deixe **desmarcada** a opção de guardar o arquivo original (economiza Storage).
5. Clique em **Importar para o Supabase**.

## 9. Como abrir o formulário público

Envie o link `formulario.html?token=SEU_TOKEN` para supervisores/técnicos. Eles preenchem **sem login**. Quem tem o token só enxerga aquela demanda.

## 10. Como exportar o resultado

- **Escala:** botão *Exportar CSV* na página Escala (grade técnico × dia).
- **Custos:** botão *Exportar CSV* na página Custos (registros filtrados).
- **Respostas/bases:** botões de exportação no detalhe da demanda.

Os CSVs saem com separador `;` e BOM UTF-8 — abrem direto no Excel brasileiro.

## 11. Como limpar dados antigos

- **Detalhe da demanda → Limpar dados da demanda:** apaga bases, linhas, respostas, análises, planos, logs e arquivos do Storage daquela demanda.
- **Configurações → Limpar demandas arquivadas:** apaga tudo das demandas com status `arquivada`.
- Ou rode as consultas de `sql/006_limpeza.sql` no SQL Editor.

**Regra de ouro: exporte antes de apagar.**

## 12. Como publicar no GitHub Pages

1. Crie um repositório no GitHub e faça push do projeto.
2. Em **Settings → Pages**, escolha `Deploy from a branch` → branch `main` → pasta `/ (root)`.
3. O portal fica em `https://SEU_USUARIO.github.io/megabrain/`.
4. Como `config.js` contém apenas chaves públicas, pode ser versionado.

## 13. Cuidados com dados sensíveis

- **Não suba** CPF, telefone, endereço, salário ou dados médicos sem autorização.
- Prefira matrícula/nome a documentos pessoais.
- Lembre: com o token, qualquer pessoa acessa os dados públicos da demanda.
- Detalhes em [docs/seguranca.md](docs/seguranca.md).

## 14. Limitações do MVP

- **Sem autenticação:** as páginas administrativas usam a mesma chave pública. As policies do MVP são permissivas — qualquer pessoa com a URL do projeto pode, tecnicamente, ler/escrever nas tabelas. Aceitável para dados operacionais não sensíveis e uso interno; veja [docs/seguranca.md](docs/seguranca.md).
- `base_linhas` usa JSONB genérico — flexível, mas não performático para grandes volumes.
- Consultas do frontend são paginadas e limitadas (~20 mil linhas por leitura).
- Sem edição em massa; a análise pesada é feita pelo Codex/Claude no VS Code.

## 15. O que fazer quando chegar no limite do Supabase Free

1. **Exporte** os resultados das demandas concluídas (CSV).
2. **Arquive** e depois **limpe** as demandas antigas (Configurações).
3. Apague arquivos do Storage (bucket `megabrain-bases`).
4. Rode `sql/006_limpeza.sql` para conferir contagens e liberar espaço.
5. Se o volume for recorrente e alto, considere: uma demanda por vez, importar só as colunas úteis, ou migrar para o plano pago.

Estratégia completa em [docs/supabase-free.md](docs/supabase-free.md).

---

## Documentação

| Doc | Conteúdo |
|---|---|
| [docs/arquitetura.md](docs/arquitetura.md) | Visão geral da arquitetura |
| [docs/modelo-dados.md](docs/modelo-dados.md) | Tabelas e views |
| [docs/fluxo-demanda.md](docs/fluxo-demanda.md) | Ciclo de vida de uma demanda |
| [docs/fluxo-upload.md](docs/fluxo-upload.md) | Fluxo de importação de bases |
| [docs/formularios-publicos.md](docs/formularios-publicos.md) | Links públicos com token |
| [docs/exemplo-escala.md](docs/exemplo-escala.md) | Exemplo completo: escala 30 dias |
| [docs/exemplo-custos.md](docs/exemplo-custos.md) | Exemplo completo: custos operacionais |
| [docs/seguranca.md](docs/seguranca.md) | Segurança e riscos |
| [docs/supabase-free.md](docs/supabase-free.md) | Estratégia para o plano gratuito |
| [docs/prompts-codex.md](docs/prompts-codex.md) | Prompts prontos para o Codex/Claude |
| [docs/roadmap.md](docs/roadmap.md) | Fases de evolução |
