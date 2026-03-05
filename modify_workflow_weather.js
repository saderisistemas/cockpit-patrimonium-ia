const fs = require('fs');

const workflowPath = 'Workflow_Motor_Iris_Atualizado.json';
let data = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

// Find nodes
const getHistoryNode = data.nodes.find(n => n.name === 'Get Supabase History');
const enrichNode = data.nodes.find(n => n.name === 'Enrich + Extrair Plano');

if (!getHistoryNode || !enrichNode) {
    console.error('Could not find necessary nodes');
    process.exit(1);
}

// Create new Geocoding Node
const geoNode = {
    "parameters": {
        "url": "=https://nominatim.openstreetmap.org/search?q={{encodeURIComponent($('Get Row Supabase').item.json.endereco)}}&format=json&limit=1",
        "options": {
            "headers": {
                "User-Agent": "Agnte_Iris_IA/1.0"
            }
        }
    },
    "id": "uuid-geo-" + Date.now(),
    "name": "Geocoding Nominatim",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.1,
    "position": [
        getHistoryNode.position[0] + 200,
        getHistoryNode.position[1]
    ],
    "alwaysOutputData": true
};

// Create new Open-Meteo node
const weatherNode = {
    "parameters": {
        "url": "=https://api.open-meteo.com/v1/forecast?latitude={{$json[0]?.lat || '-23.5505'}}&longitude={{$json[0]?.lon || '-46.6333'}}&current_weather=true",
        "options": {}
    },
    "id": "uuid-weather-" + Date.now(),
    "name": "Open-Meteo Weather",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.1,
    "position": [
        geoNode.position[0] + 200,
        getHistoryNode.position[1]
    ],
    "alwaysOutputData": true
};

// Update position of Enrich Node and everything after it
const xShift = 400;
data.nodes.forEach(node => {
    if (node.position[0] >= enrichNode.position[0]) {
        node.position[0] += xShift;
    }
});

// Update JavaScript in Enrich node
let jsCode = enrichNode.parameters.jsCode;
if (!jsCode.includes('let clima')) {
    const climateStr = `
let clima = "Não disponível";
try {
  const weatherData = $('Open-Meteo Weather').first().json;
  if(weatherData && weatherData.current_weather) {
    clima = \`Temperatura: \${weatherData.current_weather.temperature}°C, Vento: \${weatherData.current_weather.windspeed}km/h\`;
  }
} catch(e) {}
`;
    // Insert after historico logic
    jsCode = jsCode.replace('const CATALOGO = ', climateStr + '\nconst CATALOGO = ');

    // Add clima to output
    if (jsCode.includes('payload_ia: {') || jsCode.includes('payload_ia : {')) {
        jsCode = jsCode.replace('id_cliente: pendencia.id_cliente,', 'id_cliente: pendencia.id_cliente,\n      clima: clima,');
    }
    enrichNode.parameters.jsCode = jsCode;
}

// Insert nodes
data.nodes.push(geoNode);
data.nodes.push(weatherNode);

// Update connections
// Get Supabase History goes to Geocoding
data.connections['Get Supabase History'] = {
    "main": [
        [
            {
                "node": "Geocoding Nominatim",
                "type": "main",
                "index": 0
            }
        ]
    ]
};

data.connections['Geocoding Nominatim'] = {
    "main": [
        [
            {
                "node": "Open-Meteo Weather",
                "type": "main",
                "index": 0
            }
        ]
    ]
};

data.connections['Open-Meteo Weather'] = {
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

fs.writeFileSync(workflowPath, JSON.stringify(data, null, 2));
console.log('Nodes and connections injected successfully.');
