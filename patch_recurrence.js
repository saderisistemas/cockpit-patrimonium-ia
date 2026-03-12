const fs = require('fs');

async function patchWorkflow() {
    const wfPath = 'Workflow_Motor_Iris_Atualizado.json';
    let wfStr = fs.readFileSync(wfPath, 'utf8');
    let wf = JSON.parse(wfStr);

    const novaRecorrenciaNodeName = "Recorrencia Real";

    // 1. Injeta o novo code node de Enrich + Extrair Plano via clima_code.js
    const climaCode = fs.readFileSync('clima_code.js', 'utf8');
    const enrichNodeIndex = wf.nodes.findIndex(n => n.name === "Enrich + Extrair Plano" && n.type === "n8n-nodes-base.code");
    if (enrichNodeIndex !== -1) {
        wf.nodes[enrichNodeIndex].parameters.jsCode = climaCode;
        console.log("-> Updated Enrich + Extrair Plano JS code.");
    } else {
        console.log("-> WARNING: Enrich + Extrair Plano node not found!");
    }

    // 2. Procura pelo Node de Recorrencia Real ou cria
    let recorrenciaNodeIndex = wf.nodes.findIndex(n => n.name === novaRecorrenciaNodeName);
    const recorrenciaCode = fs.readFileSync('recorrencia_real.js', 'utf8');

    if (recorrenciaNodeIndex !== -1) {
        wf.nodes[recorrenciaNodeIndex].parameters.jsCode = recorrenciaCode;
        console.log("-> Updated Recorrencia Real JS code.");
    } else {
        // Cria recorrencia real node se não existir, copiando estrutura do Code Node logica
        console.log("-> Creating Recorrencia Real node...");
        const newCodeNode = {
            "parameters": {
                "language": "javascript",
                "jsCode": recorrenciaCode
            },
            "id": "recorrencia-real-new",
            "name": novaRecorrenciaNodeName,
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [
                wf.nodes[enrichNodeIndex].position[0] + 200,
                wf.nodes[enrichNodeIndex].position[1]
            ]
        };
        wf.nodes.push(newCodeNode);
    }

    // 3. Atualiza as conexões!
    // Conexao original: "Enrich + Extrair Plano" -> "Agente Global"
    // Nova conexao: "Enrich + Extrair Plano" -> "Recorrencia Real" -> "Agente Global"

    if (wf.connections["Enrich + Extrair Plano"]) {
        delete wf.connections["Enrich + Extrair Plano"];
    }

    wf.connections["Enrich + Extrair Plano"] = {
        "main": [
            [
                {
                    "node": novaRecorrenciaNodeName,
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    };

    wf.connections[novaRecorrenciaNodeName] = {
        "main": [
            [
                {
                    "node": "Agente Global",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    };
    console.log("-> Updated Connections (Enrich -> Recorrencia Real -> Agente Global).");


    // 4. Update the Agente Global Payload & Prompt
    const globalPrompt = fs.readFileSync('prompt.txt', 'utf8');
    const agenteGlobalIndex = wf.nodes.findIndex(n => n.name === "Agente Global" && n.type === "@n8n/n8n-nodes-langchain.agent");

    if (agenteGlobalIndex !== -1) {
        wf.nodes[agenteGlobalIndex].parameters.prompt = globalPrompt;

        // Update the Payload logic text field directly to map correct new variables
        wf.nodes[agenteGlobalIndex].parameters.text = `EVENTO_ATUAL: 
{{ JSON.stringify($json.pendencia) }}

RECORRENCIA_REAL:
{{ JSON.stringify($json.recorrencia_real) }}

EVENTO_CATALOGO: 
{{ JSON.stringify($json.evento_enriquecido) }}

HISTORICO_ULTIMOS_7_DIAS: 
{{ JSON.stringify($json.historico) }}

CONDIÇÃO CLIMÁTICA NO LOCAL:
{{ JSON.stringify($json.evento_enriquecido.clima) }}`;
        console.log("-> Updated Agente Global prompt & payload context.");
    }


    // 5. Update Agente Plano 6000 override rules
    const agente6000Index = wf.nodes.findIndex(n => n.name === "Agente 6000");
    if (agente6000Index !== -1) {
        let prompt6k = wf.nodes[agente6000Index].parameters.prompt?.messages?.[0]?.content || wf.nodes[agente6000Index].parameters.prompt || "";

        const isStringPrompt = typeof wf.nodes[agente6000Index].parameters.prompt === 'string';

        // Add strict explicitly rules requested by user
        const ruleToInject = `
REGRAS DO PLANO 6000 (MANDATÓRIAS):
- Possui câmeras OBRIGATORIAMENTE.
- Exige verificação de imagens!
- Possui deslocamento tático.
- O Agente NUNCA PODE concluir ausência de câmeras based no histórico visual do sistema ou variáveis antigas.
- Sempre use exclusivamente os dados do EVENTO_ATUAL limpo e CONTEXTO_PLANO passados via contexto.
- Em caso de disparo SEM desativação: Deslocamento Tático IMEDIATO + abertura OBRIGATÓRIA de imagens.`;

        if (typeof prompt6k === 'string' && !prompt6k.includes("REGRAS DO PLANO 6000 (MANDATÓRIAS)")) {
            prompt6k = prompt6k + "\n\n" + ruleToInject;
            if (isStringPrompt) {
                wf.nodes[agente6000Index].parameters.prompt = prompt6k;
            } else {
                wf.nodes[agente6000Index].parameters.prompt.messages[0].content = prompt6k;
            }
            console.log("-> Injected strong override rules into Agente 6000.");
        } else {
            console.log("-> Agente 6000 already possessed the required override.");
        }

        // Override text for 6000 payload context
        const userPayload = `={\n  "EVENTO_ATUAL": {{ JSON.stringify($json.pendencia) }},\n  "CONTEXTO_PLANO": {{ JSON.stringify($json.contexto_plano) }},\n  "RECORRENCIA_REAL": {{ JSON.stringify($json.recorrencia_real) }},\n  "DIAGNOSTICO_AGENTE_GLOBAL": {{ JSON.stringify($json.analise_global_base) }},\n  "HISTORICO_RECENTE": {{ JSON.stringify($json.historico) }},\n  "DADOS_CATALAGO": {{ JSON.stringify($json.evento_enriquecido) }}\n}`;

        if (isStringPrompt) {
            wf.nodes[agente6000Index].parameters.text = userPayload;
        } else if (wf.nodes[agente6000Index].parameters.prompt?.messages?.length > 1) {
            wf.nodes[agente6000Index].parameters.prompt.messages[1].content = userPayload;
        }
    } else {
        console.log("-> WARNING: Agente 6000 not found!");
    }


    fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2));
    console.log("=> Wrote everything directly into `Workflow_Motor_Iris_Atualizado.json`!");
}

patchWorkflow();
