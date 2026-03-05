/**
 * IRIS Collector v3.0 - DIRECT SUPABASE (bypasses n8n)
 * =====================================================
 * O n8n webhook tem problemas de TLS persistentes com Cloudflare.
 * Solução: escrever diretamente no Supabase (que funciona sem TLS issues).
 * A lógica de mapeamento do n8n "Data Mapping (Code)" foi replicada aqui.
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const puppeteer = require('puppeteer');
const axios = require('axios');
const https = require('https');
const fs = require('fs');

const IRIS_DASHBOARD_URL = 'https://novo.sistemairis.com/paineis/painel-monitoramento';
const SUPABASE_URL = 'https://vbjqsyebznaagmoxhcki.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZianFzeWViem5hYWdtb3hoY2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMDMxMzIsImV4cCI6MjA4Nzg3OTEzMn0.YH_FrUCW9QFznukcT9wEWcxFSehObUO52gPw2Yr892g';

// Catálogo de eventos para enriquecer descricao_catalogo
const CATALOGO_EVENTOS = {
    'E110': 'Emergência Incêndio',
    'E120': 'Pânico',
    'E121': 'Coação/Pânico Silencioso',
    'E130': 'Alarme de Intrusão - Zona',
    'E131': 'Alarme Perímetro',
    'E132': 'Alarme Interior',
    'E133': 'Alarme 24h',
    'E134': 'Alarme Entrada/Saída',
    'E137': 'Tamper Violação',
    'E138': 'Alarme Próximo',
    'E140': 'Alarme Geral',
    'E143': 'Falha Expansão do Módulo',
    'E144': 'Tamper do Sensor',
    'E145': 'Violação da Sirene',
    'E150': 'Alarme 24 horas (zona)',
    'E301': 'Falta de energia AC',
    'E302': 'Bateria Baixa',
    'E305': 'Reset do Sistema',
    'E306': 'Alteração Programação',
    'E309': 'Teste de Bateria Baixa',
    'E321': 'Sirene/Bell Desconectada',
    'E333': 'Falha Expansão do Módulo',
    'E341': 'Problema Linha Telefônica',
    'E344': 'Falha rádio supervisão',
    'E350': 'Falha comunicação',
    'E351': 'Falha linha telefonica',
    'E354': 'Falha ao comunicar evento',
    'E355': 'Falha comunicação polling',
    'E373': 'Tamper zona incêndio',
    'E380': 'Problema no sensor',
    'E381': 'Perda de supervisão RF',
    'E383': 'Tamper do sensor',
    'E384': 'Bateria baixa do sensor RF',
    'E401': 'Armado/Desarmado pelo Usuário',
    'E407': 'Desarmado Remoto',
    'E408': 'Armado/Desarmado Quick',
    'E409': 'Verificação Abertura',
    'E441': 'Armado Stay',
    'E570': 'Bypass de zona',
    'E601': 'Teste Manual',
    'E602': 'Teste Periódico',
    'E616': 'Solicitação Serviço',
    'E621': 'Reset do Handler',
    'E623': 'Falha no log de Eventos',
    'E625': 'Reset data/hora',
    'E627': 'Alteração Programação',
    'E628': 'Código Inválido',
    'R110': 'Restauração Incêndio',
    'R120': 'Restauração Pânico',
    'R121': 'Restauração Coação',
    'R130': 'Restauração Alarme Zona',
    'R131': 'Restauração Perímetro',
    'R132': 'Restauração Interior',
    'R133': 'Restauração 24h',
    'R137': 'Restauração Tamper',
    'R143': 'Restauração Expansao do Módulo',
    'R144': 'Restauração Tamper Sensor',
    'R145': 'Restauração Sirene',
    'R301': 'Restauração AC',
    'R302': 'Restauração Bateria',
    'R305': 'Reset do Módulo',
    'R306': 'Restauração Alteração Programa',
    'R321': 'Restauração Bell/Sirene',
    'R333': 'Restauração Módulo Expansão',
    'R341': 'Restauração Linha Telefone',
    'R344': 'Restauração Rádio',
    'R350': 'Restauração Comunicação',
    'R351': 'Restauração Linha Telefone',
    'R354': 'Restauração comunicar evento',
    'R355': 'Restauração Comunicação Polling',
    'R373': 'Restauração Tamper Incêndio',
    'R380': 'Restauração Problema Sensor',
    'R381': 'Restauração Supervisão RF',
    'R383': 'Restauração Tamper Sensor',
    'R384': 'Restauração Bateria RF',
    'R401': 'Desarmado pelo Usuário',
    'R407': 'Armado Remoto',
    'R441': 'Desarmado Stay',
    'R570': 'Restauração Bypass',
    'R602': 'Teste Periódico Recebido',
    '9012': 'Central nao ativada no horario previsto',
    '9013': 'Central desativada fora do horario previsto',
    '9015': 'TESTE PERIODICO NAO RECEBIDO ATENCAO',
    '9065': 'Solicitacao de Deslocamento Tatico',
    '9704': 'Falta de energia',
    '9900': 'Violacao',
    '9901': 'Violacao Restaurada'
};

// HTTPS Agent reutilizável
const httpsAgent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 15000,
    maxSockets: 5,
    timeout: 30000,
    rejectUnauthorized: false
});

const supabaseHeaders = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'return=representation'
};

let disparosEnviados = new Set();
let disparosAtivosNoIris = new Set();

// ============================================================
// v3.0: Upsert DIRETO no Supabase (bypasses n8n)
// ============================================================
async function upsertSupabase(registro) {
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
        try {
            const result = await axios.post(
                `${SUPABASE_URL}/rest/v1/iris_pendencias`,
                registro,
                {
                    headers: {
                        ...supabaseHeaders,
                        'Prefer': 'resolution=merge-duplicates,return=representation'
                    },
                    httpsAgent: httpsAgent,
                    timeout: 15000
                }
            );
            return result;
        } catch (err) {
            if (tentativa < 3) {
                console.log(`  [RETRY-DB ${tentativa}/3] ${err.message.substring(0, 60)} — aguardando ${tentativa * 2}s`);
                await new Promise(r => setTimeout(r, tentativa * 2000));
            } else {
                throw err;
            }
        }
    }
}

// ============================================================
// v3.0: Mapeamento (replicado do n8n Data Mapping Code)
// ============================================================
function mapearEvento(ev) {
    const patrimonio = String(ev.patrimonio || ev.Patrimonio || '');
    let planoExtraido = 'desconhecido';
    if (patrimonio.length === 5 && patrimonio.startsWith('1')) {
        planoExtraido = patrimonio.charAt(1) + '000';
    }

    let dataEvento = ev.data || ev.Data || '';
    if (dataEvento.includes('/')) {
        const parts = dataEvento.split('/');
        dataEvento = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    // Contact ID: se evento > 4 chars, extrair zona do sufixo
    const eventoRaw = String(ev.evento || ev.Evento || '');
    let eventoCodigo = eventoRaw;
    let zonaExtraida = String(ev.zona || ev.Zona || '');
    if (eventoRaw.length > 4) {
        eventoCodigo = eventoRaw.substring(0, 4);
        if (!zonaExtraida) zonaExtraida = eventoRaw.substring(4);
    }

    // Enriquecimento com catálogo
    const descCatalogo = CATALOGO_EVENTOS[eventoCodigo] || '';

    return {
        id_disparo: String(ev.idDisparo || ev.IdDisparo || ''),
        id_cliente: String(ev.idCliente || ev.IdCliente || ''),
        prioridade: String(ev.prioridade || ev.Prioridade || '0'),
        data_evento: dataEvento,
        hora_evento: ev.hora || ev.Hora || '',
        evento_codigo: eventoCodigo,
        patrimonio: patrimonio,
        particao: String(ev.particao || ev.Particao || '000'),
        agrupamento: ev.agrupamento || ev.Agrupamento || '',
        nome: ev.nome || ev.Nome || '',
        endereco: ev.endereco || ev.Endereco || '',
        desc_evento: ev.descEvento || ev.DescEvento || '',
        descricao_catalogo: descCatalogo,
        zona: zonaExtraida,
        setor: String(ev.setor || ev.Setor || ''),
        viatura: ev.viatura || ev.Viatura || null,
        status_atendimento: ev.statusAtendimento || ev.StatusAtendimento || 0,
        status: 'pendente',
        permite_retardo: ev.permiteRetardo || ev.PermiteRetardo || false,
        pode_retardar: ev.podeRetardar || ev.PodeRetardar || false,
        tem_camera: ev.temCamera || ev.TemCamera || false,
        contagem: ev.contagem || ev.Contagem || 1,
        atender_ate: ev.atenderAte || ev.AtenderAte || null,
        operador_disparo: ev.operadorDisparo || ev.OperadorDisparo || null,
        plano_extraido: planoExtraido,
        raw: JSON.stringify(ev)
    };
}

async function startCollector() {
    console.log('==========================================================');
    console.log('[START] IRIS Collector v3.0 - DIRECT SUPABASE (bypass n8n)');
    console.log('[INFO] Supabase URL: ' + SUPABASE_URL);
    console.log('[INFO] Escrita DIRETA no banco — sem webhook n8n');
    console.log('[INFO] TLS_REJECT_UNAUTHORIZED = 0');
    console.log('==========================================================\n');

    const browser = await puppeteer.launch({
        headless: false,
        userDataDir: './iris_browser_data',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Intercepta respostas XHR
    page.on('response', async (response) => {
        const url = response.url();
        const status = response.status();
        const contentType = response.headers()['content-type'] || '';

        if (url.match(/\.(svg|png|jpg|css|js|woff|ttf)(\?|$)/i)) return;
        if (contentType.includes('image/') || contentType.includes('text/css')) return;

        if (status === 200 && (contentType.includes('json') || contentType.includes('text/plain'))) {
            try {
                const text = await response.text();
                try {
                    const json = JSON.parse(text);
                    const urlShort = url.replace('https://novo.sistemairis.com', '').replace('https://gateway.novo.sistemairis.com', '');
                    const size = text.length;
                    let itemCount = '?';
                    if (Array.isArray(json)) itemCount = json.length;
                    else if (json.data && Array.isArray(json.data)) itemCount = json.data.length;

                    if (size > 100 && (Array.isArray(json) ? json.length > 0 : (json.data && json.data.length > 0))) {
                        const items = Array.isArray(json) ? json : json.data;
                        if (items && items.length > 0) {
                            const firstItem = items[0];
                            const keys = Object.keys(firstItem);
                            const alarmKeys = ['Patrimonio', 'patrimonio', 'Evento', 'evento', 'Prioridade', 'prioridade', 'Hora', 'hora'];
                            const matchingKeys = keys.filter(k => alarmKeys.includes(k));

                            if (matchingKeys.length >= 2) {
                                console.log(`[ALARMES] ${items.length} eventos detectados`);
                                await processarEEnviarParaSupabase(json, urlShort);
                            }
                        }
                    }
                } catch (e) { }
            } catch (err) { }
        }
    });

    // Navegação
    try {
        console.log('[NAV] Abrindo IRIS...');
        await page.goto(IRIS_DASHBOARD_URL, { waitUntil: 'networkidle2', timeout: 30000 });

        const requiresLogin = await page.$('input[type="password"]');
        if (requiresLogin) {
            console.log('[AUTH] Login necessario, preenchendo...');
            const userInput = await page.$('input[type="text"], input[type="email"], input[name*="user"], input[name*="login"]');
            if (userInput) await userInput.type('Pati');
            await page.type('input[type="password"]', 'Pati3343@');
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2' }),
                page.keyboard.press('Enter')
            ]);
            console.log('[AUTH] Login OK!');
            await page.goto(IRIS_DASHBOARD_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        } else {
            console.log('[AUTH] Ja autenticado via cookie.');
        }

        console.log('[LIVE] Coletor v3.0 ativo! Escrita DIRETA no Supabase.');
        console.log('[LIVE] Aguardando polling do IRIS...\n');

    } catch (e) {
        console.error('[ERRO NAV]', e.message);
    }
}

async function processarEEnviarParaSupabase(rawData, urlEndpoint) {
    let items = Array.isArray(rawData) ? rawData : (rawData.data || []);
    if (!items.length) return;

    // Mapear todos os eventos
    const eventosMapeados = items.map(mapearEvento);
    const idsAtuais = new Set(eventosMapeados.map(e => e.id_disparo));

    // Detectar fechamentos
    if (disparosAtivosNoIris.size > 0) {
        const fechados = [...disparosAtivosNoIris].filter(id => !idsAtuais.has(id));
        if (fechados.length > 0) {
            console.log(`[CLOSE] ${fechados.length} evento(s) fechado(s)`);
            await fecharEventosNoSupabase(fechados);
        }
    }
    disparosAtivosNoIris = idsAtuais;

    // Filtrar novos
    const novos = eventosMapeados.filter(ev => !disparosEnviados.has(ev.id_disparo));
    if (novos.length === 0) {
        return; // Silencioso no skip para não poluir log
    }

    // Log de zonas
    const comZona = novos.filter(n => n.zona && n.zona !== '');
    console.log(`[SEND] ${novos.length} novo(s) → Supabase direto (${comZona.length} com zona)`);
    comZona.forEach(n => console.log(`  [ZONA] ${n.id_disparo}: ${n.evento_codigo} zona=${n.zona} setor=${n.setor}`));

    // Upsert cada evento diretamente no Supabase
    let sucesso = 0;
    let falha = 0;
    for (const registro of novos) {
        try {
            await upsertSupabase(registro);
            sucesso++;
            if (disparosEnviados.size > 1000) disparosEnviados.clear();
            disparosEnviados.add(registro.id_disparo);
        } catch (err) {
            falha++;
            console.error(`  [ERRO] ${registro.id_disparo}: ${err.response?.data?.message || err.message}`);
        }
    }

    if (sucesso > 0) console.log(`[OK] ✅ ${sucesso} evento(s) gravado(s) no Supabase!`);
    if (falha > 0) console.log(`[WARN] ⚠️ ${falha} evento(s) falharam`);
}

async function fecharEventosNoSupabase(ids) {
    for (const id of ids) {
        try {
            await axios.patch(
                `${SUPABASE_URL}/rest/v1/iris_pendencias?id_disparo=eq.${id}`,
                { status: 'fechado', atualizado_em: new Date().toISOString() },
                {
                    headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
                    httpsAgent: httpsAgent,
                    timeout: 10000
                }
            );
            console.log(`  [OK] ${id} -> fechado`);
            disparosEnviados.delete(id);
        } catch (err) {
            console.error(`  [ERRO] ${id}:`, err.message);
        }
    }
}

startCollector();
