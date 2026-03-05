const fs = require('fs');

const workflowPath = 'Workflow_Motor_Iris_Atualizado.json';
let data = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

// 1. Fix connections
// Original flow had: Get Supabase History -> Geocoding -> Weather -> Enrich
// We want: Get Row Supabase -> Geocoding -> Weather -> Get Supabase History -> Enrich
// Or actually: Webhook -> Get Row Supabase -> Geocoding (Nominatim) -> Climate Data (Open-Meteo) -> Get Supabase History -> Enrich + Extrair Plano

// Clear existing connections involving these nodes
for (let key in data.connections) {
    if (key === 'Get Row Supabase' || key === 'Get Supabase History' || key === 'Geocoding Nominatim' || key === 'Open-Meteo Weather' || key === 'Geocoding (Nominatim)' || key === 'Climate Data (Open-Meteo)') {
        data.connections[key] = { "main": [[]] };
    }
}

// Ensure proper names
const geoName = data.nodes.find(n => n.name.includes('Geocoding'))?.name || 'Geocoding Nominatim';
const weatherName = data.nodes.find(n => n.name.includes('Meteo'))?.name || 'Open-Meteo Weather';

// Rebuild connections
data.connections['Get Row Supabase'] = {
    "main": [
        [
            {
                "node": geoName,
                "type": "main",
                "index": 0
            }
        ]
    ]
};

data.connections[geoName] = {
    "main": [
        [
            {
                "node": weatherName,
                "type": "main",
                "index": 0
            }
        ]
    ]
};

data.connections[weatherName] = {
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

data.connections['Get Supabase History'] = {
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

// 2. Fix the node properties (URLs)
data.nodes.forEach(node => {
    if (node.name === geoName) {
        node.parameters.url = "=https://nominatim.openstreetmap.org/search?q={{encodeURIComponent($('Get Row Supabase').first().json.endereco || 'São Paulo')}}&format=json&limit=1";
    }
    if (node.name === weatherName) {
        node.parameters.url = `=https://api.open-meteo.com/v1/forecast?latitude={{ $('${geoName}').first().json.lat || '-23.5505' }}&longitude={{ $('${geoName}').first().json.lon || '-46.6333' }}&current_weather=true`;
    }
});

fs.writeFileSync(workflowPath, JSON.stringify(data, null, 2));
console.log('Workflow fixed successfully');
