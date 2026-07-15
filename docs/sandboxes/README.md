# Contrato de sandbox de projeto

Cada demanda ou projeto deve morar em uma pasta autônoma sob `projects/`. O
Megabrain lê apenas o catálogo consolidado; ele não precisa conhecer a estrutura
interna nem compartilhar o ciclo de vida do projeto.

## Estrutura

```text
projects/
  <project-id>/
    project.json          # metadados seguros e versionáveis
    project.local.json    # destinos privados; nunca versionar nem publicar
    README.md             # objetivo, operação e decisões do projeto
    src/                  # código exclusivo do projeto
    data/
      public/             # dados que podem acompanhar uma publicação
      private/            # entradas e dados sensíveis; não publicar
    public/               # portal independente, pronto para deploy isolado
    deliverables/         # PPTX, PDF, XLSX e demais entregáveis
    archive/              # versões encerradas, quando houver necessidade
```

Código verdadeiramente reutilizado por mais de um projeto não pertence a um
sandbox: ele deve ficar em `packages/`. Assim, excluir `projects/<project-id>`
remove o projeto sem apagar o Megabrain nem uma biblioteca compartilhada.

## Regras de isolamento

1. O nome da pasta e o campo `id` devem ser iguais e usar `kebab-case`.
2. `project.json` não pode conter token, senha, chave, URL assinada, caminho
   absoluto, `file://` nem outro dado privado.
3. Caminhos locais e links com credenciais ficam somente em
   `project.local.json`.
4. No repositório central público atual, todo o conteúdo operacional do sandbox
   permanece local. Estão ignorados:

   ```gitignore
   projects/*/project.local.json
   projects/*/data/
   projects/*/deliverables/
   projects/*/public/
   projects/*/src/
   projects/*/content/
   projects/*/docs/
   projects/*/archive/
   ```

   Se um projeto precisar de histórico ou deploy contínuo, use um repositório
   privado próprio; não remova essas proteções do repositório central público.

5. O conteúdo de `public/` deve funcionar sem depender do portal Megabrain. Isso
   permite hospedar cada portal separadamente.
6. Para conteúdo estático e não sensível, o endereço não listado é guardado
   somente no manifesto local. Ele reduz descoberta, mas pode ser repassado.
   Conteúdo sensível ou com escrita exige autenticação real.
7. Arquivos gerados não devem apontar para fora do sandbox por caminhos relativos
   com `..`. Dependências compartilhadas devem ser empacotadas no build.

## Manifesto público

`project.json` segue [project.schema.json](project.schema.json). Exemplo:

```json
{
  "$schema": "../../docs/sandboxes/project.schema.json",
  "id": "calendario-operacional",
  "titulo": "Calendário operacional",
  "descricao": "Portal de consulta do calendário da operação.",
  "status": "publicado",
  "tipo": "portal",
  "responsavel": "Operações",
  "criado_em": "2026-07-15",
  "atualizado_em": "2026-07-15",
  "tags": ["calendario", "operacao"],
  "resultado_principal": null,
  "artefatos": [],
  "compartilhamento": {
    "visibilidade": "nao_listado",
    "publico_descricao": "Link guardado somente no catálogo local",
    "modo_acesso": "link_secreto"
  }
}
```

`resultado_principal` pode ser `null` enquanto o resultado ainda não existir.
Um destino público deve ter `tipo`, `rotulo` e `href`. Para ordenar manualmente
os projetos antes do `id`, pode-se adicionar o inteiro opcional `ordem`.

## Manifesto local

`project.local.json` é uma sobreposição privada e pequena. Ele pode substituir
somente `resultado_principal`, `artefatos` e partes de `compartilhamento`:

```json
{
  "id": "calendario-operacional",
  "resultado_principal": {
    "tipo": "url",
    "rotulo": "Abrir portal",
    "href": "https://site.exemplo.com/p/k7mx4pq9vr2ct8wj/",
    "caminho_local": null
  },
  "artefatos": [
    {
      "tipo": "pptx",
      "rotulo": "Copiar caminho do PowerPoint",
      "href": null,
      "caminho_local": "C:\\Resultados\\calendario.pptx"
    }
  ],
  "compartilhamento": {
    "visibilidade": "nao_listado",
    "publico_descricao": "Acesso pelo link não listado",
    "modo_acesso": "link_secreto"
  }
}
```

Esse arquivo serve ao catálogo executado localmente e mantém o endereço fora do
Git. O link ainda pode ser repassado por quem o recebeu; não use essa modalidade
para conteúdo sensível.

## Sincronização do catálogo

Na raiz do workspace:

```powershell
python scripts/catalogo/sincronizar_catalogo.py
```

O comando valida todos os `projects/*/project.json` e, se não houver erro, gera
`data/catalogo-projetos.json` de forma determinística.

Para validar sem escrever:

```powershell
python scripts/catalogo/sincronizar_catalogo.py --somente-validar
```

Para também consolidar os arquivos privados — somente quando eles já estiverem
ignorados pelo Git:

```powershell
python scripts/catalogo/sincronizar_catalogo.py --incluir-local
```

O resultado privado é `data/catalogo-projetos.local.json`. Esse arquivo também
deve permanecer ignorado pelo Git.

## Criar, arquivar e excluir

- Criar: copie a estrutura, defina um `id` único, preencha `project.json` e rode
  o sincronizador.
- Arquivar: mude `status` para `arquivado`, mova versões antigas para `archive/`
  se necessário e sincronize.
- Excluir: remova apenas `projects/<project-id>` e sincronize novamente. O card
  some do catálogo; bibliotecas em `packages/` e o Megabrain permanecem.
- Publicar: faça o deploy somente de `public/` (ou do artefato de build do
  sandbox), gere o link não listado quando adequado e registre a URL final apenas
  no manifesto local.
