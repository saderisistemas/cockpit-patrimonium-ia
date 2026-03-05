const fs = require('fs');
const workflowPath = 'Workflow_Motor_Iris_Atualizado.json';
const data = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

let target = null;
data.nodes.forEach(node => {
    if (node.name.includes("8000")) {
        target = JSON.stringify(node.parameters, null, 2);
    }
});
fs.writeFileSync('prompt_8000.txt', target || 'Not found');
