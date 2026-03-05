const fs = require('fs');
const path = require('path');

// Read .env file from cockpit folder
const envPath = path.join(__dirname, 'cockpit', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseKey = '';

envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

async function run() {
    console.log('Fetching latest event from Supabase...');
    const response = await fetch(`${supabaseUrl}/rest/v1/iris_pendencias?select=id_disparo&order=created_at.desc&limit=1`, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    });

    const data = await response.json();
    if (!data || data.length === 0) {
        console.error('No events found in iris_pendencias');
        return;
    }

    const id_disparo = data[0].id_disparo;
    console.log(`Found event ID: ${id_disparo}. Triggering analisys webhook...`);

    const webhookUrl = 'https://patrimonium-n8n.cloudfy.live/webhook/iris-analisar';
    console.log(`POST to ${webhookUrl}`);

    // We expect { "body": { "id_disparo": "..." } } because the node looks for $json.body.id_disparo
    // Wait, let me check the Webhook configuration. It expects a POST.

    const webhookRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_disparo: id_disparo }) // n8n webhook will put this under body.id_disparo
    });

    const result = await webhookRes.text();
    console.log('Webhook triggered successfully!');
    console.log('Response:', result);
}

run();
