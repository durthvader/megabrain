# Megabrain

Megabrain é o catálogo privado dos trabalhos produzidos com o Codex. Ele não é
o lugar onde demandas são abertas, analisadas ou encerradas.

As demandas são criadas nesta conversa. Cada uma recebe um sandbox independente
em `projects/`; o portal apenas mostra status, infraestrutura e um card que leva
ao resultado correspondente.

## O que existe no portal

- **Início:** visão geral dos projetos, status, bases e armazenamento.
- **Projetos:** catálogo pesquisável de resultados — portal, PowerPoint,
  planilha, documento, pasta ou ferramenta.
- **Upload:** envio opcional de CSV/Excel às bases reutilizáveis do Supabase.
- **Bases e armazenamento:** consulta da infraestrutura compartilhada.

Não há criação de demanda nem seção de Análises na interface.

## Organização

```text
Megabrain/
  index.html, resultados.html     catálogo central
  assets/                         interface do Megabrain
  data/
    catalogo-projetos.json        catálogo local gerado; ignorado pelo Git
    catalogo-projetos.local.json  destinos privados; ignorado pelo Git
  projects/
    <project-id>/                 sandbox de um único projeto
      project.json                metadados locais do card
      project.local.json          caminhos, tokens e links privados
      resources.local.json        inventário de recursos fora da pasta
      src/ data/ public/ deliverables/ ...
  packages/                       código local compartilhado entre projetos
  scripts/catalogo/               validação e sincronização do catálogo
  sql/                            infraestrutura legada/reutilizável do Supabase
```

O contrato completo está em [docs/sandboxes/README.md](docs/sandboxes/README.md).

O repositório público não versiona a lista, os nomes nem os arquivos dos
projetos. Cada sandbox, os componentes compartilhados e os dois catálogos
permanecem somente neste computador. Uma página só deve sair desse limite quando
for escolhida explicitamente para um deploy independente. O bundle legado de
Duplas na raiz é a única exceção pública atual e está marcado para exclusão
assistida no inventário daquele sandbox.

## Abrir o código organizado

Abra `Megabrain.code-workspace` em vez da pasta raiz. O Explorer passa a mostrar
dois blocos separados:

- **MEGABRAIN - sistema:** portal, infraestrutura, scripts e documentação;
- **PROJETOS:** somente os sandboxes em `projects/`.
- **PROJETOS - compartilhado:** componentes usados por mais de um sandbox.

As páginas do portal ficam agrupadas sob `index.html` e cada manifesto agrupa os
arquivos de controle do respectivo projeto. O atalho local **Megabrain - Codigo
e Projetos** abre essa visão diretamente no VS Code.

## Abrir localmente

Módulos JavaScript precisam de HTTP; não abra `index.html` com duplo clique.
Na raiz do workspace:

```powershell
.\iniciar-megabrain.ps1
```

Depois abra `http://127.0.0.1:5500/`.

O script usa `python -m http.server 5500 --bind 127.0.0.1`, abre o navegador e
impede que o servidor escute na rede local. As páginas administrativas também
recusam execução fora de `localhost`/`127.0.0.1`.

O catálogo funciona sem conexão com o Supabase. Para usar Upload, Bases ou as
ferramentas legadas somente no ambiente local, crie a configuração a partir do
modelo:

```powershell
Copy-Item assets\js\config.example.js assets\js\config.js
```

`config.js` é ignorado pelo Git e não é publicado pelo repositório central.

## Criar uma nova demanda

Descreva a demanda ao Codex nesta conversa. O fluxo esperado é:

1. criar o sandbox com o gerenciador;
2. produzir o trabalho inteiramente dentro daquele sandbox;
3. guardar caminhos locais ou links restritos em `project.local.json`;
4. sincronizar o catálogo;
5. publicar apenas o `public/` do projeto, se houver, com acesso próprio.

O gerenciador cria a estrutura e atualiza o catálogo no mesmo comando:

```powershell
python scripts\projetos\gerenciar.py criar calendario-operacional `
  --titulo "Calendário operacional" `
  --descricao "Portal do calendário da operação" `
  --tipo portal `
  --responsavel "Operações"
```

O sincronizador recusa caminhos absolutos, tokens e URLs suspeitas no manifesto
do catálogo.

## Arquivos recebidos

O upload do portal continua disponível quando uma ferramenta baseada no
Supabase realmente precisar da base. Na maioria dos trabalhos, basta informar ao
Codex o caminho local, por exemplo:

```text
C:\Users\<usuario>\Downloads
```

O navegador normalmente não pode abrir caminhos `C:\` diretamente. Por isso o
catálogo oferece copiar o caminho e tenta abrir o arquivo apenas como conveniência.

## Compartilhamento e acesso

O Megabrain central é local e não precisa de login. Cada portal compartilhável
deve ser implantado separadamente, sem publicar o catálogo central.

Para páginas estáticas, somente leitura e sem dados sensíveis, o padrão atual é
um link não listado com identificador aleatório de 16 caracteres. Gere uma vez:

```powershell
python scripts\compartilhamento\gerar_token.py
```

Use o identificador no endereço implantado e guarde a URL completa apenas em
`project.local.json`. O link funciona como uma chave compartilhável: qualquer
pessoa que o receber pode abrir e repassar. Ele não substitui autenticação para
dados pessoais, conteúdo sensível ou ferramentas com escrita.

Veja [docs/links-nao-listados.md](docs/links-nao-listados.md).

## Excluir um projeto

Para projetos somente locais, um comando remove o sandbox e seu card sem afetar
o Megabrain ou os demais projetos:

```powershell
python scripts\projetos\gerenciar.py excluir calendario-operacional `
  --confirmar calendario-operacional
```

Ferramentas com estado externo, como Duplas, têm as dependências registradas em
`resources.local.json`. O gerenciador recusa uma exclusão incompleta até que
esses recursos sejam removidos e confirmados. Para conferir a situação:

```powershell
python scripts\projetos\gerenciar.py listar
```

## Segurança

- `projects/*/`, `packages/*/` e os dois catálogos estão ignorados no
  repositório central público; manifests, bases, entregáveis e código específico
  ficam locais.
- Não execute `git clean -fdX` neste workspace: esse comando apaga justamente os
  arquivos locais ignorados. Para excluir um sandbox, use o gerenciador.
- Não armazene `service_role`, senha ou connection string no frontend.
- A chave pública do Supabase só é aceitável com RLS restritiva.
- Links não listados devem usar `noindex`, política de referência restrita e
  somente conteúdo compatível com compartilhamento por link.

Veja também [docs/seguranca.md](docs/seguranca.md) e
[docs/arquitetura.md](docs/arquitetura.md).
