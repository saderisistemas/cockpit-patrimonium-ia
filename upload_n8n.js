const axios = require('axios');
const fs = require('fs');

const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YTYzYzZkNy1mNDg3LTQyNTMtODRiMi01MzY3N2IyMGE5NTciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTA0Y2JjMTctNWM4OC00NGZhLTlhNWQtOGIxYmM1MTNmNTA1IiwiaWF0IjoxNzcyMzE1NzgxfQ.GG2IA0KeqW02cU3FFnJCxCmCFiWY-2obeBbXkyUSkSs";
const BASE_URL = "https://patrimonium-n8n.cloudfy.live/api/v1";

async function update() {
    try {
        const origStr = fs.readFileSync('C:/Users/patrimonium/.gemini/antigravity/brain/9dd92098-f16b-4770-a853-5b08f6bfd52c/.system_generated/steps/455/output.txt', 'utf8');
        const origData = JSON.parse(origStr).data;
        const optimized = JSON.parse(fs.readFileSync('optimized_workflow.json', 'utf8'));

        // Only keep standard n8n node properties
        const allowedNodeProps = ['id', 'name', 'type', 'typeVersion', 'position', 'parameters', 'credentials', 'disabled', 'notes', 'onError', 'continueOnFail', 'retryOnFail', 'maxTries', 'waitBetweenTries', 'executeOnce', 'alwaysOutputData', 'webhookId'];

        const cleanNodes = optimized.nodes.map(n => {
            const clean = {};
            for (const key of allowedNodeProps) {
                if (n[key] !== undefined) {
                    clean[key] = n[key];
                }
            }
            return clean;
        });

        // Only allowed settings properties
        const payload = {
            name: origData.name,
            nodes: cleanNodes,
            connections: optimized.connections,
            settings: {
                executionOrder: "v1"
            }
        };

        console.log("Payload size:", JSON.stringify(payload).length, "bytes");
        console.log("Node count:", payload.nodes.length);

        const res = await axios.put(`${BASE_URL}/workflows/SmS0C5f3mQbervfm`, payload, {
            headers: {
                'X-N8N-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        console.log("SUCCESS! Updated workflow:", res.data.id, res.data.name);
        console.log("Node count after update:", res.data.nodes?.length || 'unknown');
    } catch (e) {
        if (e.response) {
            console.error("HTTP Error:", e.response.status, JSON.stringify(e.response.data).substring(0, 500));
        } else {
            console.error("Error:", e.message);
        }
    }
}

update();
