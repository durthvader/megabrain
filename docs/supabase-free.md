# Uso econômico do Supabase

Supabase é infraestrutura auxiliar para bases e algumas ferramentas; não é o
repositório permanente dos projetos. Limites e preços mudam, portanto consulte o
painel do provedor para os números atuais.

## Regras práticas

1. Envie somente colunas e linhas necessárias.
2. Não guarde o arquivo original no Storage quando o sandbox local já o preserva.
3. Evite duplicar bases corrigidas; identifique e remova a versão obsoleta pelo
   painel/SQL com conferência prévia.
4. Exporte o resultado antes de qualquer limpeza.
5. Trate `base_linhas` como área de trabalho, não data warehouse.
6. Monitore banco, Storage e tráfego diretamente no dashboard do Supabase.
7. Não execute exclusões em lote sem listar IDs, vínculos e projetos afetados.

As rotinas SQL existentes permanecem em `sql/006_limpeza.sql`, mas a interface do
Megabrain não oferece mais ações administrativas de exclusão. Isso reduz o risco
de apagar estado externo ao remover um sandbox.
