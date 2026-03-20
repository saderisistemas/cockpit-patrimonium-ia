const j = $input.item.json;

const score = Number(j.score || 0);
const historico = j.historico_resumo || {};
const globalAnalysis = j.global_analysis || {};
const recorrencia = globalAnalysis.analise_recorrencia || {};
const evento = j.evento_enriquecido || {};
const pendencia = j.pendencia || {};

const codigoEvento =
  j.codigo_evento ||
  pendencia.evento_codigo ||
  evento.codigo ||
  null;

const setor =
  j.setor ||
  pendencia.setor ||
  (pendencia.raw ? JSON.parse(pendencia.raw).setor : null) ||
  null;

const zona =
  j.zona ||
  pendencia.zona ||
  (pendencia.raw ? JSON.parse(pendencia.raw).zona : null) ||
  null;

const patrimonio =
  j.patrimonio_norm ||
  j.patrimonio ||
  pendencia.patrimonio_normalizado ||
  pendencia.patrimonio ||
  (pendencia.raw ? JSON.parse(pendencia.raw).patrimonio : null) ||
  null;

const endereco =
  j.endereco ||
  pendencia.endereco ||
  (pendencia.raw ? JSON.parse(pendencia.raw).endereco : null) ||
  null;

const descricaoEvento =
  j.descricao_evento ||
  pendencia.desc_evento ||
  evento.descricao_iris ||
  (pendencia.raw ? JSON.parse(pendencia.raw).descEvento : null) ||
  null;

const mesmoCodigo7d = Number(historico.mesmo_codigo_evento || recorrencia.qtd_mesmo_evento_7d || 0);
const mesmoSetor7d = Number(historico.mesmo_setor || 0);
const mesmaZona7d = Number(historico.mesma_zona || recorrencia.qtd_mesma_zona_7d || 0);

// Novos campos E130 do Resumo Histórico IA
const e130Validos7d = Number(historico.e130_validos_sensor_7d || 0);
const diasDistintosE130Validos7d = Number(historico.dias_distintos_e130_validos_7d || 0);
const e130Total7d = Number(historico.e130_total_7d || 0);
const e130Descartados7d = Number(historico.e130_descartados_9013_5m_7d || 0);

const recorrenciaElevadaMesmoSetor = Boolean(historico.recorrencia_elevada_mesmo_setor === true);
const recorrenciaElevadaMesmoCodigo = Boolean(historico.recorrencia_elevada_mesmo_codigo === true);
const recorrenciaElevadaMesmaZona = Boolean(historico.recorrencia_elevada_mesma_zona === true);
const primeiraOcorrencia = Boolean(historico.primeira_ocorrencia === true);

const hipotese = (j.hipotese || "").toLowerCase();
const observacaoRecorrencia = (recorrencia.observacao || "").toLowerCase();
const pontosAtencao = Array.isArray(globalAnalysis.pontos_de_atencao)
  ? globalAnalysis.pontos_de_atencao.join(" | ").toLowerCase()
  : "";

let abrir_os = false;
let tipo_os = null;
let motivo_os = null;
let prioridade_os = "Baixa";
let categoria_os = null;
let detalhe_sensor = null;
let grau_suspeita = null;
let regra_suspeita_aplicada = null;

// ═══════════════════════════════════════════════════════════
// REGRA 1 (REVISADA): Suspeita de sensor/zona viciada via E130
// Usa e130_validos (já descartados os E130 com 9013 em ≤5min)
// ═══════════════════════════════════════════════════════════

if (String(codigoEvento || '').toUpperCase() === 'E130' && !primeiraOcorrencia) {

  // GRAU ALTA: >12 E130 válidos OU ≥3 dias distintos
  if (e130Validos7d > 12 || diasDistintosE130Validos7d >= 3) {
    grau_suspeita = 'alta';
    regra_suspeita_aplicada = e130Validos7d > 12
      ? `>12 E130 válidos na mesma zona em 7d (encontrados: ${e130Validos7d})`
      : `≥3 dias distintos com E130 válido (encontrados: ${diasDistintosE130Validos7d})`;
    prioridade_os = 'Alta';

  // GRAU MÉDIA: ≥8 E130 válidos em ≥2 dias distintos
  } else if (e130Validos7d >= 8 && diasDistintosE130Validos7d >= 2) {
    grau_suspeita = 'media';
    regra_suspeita_aplicada = `≥8 E130 válidos (${e130Validos7d}) em ≥2 dias distintos (${diasDistintosE130Validos7d})`;
    prioridade_os = 'Média';

  // GRAU BAIXA: ≥5 E130 válidos na mesma zona
  } else if (e130Validos7d >= 5) {
    grau_suspeita = 'baixa';
    regra_suspeita_aplicada = `≥5 E130 válidos na mesma zona em 7d (encontrados: ${e130Validos7d})`;
    prioridade_os = 'Baixa';

  // Fallback CORRIGIDO: indicação textual da IA + mínimo de recorrência (>=3 E130 válidos)
  // Removido fallback sem mínimo que causava OS indevida (ex: disparo 129009319)
  } else if (
    e130Validos7d >= 3 && (
      hipotese.includes("sensor") ||
      observacaoRecorrencia.includes("sensor") ||
      pontosAtencao.includes("sensor")
    )
  ) {
    grau_suspeita = 'baixa';
    regra_suspeita_aplicada = `Indicação textual da IA + >=3 E130 válidos (${e130Validos7d})`;
    prioridade_os = 'Baixa';
  }

  if (grau_suspeita) {
    abrir_os = true;
    tipo_os = "Sensor viciado";
    categoria_os = "Manutenção";
    detalhe_sensor = `Evento ${codigoEvento}${descricaoEvento ? " - " + descricaoEvento.trim() : ""}${zona ? " | zona " + zona : ""}`;
    motivo_os = `Suspeita de sensor viciado (grau: ${grau_suspeita}). ${regra_suspeita_aplicada}. ${detalhe_sensor}. E130 7d: total=${e130Total7d}, descartados(9013)=${e130Descartados7d}, válidos=${e130Validos7d}, dias distintos=${diasDistintosE130Validos7d}.`;
  }
}

// REGRA 2: falha técnica explícita (MANTIDA)
const eventoTecnico = ["9015", "E302", "E306", "E309", "E351"].includes(String(codigoEvento || "").toUpperCase());

if (!abrir_os && eventoTecnico && score >= 70) {
  abrir_os = true;
  tipo_os = "Falha técnica";
  categoria_os = "Manutenção";
  motivo_os = `Evento técnico ${codigoEvento}${descricaoEvento ? " - " + descricaoEvento.trim() : ""}${zona ? " | zona " + zona : ""} com score ${score}.`;
  prioridade_os = score >= 85 ? "Alta" : "Média";
}

// REGRA 3: recorrência operacional anormal (MANTIDA)
if (!abrir_os && !primeiraOcorrencia && mesmaZona7d >= 5 && score >= 70) {
  abrir_os = true;
  tipo_os = "Inspeção técnica";
  categoria_os = "Verificação";
  motivo_os = `Alta recorrência operacional${zona ? " na zona " + zona : ""}. Histórico 7d: mesma zona=${mesmaZona7d}.`;
  prioridade_os = "Média";
}

return {
  json: {
    ...j,
    codigo_evento: codigoEvento,
    setor,
    zona,
    patrimonio,
    patrimonio_norm: patrimonio,
    endereco,
    descricao_evento: descricaoEvento ? descricaoEvento.trim() : null,
    abrir_os,
    tipo_os,
    categoria_os,
    motivo_os,
    prioridade_os,
    detalhe_sensor,
    grau_suspeita,
    regra_suspeita_aplicada,
    e130_total_7d: e130Total7d,
    e130_descartados_9013_5m_7d: e130Descartados7d,
    e130_validos_sensor_7d: e130Validos7d,
    dias_distintos_e130_validos_7d: diasDistintosE130Validos7d
  }
};