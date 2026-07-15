# Gerenciador de projetos

Este comando concentra o ciclo de vida dos sandboxes em `projects/`.

```powershell
python scripts\projetos\gerenciar.py listar
python scripts\projetos\gerenciar.py criar --help
python scripts\projetos\gerenciar.py excluir --help
```

`criar` gera os manifestos e as pastas iniciais conforme o tipo do resultado.
`excluir` aceita somente um filho direto e validado de `projects/`, recusa links
e junctions, verifica recursos externos e atualiza o catálogo automaticamente.

Projetos sem recursos externos são removidos em uma operação. Quando
`resources.local.json` está preenchido, primeiro remova os recursos listados e
só então repita o comando com `--recursos-externos-removidos`.

Os sandboxes e componentes compartilhados são ignorados pelo Git para não serem
publicados. Por isso, nunca use `git clean -fdX` neste workspace; ele apagaria os
arquivos locais ignorados de todos os projetos.
