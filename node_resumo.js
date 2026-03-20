const historico = $input.all();
const atual = $('Get Row Supabase').first().json;

const eventoAtual = String(atual.evento_codigo ?? '').trim();
const setorAtual = String(atual.setor ?? '').trim();
const zonaAtual = String(atual.zona ?? '').trim();
const agrupamentoAtual = String(atual.agrupamento ?? '').trim();

const totalEventos = historico.length;

const mesmoCodigo = historico.filter(item =>
  String(item.json.evento_codigo ?? '').trim() === eventoAtual
).length;

const mesmoSetor = historico.filter(item =>
  String(item.json.setor ?? '').trim() === setorAtual
).length;

const mesmaZona = historico.filter(item =>
  String(item.json.zona ?? '').trim() === zonaAtual
).length;

const mesmoAgrupamento = historico.filter(item =>
  String(item.json.agrupamento ?? '').trim() === agrupamentoAtual
).length;

// Monta contagem por horário HH:MM
const contagemHorarios = {};

for (const item of historico) {
  const hora = String(item.json.hora_evento ?? '').trim();
  const hhmm = hora ? hora.slice(0, 5) : 'SEM_HORA';
  contagemHorarios[hhmm] = (contagemHorarios[hhmm] || 0) + 1;
}

const horariosRecorrentes = Object.entries(contagemHorarios)
  .filter(([hora, qtd]) => hora !== 'SEM_HORA' && qtd >= 2)
  .map(([hora, qtd]) => ({ hora, quantidade: qtd }))
  .sort((a, b) => b.quantidade - a.quantidade);

// Eventos relevantes resumidos
const eventosRelevantes = historico.slice(0, 20).map(item => ({
  id_disparo: item.json.id_disparo ?? null,
  data_evento: item.json.data_evento ?? null,
  hora_evento: item.json.hora_evento ?? null,
  evento_codigo: item.json.evento_codigo ?? null,
  agrupamento: item.json.agrupamento ?? null,
  setor: item.json.setor ?? null,
  zona: item.json.zona ?? null,
  desc_evento: item.json.desc_evento ?? null
}));

// ═══════════════════════════════════════════════════════════
// NOVA LÓGICA E130/9013 — Descarte de E130 com 9013 em ≤ 5 min
// ═══════════════════════════════════════════════════════════

// Filtrar apenas E130 na mesma zona
const e130MesmaZona = historico.filter(item => {
  const cod = String(item.json.evento_codigo ?? '').trim().toUpperCase();
  const z = String(item.json.zona ?? '').trim();
  return cod === 'E130' && z === zonaAtual;
});

const e130Total7d = e130MesmaZona.length;

// Identificar pares E130→9013 (restauração em ≤ 5 min = abertura+fechamento normal)
const todos9013 = historico.filter(item => {
  const cod = String(item.json.evento_codigo ?? '').trim();
  return cod === '9013';
});

let e130Descartados = 0;

for (const e130 of e130MesmaZona) {
  const tsE130 = new Date(e130.json.data_evento + 'T' + (e130.json.hora_evento || '00:00:00'));
  if (isNaN(tsE130.getTime())) continue;

  const zonaE130 = String(e130.json.zona ?? '').trim();

  // Procurar um 9013 no mesmo patrimônio em até 5 min após o E130
  const temPar9013 = todos9013.some(r => {
    const zonaR = String(r.json.zona ?? '').trim();
    if (zonaR !== zonaE130) return false;

    const tsR = new Date(r.json.data_evento + 'T' + (r.json.hora_evento || '00:00:00'));
    if (isNaN(tsR.getTime())) return false;

    const diffMs = tsR.getTime() - tsE130.getTime();
    return diffMs >= 0 && diffMs <= 5 * 60 * 1000; // 0 a 5 min
  });

  if (temPar9013) e130Descartados++;
}

const e130Validos7d = e130Total7d - e130Descartados;

// Dias distintos com E130 válido (sem par 9013)
const diasComE130Valido = new Set();
for (const e130 of e130MesmaZona) {
  const tsE130 = new Date(e130.json.data_evento + 'T' + (e130.json.hora_evento || '00:00:00'));
  if (isNaN(tsE130.getTime())) continue;

  const zonaE130 = String(e130.json.zona ?? '').trim();
  const temPar = todos9013.some(r => {
    const zonaR = String(r.json.zona ?? '').trim();
    if (zonaR !== zonaE130) return false;
    const tsR = new Date(r.json.data_evento + 'T' + (r.json.hora_evento || '00:00:00'));
    if (isNaN(tsR.getTime())) return false;
    const diffMs = tsR.getTime() - tsE130.getTime();
    return diffMs >= 0 && diffMs <= 5 * 60 * 1000;
  });

  if (!temPar) {
    const dia = String(e130.json.data_evento ?? '').slice(0, 10);
    if (dia) diasComE130Valido.add(dia);
  }
}

const diasDistintosE130Validos7d = diasComE130Valido.size;

// ═══════════════════════════════════════════════════════════

const primeiraOcorrencia = totalEventos === 0;
const recorrenciaElevadaMesmoSetor = mesmoSetor >= 3;
const recorrenciaElevadaMesmaZona = mesmaZona >= 3;
const recorrenciaElevadaMesmoCodigo = mesmoCodigo >= 3;

let resumoTexto = '';

if (totalEventos === 0) {
  resumoTexto = 'Não foram encontrados eventos anteriores para este patrimônio nos últimos 7 dias.';
} else {
  resumoTexto =
    `Foram encontrados ${totalEventos} eventos para este patrimônio nos últimos 7 dias. ` +
    `${mesmoCodigo} possuem o mesmo código do evento atual (${eventoAtual || 'N/D'}). ` +
    `${mesmoSetor} ocorreram no mesmo setor (${setorAtual || 'N/D'}). ` +
    `${mesmaZona} ocorreram na mesma zona (${zonaAtual || 'N/D'}). ` +
    `${mesmoAgrupamento} pertencem ao mesmo agrupamento (${agrupamentoAtual || 'N/D'}).`;

  if (horariosRecorrentes.length > 0) {
    const topHorarios = horariosRecorrentes
      .slice(0, 3)
      .map(h => `${h.hora} (${h.quantidade}x)`)
      .join(', ');
    resumoTexto += ` Há recorrência de horário em: ${topHorarios}.`;
  }

  if (recorrenciaElevadaMesmoSetor) resumoTexto += ' Há recorrência elevada no mesmo setor.';
  if (recorrenciaElevadaMesmaZona) resumoTexto += ' Há recorrência elevada na mesma zona.';
  if (recorrenciaElevadaMesmoCodigo) resumoTexto += ' Há recorrência elevada do mesmo código de evento.';

  if (e130Validos7d > 0) {
    resumoTexto += ` E130 na mesma zona: ${e130Total7d} total, ${e130Descartados} descartados (9013 em ≤5min), ${e130Validos7d} válidos em ${diasDistintosE130Validos7d} dia(s) distinto(s).`;
  }
}

return [
  {
    json: {
      historico_resumo: {
        janela_dias: 7,
        total_eventos_periodo: totalEventos,
        mesmo_codigo_evento: mesmoCodigo,
        mesmo_setor: mesmoSetor,
        mesma_zona: mesmaZona,
        mesmo_agrupamento: mesmoAgrupamento,
        primeira_ocorrencia: primeiraOcorrencia,
        recorrencia_elevada_mesmo_setor: recorrenciaElevadaMesmoSetor,
        recorrencia_elevada_mesma_zona: recorrenciaElevadaMesmaZona,
        recorrencia_elevada_mesmo_codigo: recorrenciaElevadaMesmoCodigo,
        horarios_recorrentes: horariosRecorrentes,
        eventos_relevantes: eventosRelevantes,
        resumo_historico_texto: resumoTexto,
        // Novos campos E130
        e130_total_7d: e130Total7d,
        e130_descartados_9013_5m_7d: e130Descartados,
        e130_validos_sensor_7d: e130Validos7d,
        dias_distintos_e130_validos_7d: diasDistintosE130Validos7d
      }
    }
  }
];
