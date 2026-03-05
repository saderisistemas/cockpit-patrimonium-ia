const fs = require('fs');

try {
    const workflowDataStr = fs.readFileSync('C:/Users/patrimonium/.gemini/antigravity/brain/9dd92098-f16b-4770-a853-5b08f6bfd52c/.system_generated/steps/455/output.txt', 'utf8');
    let workflowData;
    try {
        workflowData = JSON.parse(workflowDataStr).data;
    } catch (e) {
        console.error("Parse error on workflowData:", e);
        process.exit(1);
    }

    const catalogo = JSON.parse(fs.readFileSync('catalogo_dump.json', 'utf8'));

    // Optimize code for Enrich
    const newJsCode = `const pendencia = $('Get Row Supabase').first().json;

let historico = [];
try {
  const histItems = $('Get Supabase History').all().map(i => i.json);
  historico = histItems.filter(j => j && Object.keys(j).length > 0);
} catch (e) {
  historico = [];
}

const CATALOGO = ${JSON.stringify(catalogo)};
const catalogoItem = CATALOGO[pendencia.evento_codigo] || null;

const patrimonio = String(pendencia.patrimonio || '').trim().toUpperCase();
let plano = '1000';
const regexPlanos = /(0000|1000|2000|3000|4000|5000|6000|7000|8000|9000)/;
const match = patrimonio.match(regexPlanos);
if (match) {
  plano = match[0];
} else {
  if (patrimonio.length === 5 && patrimonio.charAt(0) === '1') {
    const milhar = patrimonio.charAt(1);
    if (milhar >= '1' && milhar <= '9') {
      plano = milhar + '000';
    } else {
      plano = '1000';
    }
  }
}
plano = String(plano).trim();

const eventoCatalogo = {
  codigo: pendencia.evento_codigo,
  descricao_iris: pendencia.desc_evento || '',
  descricao_catalogo: catalogoItem ? catalogoItem.desc_evento : 'Nao catalogado',
  prioridade_catalogo: catalogoItem ? catalogoItem.prioridade : 'nao definida',
  categoria: catalogoItem ? (catalogoItem.categoria || 'OUTROS') : 'NAO_CATALOGADO',
  requer_despacho: catalogoItem ? (catalogoItem.requer_despacho || false) : false,
  catalogado: !!catalogoItem
};

const historicoFormatado = historico.slice(0, 20).map(h => ({
  id_disparo: h.id_disparo,
  evento: h.evento_codigo,
  desc_evento: h.desc_evento,
  data: h.data_evento,
  hora: h.hora_evento,
  zona: h.zona,
  setor: h.setor,
  status: h.status
}));

return [{
  json: {
    plano: plano,
    evento_enriquecido: eventoCatalogo,
    pendencia: pendencia,
    historico: historicoFormatado,
    total_historico: historico.length,
    id_disparo: pendencia.id_disparo,
    id_cliente: pendencia.id_cliente
  }
}];`;

    // Modify nodes
    workflowData.nodes = workflowData.nodes.filter(n => n.name !== 'Lookup Catalogo');
    const enrichNode = workflowData.nodes.find(n => n.name === 'Enrich + Extrair Plano');
    enrichNode.parameters.jsCode = newJsCode;

    // Update connections
    if (workflowData.connections['Get Supabase History']) {
        workflowData.connections['Get Supabase History']['main'] = [
            [{ node: 'Enrich + Extrair Plano', type: 'main', index: 0 }]
        ];
    }
    delete workflowData.connections['Lookup Catalogo'];

    const updatedWorkflow = {
        id: workflowData.id,
        nodes: workflowData.nodes,
        connections: workflowData.connections
    };

    fs.writeFileSync('optimized_workflow.json', JSON.stringify(updatedWorkflow, null, 2));

    console.log('Workflow optimized to optimized_workflow.json');

} catch (e) {
    console.error(e);
}
