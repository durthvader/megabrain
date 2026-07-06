# Projeto 3Ps — Análise executiva do Ceará

## Mensagem central

Fortaleza (C.27) concentra o risco operacional: está abaixo nos três Ps e também abriu 06/07 com fila acima de um dia de trabalho (1,125 dia). Ceará Interior (C.26) está bem em quase tudo — Presença acima da meta e fila dentro do limite (0,820 dia) —, fechando o Prazo apenas por margem mínima. A recuperação começa nominal: 3 áreas de gestão e 15 técnicos definem metade do desvio de Produção. Combina-se a isso a conversão diária de presença em produção e a redução das visitas improdutivas geradas antes do despacho — OS aberta sem necessidade, cliente não confirmado e falha massiva.

## Escopo e metodologia

- Estado: Ceará.
- Clusters: C.26 Ceará Interior e C.27 Fortaleza.
- Presença: foto de 03/07/2026.
- Produção agregada: fechamento S27, de 29/06 a 05/07, atualizado em 06/07.
- Produção nominal e improdutividade: 01/07 a 03/07.
- Prazo 24h: S27, com meta operacional de 85% registrada no painel.
- Não foram somadas métricas duplicadas. Exportações posteriores substituem snapshots anteriores para o mesmo indicador, cluster e período.
- Produtividade OK é a métrica executiva. Baremo OK permanece como sensibilidade, sem acumulação.

## 1. Leitura macro dos 3 Ps

| Indicador | Meta | C.26 Ceará Interior | Leitura | C.27 Fortaleza | Leitura |
|---|---:|---:|---|---:|---|
| Presença em 03/07 | 95,0% | 102,5% | Acima | 94,5% | Abaixo em 0,5 p.p. |
| Produção OK S27 | Meta por tempo de casa | 3,5 OS/dia agregado | Desvio nas faixas de 60–89 e >90 dias | 3,2 OS/dia agregado | Desvio nas três faixas |
| Prazo 24h S27 | 85,0% | 85,2% | Apenas 0,2 p.p. acima | 83,2% | Abaixo em 1,8 p.p. |
| Dias de estoque em 06/07 | ≤ 1 dia | 0,820 | Dentro do limite | 1,125 | Risco de deterioração |

### Implicação

- **C.27 Fortaleza é a regional crítica:** falha nos três Ps, concentra 66% do gap estimado de Produção e também estourou o limite de fila em 06/07 (1,125 dia) — falha nos quatro indicadores acompanhados.
- **C.26 Interior está bem em quase tudo, mas sem folga no Prazo:** Presença acima da meta e fila dentro do limite (0,820 dia); o fechamento semanal do Prazo atingiu a meta por margem mínima (+0,2 p.p.), sem espaço para regredir.
- Presença acima de 100% no Interior indica realizado superior ao planejamento e exige apenas validação do denominador; não deve ser interpretada como disponibilidade ilimitada.

## 2. Produção do macro ao micro

### 2.1 Fechamento agregado da S27

| Cluster | H.C trabalhado | Produtividade OK | Produtividade OK e NOK |
|---|---:|---:|---:|
| C.26 Interior | 43 | 3,5 | 4,2 |
| C.27 Fortaleza | 81 | 3,2 | 4,3 |
| **Ceará** | **124** | **3,3** | **4,3** |

A diferença entre OK e OK+NOK evidencia volume executado que não se converte integralmente em baixa válida. A gestão deve proteger a qualidade da execução, sem compensar produtividade com ordens NOK.

### 2.2 A régua correta é por tempo de casa

Na foto nominal de 01 a 03/07, 127 técnicos eram elegíveis para a medição 11 OK:

| Cluster | Elegíveis | Abaixo da meta individual | Sem produção | Gap estimado |
|---|---:|---:|---:|---:|
| C.26 Interior | 46 | 25 (54,3%) | 3 | 83,5 OS |
| C.27 Fortaleza | 81 | 61 (75,3%) | 5 | 162,0 OS |
| **Ceará** | **127** | **86 (67,7%)** | **8** | **245,5 OS** |

O gap é uma estimativa operacional: `máximo(meta individual × dias trabalhados − volume OK, 0)`.

### 2.3 O desvio está no time veterano — mas o dado precisa ser lido com honestidade

- 115 dos 127 técnicos elegíveis (91%) são veteranos, com mais de 90 dias de casa. Como o quadro é quase todo veterano, é natural que esse grupo concentre a maior parte do gap (222 das 245,5 OS, ou 90,4%) — o número acompanha a proporção do quadro e, sozinho, não prova nada.
- A leitura executiva correta é outra: **o desvio não tem desculpa de rampa**. 76 dos 115 veteranos (66%) estão abaixo da meta que já deveriam cumprir integralmente.
- Os dez casos restantes abaixo da meta estão nas faixas de 30–59 e 60–89 dias e pedem tratamento de rampa, não a mesma abordagem dos veteranos.

### 2.3.1 Os "8 sem produção" são, na verdade, dois problemas diferentes

A verificação nominal dos oito técnicos NP (sem produção) mostrou que o rótulo escondia dois fenômenos distintos:

- **7 técnicos não trabalharam nenhum dia entre 01 e 03/07**: Anderson Saraiva, Genilson Nogueira e Felipe Morais (C.26); Emanoel Dias, Egtonio Nunes, Felipe Damasceno e Otávio Dantas (C.27). Não é caso de baixa produtividade — é capacidade fora de campo, a confirmar com RH e escala (férias, atestado ou vaga a repor). Como não trabalharam, eles contribuem com zero para o gap de 245,5 OS.
- **1 técnico trabalhou os 3 dias sem produzir B2C**: John Wayne Queiroz (C.27) executou apenas atividades OEM, que não contam para a meta. É decisão de alocação de agenda, não de cobrança individual. O mesmo padrão aparece em Jean Carlos Freitas (C.26), que fez quase só OEM, B2B e apoio.

### 2.3.2 Concentração nominal do gap

- **Por área de gestão (GA):** a área de Pedro Henrique Marques Ferreira (C.27) tem 21 dos 22 técnicos abaixo da meta e 63 OS de gap — 26% de toda a perda do Ceará — além de liderar o ranking de improdutivas por GA (82 de 328). As três maiores áreas (Pedro Henrique, Romildo Albuquerque e Agenor Vieira) somam 121 OS, 49% do gap estadual.
- **O gap de 63 não é só o maior em volume, é desproporcional ao tamanho da equipe:** a área executou 167 das 230 OS esperadas (meta × dias trabalhados), uma perda de 27,5% da própria capacidade — contra 19,2% de perda média no Ceará (1.101 executadas de 1.279 esperadas). Com 17% dos técnicos do estado, a área responde por 26% do gap; produz em média 2,65 OS/dia por técnico, a taxa mais baixa entre todas as GAs (a segunda pior, Romildo Albuquerque, entrega 3,18).
- **Por técnico:** os 8 maiores desvios individuais somam 65,5 OS (27% do gap). Entre os 86 abaixo da meta, 38 estão a até 2 OS da meta no período (menos de 1 OS/dia) — casos de ajuste fino de carga e rota, não de plano intensivo.
- **Referências:** Carlos André (7,3 OS/dia), Miguel Gomes (7,0) e Francisco Wagner (6,0) entregam quase o dobro da meta nas mesmas condições — evidência de que a meta de 4 OS/dia é atingível.

### 2.4 Quartil relativo não substitui meta absoluta

- Q1: 51 técnicos, 40,2%.
- Q2: 47 técnicos, 37,0%.
- Q3: 18 técnicos, 14,2%.
- Q4: 3 técnicos, 2,4%.
- NP: 8 técnicos, 6,3%.

Dos 47 técnicos Q2, 46 ficaram abaixo da meta individual. Logo, usar apenas Q3, Q4 e NP deixaria grande parte do gap sem ação. O quartil prioriza; a meta por tempo de casa decide conformidade.

## 3. Conversão diária da capacidade

| Data | Folha | Trabalharam | Produtivos | Produtivos / trabalharam | Sem baixa no dia |
|---|---:|---:|---:|---:|---:|
| 01/07 | 135 | 107 | 97 | 90,7% | 28 |
| 02/07 | 135 | 110 | 103 | 93,6% | 25 |
| 03/07 | 135 | 110 | 99 | 90,0% | 25 |

Há duas perdas distintas:

1. Folha que não se converte em dia trabalhado, incluindo escala, férias e demais ocorrências.
2. Dia trabalhado que não se converte em dia produtivo: foram 10, 7 e 11 técnicos nos três dias.

O ritual diário deve separar essas perdas até o nível nominal; tratar tudo como “baixa produtividade” mistura causas de RH, escala, despacho e execução.

## 4. Improdutividade e causas

O volume nominal registrou 328 improdutivas. Esse total está confirmado de duas formas independentes: pelo ranking do painel (por GO) e pela soma do campo `volume_improdutivo` na base nominal por técnico — as duas batem exatamente:

- Jose Nilton Mendes Lima (GO, C.27 Fortaleza): 213, ou 64,9%.
- Jose Geraldo Barbosa da Silva (GO, C.26 Interior): 95, ou 29,0%.
- Jefferson Oliveira da Silva (GO, C.27 Fortaleza): 20, ou 6,1%.

Em 06/07 foram obtidos os arquivos reais de motivo e submotivo (`Improdutivas Motivos Baixa.xlsx` e `Improdutivas Submotivos Baixa.xlsx`, detalhados em `fontes/motivos-submotivos-improdutividade-2026-07-06.md`), que substituem a transcrição do print usada até então. Eles confirmam **217 baixas com motivo e submotivo classificado** — 5 a mais do que os 212 visíveis no print, que estava de fato cortado pela rolagem da tela, como já havíamos sinalizado. Os quatro motivos principais somam 170, ou 78,3% das 217 classificadas:

| Motivo | Quantidade | Share das 217 classificadas |
|---|---:|---:|
| Abertura indevida | 59 | 27,2% |
| Cliente ausente | 52 | 24,0% |
| Solicitação de reagendamento | 36 | 16,6% |
| Falha massiva | 23 | 10,6% |

### Interpretação

- **Qualidade da demanda:** abertura indevida e demanda não técnica sugerem oportunidade de bloqueio antes do despacho.
- **Disponibilidade do cliente:** ausência, casa fechada e não autorização pedem confirmação preventiva e política de reincidência.
- **Programação:** reagendamento deve sair da fila antes de consumir capacidade de campo.
- **Rede:** falha massiva exige supressão automática de despachos individuais quando houver correlação conhecida.

Essa leitura não absolve a execução individual, mas mostra que cobrança de técnico isolada não elimina a maior parte das baixas classificadas.

### Limite da evidência

Com os arquivos reais, a cobertura sobe de 212/328 (64,6%) para **217/328 (66,2%)**. Ainda restam **111 improdutivas (33,8%) sem motivo nem submotivo atribuído**. Como os dois arquivos agora são exportações completas do BI — não mais um print sujeito a corte de tela — essa lacuna deixou de ser um problema de transcrição e passou a ser uma lacuna real de classificação no sistema de origem, ainda não explicada. Antes de tratar os 78,3% como proporção de todo o volume de improdutivas, é necessário reconciliar os 111 casos restantes com o BI.

## 5. Sensibilidade do Baremo OK

- O Baremo inclui 135 técnicos; 127 também aparecem na metodologia 11 OK.
- Nos 127 comparáveis, aumenta a produtividade em média 0,27 OS/dia.
- 18 técnicos sobem de quartil: 11 de Q2 para Q1 e sete de Q3 para Q2.
- Os oito técnicos adicionais são de Fortaleza; sete estão NP e um Q3.

Recomendação: manter 11 OK como métrica oficial, alinhada à ata, e usar Baremo apenas para explicar mix de atividade. Trocar de métrica durante a recuperação criaria melhora estatística sem garantir melhora operacional.

## 6. Solução recomendada

### Frente 1 — Gestão diária por exceção

Implantar três cortes de controle, com lista nominal por GA:

- **09h:** Presença, escala, ferramenta, frota, login e carga atribuída.
- **12h:** técnicos sem primeira OS OK, motivo e ação para o mesmo dia.
- **16h30:** dia trabalhado sem produção, produtividade abaixo da faixa e risco de 24h.

Saída diária: técnico, fato, causa padronizada, ação, dono, prazo e evidência de encerramento.

### Frente 2 — Segmentação nominal

- **Parados (7):** técnicos sem nenhum dia trabalhado no período. Confirmar com RH e escala em 24 horas se é férias, atestado ou vaga a repor, e devolver a capacidade ao campo.
- **Fora da agenda B2C (2):** John Wayne Queiroz e Jean Carlos Freitas trabalharam, mas quase só em OEM, B2B e apoio. Decidir a alocação: devolver à agenda B2C ou formalizar a função e retirar da medição.
- **Desvio crítico (8, contando os 2 acima):** maiores gaps individuais, 27% da perda. Conversa individual gestor-técnico com plano simples de recuperação e acompanhamento diário.
- **Desvio médio (33):** entre 2,5 e 5 OS de gap no período. Conversa individual até 10/07.
- **Quase na meta (38):** até 2 OS de gap. Ajuste de carga e rota; não consomem agenda de 1:1 intensivo.
- **Na meta (41):** reconhecer e usar como referência operacional (rota, carga e método de Carlos André, Miguel Gomes e Francisco Wagner).
- **Travados pela demanda (4):** André Jefferson, Jadson Araújo, Adriano Sousa e Luiz Nauá tiveram 6 a 7 visitas improdutivas cada em 3 dias. Tratar pela frente de qualidade da demanda, não por cobrança individual.

### Frente 3 — Redução das causas de demanda

- Reconciliar as 328 improdutivas com motivo e submotivo até atingir cobertura superior a 95%.
- Criar barreira de qualidade para abertura indevida e demanda não técnica.
- Confirmar cliente antes do despacho e retirar reagendamentos da carga do dia.
- Integrar massivas ao despacho para impedir visitas evitáveis.
- Acompanhar semanalmente volume e reincidência dos quatro motivos prioritários.

### Frente 4 — Proteção de Prazo

- C.27: todo início de manhã, puxar a lista das ordens abertas no dia anterior que ainda não foram atendidas e priorizar as com mais de 20 horas, antes que estourem o prazo de 24h, até a fila voltar a um dia ou menos (hoje em 1,125); elevar o atendimento em 24h em pelo menos 1,8 p.p.
- C.26: manter a fila abaixo de um dia (hoje em 0,820) e proteger a margem mínima do Prazo (+0,2 p.p.) para não regredir.
- Não deslocar capacidade para Produção sem avaliar o efeito sobre Prazo.

### Frente 5 — Governança e fonte única

- Usar o modelo REDIR e discutir somente desvios.
- Fixar Produtividade OK como indicador oficial; Baremo é diagnóstico.
- Registrar data de atualização, período e filtro em todo número apresentado.
- Nunca somar snapshots e exportações do mesmo painel.

## 7. FCA executivo proposto

| Fato | Causa | Ação | Prazo | Responsável | Status |
|---|---|---|---|---|---|
| Fortaleza abaixo nos três Ps: Presença 94,5%, Produção 3,2 OS/dia e Prazo 83,2% | Em Produção, 61 dos 81 técnicos abaixo da meta, com metade da perda em 3 áreas (Pedro Henrique, Agenor e Thiago Rabelo). Presença e Prazo com causa em levantamento | Controle diário em 3 horários — 9h presença e carga, 12h primeira OS concluída, 16h30 risco de dia sem produção — com lista nominal e providência no mesmo dia | Início 07/07; 1ª revisão 13/07 | José Nilton (GO), Jefferson Oliveira e GAs de Fortaleza | A iniciar |
| 245,5 OS não executadas: 86 dos 127 técnicos abaixo da meta em 01–03/07 | Três perfis distintos: 7 técnicos sem nenhum dia trabalhado, 2 alocados fora da agenda B2C e 8 casos críticos que somam 27% da perda; os demais estão a menos de 5 OS da meta | Confirmar com RH a situação dos 7 parados; decidir a alocação dos 2 desviados; plano individual para os 8 críticos; ajuste de carga e rota para os demais | Parados e desviados: 08/07; planos: 10/07 | GAs dos dois clusters, coordenados pelos GOs | Imediato |
| 328 visitas improdutivas; 217 têm motivo e submotivo registrado | Entre as 217 classificadas, 78% nascem antes do despacho: OS aberta sem necessidade, cliente não confirmado, reagendamento não retirado da fila e falha massiva. As outras 111 (34%) não têm motivo no BI — lacuna real do sistema, não recorte de tela | Reconciliar com o BI por que 111 baixas não têm motivo registrado; travar abertura de OS sem validação técnica; confirmar o cliente antes do despacho; suspender despacho em área com falha massiva ativa | Classificação: 08/07; travas: 10/07 | Biondillo (Performance), Davi dos Reis Luz (BI) e GOs do Ceará | Em validação |
| Fortaleza abriu 06/07 com fila de 1,125 dia de trabalho (Interior está em 0,820, dentro do limite) | Sem dados de entrada de ordens por hora; não é possível afirmar se é excesso de demanda ou perda de capacidade — causa em validação | Toda manhã, atacar primeiro as ordens abertas há mais de 20 horas, antes de estourarem o prazo de 24h, e medir a fila no fim do dia até voltar a 1 dia ou menos | Início 07/07; fila ≤ 1 dia até 10/07 | José Nilton (GO), Jefferson Oliveira e GAs de Fortaleza | Atenção |

## 8. Informações faltantes para fechar causa raiz

1. Regra formal de cálculo de Presença e justificativas nominais de C.27 em 03/07.
2. Confirmação formal da meta de 85% para Prazo 24h, pois a ata registra o indicador, mas não o percentual.
3. Mapeamento completo das 328 improdutivas para motivo, submotivo, técnico, OS e data.
4. Base de ordens com abertura, despacho, chegada, conclusão e baixa para ligar Prazo à capacidade e à produtividade.
5. Entrada de ordens por hora, idade da fila e capacidade disponível para explicar a fila acumulada de C.27.
6. Confirmação dos responsáveis e aceite dos prazos propostos no FCA.
7. Decisão formal de governança sobre Produtividade OK versus Baremo OK.

Essas lacunas não impedem iniciar as ações de 72 horas; impedem apenas declarar causa raiz definitiva e medir impacto causal com precisão.
