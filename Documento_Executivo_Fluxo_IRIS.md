# Visão Executiva: Fluxo de Análise IA (Sistema IRIS)

Este documento apresenta, de forma clara e objetiva para o nível diretivo, como funciona o fluxo de inteligência artificial (n8n) por trás do sistema **IRIS**. O objetivo deste fluxo é automatizar a coleta de dados de campo e clima, processá-los com Inteligência Artificial Especializada e registrar avaliações precisas de forma automatizada.

---

## 1. O Gatilho Inicial (Recepção de Dados)
O processo começa quando o aplicativo reporta que uma nova análise precisa ser feita. 
- O fluxo recebe instantaneamente essa requisição (**Webhook App**).
- O sistema consulta imediatamente o **Supabase** (nosso banco de dados) para resgatar os dados completos da propriedade e do histórico daquele registro.

## 2. Coleta de Contexto (Clima e Histórico)
Para que a Inteligência Artificial possa avaliar a situação com precisão clínica, o sistema busca o cenário real que envolve a propriedade:
1. **Dados Climáticos:** Descobre as coordenadas do local exato (**Geocoding Nominatim**) e busca as condições meteorológicas precisas (**Open-Meteo Weather**).
2. **Histórico Recente:** Resgata os últimos 7 dias de atividades armazenadas e utiliza um processamento de IA dedicado para **resumir o histórico**, garantindo que não estamos apenas olhando para o "agora", mas para a tendência da semana.
3. Essas informações (Clima + Histórico) são **fundidas** e enviadas para a etapa de decisão.

## 3. Inteligência Artificial em Dois Níveis
Essa é a etapa principal de processamento. Para garantir a melhor resposta possível, o fluxo utiliza **duas camadas de avaliação por Inteligência Artificial**:

- **Nível 1: Visão Sistêmica (Agente Global)**  
  Uma camada de IA avalia o cenário geral com base no clima, no resumo do histórico e nas informações enviadas pelo aplicativo.
- **Nível 2: Especialistas por Plano (Agentes 0000 a 9000)**  
  Com base no "Plano" exato da propriedade ou da operação, o sistema direciona os dados para um **Agente de IA Especialista**. Temos 10 Agentes dedicados (do Agente 0000 ao Agente 9000), cada um treinado para compreender métricas, riscos e características específicas do plano em questão.

*Essa arquitetura garante uma resposta com amplo contexto, mas perfeitamente adaptada às regras de negócio específicas daquela operação.*

## 4. Registro e Devolutiva
Com o diagnóstico detalhado em mãos:
1. O fluxo mapeia o resultado gerado pela IA.
2. Verifica se já existe uma análise para aquele registro.
   - **Se for novo:** Cria um registro de análise inédito no banco de dados.
   - **Se já existir:** Atualiza a análise anterior com os dados mais recentes.
3. Por fim, ele **devolve um sinal de sucesso ao aplicativo**, confirmando que a inteligência processou os dados e o sistema está pronto.
   - *Nota de Segurança:* Se algo der errado no percurso, um **Gatilho de Erro** entra em ação e notifica o aplicativo automaticamente para garantir total transparência.

## 5. Abertura Automática de Ordens de Serviço (OS)
Após o registro da análise, o sistema avalia se há necessidade de ação técnica em campo:

1. **Decisão Inteligente:** Um módulo de código analisa os resultados da IA e decide se uma OS deve ser aberta. Critérios incluem problemas de sensores, falhas técnicas e eventos recorrentes.
2. **Janela Anti-Duplicação (48h):** Antes de criar uma nova OS, o sistema verifica se já existe uma OS aberta para o mesmo patrimônio nas últimas 48 horas, evitando duplicações.
3. **Registro Duplo:**
   - **Supabase:** A OS é registrada na tabela `iris_ordens_servico` com todos os dados contextuais (patrimônio, evento, zona, tipo, categoria, motivo, prioridade e origem "IRIS").
   - **Excel (OneDrive):** Uma cópia é inserida em planilha Excel para acompanhamento gerencial paralelo.
4. **Acompanhamento em Tempo Real:** O **Cockpit IRIS** dispõe de uma página dedicada (`/ordens-servico`) para visualizar, filtrar e acompanhar todas as OS geradas, com atualização automática via Realtime.

---
**Resumo do Valor Entregue:** 
O fluxo do IRIS transforma um simples chamado do aplicativo em uma robusta máquina de avaliação, consumindo dados externos (clima), entendendo o contexto temporal (histórico) e escalando decisões através de IAs que operam como Auditores Especialistas e Globais em frações de segundos. Agora, com o pipeline de OS integrado, o sistema também **aciona ações corretivas de forma autônoma**, gerando ordens de serviço quando identifica necessidade de intervenção técnica.
