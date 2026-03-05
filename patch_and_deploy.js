const fs = require('fs');

async function deploy() {
    const workflowPath = 'Workflow_Motor_Iris_Atualizado.json';
    const data = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

    const API_URL = "https://patrimonium-n8n.cloudfy.live/api/v1";
    const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YTYzYzZkNy1mNDg3LTQyNTMtODRiMi01MzY3N2IyMGE5NTciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTA0Y2JjMTctNWM4OC00NGZhLTlhNWQtOGIxYmM1MTNmNTA1IiwiaWF0IjoxNzcyMzE1NzgxfQ.GG2IA0KeqW02cU3FFnJCxCmCFiWY-2obeBbXkyUSkSs";
    const WORKFLOW_ID = "SmS0C5f3mQbervfm";

    // Patch Enrich Node
    data.nodes.forEach(node => {
        if (node.name === "Enrich + Extrair Plano") {
            let code = node.parameters.jsCode;

            // Re-inject clima inside the returned object correctly.
            // Currently it says:
            // const eventoCatalogo = {
            //   codigo: pendencia.evento_codigo,
            //   ...
            // };
            // We want to add `clima: clima,`

            if (!code.includes("clima: clima")) {
                code = code.replace(
                    "catalogado: !!catalogoItem",
                    "catalogado: !!catalogoItem,\n  clima: clima"
                );
                node.parameters.jsCode = code;
                console.log("Patched JS Code for Enrich Node.");
            }
        }
    });

    const allowedSettings = [
        "executionOrder",
        "timezone",
        "saveDataErrorExecution",
        "saveDataSuccessExecution",
        "saveManualExecutions",
        "callerPolicy",
        "errorWorkflow"
    ];

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
                name: data.name || "IRIS - Análise IA (Supabase API)",
                nodes: data.nodes,
                connections: data.connections,
                settings: safeSettings
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Successfully patched and deployed workflow id: ' + result.id);
            // Save back to file
            fs.writeFileSync(workflowPath, JSON.stringify(data, null, 2));
        } else {
            console.error('Failed to deploy workflow:');
            console.error(response.status, response.statusText);
            console.error(await response.text());
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

deploy();
