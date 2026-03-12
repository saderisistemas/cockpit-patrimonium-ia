const data = $input.first().json;

const pendencia = data.pendencia || {};
const historico = Array.isArray(data.historico) ? data.historico : [];

const eventoAtual = String(pendencia.evento_codigo || '').trim().toUpperCase();
const zonaAtual = String(pendencia.zona || '').trim();
const setorAtual = String(pendencia.setor || '').trim();
const dataAtual = String(pendencia.data_evento || '').trim();
const horaAtual = String(pendencia.hora_evento || '00:00:00').trim();

function toMinutes(hora) {
    if (!hora) return null;
    const [h, m] = hora.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
}

const minutosAtual = toMinutes(horaAtual);

const mesmoEvento7d = historico.filter(h =>
    String(h.evento || '').trim().toUpperCase() === eventoAtual
);

const mesmaZona7d = historico.filter(h =>
    String(h.zona || '').trim() === zonaAtual && zonaAtual !== ''
);

const mesmoEventoMesmaZona7d = historico.filter(h =>
    String(h.evento || '').trim().toUpperCase() === eventoAtual &&
    String(h.zona || '').trim() === zonaAtual &&
    zonaAtual !== ''
);

const mesmoDiaMesmaZona = historico.filter(h =>
    String(h.data || '').trim() === dataAtual &&
    String(h.zona || '').trim() === zonaAtual &&
    zonaAtual !== ''
);

const historicoMesmoDia = historico.filter(h =>
    String(h.data || '').trim() === dataAtual
);

const zonasMesmoDia = [...new Set(
    historicoMesmoDia
        .map(h => String(h.zona || '').trim())
        .filter(z => z !== '')
)];

let multiZonaJanela10min = false;

if (minutosAtual !== null) {
    const janela = historicoMesmoDia.filter(h => {
        const mz = String(h.zona || '').trim();
        const mh = toMinutes(String(h.hora || '').trim());
        if (!mz || mz === zonaAtual || mh === null) return false;
        return Math.abs(mh - minutosAtual) <= 10;
    });

    if (janela.length > 0) {
        multiZonaJanela10min = true;
    }
}

let padraoHorario = false;
if (minutosAtual !== null && mesmoEvento7d.length >= 2) {
    const proximosHorario = mesmoEvento7d.filter(h => {
        const mh = toMinutes(String(h.hora || '').trim());
        if (mh === null) return false;
        return Math.abs(mh - minutosAtual) <= 30;
    });
    padraoHorario = proximosHorario.length >= 2;
}

const qtdMesmoEvento7d = mesmoEvento7d.length;
const qtdMesmaZona7d = mesmaZona7d.length;
const qtdMesmoEventoMesmaZona7d = mesmoEventoMesmaZona7d.length;
const qtdMesmoDiaMesmaZona = mesmoDiaMesmaZona.length;
const zonasDiferentesHoje = zonasMesmoDia.length;

let classificacaoRecorrencia = 'EVENTO_ISOLADO';
let scoreAjuste = 0;
let motivoScore = 'Sem ajuste relevante por recorrência.';
let indiceSensibilidade = 'MEDIA';

if (qtdMesmoEvento7d === 0 && qtdMesmaZona7d === 0) {
    classificacaoRecorrencia = 'PRIMEIRO_EVENTO';
    scoreAjuste = 10;
    motivoScore = 'Primeiro evento relevante sem recorrência recente.';
    indiceSensibilidade = 'ALTA';
}

if (qtdMesmoEventoMesmaZona7d >= 3 || qtdMesmoDiaMesmaZona >= 2) {
    classificacaoRecorrencia = 'SENSOR_VICIADO';
    scoreAjuste = -20;
    motivoScore = 'Mesma zona/evento com repetição compatível com falha ou sensor viciado.';
    indiceSensibilidade = 'BAIXA';
}

if (qtdMesmoEvento7d >= 2 && classificacaoRecorrencia === 'EVENTO_ISOLADO') {
    classificacaoRecorrencia = 'RECORRENTE_MODERADO';
    scoreAjuste = -5;
    motivoScore = 'Evento já ocorreu outras vezes nos últimos 7 dias.';
    indiceSensibilidade = 'MEDIA';
}

if (multiZonaJanela10min || zonasDiferentesHoje >= 3) {
    classificacaoRecorrencia = 'MULTI_ZONA_CRITICO';
    scoreAjuste = 20;
    motivoScore = 'Disparos em múltiplas zonas indicam maior criticidade.';
    indiceSensibilidade = 'CRITICA';
}

const recorrencia_real = {
    qtd_mesmo_evento_7d: qtdMesmoEvento7d,
    qtd_mesma_zona_7d: qtdMesmaZona7d,
    qtd_mesmo_evento_mesma_zona_7d: qtdMesmoEventoMesmaZona7d,
    disparos_mesmo_dia_mesma_zona: qtdMesmoDiaMesmaZona,
    multi_zona_janela_10min: multiZonaJanela10min,
    zonas_diferentes_hoje: zonasDiferentesHoje,
    padrao_horario: padraoHorario,
    primeiro_evento_relevante: qtdMesmoEvento7d === 0 && qtdMesmaZona7d === 0,
    indice_sensibilidade: indiceSensibilidade,
    classificacao_recorrencia: classificacaoRecorrencia,
    score_ajuste: scoreAjuste,
    motivo_score: motivoScore
};

return [{
    json: {
        ...data,
        recorrencia_real
    }
}];
