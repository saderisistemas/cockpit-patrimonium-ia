/**
 * IRIS Collector v2.2 - Modo Discovery
 * Loga TODAS as chamadas XHR para descobrir a URL real dos endpoints do IRIS
 */
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');

const IRIS_DASHBOARD_URL = 'https://novo.sistemairis.com/paineis/painel-monitoramento';
const N8N_WEBHOOK_URL = 'https://patrimonium-n8n.cloudfy.live/webhook/iris-ingestor';
const SUPABASE_URL = 'https://vbjqsyebznaagmoxhcki.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZianFzeWViem5hYWdtb3hoY2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMDMxMzIsImV4cCI6MjA4Nzg3OTEzMn0.YH_FrUCW9QFznukcT9wEWcxFSehObUO52gPw2Yr892g';

let disparosEnviados = new Set();
let disparosAtivosNoIris = new Set();
let discoveryDone = false;

async function startCollector() {
    console.log('[START] IRIS Collector v2.2 - Discovery Mode');
    console.log('[INFO] Webhook: ' + N8N_WEBHOOK_URL);
    console.log('');

    const browser = await puppeteer.launch({
        headless: false,
        userDataDir: './iris_browser_data',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Intercepta TODAS as respostas XHR (exceto SVGs e imagens)
    page.on('response', async (response) => {
        const url = response.url();
        const status = response.status();
        const contentType = response.headers()['content-type'] || '';

        // Ignora SVGs, imagens, CSS, JS
        if (url.match(/\.(svg|png|jpg|css|js|woff|ttf)(\?|$)/i)) return;
        if (contentType.includes('image/') || contentType.includes('text/css')) return;

        // Loga TUDO que parece ser JSON/API
        if (status === 200 && (contentType.includes('json') || contentType.includes('text/plain'))) {
            try {
                const text = await response.text();
                // Tenta parsear como JSON
                try {
                    const json = JSON.parse(text);
                    const urlShort = url.replace('https://novo.sistemairis.com', '');

                    // Mostra info sobre esta chamada
                    const size = text.length;
                    let itemCount = '?';
                    if (Array.isArray(json)) itemCount = json.length;
                    else if (json.data && Array.isArray(json.data)) itemCount = json.data.length;

                    console.log(`[XHR] ${urlShort.substring(0, 60).padEnd(60)} | ${status} | ${size}B | items: ${itemCount}`);

                    // Se parece ter dados de violados/eventos (> 100 bytes, tem array)
                    if (size > 100 && (Array.isArray(json) ? json.length > 0 : (json.data && json.data.length > 0))) {
                        const items = Array.isArray(json) ? json : json.data;
                        if (items && items.length > 0) {
                            const firstItem = items[0];
                            const keys = Object.keys(firstItem);
                            console.log(`  └─ Keys: ${keys.join(', ')}`);

                            // Detecta se parece com dados de alarme
                            const alarmKeys = ['Patrimonio', 'patrimonio', 'Evento', 'evento', 'Prioridade', 'prioridade', 'Hora', 'hora'];
                            const matchingKeys = keys.filter(k => alarmKeys.includes(k));

                            if (matchingKeys.length >= 2) {
                                console.log(`  └─ *** ENDPOINT DE ALARMES DETECTADO! ***`);
                                console.log(`  └─ Primeiro item: ${JSON.stringify(firstItem).substring(0, 200)}`);

                                // Salva para debug
                                fs.writeFileSync('./debug_alarmes_payload.json', JSON.stringify(json, null, 2));
                                console.log(`  └─ Payload salvo em debug_alarmes_payload.json`);

                                // Processa e envia
                                await processarEEnviarParaN8N(json, urlShort);
                            }
                        }
                    }
                } catch (e) {
                    // Não é JSON, ignore
                }
            } catch (err) {
                // Response body unavailable
            }
        }
    });

    // Navegação
    try {
        console.log('[NAV] Abrindo IRIS Legacy...');
        await page.goto(IRIS_DASHBOARD_URL, { waitUntil: 'networkidle2', timeout: 30000 });

        const requiresLogin = await page.$('input[type="password"]');
        if (requiresLogin) {
            console.log('[AUTH] Login necessário, preenchendo...');
            const userInput = await page.$('input[type="text"], input[type="email"], input[name*="user"], input[name*="login"]');
            if (userInput) await userInput.type('Pati');
            await page.type('input[type="password"]', 'Pati3343@');
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2' }),
                page.keyboard.press('Enter')
            ]);
            console.log('[AUTH] Login OK!');

            // Após login, navega ao painel
            console.log('[NAV] Navegando ao Painel de Monitoramento...');
            await page.goto(IRIS_DASHBOARD_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        } else {
            console.log('[AUTH] Ja autenticado via cookie.');
        }

        console.log('[LIVE] Coletor ativo! Logando TODAS as chamadas XHR...');
        console.log('[LIVE] Aguardando polling do IRIS...\n');

    } catch (e) {
        console.error('[ERRO]', e.message);
    }
}

async function processarEEnviarParaN8N(rawData, urlEndpoint) {
    let items = Array.isArray(rawData) ? rawData : (rawData.data || []);
    if (!items.length) return;

    console.log(`\n[PROCESS] Processando ${items.length} eventos de ${urlEndpoint}`);

    // Mapeamento flexível de campos do IRIS
    const eventosMapeados = items.map(ev => ({
        idDisparo: String(ev.IdDisparo || ev.idDisparo || ev.Id || ev.id || ev.Codigo || ev.codigo || `${ev.Patrimonio || ev.patrimonio}-${ev.Hora || ev.hora || Date.now()}`),
        idCliente: String(ev.IdCliente || ev.idCliente || ev.Cliente || ev.cliente || ev.CodigoCliente || ''),
        prioridade: Number(ev.Prioridade || ev.prioridade || ev.P || 3),
        data: ev.Data || ev.data || new Date().toISOString().split('T')[0],
        hora: ev.Hora || ev.hora || '',
        evento: ev.Evento || ev.evento || ev.EventoCodigo || ev.CodigoEvento || '',
        patrimonio: String(ev.Patrimonio || ev.patrimonio || ''),
        particao: String(ev.Particao || ev.particao || ev.Partição || '000'),
        agrupamento: ev.Agrupamento || ev.agrupamento || ev.Zona || ev.zona || '',
        nome: ev.Nome || ev.nome || ev.NomeCliente || ev.Titular || ev.titular || '',
        endereco: ev.Endereco || ev.endereco || ev.Endereço || ''
    }));

    const idsAtuais = new Set(eventosMapeados.map(e => e.idDisparo));

    // Detectar fechamentos
    if (disparosAtivosNoIris.size > 0) {
        const fechados = [...disparosAtivosNoIris].filter(id => !idsAtuais.has(id));
        if (fechados.length > 0) {
            console.log(`[CLOSE] ${fechados.length} evento(s) fechado(s): ${fechados.join(', ')}`);
            await fecharEventosNoSupabase(fechados);
        }
    }
    disparosAtivosNoIris = idsAtuais;

    // Enviar novos
    const novos = eventosMapeados.filter(ev => !disparosEnviados.has(ev.idDisparo));
    if (novos.length === 0) {
        console.log(`[SKIP] Nenhum evento novo (${eventosMapeados.length} já enviados)`);
        return;
    }

    console.log(`[SEND] Enviando ${novos.length} novo(s) para n8n...`);
    try {
        const result = await axios.post(N8N_WEBHOOK_URL, {
            timestamp_coleta: new Date().toISOString(),
            disparos_ativos: novos
        });
        if (result.status === 200) {
            console.log(`[OK] Lote enviado com sucesso!`);
            novos.forEach(e => {
                if (disparosEnviados.size > 1000) disparosEnviados.clear();
                disparosEnviados.add(e.idDisparo);
            });
        }
    } catch (err) {
        console.error(`[ERRO] Falha ao enviar:`, err.message);
    }
}

async function fecharEventosNoSupabase(ids) {
    for (const id of ids) {
        try {
            await axios.patch(
                `${SUPABASE_URL}/rest/v1/iris_pendencias?id_disparo=eq.${id}`,
                { status: 'fechado', atualizado_em: new Date().toISOString() },
                { headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'return=minimal' } }
            );
            console.log(`  [OK] ${id} -> fechado`);
            disparosEnviados.delete(id);
        } catch (err) {
            console.error(`  [ERRO] ${id}:`, err.message);
        }
    }
}

startCollector();
