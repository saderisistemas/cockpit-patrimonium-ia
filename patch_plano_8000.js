const fs = require('fs');

async function deploy() {
    const workflowPath = 'Workflow_Motor_Iris_Atualizado.json';
    const data = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

    const API_URL = "https://patrimonium-n8n.cloudfy.live/api/v1";
    const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YTYzYzZkNy1mNDg3LTQyNTMtODRiMi01MzY3N2IyMGE5NTciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTA0Y2JjMTctNWM4OC00NGZhLTlhNWQtOGIxYmM1MTNmNTA1IiwiaWF0IjoxNzcyMzE1NzgxfQ.GG2IA0KeqW02cU3FFnJCxCmCFiWY-2obeBbXkyUSkSs";
    const WORKFLOW_ID = "SmS0C5f3mQbervfm";

    let modified = false;

    data.nodes.forEach(node => {
        if (node.name === "Agente 8000") {
            let content = node.parameters.prompt.messages[0].content;

            const newProtocol = `=== PROTOCOLO DE ATENDIMENTO TATICO ===
- ANTES de realizar deslocamento tático, o operador DEVE obrigatoriamente abrir as câmeras e verificar se possui evidência de movimentação.
- Se houver evidência de movimentação -> Realizar o deslocamento tático.
- Se as câmeras NÃO estiverem disponíveis/dispostivos offline -> O operador DEVE solicitar abertura de O.S. (Ordem de Serviço) na técnica.
- Central NÃO liga para cliente como primeira ação em disparos de alarme.`;

            const regex = /=== PROTOCOLO DE ATENDIMENTO TATICO ===[\s\S]*?(?==== PRIMEIRA OCORRENCIA DO DIA ===)/;

            if (regex.test(content)) {
                content = content.replace(regex, newProtocol + "\n\n");
                node.parameters.prompt.messages[0].content = content;
                modified = true;
                console.log("Found and modified protocol in node Agente 8000");
            } else {
                console.log("Regex for protocol section did not match");
            }
        }
    });

    if (!modified) {
        console.log("No changes made to the workflow JSON.");
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
            console.log('Successfully updated Plan 8000 in n8n!');
            fs.writeFileSync(workflowPath, JSON.stringify(data, null, 2));
        } else {
            console.error('Failed to update workflow', response.status);
            console.error(await response.text());
        }
    } catch (e) {
        console.error('Error during fetch:', e);
    }
}
deploy();
