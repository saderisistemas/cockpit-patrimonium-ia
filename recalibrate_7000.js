const fs = require('fs');

async function deploy() {
    const workflowPath = 'Workflow_Motor_Iris_Atualizado.json';
    const data = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

    const API_URL = "https://patrimonium-n8n.cloudfy.live/api/v1";
    const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YTYzYzZkNy1mNDg3LTQyNTMtODRiMi01MzY3N2IyMGE5NTciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTA0Y2JjMTctNWM4OC00NGZhLTlhNWQtOGIxYmM1MTNmNTA1IiwiaWF0IjoxNzcyMzE1NzgxfQ.GG2IA0KeqW02cU3FFnJCxCmCFiWY-2obeBbXkyUSkSs";
    const WORKFLOW_ID = "SmS0C5f3mQbervfm";

    let modified = false;

    data.nodes.forEach(node => {
        if (node.name === "Agente 7000") {
            let content = node.parameters.prompt.messages[0].content;

            // Remove the conflicting "PRIMEIRA OCORRENCIA DO DIA" text that forced immediate tatico
            const oldFirstEvent = `=== PRIMEIRA OCORRENCIA DO DIA ===
- PRIMEIRO DISPARO DO DIA: SEMPRE recomendar Tatico Imediato (Score ALTO). NAO ligar para o cliente ainda.
- SENSOR VICIADO (Mesmo sensor disparando repetidas vezes no mesmo dia): Score BAIXO/MENOR. Informar que e sensor viciado/recorrente. NAO orientar deslocamento tatico.`;

            const newFirstEvent = `=== PRIMEIRA OCORRENCIA DO DIA ===
- PRIMEIRO DISPARO DO DIA: Recomendar verificação visual via câmeras (Score ALTO). Seguir estritamente o PROTOCOLO DE ATENDIMENTO TATICO (Verificar cameras -> Se movimento -> Contato cliente).
- SENSOR VICIADO (Mesmo sensor repetidas vezes): Score BAIXO. Notificar recorrência.`;

            if (content.includes(oldFirstEvent)) {
                content = content.replace(oldFirstEvent, newFirstEvent);
                modified = true;
                console.log("Improved 'Primeira Ocorrencia' rule logic");
            }

            // Ensure the main protocol is robust
            const updatedProtocol = `=== PROTOCOLO DE ATENDIMENTO TATICO (RIGOROSO) ===
1. OBRIGATÓRIO: O operador deve abrir e avaliar as imagens das câmeras ANTES de qualquer outra ação.
2. SE IDENTIFICADO ALGUÉM/MOVIMENTAÇÃO:
   - Realizar contato imediato com o cliente.
   - Perguntar se ele reconhece a pessoa ou está ciente.
   - SE cliente NÃO souber quem é, NÃO estiver ciente ou NÃO atender -> DESLOCAMENTO TÁTICO IMEDIATO.
3. SE NADA IDENTIFICADO: Encerrar como verificação sem anormalidade.
- REGRA DE OURO: Nunca sugerir tático antes de checar as câmeras.`;

            const protocolRegex = /=== PROTOCOLO DE ATENDIMENTO TATICO ===[\s\S]*?(?==== PRIMEIRA OCORRENCIA DO DIA ===)/;

            if (protocolRegex.test(content)) {
                content = content.replace(protocolRegex, updatedProtocol + "\n\n");
                modified = true;
                console.log("Strengthened Agent 7000 security protocol");
            }

            node.parameters.prompt.messages[0].content = content;
        }
    });

    if (!modified) {
        console.log("No changes made to the workflow JSON (content possibly already updated or signature changed).");
        return;
    }

    const allowedSettings = ["executionOrder", "timezone", "saveDataErrorExecution", "saveDataSuccessExecution", "saveManualExecutions", "callerPolicy", "errorWorkflow"];
    const safeSettings = {};
    if (data.settings) {
        for (const key of allowedSettings) {
            if (key in data.settings) {
                safeSettings[key] = data.settings[key];
            }
        }
    }

    try {
        const response = await fetch(`${API_URL}/workflows/${WORKFLOW_ID}`, {
            method: 'PUT',
            headers: {
                'X-N8N-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: data.name,
                nodes: data.nodes,
                connections: data.connections,
                settings: safeSettings
            })
        });

        if (response.ok) {
            console.log('Successfully recalibrated Plan 7000 in n8n!');
            fs.writeFileSync(workflowPath, JSON.stringify(data, null, 2));
        } else {
            console.error('Failed to update workflow', response.status);
            console.error(await response.text());
        }
    } catch (e) {
        console.error('Error:', e);
    }
}
deploy();
