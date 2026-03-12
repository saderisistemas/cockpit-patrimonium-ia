const fs = require('fs');

try {
    let wStr = fs.readFileSync('Workflow_Motor_Iris_Atualizado.json', 'utf8');
    let w = JSON.parse(wStr);

    w.nodes.forEach(n => {
        if (n.name === 'Open-Meteo Weather') {
            n.parameters.url = "=https://api.open-meteo.com/v1/forecast?latitude={{ $('Geocoding Nominatim').first().json.lat || '-23.5505' }}&longitude={{ $('Geocoding Nominatim').first().json.lon || '-46.6333' }}&hourly=temperature_2m,weathercode,windspeed_10m&past_days=7&timezone=America%2FSao_Paulo";
        }
    });

    fs.writeFileSync('Workflow_Motor_Iris_Atualizado.json', JSON.stringify(w, null, 2));
    console.log('Fixed Open-Meteo node URL in Workflow_Motor_Iris_Atualizado.json');
} catch (e) {
    console.error(e);
}
