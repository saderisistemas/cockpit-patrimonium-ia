const axios = require('axios');
const fs = require('fs');

const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YTYzYzZkNy1mNDg3LTQyNTMtODRiMi01MzY3N2IyMGE5NTciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTA0Y2JjMTctNWM4OC00NGZhLTlhNWQtOGIxYmM1MTNmNTA1IiwiaWF0IjoxNzcyMzE1NzgxfQ.GG2IA0KeqW02cU3FFnJCxCmCFiWY-2obeBbXkyUSkSs";
const BASE_URL = "https://patrimonium-n8n.cloudfy.live/api/v1";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZianFzeWViem5hYWdtb3hoY2tpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMwMzEzMiwiZXhwIjoyMDg3ODc5MTMyfQ.TnHVJmJhKBb65me2IsuBasROqXBfOUXkqGXIwOlUv-s";

const payload = {
    name: 'IRIS - Cleanup Automático (Retenção 14/30 dias)',
    settings: { executionOrder: 'v1' },
    nodes: [
        {
            id: 'cron-cleanup-001',
            name: 'Cron Diário 3am',
            type: 'n8n-nodes-base.scheduleTrigger',
            typeVersion: 1.2,
            position: [400, 0],
            parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 3 * * *' }] } }
        },
        {
            id: 'http-pendencias',
            name: 'Excluir Pendencias > 14 dias',
            type: 'n8n-nodes-base.httpRequest',
            typeVersion: 4.1,
            position: [700, -100],
            parameters: {
                method: 'DELETE',
                url: `=https://vbjqsyebznaagmoxhcki.supabase.co/rest/v1/iris_pendencias?data_evento=lt.{{new Date(new Date().setDate(new Date().getDate() - 14)).toISOString().split("T")[0]}}`,
                sendHeaders: true,
                headerParameters: {
                    parameters: [
                        { name: 'apikey', value: SUPABASE_KEY },
                        { name: 'Authorization', value: `Bearer ${SUPABASE_KEY}` },
                        { name: 'Prefer', value: 'return=representation,count=exact' }
                    ]
                },
                options: {
                    ignoreSSLIssues: true
                }
            }
        },
        {
            id: 'http-analises',
            name: 'Excluir Analises > 30 dias',
            type: 'n8n-nodes-base.httpRequest',
            typeVersion: 4.1,
            position: [700, 100],
            parameters: {
                method: 'DELETE',
                url: `=https://vbjqsyebznaagmoxhcki.supabase.co/rest/v1/iris_analises?created_at=lt.{{new Date(new Date().setDate(new Date().getDate() - 30)).toISOString()}}`,
                sendHeaders: true,
                headerParameters: {
                    parameters: [
                        { name: 'apikey', value: SUPABASE_KEY },
                        { name: 'Authorization', value: `Bearer ${SUPABASE_KEY}` },
                        { name: 'Prefer', value: 'return=representation,count=exact' }
                    ]
                },
                options: {
                    ignoreSSLIssues: true
                }
            }
        }
    ],
    connections: {
        'Cron Diário 3am': {
            main: [
                [
                    { node: 'Excluir Pendencias > 14 dias', type: 'main', index: 0 },
                    { node: 'Excluir Analises > 30 dias', type: 'main', index: 0 }
                ]
            ]
        }
    }
};

async function update() {
    try {
        await axios.put(`${BASE_URL}/workflows/v52iy3jWKoRJB5Wp`, payload, {
            headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' }
        });
        console.log("Deployed pure HTTP nodes successfully!");
    } catch (e) {
        console.error("HTTP Error:", e.response?.status, JSON.stringify(e.response?.data));
    }
}

update();
