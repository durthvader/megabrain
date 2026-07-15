# Pipeline compartilhado de Custo de Horas

O pacote contém o código comum; cada regional mantém dados, narrativa e entrega
no próprio sandbox `projects/horas-<regiao>/`.

## Atualizar uma regional

```powershell
python packages\horas\extrair_horas.py --pasta "C:\caminho\dos\exports" --regiao ceara
python packages\horas\build_horas.py --regiao ceara
```

Por padrão, o extrator grava em
`projects/horas-<regiao>/data/processed/dados.json`; o gerador lê também
`content/narrativa.json` e salva em `deliverables/`.

Os parâmetros `--dados`, `--narrativa` e `--saida` continuam disponíveis para
execuções fora da convenção.

A descrição detalhada do formato das fontes e das regras do pipeline anterior
foi preservada em [REFERENCIA_PIPELINE_ORIGINAL.md](REFERENCIA_PIPELINE_ORIGINAL.md).
