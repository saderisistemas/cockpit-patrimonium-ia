// Gate E130 — Preparar dados mínimos para verificação de cooldown
const row = $('Get Row Supabase').first().json;

const codigoEvento = String(row.evento_codigo ?? '').trim().toUpperCase();
const patrimonioNorm = String(row.patrimonio_normalizado ?? row.patrimonio ?? '')
  .normalize('NFKC').trim().toUpperCase().replace(/\s+/g, ' ');
const zona = String(row.zona ?? '').trim();

const isE130 = codigoEvento === 'E130';

// Timestamps para cooldowns
const agora = new Date();
const cooldown60m = new Date(agora.getTime() - 60 * 60 * 1000).toISOString();
const cooldown48h = new Date(agora.getTime() - 48 * 60 * 60 * 1000).toISOString();

return [{
  json: {
    ...row,
    _gate: {
      is_e130: isE130,
      patrimonio_norm: patrimonioNorm,
      zona: zona,
      codigo_evento: codigoEvento,
      cooldown_60m_iso: cooldown60m,
      cooldown_48h_iso: cooldown48h
    }
  }
}];
