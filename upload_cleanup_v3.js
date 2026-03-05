const axios = require('axios');

const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YTYzYzZkNy1mNDg3LTQyNTMtODRiMi01MzY3N2IyMGE5NTciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTA0Y2JjMTctNWM4OC00NGZhLTlhNWQtOGIxYmM1MTNmNTA1IiwiaWF0IjoxNzcyMzE1NzgxfQ.GG2IA0KeqW02cU3FFnJCxCmCFiWY-2obeBbXkyUSkSs";
const BASE_URL = "https://patrimonium-n8n.cloudfy.live/api/v1";

// Strategy: Use Supabase "Get Many" with filter to get old record IDs,
// then use "SplitInBatches" to loop through them, deleting each one
// via the native Supabase "Delete" operation with the saved credential.

const payload = {
    name: 'IRIS - Cleanup Automático (Retenção 14/30 dias)',
    settings: { executionOrder: 'v1' },
    nodes: [
        {
            id: 'cron-001',
            name: 'Cron Diário 3am',
            type: 'n8n-nodes-base.scheduleTrigger',
            typeVersion: 1.2,
            position: [300, 0],
            parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 3 * * *' }] } }
        },
        // ===== BRANCH 1: Delete old pendencias =====
        {
            id: 'get-old-pend',
            name: 'Buscar Pendencias Antigas',
            type: 'n8n-nodes-base.supabase',
            typeVersion: 1,
            position: [550, -150],
            credentials: { supabaseApi: { id: '8hyiuJeUM9Khn0Tk', name: 'Supabase Iris Agente' } },
            parameters: {
                operation: 'getAll',
                tableId: 'iris_pendencias',
                returnAll: true,
                filters: {
                    conditions: [
                        {
                            keyName: 'data_evento',
                            condition: 'lt',
                            keyValue: '={{ new Date(new Date().setDate(new Date().getDate() - 14)).toISOString().split("T")[0] }}'
                        }
                    ]
                },
                additionalFields: {
                    fields: 'id_disparo'
                }
            }
        },
        {
            id: 'loop-pend',
            name: 'Loop Pendencias',
            type: 'n8n-nodes-base.splitInBatches',
            typeVersion: 3,
            position: [800, -150],
            parameters: { batchSize: 50 }
        },
        {
            id: 'del-pend',
            name: 'Deletar Pendencia',
            type: 'n8n-nodes-base.supabase',
            typeVersion: 1,
            position: [1050, -150],
            credentials: { supabaseApi: { id: '8hyiuJeUM9Khn0Tk', name: 'Supabase Iris Agente' } },
            parameters: {
                operation: 'delete',
                tableId: 'iris_pendencias',
                filters: {
                    conditions: [
                        {
                            keyName: 'id_disparo',
                            condition: 'equal',
                            keyValue: '={{ $json.id_disparo }}'
                        }
                    ]
                }
            }
        },
        // ===== BRANCH 2: Delete old analises =====
        {
            id: 'get-old-anal',
            name: 'Buscar Analises Antigas',
            type: 'n8n-nodes-base.supabase',
            typeVersion: 1,
            position: [550, 150],
            credentials: { supabaseApi: { id: '8hyiuJeUM9Khn0Tk', name: 'Supabase Iris Agente' } },
            parameters: {
                operation: 'getAll',
                tableId: 'iris_analises',
                returnAll: true,
                filters: {
                    conditions: [
                        {
                            keyName: 'created_at',
                            condition: 'lt',
                            keyValue: '={{ new Date(new Date().setDate(new Date().getDate() - 30)).toISOString() }}'
                        }
                    ]
                },
                additionalFields: {
                    fields: 'id'
                }
            }
        },
        {
            id: 'loop-anal',
            name: 'Loop Analises',
            type: 'n8n-nodes-base.splitInBatches',
            typeVersion: 3,
            position: [800, 150],
            parameters: { batchSize: 50 }
        },
        {
            id: 'del-anal',
            name: 'Deletar Analise',
            type: 'n8n-nodes-base.supabase',
            typeVersion: 1,
            position: [1050, 150],
            credentials: { supabaseApi: { id: '8hyiuJeUM9Khn0Tk', name: 'Supabase Iris Agente' } },
            parameters: {
                operation: 'delete',
                tableId: 'iris_analises',
                filters: {
                    conditions: [
                        {
                            keyName: 'id',
                            condition: 'equal',
                            keyValue: '={{ $json.id }}'
                        }
                    ]
                }
            }
        }
    ],
    connections: {
        'Cron Diário 3am': {
            main: [[
                { node: 'Buscar Pendencias Antigas', type: 'main', index: 0 },
                { node: 'Buscar Analises Antigas', type: 'main', index: 0 }
            ]]
        },
        'Buscar Pendencias Antigas': {
            main: [[{ node: 'Loop Pendencias', type: 'main', index: 0 }]]
        },
        'Loop Pendencias': {
            main: [
                [{ node: 'Deletar Pendencia', type: 'main', index: 0 }],
                []
            ]
        },
        'Deletar Pendencia': {
            main: [[{ node: 'Loop Pendencias', type: 'main', index: 0 }]]
        },
        'Buscar Analises Antigas': {
            main: [[{ node: 'Loop Analises', type: 'main', index: 0 }]]
        },
        'Loop Analises': {
            main: [
                [{ node: 'Deletar Analise', type: 'main', index: 0 }],
                []
            ]
        },
        'Deletar Analise': {
            main: [[{ node: 'Loop Analises', type: 'main', index: 0 }]]
        }
    }
};

async function update() {
    try {
        await axios.put(`${BASE_URL}/workflows/v52iy3jWKoRJB5Wp`, payload, {
            headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' }
        });
        console.log("SUCCESS deployed Supabase native nodes!");

        // Activate
        await axios.post(`${BASE_URL}/workflows/v52iy3jWKoRJB5Wp/activate`, { active: true }, {
            headers: { 'X-N8N-API-KEY': API_KEY }
        });
        console.log("Workflow activated.");
    } catch (e) {
        console.error("Error:", e.response?.status, JSON.stringify(e.response?.data).substring(0, 400));
    }
}

update();
