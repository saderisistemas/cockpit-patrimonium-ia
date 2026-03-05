const fs = require('fs');
const workflowPath = 'Workflow_Motor_Iris_Atualizado.json';
const data = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

let found = false;
data.nodes.forEach(node => {
    if (node.name.includes("8000") || (node.notes && node.notes.includes("8000"))) {
        console.log("=== Found Node:", node.name, "===");
        if (node.parameters && node.parameters.options && node.parameters.options.systemMessage) {
            console.log("System Message:", node.parameters.options.systemMessage);
        } else if (node.parameters && node.parameters.prompt) {
            console.log("Prompt:", node.parameters.prompt);
        } else if (node.parameters && node.parameters.text) {
            console.log("Text:", node.parameters.text);
        } else if (node.parameters && node.parameters.jsCode) {
            console.log("jsCode:", node.parameters.jsCode);
        } else {
            console.log("Parameters Keys:", Object.keys(node.parameters));
            // if it's an assignment block we might need to check values
            if (node.parameters.assignments) {
                console.log("Assignments:", JSON.stringify(node.parameters.assignments, null, 2));
            }
        }
        found = true;
    }
});
if (!found) {
    console.log("Node 8000 not found!");
}
