const fs = require('fs');

const workflowPath = 'Workflow_Motor_Iris_Atualizado.json';
const data = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

const climaCode = fs.readFileSync('clima_code.js', 'utf8');
const promptGlobal = fs.readFileSync('prompt.txt', 'utf8');

const oldWeatherBlock1 = `### CONDIÇÕES CLIMÁTICAS
Caso o evento atual possua informações de clima (payload "clima"), leve isso em consideração na análise. Fatores climáticos severos (chuva forte, vento forte) podem aumentar a chance de falsos positivos, especialmente para sensores em áreas externas, problemas de conexão, ou falhas de energia comercial. Se as condições forem adversas, informe no raciocínio.`;

const newWeatherBlock = `### CONDIÇÕES CLIMÁTICAS
Caso o evento atual possua informações de clima (payload "clima"), leve isso em consideração NA SUA ANÁLISE DE ACORDO COM O TIPO DE SENSOR:
- SENSORES EXTERNOS (muro, barreira, quintal, perimetro, etc.): Fatores climáticos severos (chuva forte, tempestade, vento forte, calor extremo) AUMENTAM muito a chance de falsos positivos.
- SENSORES INTERNOS (sala, quarto, recepcao, corredor, loja, etc.): NÃO sofrem interferência climática. IGNORE O CLIMA se o sensor for interno ou não perimetral em ambiente aberto.
- FALTAS DE ENERGIA/BATERIA: Podem ser justificadas por chuvas fortes ou tempestades.
Sempre indique no raciocínio se a condição climática foi um fator agravante (apenas para sensores externos / energia).`;

let updatedNodes = 0;

data.nodes.forEach(node => {
    // Update JS Node
    if (node.name === "Enrich + Extrair Plano") {
        node.parameters.jsCode = climaCode;
        updatedNodes++;
        console.log("Updated Enrich + Extrair Plano node.");
    }

    // Update Agente Global
    if (node.name === "Agente Global") {
        if (node.parameters && node.parameters.prompt && Array.isArray(node.parameters.prompt.messages)) {
            node.parameters.prompt.messages.forEach(msg => {
                if (msg.role === 'system' && typeof msg.content === 'string') {
                    msg.content = promptGlobal;
                    updatedNodes++;
                    console.log("Updated Agente Global prompt.");
                }
            });
        }
    }

    // Update other agents (Agente X000)
    if (node.name.startsWith('Agente') && node.name !== 'Agente Global') {
        if (node.parameters && node.parameters.prompt && Array.isArray(node.parameters.prompt.messages)) {
            node.parameters.prompt.messages.forEach(msg => {
                if (msg.role === 'system' && typeof msg.content === 'string') {
                    // Replace the old block if it exists
                    if (msg.content.includes(oldWeatherBlock1.trim())) {
                        msg.content = msg.content.replace(oldWeatherBlock1.trim(), newWeatherBlock.trim());
                        updatedNodes++;
                        console.log(`Updated weather logic in ${node.name}.`);
                    } else if (msg.content.includes('### CONDIÇÕES CLIMÁTICAS')) {
                        // Sometimes slightly modified
                        const idx = msg.content.indexOf('### CONDIÇÕES CLIMÁTICAS');
                        msg.content = msg.content.substring(0, idx) + newWeatherBlock;
                        updatedNodes++;
                        console.log(`Updated weather logic in ${node.name} (fallback replace).`);
                    } else {
                        // Append if missing completely
                        msg.content = msg.content + '\n\n' + newWeatherBlock;
                        updatedNodes++;
                        console.log(`Added weather logic to ${node.name}.`);
                    }
                }
            });
        }
    }
});

if (updatedNodes > 0) {
    fs.writeFileSync(workflowPath, JSON.stringify(data, null, 2));
    console.log(`Successfully updated ${updatedNodes} instances in Workflow JSON.`);
} else {
    console.log(`No nodes were updated. Please check names and structures.`);
}
