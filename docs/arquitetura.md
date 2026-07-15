# Arquitetura do Megabrain

## Responsabilidades

```text
Conversa com o Codex
        │ cria e executa a demanda
        ▼
projects/<id>/                 um sandbox por projeto
  project.json                 metadados seguros
  project.local.json           links, tokens e caminhos privados
  data/src/public/deliverables ciclo de vida do resultado
        │
        ├── packages/          código compartilhado, quando necessário
        │
        └── sincronizador
                ▼
data/catalogo-projetos*.json
                ▼
Megabrain                      catálogo e visão de infraestrutura
```

O catálogo não cria demandas e não contém a lógica dos projetos. Essa fronteira
permite arquivar ou excluir um sandbox sem alterar os demais trabalhos.

## Camadas do catálogo

- `assets/js/pages/`: renderização das páginas Início, Projetos, Upload e
  Bases/armazenamento.
- `assets/js/services/catalogoService.js`: leitura e mesclagem do catálogo seguro
  com os destinos locais.
- `data/catalogo-projetos.json`: artefato gerado dos `project.json`.
- `data/catalogo-projetos.local.json`: artefato privado gerado dos
  `project.local.json`.
- `scripts/catalogo/sincronizar_catalogo.py`: validação e consolidação.

A Home carrega o catálogo mesmo quando Supabase ou CDN estiverem indisponíveis;
os indicadores de bases degradam separadamente.

## Sandboxes

Cada sandbox segue [o contrato de sandboxes](sandboxes/README.md). O conteúdo
`public/` é um snapshot de implantação e não deve importar navegação ou arquivos
do Megabrain. Dependências verdadeiramente comuns ficam em `packages/` e são
empacotadas ao publicar.

O repositório central atual ignora conteúdo operacional dos sandboxes. Isso evita
que dados, apresentações e tokens novos sejam publicados acidentalmente no
repositório público existente. Um projeto que precise de histórico próprio deve
receber um repositório privado ou armazenamento protegido independente.

## Supabase

Supabase continua como infraestrutura compartilhada para Upload, Bases e para as
instâncias legadas das ferramentas Escala/Duplas/Custos. As tabelas `demandas`,
`demanda_bases`, `base_linhas`, `formulario_respostas` e correlatas não são mais o
cadastro oficial do portfólio.

Consequência: excluir uma pasta de projeto não exclui estado externo. O sandbox
deve inventariar IDs e recursos privados antes de qualquer limpeza destrutiva.

## Compartilhamento

```text
Megabrain local            Projeto A não listado        Projeto B não listado
catálogo completo    ───►  link independente      ───►  link independente
```

Cada projeto compartilhável recebe implantação e ciclo de vida próprios. Para
conteúdo estático e não sensível, a URL não listada contém um identificador
aleatório de 16 caracteres e fica somente no manifesto local. Esse endereço
reduz descoberta acidental, mas não identifica a pessoa que o abriu.

Projetos com dados sensíveis, escrita ou permissões por pessoa continuam exigindo
autenticação e autorização próprias. Escala e Duplas permanecem legados: seus
tokens selecionam a instância no Supabase, mas não corrigem policies permissivas.

## Decisões atuais

1. HTML/CSS/JS simples no catálogo, sem etapa de build.
2. Catálogo gerado a partir dos sandboxes; não editado manualmente como fonte de
   verdade.
3. Metadados seguros e privados separados.
4. Projetos específicos não dependem do ciclo de vida do Megabrain.
5. Ferramentas compartilhadas e SQL permanecem fora dos sandboxes.
6. O catálogo central executa somente em loopback (`127.0.0.1`/`localhost`).
7. Links não listados são aceitos apenas para conteúdo não sensível.
