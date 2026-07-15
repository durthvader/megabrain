# Sandboxes de projetos

Cada subpasta representa um projeto independente. O Megabrain usa somente o
`project.json` para montar o catálogo; links privados e caminhos locais ficam no
`project.local.json`, ignorado pelo Git. Recursos que vivem fora da pasta, como
uma base do Supabase ou um deploy, ficam inventariados em
`resources.local.json`, também ignorado. No repositório central público, a pasta
inteira de cada sandbox é local e não é versionada.

O contrato completo, inclusive criação e exclusão, está em
[`docs/sandboxes/README.md`](../docs/sandboxes/README.md).

Para compartilhar um portal, publique somente o `public/` daquele sandbox em
uma hospedagem separada. O catálogo central e os outros sandboxes não devem
acompanhar esse deploy.

Não copie pastas manualmente. O gerenciador cria, lista e exclui sandboxes e
sincroniza o catálogo:

```powershell
python scripts\projetos\gerenciar.py listar
python scripts\projetos\gerenciar.py criar --help
python scripts\projetos\gerenciar.py excluir --help
```
