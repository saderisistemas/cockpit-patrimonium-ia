const fs = require('fs');

const path = 'IRIS - Análise IA.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const nodes = data.nodes || [];
const connections = data.connections || {};

let output = `Total nodes: ${nodes.length}\n`;

output += '\n--- Nodes ---\n';
nodes.forEach(n => {
    output += `- [${n.type}] ${n.name}\n`;
});

output += '\n--- Connections (From -> To) ---\n';
for (const source in connections) {
    if (connections[source].main && connections[source].main[0]) {
        connections[source].main[0].forEach(dest => {
            output += `  ${source} -> ${dest.node}\n`;
        });
    }
}

fs.writeFileSync('workflow_summary.txt', output);
console.log('Saved to workflow_summary.txt');
