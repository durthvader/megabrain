# Sandboxes de projetos

Cada subpasta representa um projeto independente. O Megabrain usa somente o
`project.json` para montar o catálogo; links privados e caminhos locais ficam no
`project.local.json`, ignorado pelo Git.

O contrato completo, inclusive criação e exclusão, está em
[`docs/sandboxes/README.md`](../docs/sandboxes/README.md).

As pastas `src/`, `data/`, `content/`, `docs/`, `public/`, `deliverables/` e
`archive/` são privadas neste repositório público. Para compartilhar um portal,
publique somente o `public/` daquele sandbox em uma hospedagem com controle de
acesso próprio.
