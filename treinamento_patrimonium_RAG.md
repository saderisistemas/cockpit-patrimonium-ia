---
title: "Treinamento Patrimonium — Pacotes e Serviços (Base RAG)"
source: "Treinamento - Pacotes e Serviços de Monitoramento Patrimonium (PDF)"
created_at: "2026-03-04T18:43:14"
language: "pt-BR"
recommended_chunking: "1 tópico por seção H2/H3; usar IDs [CHUNK:...]"
---

# Visão geral

Este documento estrutura **pacotes, códigos, regras e procedimentos operacionais** para consulta por IA (RAG/Antigravity).
Foco: recuperar rapidamente **o que é cada pacote**, **limites**, **regras de cobrança** e **tratativas** por tipo de evento.

---

# Glossário operacional

[CHUNK:GLOSSARIO:MI_ME]
## MI / ME
- **MI (Monitor Interno):** operador interno que atende, confirma palavra-chave, acessa imagens e coordena o atendimento.
- **ME (Monitor Externo / Tático):** atendimento presencial (deslocamento) para vistoria/apoio.

[CHUNK:GLOSSARIO:URA]
## URA
Sistema de ligações automáticas para reduzir o fluxo de chamadas do operador. Emite mensagens de:
- Central não ativada no horário previsto
- Desativação
- Disparo seguido de desativação

[CHUNK:GLOSSARIO:PALAVRA_CHAVE_CONTRA_SENHA]
## Palavra-chave / Contra-senha
- **Palavra-chave:** confirma identidade e verifica possível coação.
- **Contra-senha:** o cliente confirma que está falando com a central Patrimonium (segurança do cliente).

[CHUNK:GLOSSARIO:TEMPO_RETARDO]
## Tempo de retardo (controle de acesso)
“Janela” aplicada aos horários previstos para reduzir falsos alertas de acesso fora de horário.
- **Prata / Ouro / Atendimento tático mediante visualização:** 45 min
- **Premium:** 10 min

---

# Tipos de pacotes (regras de descrição)

[CHUNK:DESCRICAO_PACOTES:TIPOS]
## Regras
- **Pacote I:** apenas sensores internos.
- **Pacote sem descrição extra:** sensores internos e externos/semi externos e equipamentos **vendidos**.
- **Pacote Isento:** equipamento **locado**.
  - Se houver locação: incluir item “**Locação de equipamento**” e cobrar o **valor total dos itens locados**.

---

# Seguro

[CHUNK:SEGURO:TIPOS]
## Tipos e limites
- **Seguro Especial Mais:** até R$ 3.000,00 (equipamentos vendidos)
- **Seguro Especial Mais ISENTO:** até R$ 3.000,00 (equipamentos locados)
- **Seguro Especial Mais Plus:** até R$ 5.000,00 (equipamentos vendidos)
- **Seguro Especial Mais Plus ISENTO:** até R$ 5.000,00 (equipamentos locados)

[CHUNK:SEGURO:REGRAS]
## Regras e exclusões
- Valores:
  - R$ 3.000,00 → Residência R$ 30,00 / Comércio R$ 35,00
  - R$ 5.000,00 → R$ 45,00 (residência e comércio)
- Franquia fixa: **R$ 800,00**
- Não cobre vandalismo
- Cobertura apenas de itens com **nota fiscal**
- Cliente deve estar **adimplente**
- Não cobre: condomínio e/ou indústria
- Não cobre (exemplos): dinheiro, joias, perfumes, notebook, tablets, câmeras fotográficas, celular, cosméticos, óculos, automóveis, motos, bicicletas, patinetes, bebidas, itens de estoque etc.
- Cobre danos em portas/janelas/fechaduras/vidros e partes do imóvel **desde que não seja vandalismo**

---

# Catálogo de pacotes e serviços (por código)

> Convenção de leitura: cada pacote tem **código**, **descrição**, **regras**, **limites** e **percentuais**.

[CHUNK:PKG:0000]
## Código 0000 — Atendimento Tático mediante Visualização
**Descrição:** atendimento a disparos 24h **mediante visualização das câmeras** (vistoria virtual).  
**Pré-requisito:** cliente deve ter câmeras cobrindo o perímetro visual.

**Entregas / características**
- Atendimento 24h (visualização de câmeras)
- Assistência técnica (tabela contratada)
- Relatório de eventos (últimos 3 meses) mediante solicitação
- Controle de acesso 21:00–06:00 via URA (retardo 45 min)

**Fluxo resumido**
- Disparo **sem desativação** → abrir câmeras e verificar perímetro
- Se anormalidade/intrusão → acionar polícia e solicitar apoio
- Se nada identificado → encerrar como “vistoria remota via CFTV”

**Limites e acréscimos**
- Até **8 sensores**; no máximo **2** semi externos/externos
- Se > 8 sensores → **+30%** no valor do pacote
- Se tiver sensor de barreira → **+20%**

---

[CHUNK:PKG:1000]
## Código 1000 — Pacote Patrimonium Smart (em validação)
**Status:** pacote a ser validado (atendimento e sistema em laboratório).

**Características**
- Atendimento a disparos 24h pelo MI confirmando palavra-chave por telefone
- Se não atender/não confirmar → deslocar tático/avisar polícia (**observação no material: intenção é não ter tático; ponto a validar**)
- Assistência técnica (tabela contratada; Maringá e região próxima)
- Relatório de eventos (últimos 3 meses) mediante solicitação

**Limites e acréscimos**
- Até **8 sensores**; no máximo **2** semi externos/externos
- Se > 8 sensores → **+30%**
- Se tiver barreira → **+20%**

---

[CHUNK:PKG:2000]
## Código 2000 — Pacote Bronze
**Características**
- Atendimento a disparos 24h com **tático**
- Assistência técnica (tabela contratada)
- Relatório de eventos (últimos 3 meses) mediante solicitação

**Limites e acréscimos**
- Até 8 sensores; no máximo 2 externos/semi externos
- > 8 sensores → +30%
- Barreira → +20%

---

[CHUNK:PKG:3000]
## Código 3000 — Pacote Prata
**Características**
- Atendimento a disparos 24h com tático
- Assistência técnica
- Relatório de eventos (últimos 3 meses) mediante solicitação
- Controle de acesso 21:00–06:00 via URA (retardo 45 min)

**Limites e acréscimos**
- Até 8 sensores; no máximo 2 externos/semi externos
- > 8 sensores → +30%
- Barreira → +20%

---

[CHUNK:PKG:4000]
## Código 4000 — Pacote Ouro
**Características**
- Atendimento a disparos 24h com tático
- Assistência técnica
- Cadastro de senhas sem custos adicionais (desde que possível via download/acesso remoto)
- Relatório de eventos (últimos 3 meses) mediante solicitação
- Controle de acesso via URA (retardo 45 min)

**Limites e acréscimos**
- Até 8 sensores; no máximo 2 externos/semi externos
- > 8 sensores → +30%
- Barreira → +20%

---

[CHUNK:PKG:5000]
## Código 5000 — Pacote Premium
**Características**
- Atendimento a disparos 24h com tático
- Assistência técnica
- Cadastro de senhas sem custo
- Regulagem de sensores sem custo
- Relatório de eventos (últimos 3 meses) mediante solicitação
- Controle de acesso via URA (retardo **10 min**)

**Limites e acréscimos**
- Até 8 sensores; no máximo 2 externos/semi externos
- > 8 sensores → +30%
- Barreira → +20%

---

[CHUNK:SVC:6000]
## Código 6000 — Serviço Disparo por Imagem (acessório)
**Tipo:** serviço acessório ao monitoramento.

**Descrição operacional**
- Em caso de disparo de alarme sem desativação:
  - **ME** é deslocado para vistoria
  - **MI** acessa a **imagem vinculada ao setor** para análise do evento e apoio ao ME
  - Se identificar intrusão real → solicitar apoio (polícia e MEs)

**Observação**
- Se houver dificuldade no acesso às imagens → registrar para abertura de **O.S. (MI)**

---

[CHUNK:PKG:7000]
## Código 7000 — Pacote Analítico (CFTV)
**Características**
- Atendimento a disparos das câmeras (24h ou por tabela pré-definida)
- Apoio tático em caso de invasão/identificação de intrusão por câmeras
- Assistência técnica
- Relatório de eventos (últimos 3 meses) mediante solicitação

**Limites e acréscimos**
- Até **8 câmeras**; no máximo 2 semi externas/externas
- > 8 câmeras → +30%

---

[CHUNK:PKG:8000]
## Código 8000 — Pacote Analítico Plus (CFTV + Alarme)
**Características**
- Disparos do alarme 24h com tático
- Disparos das câmeras (24h ou por tabela) com apoio tático se invasão/intrusão
- Controle de acesso via URA (retardo 45 min)
- Assistência técnica
- Relatório de eventos (últimos 3 meses) mediante solicitação

**Limites e acréscimos**
- Até 8 câmeras/sensores; no máximo 2 semi externos/externos
- > 8 câmeras/sensores → +30%

---

[CHUNK:PKG:9000]
## Código 9000 — Patrimonium Mobile
**Características**
- Acesso ao aplicativo Patrimonium Mobile (funções conforme modelo da central)
- Atendimento a disparos do alarme com apoio tático **mediante solicitação via app** (**R$ 49,90 por deslocamento**)
- Controle de acesso via URA (retardo 45 min)
- Assistência técnica
- Relatório de eventos (últimos 3 meses) mediante solicitação

**Regra crítica (responsabilidade)**
- Neste pacote o **cliente é responsável pelo monitoramento** do local.
- Só há deslocamento (ME) mediante solicitação via app.

**Cobrança por deslocamento (fluxo)**
1. Receber evento de solicitação via app
2. MI desloca ME
3. Incluir “F-5” e gerar cobrança de **R$ 49,90** por deslocamento (O.S.)

**Compatibilidade do app**
- Acesso completo apenas para centrais: **VW / Intelbras / JFL**
- Outros modelos: acesso a eventos e solicitação de apoio, porém sem ativar/desativar alarme.

---

# Procedimentos e árvores de decisão (operacional)

[CHUNK:PROC:DISPARO_ALARME]
## Quando houver disparo do alarme

### 1) Houve desativação?
**SIM**
- Se desativação com senha padrão:
  - Manter contato com o usuário que desativou
  - Confirmar palavra-chave
  - Se cliente não atender (mínimo 3 tentativas): registrar tentativas e finalizar
- Se desativação com senha de coação:
  - Mesmo processo acima
  - Se não atender: deslocar ME ao local

**NÃO**
- Enviar ME (tático) para vistoria no local  
- **Avaliar o serviço/pacote contratado para a devida ação** (tratativa varia por pacote)

> Nota: o material indica que cada pacote possui tratativa “0/1/2/3/4/5/6/7/8/9”.

---

[CHUNK:PROC:DISPARO_MULTI_SETOR]
## Disparo em mais de um setor sem desativação
- Prioridade no atendimento
- Deslocar ME (tático) para vistoria
- Se ME identificar anormalidade/indícios de intrusão:
  - comunicar MI para apoio e/ou comunicar ao cliente para que realize vistoria

---

[CHUNK:PROC:DISPARO_EXCESSIVO]
## Disparo excessivo no mesmo setor
- Se não houver acesso ao local (chaves/controle):
  - deslocar ME (tático) para vistoria
  - manter contato para o cliente ir ao local desativar/inibir sensor e vistoriar
- Se recorrente:
  - incluir cliente na planilha de O.S. para técnica agendar visita/manutenção

---

[CHUNK:PROC:FALHA_BATERIA]
## Falha de bateria
### Alarme desativado?
**SIM**
- Contatar cliente e verificar alteração
- Ofertar manutenção de bateria

**NÃO**
- Encaminhar ME (tático) para vistoria

**OBS:** se ocorrer em vários clientes da mesma região, acompanhar no IRIS.

---

[CHUNK:PROC:PANICO_COACAO]
## Pânico / Coação
- Deslocar ME imediatamente ao local
- Simultaneamente manter contato com o cliente
- Se confirmar palavra-chave: cancelar ida do ME
- Se ME chegar e estiver tudo certo: encerrar como “vistoria sem anormalidades”
- Se notar anormalidade: solicitar apoio da PM / MEs

---

[CHUNK:PROC:TESTE_PERIODICO]
## Teste periódico (falha de comunicação: telefone / IP / GPRS)
- Ao recepcionar falha do teste periódico em SDF:
  - enviar ME (tático) ao local
- Em dias úteis:
  - manter contato e realizar testes
- Se comunicação não retornar:
  - abrir O.S.

---

# Controle de acesso e tabela de horário

[CHUNK:ACESSO:DEFINICAO]
## Controle de acesso (conceito)
Controle de acesso é quando a central controla:
- acesso do cliente fora do horário previsto, ou
- não ativação do alarme no horário previsto

[CHUNK:ACESSO:RETARDO_EXEMPLO]
## Retardo e exemplo prático
- Retardo 45 min (Prata/Ouro/Visualização):
  - reduz 45 min na abertura e adiciona 45 min na saída
  - eventos caem na central dentro dessa lacuna
- Exemplo (abertura 08:00):
  - desarmar 07:16 → não cai como fora do horário
  - desarmar 07:14 → cai como fora do horário

Premium: retardo 10 min (mesma lógica).

[CHUNK:TABELA_HORARIO:PACOTES]
## Pacotes que possuem tabela de horário
- Prata: 21 às 06 (ajustável dentro desse intervalo)
- Ouro: conforme necessidade, com retardo 45 min
- Premium: conforme necessidade (material menciona 45 min; validar vs. retardo 10 min citado em “Controle de acesso”)

[CHUNK:TABELA_HORARIO:COMO_PREENCHER]
## Como preencher (regra)
- Preencher entrada/saída conforme funcionamento do local
- O controle de acesso ocorre após o período de ativação do alarme ou em caso de não ativação no horário previsto

**Exemplo**
- Funcionamento: 08:45–18:15
- Com retardo 45 min → controle: 08:00–19:00
- Se não ativar no horário:
  - central entra em contato, confirma palavra-chave e previsão de ativação
- Se já estiver ativado e cliente acessar após período de controle:
  - central liga para confirmar palavra-chave e previsão de ativação

---

# Notas de qualidade e pontos para validação (para manutenção da base)

[CHUNK:QA:PONTOS_VALIDAR]
## Pontos que merecem validação interna
- Pacote Smart (1000): trecho indica intenção de não ter tático, mas menciona deslocar tático/avisar polícia (ambiguidade).
- Premium: retardo citado como 10 min no pacote, mas em “Tabela de horário” aparece “retardo 45 min” (inconsistência).
- “Tratativa 0/1/2/3/4/5/6/7/8/9”: lista não detalhada no material (faltam regras por tratativa).

---

# Metadados para indexação (opcional)

[CHUNK:INDEX:CODIGOS]
## Índice de códigos
- 0000: Atendimento tático mediante visualização
- 1000: Patrimonium Smart (em validação)
- 2000: Bronze
- 3000: Prata
- 4000: Ouro
- 5000: Premium
- 6000: Serviço disparo por imagem
- 7000: Analítico CFTV
- 8000: Analítico Plus (CFTV + alarme)
- 9000: Patrimonium Mobile
