const fs = require('fs');

async function patchWeather() {
    const wfPath = 'Workflow_Motor_Iris_Atualizado.json';
    let wfStr = fs.readFileSync(wfPath, 'utf8');
    let wf = JSON.parse(wfStr);

    let updatedWeatherNode = false;
    for (let n of wf.nodes) {
        if (n.name === 'Open-Meteo Weather' && n.type === 'n8n-nodes-base.httpRequest') {
            n.parameters.url = `=https://api.open-meteo.com/v1/forecast?latitude={{ $node["Parse Json"].json.latitude || '-23.5505' }}&longitude={{ $node["Parse Json"].json.longitude || '-46.6333' }}&hourly=temperature_2m,weathercode,windspeed_10m&past_days=7&timezone=America%2FSao_Paulo`;
            updatedWeatherNode = true;
        }
    }

    if (updatedWeatherNode) {
        console.log('Successfully updated Open-Meteo Weather node url.');
    }

    // Now we update clima_code.js
    let climaCode = fs.readFileSync('clima_code.js', 'utf8');

    const originalWeatherParse = `let clima = null;
try {
  const weatherData = $('Open-Meteo Weather').first().json;
  if (weatherData && weatherData.current_weather) {
    const wcode = weatherData.current_weather.weathercode;
    const temp = weatherData.current_weather.temperature;
    const wind = weatherData.current_weather.windspeed;
    clima = {
      code: wcode,
      temp: temp,
      wind: wind
    };
  }
} catch (e) { }`;

    const newWeatherParse = `let clima = null;
try {
  const weatherData = $('Open-Meteo Weather').first().json;
  
  let dataStr = pendencia.data_evento || '';
  let horaStr = pendencia.hora_evento || '';
  
  // Format data_evento to YYYY-MM-DD
  if (dataStr.includes('/')) {
    const parts = dataStr.split('/');
    if (parts.length === 3) { // DD/MM/YYYY
      dataStr = \`\${parts[2]}-\${parts[1]}-\${parts[0]}\`;
    }
  } else if (dataStr.includes('T')) {
    dataStr = dataStr.split('T')[0];
  }
  
  // Format hora_evento to HH:00
  if (horaStr) {
    horaStr = horaStr.split(':')[0] + ':00';
  } else {
    horaStr = '00:00';
  }
  
  const targetTime = \`\${dataStr}T\${horaStr}\`;

  if (weatherData && weatherData.hourly && weatherData.hourly.time) {
    const times = weatherData.hourly.time;
    let idx = times.indexOf(targetTime);
    
    // Fallback to closest or current hour if target not found
    if (idx === -1) {
      idx = times.length - 1; // latest available
    }

    if (idx !== -1) {
      clima = {
        code: weatherData.hourly.weathercode[idx],
        temp: weatherData.hourly.temperature_2m[idx],
        wind: weatherData.hourly.windspeed_10m[idx]
      };
    }
  } else if (weatherData && weatherData.current_weather) {
    // Legacy fallback just in case
    clima = {
      code: weatherData.current_weather.weathercode,
      temp: weatherData.current_weather.temperature,
      wind: weatherData.current_weather.windspeed
    };
  }
} catch (e) { }`;

    if (climaCode.includes(originalWeatherParse)) {
        climaCode = climaCode.replace(originalWeatherParse, newWeatherParse);
        fs.writeFileSync('clima_code.js', climaCode);
        console.log('Successfully updated clima_code.js to parse exact historical hour.');
    } else if (!climaCode.includes('targetTime')) {
        console.log('WARNING: Could not find original weather parse block in clima_code.js');
    }

    let updatedEnrichNode = false;
    for (let n of wf.nodes) {
        if (n.name === 'Enrich + Extrair Plano' && n.type === 'n8n-nodes-base.code') {
            n.parameters.jsCode = climaCode;
            updatedEnrichNode = true;
        }
    }

    if (updatedEnrichNode) {
        console.log('Successfully injected modified clima_code.js into Enrich Node.');
    }

    fs.writeFileSync('Workflow_Motor_Iris_Atualizado.json', JSON.stringify(wf, null, 2));
    console.log('Workflow_Motor_Iris_Atualizado.json saved.');
}

patchWeather();
