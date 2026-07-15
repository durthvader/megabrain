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
Megabrain privado          Projeto A protegido          Projeto B protegido
catálogo completo    ───►  usuários/grupo A       ───►  usuários/grupo B
```

Cada projeto compartilhável precisa de implantação e política de acesso próprias.
Subpastas em um único site, cards ocultos e tokens não formam uma fronteira de
autorização.

## Decisões atuais

1. HTML/CSS/JS simples no catálogo, sem etapa de build.
2. Catálogo gerado a partir dos sandboxes; não editado manualmente como fonte de
   verdade.
3. Metadados seguros e privados separados.
4. Projetos específicos não dependem do ciclo de vida do Megabrain.
5. Ferramentas compartilhadas e SQL permanecem fora dos sandboxes.
