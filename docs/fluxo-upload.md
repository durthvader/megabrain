# Fluxo de arquivos e bases

Há dois caminhos válidos.

## Caminho local informado ao Codex

É o padrão para PPTs, documentos, análises e trabalhos pontuais. Informe o
caminho da pasta ou do arquivo, por exemplo:

```text
C:\Users\<usuario>\Downloads
```

O material processado deve ser copiado ou referenciado dentro do sandbox do
projeto. Caminhos absolutos ficam apenas em `project.local.json`.

## Upload pelo portal

Use `upload.html` quando uma ferramenta baseada no Supabase precisar de uma base
reutilizável. O upload:

1. lê CSV/XLSX no navegador;
2. mostra prévia e normaliza colunas;
3. grava metadados e linhas na biblioteca de bases;
4. opcionalmente guarda o arquivo original no Storage.

O upload não cria um projeto nem um card. Depois, o sandbox da ferramenta deve
registrar privadamente quais bases/IDs externos utiliza.

Evite dados pessoais desnecessários e mantenha RLS restritiva.
