const axios = require('axios');
const fs = require('fs');

const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YTYzYzZkNy1mNDg3LTQyNTMtODRiMi01MzY3N2IyMGE5NTciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTA0Y2JjMTctNWM4OC00NGZhLTlhNWQtOGIxYmM1MTNmNTA1IiwiaWF0IjoxNzcyMzE1NzgxfQ.GG2IA0KeqW02cU3FFnJCxCmCFiWY-2obeBbXkyUSkSs";
const BASE_URL = "https://patrimonium-n8n.cloudfy.live/api/v1";
const WORKFLOW_ID = "SmS0C5f3mQbervfm";
const TARGET_FILE = "IRIS - Análise IA.json";

async function download() {
    try {
        const res = await axios.get(`${BASE_URL}/workflows/${WORKFLOW_ID}`, {
            headers: {
                'X-N8N-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            }
        });

        fs.writeFileSync(TARGET_FILE, JSON.stringify(res.data, null, 2), 'utf8');
        console.log(`SUCCESS! Workflow '${res.data.name}' downloaded and saved to '${TARGET_FILE}'`);
        console.log("Node count:", res.data.nodes?.length || 'unknown');
    } catch (e) {
        if (e.response) {
            console.error("HTTP Error:", e.response.status, JSON.stringify(e.response.data).substring(0, 500));
        } else {
            console.error("Error:", e.message);
        }
    }
}

download();
