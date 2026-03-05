const fs = require('fs');

async function deploy() {
    const workflowPath = 'Workflow_Motor_Iris_Atualizado.json';
    const data = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

    const API_URL = "https://patrimonium-n8n.cloudfy.live/api/v1";
    const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YTYzYzZkNy1mNDg3LTQyNTMtODRiMi01MzY3N2IyMGE5NTciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYTA0Y2JjMTctNWM4OC00NGZhLTlhNWQtOGIxYmM1MTNmNTA1IiwiaWF0IjoxNzcyMzE1NzgxfQ.GG2IA0KeqW02cU3FFnJCxCmCFiWY-2obeBbXkyUSkSs";
    const WORKFLOW_ID = "SmS0C5f3mQbervfm";

    data.nodes.forEach(node => {
        if (node.name === "Enrich + Extrair Plano") {
            let code = node.parameters.jsCode;

            // Replace the clima string logic to include an object
            code = code.replace(
                "clima = `Temperatura: ${weatherData.current_weather.temperature}°C, Vento: ${weatherData.current_weather.windspeed}km/h`;",
                "clima = { temp: weatherData.current_weather.temperature, wind: weatherData.current_weather.windspeed, code: weatherData.current_weather.weathercode, text: `Temperatura: ${weatherData.current_weather.temperature}°C, Vento: ${weatherData.current_weather.windspeed}km/h` };"
            );

            code = code.replace(
                "let clima = \"Não disponível\";",
                "let clima = { temp: null, wind: null, code: null, text: \"Não disponível\" };"
            );

            node.parameters.jsCode = code;
        }
    });

    const allowedSettings = ["executionOrder", "timezone", "saveDataErrorExecution", "saveDataSuccessExecution", "saveManualExecutions", "callerPolicy", "errorWorkflow"];
    const safeSettings = {};
    if (data.settings) {
        for (const key of allowedSettings) {
            if (key in data.settings) {
                safeSettings[key] = data.settings[key];
            }
        }
    }

    try {
        const response = await fetch(`${API_URL}/workflows/${WORKFLOW_ID}`, {
            method: 'PUT',
            headers: {
                'X-N8N-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: data.name,
                nodes: data.nodes,
                connections: data.connections,
                settings: safeSettings
            })
        });

        if (response.ok) {
            console.log('Successfully patched and deployed v2!');
            fs.writeFileSync(workflowPath, JSON.stringify(data, null, 2));
        } else {
            console.error('Failed', response.status);
            console.error(await response.text());
        }
    } catch (e) {
        console.error('Error:', e);
    }
}
deploy();
