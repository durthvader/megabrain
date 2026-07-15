# Links não listados

Links não listados são o padrão provisório para compartilhar páginas estáticas,
somente leitura e sem dados sensíveis. Eles reduzem descoberta acidental, mas
não comprovam a identidade de quem abriu a página.

## Criar

Gere o identificador uma única vez:

```powershell
python scripts\compartilhamento\gerar_token.py
```

O padrão usa 16 caracteres aleatórios sem símbolos ambíguos. Incorpore o valor
no caminho da implantação, quando a hospedagem suportar:

```text
https://site.exemplo.com/p/k7mx4pq9vr2ct8wj/
```

Se a aplicação realmente validar um parâmetro, também pode usar:

```text
https://site.exemplo.com/?token=k7mx4pq9vr2ct8wj
```

Não use `#identificador` como proteção. O fragmento fica somente no navegador e
o servidor continua entregando a mesma página.

## Guardar

- salve a URL final apenas em `projects/<id>/project.local.json`;
- marque a sobreposição local como `visibilidade: "nao_listado"` e
  `modo_acesso: "link_secreto"`;
- nunca grave o identificador em `project.json`, catálogo versionado, documentação,
  código versionado ou mensagem de log;
- não regenere o valor ao sincronizar o catálogo.

## Preparar a página

Inclua no `<head>`:

```html
<meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
<meta name="referrer" content="no-referrer" />
```

Quando a hospedagem permitir, prefira também os cabeçalhos
`X-Robots-Tag`, `Referrer-Policy: no-referrer` e `Cache-Control: private,
no-store`.

## Limites e revogação

Qualquer pessoa com o link pode abrir, copiar ou repassar. Se houver vazamento,
troque o identificador ou remova a implantação e atualize o manifesto local.

Não use esse modelo para CPF, endereço, salário, informação médica ou bancária,
dados de clientes, páginas administrativas ou ferramentas que alterem dados.
Duplas usa um token legado para selecionar sua instância no Supabase; isso não
impede acesso direto às APIs enquanto as policies continuarem permissivas.
