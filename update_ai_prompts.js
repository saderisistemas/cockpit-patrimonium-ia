const fs = require('fs');

const workflowPath = 'Workflow_Motor_Iris_Atualizado.json';
let data = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

const climatePrompt = `
### CONDIÇÕES CLIMÁTICAS
Caso o evento atual possua informações de clima (payload "clima"), leve isso em consideração na análise. Fatores climáticos severos (chuva forte, vento forte) podem aumentar a chance de falsos positivos, especialmente para sensores em áreas externas, problemas de conexão, ou falhas de energia comercial. Se as condições forem adversas, informe no raciocínio.
`;

let updatedNodes = 0;

data.nodes.forEach(node => {
    if (node.type === 'n8n-nodes-base.openAi' || node.name.startsWith('Agente')) {
        let updated = false;

        // Structure: parameters.prompt.messages[]
        if (node.parameters && node.parameters.prompt && Array.isArray(node.parameters.prompt.messages)) {
            node.parameters.prompt.messages.forEach(msg => {
                if (msg.role === 'system' && typeof msg.content === 'string') {
                    if (!msg.content.includes('CONDIÇÕES CLIMÁTICAS')) {
                        msg.content = msg.content + '\n' + climatePrompt;
                        updated = true;
                    }
                }
            });
        }

        if (updated) updatedNodes++;
    }
});

if (updatedNodes > 0) {
    fs.writeFileSync(workflowPath, JSON.stringify(data, null, 2));
    console.log(`Updated prompts in \${updatedNodes} AI nodes.`);
} else {
    console.log('No AI nodes needed updating or none were found.');
}
