let content = "";

if ($input.item.json.message && $input.item.json.message.content) {
	content = $input.item.json.message.content;
} else if ($input.item.json.text) {
	content = $input.item.json.text;
} else if (typeof $input.item.json === 'string') {
	content = $input.item.json;
} else if ($input.item.json.content) {
	content = $input.item.json.content;
}

if (!content) {
	throw new Error("Could not find AI content in output: " + JSON.stringify($input.item.json).substring(0, 100));
}

content = content.replace(/```json\n?|```/g, '').trim();

let promptResult;
try {
	promptResult = JSON.parse(content);
} catch (e) {
	const match = content.match(/\{[\s\S]*\}/);
	if (match) {
		promptResult = JSON.parse(match[0]);
	} else {
		throw new Error("AI responded with invalid JSON: " + content.substring(0, 100));
	}
}

const enrichData = $('Merge Global').first().json;
const webhookData = $('Webhook App (Analisar)').first().json.body || {};
const evento = enrichData.evento_enriquecido || {};
const historicoResumo = enrichData.historico_resumo || {};
const globalAnalysis = enrichData.global_analysis || {};
const pendencia = enrichData.pendencia || {};

return {
  json: {
    id_disparo: enrichData.id_disparo,
    id_cliente: enrichData.id_cliente,

    score: Number(promptResult.score || 0),
    hipotese: promptResult.hipotese || "Não informada",
    acao_recomendada: promptResult.acao_recomendada || "Analisar manualmente",
    evidencias: Array.isArray(promptResult.evidencias) ? promptResult.evidencias : [],

    plano_utilizado: enrichData.plano || null,
    operador_solicitante: webhookData.operador_solicitante || null,

    evento_enriquecido: evento,
    historico_resumo: historicoResumo,
    global_analysis: globalAnalysis,
    pendencia: pendencia,
    total_historico: enrichData.total_historico || 0,

    patrimonio: pendencia.patrimonio || null,
    patrimonio_norm: pendencia.patrimonio_normalizado || pendencia.patrimonio || null,
    endereco: pendencia.endereco || null,

    codigo_evento: evento.codigo || evento.codigo_evento || null,
    descricao_evento: evento.descricao || evento.desc_evento || null,
    zona: evento.zona || null,
    setor: evento.setor || null
  }
};
