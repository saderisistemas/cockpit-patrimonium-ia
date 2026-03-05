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

            const newProtocol = `=== PROTOCOLO DE ATENDIMENTO TATICO ===
- É OBRIGATÓRIO avaliar as câmeras ANTES de realizar o deslocamento tático.
- Se for detectada movimentação de alguém no local:
  1. Realizar contato imediato com o cliente.
  2. Questionar o cliente se ele tem conhecimento de quem é a pessoa ou se está ciente da situação.
  3. Se o cliente NÃO souber quem é, NÃO estiver ciente, ou se o contato com o cliente NÃO for possível -> REALIZAR ENVIO DE TÁTICO IMEDIATO.
- Se NÃO houver evidência de movimentação -> Seguir procedimentos de verificação padrão conforme o tipo de sinal.`;

            // Regex for protocol section - Agent 7000 has a similar structure
            const regex = /=== PROTOCOLO DE ATENDIMENTO TATICO ===[\s\S]*?(?====)/;

            if (regex.test(content)) {
                content = content.replace(regex, newProtocol + "\n\n");
                node.parameters.prompt.messages[0].content = content;
                modified = true;
                console.log("Found and modified protocol in node Agente 7000");
            } else {
                console.log("Regex for protocol section did not match in Agente 7000");
                // Alternative if it's the last section before something else or just at end
                content += "\n\n" + newProtocol;
                node.parameters.prompt.messages[0].content = content;
                modified = true;
            }
        }
    });

    if (!modified) {
        console.log("No changes made to the workflow JSON for 7000.");
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
            console.log('Successfully updated Plan 7000 in n8n!');
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
