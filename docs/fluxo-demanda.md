# Fluxo de um projeto

Demandas novas começam na conversa com o Codex, não no portal.

## 1. Enquadrar

Defina objetivo, público, formato de entrega, prazo, fontes e quem poderá ver o
resultado. Quando alguma decisão mudar materialmente o resultado, o Codex deve
perguntar antes de avançar.

## 2. Criar o sandbox

Crie `projects/<id>/project.json` e, quando necessário, o manifesto privado
`project.local.json`. Todo material específico entra nessa pasta; código comum a
mais de um trabalho vai para `packages/`.

## 3. Produzir e validar

- entradas em `data/`;
- código específico em `src/`;
- portal implantável em `public/`;
- entregáveis em `deliverables/`;
- decisões e contexto no `README.md` ou `docs/`.

Valide o resultado no formato final — navegador, PowerPoint, planilha ou outro.

## 4. Registrar no catálogo

Atualize status e datas no manifesto, configure os destinos locais e rode:

```powershell
python scripts\catalogo\sincronizar_catalogo.py --incluir-local
```

O card passa a apontar diretamente ao resultado.

## 5. Compartilhar

Se houver portal, implante somente o `public/` daquele sandbox em uma aplicação
independente. Para conteúdo estático e não sensível, gere um identificador de 16
caracteres, componha o endereço não listado e guarde a URL somente em
`project.local.json`:

```powershell
python scripts\compartilhamento\gerar_token.py
```

Adicione `noindex` e política `no-referrer` à página. Se houver dados sensíveis,
escrita ou acesso individualizado, o link não listado não basta: use autenticação
adequada antes de compartilhar.

## 6. Arquivar ou excluir

Arquivar altera o status para `arquivado`. Excluir remove o sandbox e, após a
sincronização, o card. Recursos externos — Supabase, deploy, grupos, links de
arquivo — precisam de limpeza explícita e separada.
