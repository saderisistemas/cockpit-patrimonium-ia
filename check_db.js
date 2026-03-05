require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, 'cockpit', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseKey = '';

envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Fetching latest event in iris_analises...');

    // Sort by criado_em descending
    const { data, error } = await supabase.from('iris_analises').select('*').order('criado_em', { ascending: false }).limit(1);
    if (error) {
        console.error(error);
    } else if (data && data.length > 0) {
        console.log("\n--- LATEST EVENT ---");
        console.log("ID:", data[0].id);
        console.log("Hipotese:", data[0].hipotese);

        console.log("\nEVIDENCIAS DA IA:");
        console.log(data[0].evidencias);

        console.log("\nEVENTO ENRIQUECIDO (PAYLOAD):");
        console.log(JSON.stringify(data[0].evento_enriquecido, null, 2));
    } else {
        console.log("No data found.");
    }
}
run();
