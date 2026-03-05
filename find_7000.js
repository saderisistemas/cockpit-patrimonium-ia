const fs = require('fs');
const workflowPath = 'Workflow_Motor_Iris_Atualizado.json';
const data = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

let target = null;
data.nodes.forEach(node => {
    if (node.name.includes("7000") || (node.notes && node.notes.includes("7000"))) {
        console.log("=== Found Node:", node.name, "===");
        target = JSON.stringify(node.parameters, null, 2);
    }
});
fs.writeFileSync('params_7000.txt', target || 'Not found');
