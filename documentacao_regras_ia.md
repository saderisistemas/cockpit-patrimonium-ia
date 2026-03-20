# DOCUMENTAÇÃO OFICIAL: REGRAS DE IA E GATE E130 DO COCKPIT

Este documento centraliza todas as regras de negócios, escores de inteligência e filtros antimaterial que regem a operação do painel Cockpit IA. 

## 1. O GATE E130 (FILTRO ANTI-FLOOD)

O Gate E130 é uma barreira de processamento localizada entre a recepção do evento do cliente e o envio para a Inteligência Artificial (Gemini). Seu objetivo primário é mitigar custos de API (tokens) e reduzir a poluição visual do painel operativo.

**Regra dos 5 Minutos:**
- Sempre que um evento do tipo `E130` (Alarme de Intrusão) é detectado, o sistema pesquisa no banco de dados se esse mesmo cliente disparou a mesma Zona/Setor nos últimos 5 minutos.
- Se SIM (houve disparo < 5 min), o evento novo é armazenado no histórico como um simples "eco" do disparo anterior, e **NÃO É ENVIADO PARA A IA**.
- O Operador não sofrerá com dezenas de painéis falsos se o sensor estiver oscilando pelo vento ou falha técnica contínua.

## 2. PARÂMETROS DE SUSPEITA (SCORING DA IA)

Quando um evento passa pelo Gate, ele é submetido à IA do Google Gemini com um prompt especializado que cruza dados climáticos (OpenWeather) e histórico de falhas do cliente para gerar uma nota de 0 a 100 indicando o risco real.

### 🟡 Baixa Suspeita (Score 0 a 39)
- **Definição:** Risco mínimo ou nulo de invasão real.
- **Motivos:** Análise climática indica calor extremo que ofusca sensores IR, tempestades/rajadas de vento fortes balançando a estrutura, ou trata-se de um disparo de portão acidental rápido sem sequenciamento (entrou no pátio e saiu).
- **Ação:** Nenhuma ronda necessária caso confinado e isolado.

### 🟠 Média Suspeita (Score 40 a 69)
- **Definição:** Eventos ambíguos ou sinais consistentes de equipamento defeituoso que exigem acompanhamento do operador de CFTV.
- **Motivos:** Sensor disparando no fim da tarde/madrugada sem explicação climática, porém de forma repetitiva e no mesmo setor isolado, sem caminhamento interno.
- **Ação:** Verificação humana atenta pelo CFTV, possibilidade alta de encaminhamento para Serviço Técnico.

### 🔴 Alta Suspeita (Score 70 a 100)
- **Definição:** Atividade hostil tática de alta probabilidade de intrusão/crime em andamento.
- **Motivos:** Setores disparando em sequência lógica (ex: Zona Externa Muro -> Zona 2 Porta Frontal -> Zona 3 Corredor). Presença humana confirmada por horário não habitual comercial, em climas limpos e calmos.
- **Ação:** Despacho imediato de Ronda (Pronta Resposta) e acompanhamento severo de CFTV tático.

## 3. REGRAS PARA SOLICITAÇÃO DE ORDEM DE SERVIÇO (O.S.)

O modelo de Inteligência foi treinado para deduzir se a culpa do disparo é externa ou técnica:
- **O.S. RECOMENDADA:** Quando ocorre acionamentos crônicos (constantes, dias parecidos ou picos no mesmo setor) e as condições atmosféricas estão tranquilas ("Clear" / "Clouds"), a IA deduz que há vício de manutenção no infravermelho (ex: teia de aranha, oxidação, curto-circuito) e recomenda abrir O.S. (O painel ficará amarelo e um ícone de chave de fenda 🔧 indicará).
- **O.S. NEGADA (ISENTA):** Sob clima severo (Raio, Chuva Forte, Ventania, Neve/Granizo), o sensor é isento de culpa mecânica temporariamente. Nenhuma Ordem de Serviço será recomendada para evitar deslocamento de técnicos em vão.

## 4. CONTROLE TÁTICO: O TOGGLE DE ANÁLISE AUTOMÁTICA

Na interface principal (Cockpit), existe o interruptor "Análise Automática IA" (Armado/Desarmado).

- **O que significa?** Ele controla o envio do payload logístico para o workflow da IA no N8N.
- **Modo Armado (ON):** Tudo que passar pelo Gate E130 vai receber pontuação, enriquecimento climático e diagnóstico automático do Gemini. Útil para 99% do período da empresa.
- **Modo Desarmado (OFF):** Pode ser desativado pelo Gerente de Monitoramento em meio a uma Blackout (Tempestade gigante derrubando a luz em dezenas de clientes ao mesmo tempo). Isso geraria centenas de disparos nos painéis de alarme que a IA teria que analisar, gerando altíssimo custo no Google Gemini por apenas confirmar que a energia caiu para todo mundo sob tempestade. Ao desligar, os eventos caem no Cockpit mas permanecem congelados em modo de espera, evitando estouro do cartão de crédito corporativo vinculado à API.
