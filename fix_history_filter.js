/**
 * Comprehensive workflow restructure:
 * 1. Add "Preparar Histórico 7D" Code node
 * 2. Update "Get Supabase History" filters + limit
 * 3. Fix "Enrich + Extrair Plano" slice(0,20) cap
 * 4. Rewire connections: decouple history from weather (parallel branches)
 * 5. Add "Merge Clima+Hist" node to rejoin branches before Enrich
 */

const fs = require('fs');

const w = JSON.parse(fs.readFileSync('Workflow_Motor_Iris_Atualizado.json', 'utf8'));

// ============================================================
// STEP 1: Find key nodes and their positions
// ============================================================
const getRow = w.nodes.find(n => n.name === 'Get Row Supabase');
const geocoding = w.nodes.find(n => n.name === 'Geocoding Nominatim');
const openMeteo = w.nodes.find(n => n.name === 'Open-Meteo Weather');
const getHistory = w.nodes.find(n => n.name === 'Get Supabase History');
const enrich = w.nodes.find(n => n.name === 'Enrich + Extrair Plano');

console.log('Found nodes:', {
    getRow: !!getRow,
    geocoding: !!geocoding,
    openMeteo: !!openMeteo,
    getHistory: !!getHistory,
    enrich: !!enrich
});

// ============================================================
// STEP 2: Create "Preparar Histórico 7D" Code node
// ============================================================
const prepHistNode = {
    "id": "prep-historico-7d-" + Date.now(),
    "name": "Preparar Histórico 7D",
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "position": [
        getRow.position[0] + 240,
        getRow.position[1] + 200
    ],
    "parameters": {
        "jsCode": `const row = $('Get Row Supabase').first().json;

const patrimonioNorm = String(row.patrimonio ?? '')
  .normalize('NFKC')
  .trim()
  .toUpperCase()
  .replace(/\\s+/g, ' ');

const dataAtual = row.data_evento ? new Date(row.data_evento) : new Date();
const dataInicio = new Date(dataAtual.getTime() - 7 * 24 * 60 * 60 * 1000);

return [{
  json: {
    patrimonio_norm: patrimonioNorm,
    data_inicio_hist: dataInicio.toISOString(),
    data_fim_hist: dataAtual.toISOString(),
    id_disparo_atual: row.id_disparo,
    id_cliente_atual: row.id_cliente
  }
}];`
    }
};

w.nodes.push(prepHistNode);
console.log('Added node: Preparar Histórico 7D');

// ============================================================
// STEP 3: Create "Merge Clima+Hist" node to combine branches
// ============================================================
const mergeNode = {
    "id": "merge-clima-hist-" + Date.now(),
    "name": "Merge Clima+Hist",
    "type": "n8n-nodes-base.merge",
    "typeVersion": 3,
    "position": [
        enrich.position[0] - 240,
        enrich.position[1]
    ],
    "parameters": {
        "mode": "combine",
        "combinationMode": "mergeByPosition",
        "options": {}
    }
};

w.nodes.push(mergeNode);
console.log('Added node: Merge Clima+Hist');

// ============================================================
// STEP 4: Update "Get Supabase History" filters + limit
// ============================================================
getHistory.parameters.limit = 200;

// Update filter conditions properly
const filters = getHistory.parameters.filters;
if (filters && filters.conditions) {
    // Update patrimonio condition to use normalized field
    let condPat = filters.conditions.find(c => c.keyName === 'patrimonio' || c.keyName === 'id_cliente' || c.keyName === 'patrimonio_normalizado');
    if (condPat) {
        condPat.keyName = 'patrimonio_normalizado';
        condPat.condition = 'eq';
        condPat.keyValue = "={{ $('Preparar Histórico 7D').first().json.patrimonio_norm }}";
    }

    // Update date condition for lower bound (gte)
    let condDate = filters.conditions.find(c => c.keyName === 'data_evento');
    if (condDate) {
        condDate.condition = 'gte';
        condDate.keyValue = "={{ $('Preparar Histórico 7D').first().json.data_inicio_hist }}";
    }

    // Add upper bound date condition (lte) - only if not exists
    let condDateLte = filters.conditions.find(c => c.keyName === 'data_evento' && c.condition === 'lte');
    if (!condDateLte) {
        filters.conditions.push({
            "keyName": "data_evento",
            "condition": "lte",
            "keyValue": "={{ $('Preparar Histórico 7D').first().json.data_fim_hist }}"
        });
    }

    // Add id_disparo exclusion (neq) - only if not exists
    let condId = filters.conditions.find(c => c.keyName === 'id_disparo');
    if (!condId) {
        filters.conditions.push({
            "keyName": "id_disparo",
            "condition": "neq",
            "keyValue": "={{ $('Preparar Histórico 7D').first().json.id_disparo_atual }}"
        });
    }

    // Remove any matchType that could cause deployment failure
    delete filters.matchType;
}

// Move position down for the parallel branch
getHistory.position = [
    prepHistNode.position[0] + 240,
    prepHistNode.position[1]
];

console.log('Updated Get Supabase History filters + limit');

// ============================================================
// STEP 5: Fix Enrich + Extrair Plano slice cap 
// ============================================================
if (enrich.parameters.jsCode) {
    // Replace slice(0, 20) or slice(0,20) with full array
    enrich.parameters.jsCode = enrich.parameters.jsCode
        .replace(/\.slice\s*\(\s*0\s*,\s*20\s*\)/g, '')
        .replace(/\.slice\s*\(\s*0\s*,\s*\d+\s*\)/g, '');
    console.log('Removed slice cap from Enrich + Extrair Plano');
} else {
    console.log('No jsCode found in Enrich node, skipping slice fix');
}

// ============================================================
// STEP 6: Rewire connections for parallel branches
// ============================================================
const conn = w.connections;

// Get Row Supabase now connects to TWO branches:
// Branch 1: Geocoding Nominatim (weather path - stays at index 0)
// Branch 2: Preparar Histórico 7D (history path - new at index 0 too)
conn['Get Row Supabase'] = {
    "main": [
        [
            {
                "node": "Geocoding Nominatim",
                "type": "main",
                "index": 0
            },
            {
                "node": "Preparar Histórico 7D",
                "type": "main",
                "index": 0
            }
        ]
    ]
};

// Preparar Histórico 7D → Get Supabase History
conn['Preparar Histórico 7D'] = {
    "main": [
        [
            {
                "node": "Get Supabase History",
                "type": "main",
                "index": 0
            }
        ]
    ]
};

// Open-Meteo Weather → Merge Clima+Hist (input 0)
conn['Open-Meteo Weather'] = {
    "main": [
        [
            {
                "node": "Merge Clima+Hist",
                "type": "main",
                "index": 0
            }
        ]
    ]
};

// Get Supabase History → Merge Clima+Hist (input 1)
conn['Get Supabase History'] = {
    "main": [
        [
            {
                "node": "Merge Clima+Hist",
                "type": "main",
                "index": 1
            }
        ]
    ]
};

// Merge Clima+Hist → Enrich + Extrair Plano
conn['Merge Clima+Hist'] = {
    "main": [
        [
            {
                "node": "Enrich + Extrair Plano",
                "type": "main",
                "index": 0
            }
        ]
    ]
};

console.log('Rewired connections for parallel branches');

// ============================================================
// Save
// ============================================================
fs.writeFileSync('Workflow_Motor_Iris_Atualizado.json', JSON.stringify(w, null, 2));
console.log('\n=== DONE: All 5 steps applied ===');
