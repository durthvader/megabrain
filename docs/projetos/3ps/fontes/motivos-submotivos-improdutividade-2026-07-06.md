# Projeto 3Ps — Motivos e submotivos de improdutividade (arquivos reais)

## Identificação

Estes dois arquivos substituem, para a dimensão de motivo e submotivo, a transcrição do print usada em `evidencia-dashboard-improdutividade-2026-07-06.md`. Não são mais um recorte de tela: são exportações do BI em `.xlsx`, com filtros e totais explícitos na própria planilha.

| Arquivo | SHA-256 | Linhas de dado |
|---|---|---:|
| `Improdutivas  Motivos Baixa .xlsx` | `ff5a215e37d72c78c892d2a159588e8d4f8bdc95848f60d97713d44da9036937` | 20 motivos |
| `Improdutivas  Submotivos Baixa .xlsx` | `2c0fe80e51a7377673c054c8ddae34d19380cb8e3cf4596fe10b68defa0b3c80` | 32 submotivos |

**Filtros aplicados (idênticos nos dois arquivos, célula A1 da planilha):**

- `ultimo_servico` = REPARO
- `Gerente` não é um dos 8 nomes de outra hierarquia corporativa (lista de exclusão do BI; nenhum deles é o Gerente Geral do Ceará)
- `Nome_RH` = B2C
- `Status` = Ativo
- `Date` entre 01/07/2026 00:00 e 04/07/2026 00:00 (ou seja, 01 a 03/07)
- `Tempo Treinamento` = Tempo de Treinamento ultrapassado
- `Ano` = 2026 · `eps` = GIGA+

## O que mudou em relação ao print

A transcrição do print (`evidencia-dashboard-improdutividade-2026-07-06.md`) registrava 212 baixas classificadas por motivo, com a ressalva explícita de que a lista podia estar cortada pela rolagem da tela. Os arquivos reais confirmam essa suspeita: contêm os mesmos 15 motivos do print, mais 5 motivos adicionais (1 ocorrência cada) que não apareciam na captura.

- **Total real de motivos:** 217 (antes: 212 visíveis no print).
- **Total real de submotivos:** 217 — bate exatamente com o total de motivos, confirmando que as duas exportações descrevem o mesmo conjunto de 217 baixas, em dois níveis de detalhe.

## Motivos (completo, 217 ocorrências)

| Motivo | Quantidade |
|---|---:|
| Abertura indevida | 59 |
| Cliente Ausente | 52 |
| Solicitação de reagendamento | 36 |
| Falha massiva | 23 |
| Desistiu do serviço | 9 |
| Área de risco | 5 |
| Triagem CST | 5 |
| Troca conector externo | 5 |
| Visita a campo evitada | 5 |
| Drop refeito | 4 |
| Entrada não autorizada | 3 |
| Troca conector interno | 2 |
| Troca ONU | 2 |
| Chuva | 1 |
| Falta material | 1 |
| Normalizado sem intervenção técnica | 1 |
| Reconexão Externa - CTO | 1 |
| Reconexão Interna | 1 |
| Reconfiguração ONU | 1 |
| Tubulação obstruída | 1 |
| **Total** | **217** |

Os quatro motivos principais somam 170 registros, ou **78,3%** das 217 baixas classificadas (antes: 80,2% de 212 — a proporção não muda de forma relevante com os 5 motivos adicionais).

## Submotivos (completo, 217 ocorrências, 32 categorias)

| Submotivo | Quantidade |
|---|---:|
| Casa fechada | 41 |
| Reagendamento | 36 |
| Demanda não é técnica | 25 |
| Cliente não solicitou serviço | 17 |
| Sinal e potência normalizados | 17 |
| Sem potência | 13 |
| Cliente não estava em casa | 11 |
| Potência fora do padrão | 7 |
| Serviço não é mais necessário | 7 |
| Desgaste natural | 5 |
| TRIADOCST_Online | 5 |
| Risco à integridade | 4 |
| Serviço não autorizado | 3 |
| Ações de terceiros | 2 |
| Carga alta | 2 |
| FTTA com problema | 2 |
| Inclusão em Massiva pós Abertura OS | 2 |
| Instruções ao cliente foram suficientes | 2 |
| Motivos pessoais | 2 |
| (em branco) | 2 |
| Chuva | 1 |
| Cliente desconectado na CTO | 1 |
| Confirmação retorno do sinal e potência | 1 |
| Desconectado na ONU | 1 |
| Massiva em andamento | 1 |
| Normalizado sem intervenção técnica | 1 |
| ONU | 1 |
| Operação policial | 1 |
| Poda de árvore | 1 |
| Problema no roteador wifi cliente | 1 |
| Problemas no wifi | 1 |
| Tubulação externa | 1 |
| **Total** | **217** |

## O que ainda não fecha: 217 de 328

O total de 328 improdutivas não vem apenas do print — está confirmado de forma independente na base nominal por técnico (`10007154-8266-4eb7-aae3-bd095040cd03`, campo `volume_improdutivo`), somando exatamente 328 tanto por `gerente_geral` (Jose Nilton Mendes Lima, único gerente geral responsável pelos 127 técnicos do Ceará) quanto por `gestor_operacoes`:

| Gestor de Operações | Cluster | Improdutivas (base nominal) |
|---|---|---:|
| Jose Nilton Mendes Lima | C.27 Fortaleza | 213 |
| Jose Geraldo Barbosa da Silva | C.26 Ceará Interior | 95 |
| Jefferson Oliveira da Silva | C.27 Fortaleza | 20 |
| Francisco Cleiton Cruz do Nascimento | C.26/C.27 | 0 |
| **Total** | | **328** |

Essa reconciliação também confirma que a responsabilidade atribuída no FCA (Jose Nilton e Jefferson para Fortaleza; Jose Geraldo e Francisco Cleiton para o Interior) está correta.

Com os arquivos reais de motivo e submotivo, a cobertura sobe de 212/328 (64,6%) para **217/328 (66,2%)**. Ainda restam **111 improdutivas (33,8%) sem motivo nem submotivo atribuído** nesses dois arquivos. Como os arquivos agora são exportações completas do BI — não um print cortado — essa lacuna deixa de ser um problema de transcrição e passa a ser uma lacuna real de classificação no sistema de origem: 111 baixas foram registradas como improdutivas, mas sem preenchimento de motivo/submotivo pelo técnico ou pelo sistema.

**Isso não foi reconciliado nesta rodada.** Possíveis explicações a validar com o BI: (1) baixas sem motivo obrigatório no fluxo do aplicativo de campo; (2) um filtro adicional nos dois arquivos (por exemplo, algo além de `ultimo_servico = REPARO`) que exclua um subconjunto das 328; (3) diferença de definição entre "improdutiva" (ranking por GO) e "baixa com motivo" (estas duas exportações). Nenhuma dessas hipóteses foi confirmada — permanece como pendência explícita, e não deve ser tratada como 100% das 328 já explicadas.
