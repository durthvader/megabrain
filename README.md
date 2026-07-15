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
    catalogo-projetos.json        catálogo gerado, sem segredos
    catalogo-projetos.local.json  destinos privados; ignorado pelo Git
  projects/
    <project-id>/                 sandbox de um único projeto
      project.json                metadados seguros
      project.local.json          caminhos, tokens e links privados
      src/ data/ public/ deliverables/ ...
  packages/                       código compartilhado entre projetos
  scripts/catalogo/               validação e sincronização do catálogo
  sql/                            infraestrutura legada/reutilizável do Supabase
```

O contrato completo está em [docs/sandboxes/README.md](docs/sandboxes/README.md).

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

1. criar `projects/<id>/project.json`;
2. produzir o trabalho inteiramente dentro daquele sandbox;
3. guardar caminhos locais ou links restritos em `project.local.json`;
4. sincronizar o catálogo;
5. publicar apenas o `public/` do projeto, se houver, com acesso próprio.

O catálogo é reconstruído com:

```powershell
python scripts\catalogo\sincronizar_catalogo.py --incluir-local
```

O sincronizador recusa caminhos absolutos, tokens e URLs suspeitas no manifesto
público.

## Arquivos recebidos

O upload do portal continua disponível quando uma ferramenta baseada no
Supabase realmente precisar da base. Na maioria dos trabalhos, basta informar ao
Codex o caminho local, por exemplo:

```text
C:\Users\rogerio.fonseca\Downloads
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

Para projetos somente locais, excluir `projects/<id>/` e sincronizar remove o
sandbox e seu card sem afetar o Megabrain ou os demais projetos.

Ferramentas com estado externo, como Escala e Duplas, exigem uma etapa adicional:
excluir a pasta não remove automaticamente registros, respostas, bases ou deploys
no Supabase/hospedagem. O `README.md` do sandbox registra essa dependência.

## Segurança

- `project.local.json`, bases, entregáveis, snapshots publicados e código
  específico estão ignorados no repositório central atual.
- Não armazene `service_role`, senha ou connection string no frontend.
- A chave pública do Supabase só é aceitável com RLS restritiva.
- Links não listados devem usar `noindex`, política de referência restrita e
  somente conteúdo compatível com compartilhamento por link.

Veja também [docs/seguranca.md](docs/seguranca.md) e
[docs/arquitetura.md](docs/arquitetura.md).
