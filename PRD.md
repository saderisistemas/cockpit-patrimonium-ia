# PRD - IRIS IA: Monitoramento Tático Inteligente

## 1. Visão Geral do Projeto
O **Iris IA** é um ecossistema de segurança tática desenvolvido para a **Patrimonium**. O sistema automatiza a análise de disparos de alarme e eventos de CFTV (Circuito Fechado de TV), utilizando Inteligência Artificial para filtrar eventos, reduzir falsos positivos e otimizar o atendimento operacional (MI/ME).

## 2. Objetivos de Negócio
- **Redução de Carga Operacional:** Uso de URAs e IA para automatizar tratativas simples (ex: esquecimento de arme).
- **Precisão Tática:** Priorização de eventos reais com análise de imagem e histórico.
- **Escalabilidade:** Centralização de múltiplos pacotes de serviço (Bronze, Prata, Ouro, Premium, Analítico) em uma interface unificada.

## 3. Arquitetura Técnica

### 3.1. Frontend (Cockpit)
- **Tecnologias:** React 19, TypeScript, Vite, Tailwind CSS (v4).
- **Funcionalidades:**
  - Dashboard tático 24h otimizado para TVs (legibilidade de longa distância).
  - Detalhamento de disparos com evidências de IA e contexto meteorológico.
  - Gestão de usuários e RBAC (Role-Based Access Control).
  - Relatórios analíticos e de performance operacional.

### 3.2. Automatização (Motor IRIS - n8n)
- **Tecnologias:** n8n (Workflows), JavaScript/Node.js scripts.
- **Papel:** O motor processa os webhooks disparados pelos sistemas de alarme/D-Guard, enriquece os dados via RAG (Base de Conhecimento Patrimonium) e solicita análises de IA.

### 3.3. Backend e Dados (Supabase)
- **Tecnologias:** PostgreSQL, Edge Functions, Auth, Realtime.
- **Tabelas Principais:** `iris_pendencias`, `iris_analises`, `usuarios`.

### 3.4. Inteligência Artificial
- **Processamento:** Análise baseada em parâmetros Contact ID, histórico de eventos do cliente, condições climáticas e base RAG de regras da empresa.

## 4. Funcionalidades Detalhadas
- **Triagem Inteligente:** Classificação automática de eventos (Invasão, Pânico, Falha Técnica).
- **Vistoria Virtual:** Integração com câmeras para análise remota imediata.
- **Controle de Acesso Automatizado:** Verificação de horários de ativação/desativação com janelas de retardo inteligentes.
- **RAG (Retrieval-Augmented Generation):** Base de conhecimento dinâmica com as regras de cada pacote Patrimonium para guiar a IA.

## 5. Stakeholders
- **Monitor Interno (MI):** Operador da central que utiliza o Cockpit.
- **Monitor Externo (ME):** Equipes táticas de rua que recebem os despachos validados.
- **Clientes Patrimonium:** Beneficiários da rapidez e precisão do atendimento.

---
*Documento gerado automaticamente pelo Agente Antigravity em 08/03/2026.*
