const fs = require('fs');

const top = fs.readFileSync('clima_code_top.txt', 'utf8');

const fullCode = fs.readFileSync('clima_code.js', 'utf8');
const lines = fullCode.split('\n');
const catalogoLine = lines[34]; // the huge one-liner JSON

const newBottom = `const catalogoItem = CATALOGO[pendencia.evento_codigo] || null;

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

const CONFIG_PLANOS = {
  "0000": { temCamera: true, temTatico: false, exigeVerificacaoImagem: true, cameraObrigatoria: true, nome: "0000" },
  "1000": { temCamera: false, temTatico: false, exigeVerificacaoImagem: false, cameraObrigatoria: false, nome: "1000" },
  "2000": { temCamera: false, temTatico: true, exigeVerificacaoImagem: false, cameraObrigatoria: false, nome: "2000" },
  "3000": { temCamera: false, temTatico: true, exigeVerificacaoImagem: false, cameraObrigatoria: false, nome: "3000" },
  "4000": { temCamera: false, temTatico: true, exigeVerificacaoImagem: false, cameraObrigatoria: false, nome: "4000" },
  "5000": { temCamera: false, temTatico: true, exigeVerificacaoImagem: false, cameraObrigatoria: false, nome: "5000" },
  "6000": { temCamera: true, temTatico: true, exigeVerificacaoImagem: true, cameraObrigatoria: true, nome: "6000" },
  "7000": { temCamera: true, temTatico: false, exigeVerificacaoImagem: true, cameraObrigatoria: true, nome: "7000" },
  "8000": { temCamera: true, temTatico: true, exigeVerificacaoImagem: true, cameraObrigatoria: true, nome: "8000" },
  "9000": { temCamera: false, temTatico: false, exigeVerificacaoImagem: false, cameraObrigatoria: false, nome: "9000" }
};

const contexto_plano = CONFIG_PLANOS[plano] || CONFIG_PLANOS["1000"];

const pendencia_raw = JSON.parse(JSON.stringify(pendencia));

// Sobrescreve as regras do payload RAW usando a configuracao de PLANO padronizada.
pendencia.temCamera = contexto_plano.temCamera;
pendencia.temTatico = contexto_plano.temTatico;
pendencia.exigeVerificacaoImagem = contexto_plano.exigeVerificacaoImagem;
pendencia.cameraObrigatoria = contexto_plano.cameraObrigatoria;

const eventoCatalogo = {
  codigo: pendencia.evento_codigo,
  descricao_iris: pendencia.desc_evento || '',
  descricao_catalogo: catalogoItem ? catalogoItem.desc_evento : 'Nao catalogado',
  prioridade_catalogo: catalogoItem ? catalogoItem.prioridade : 'nao definida',
  categoria: catalogoItem ? (catalogoItem.categoria || 'OUTROS') : 'NAO_CATALOGADO',
  requer_despacho: catalogoItem ? (catalogoItem.requer_despacho || false) : false,
  catalogado: !!catalogoItem,
  clima: clima
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
    plano_nome: contexto_plano.nome,
    contexto_plano: contexto_plano,
    evento_enriquecido: eventoCatalogo,
    pendencia: pendencia,
    pendencia_raw: pendencia_raw,
    historico: historicoFormatado,
    total_historico: historico.length,
    id_disparo: pendencia.id_disparo,
    id_cliente: pendencia.id_cliente
  }
}];`;

fs.writeFileSync('clima_code.js', [top, catalogoLine, newBottom].join('\n'));
console.log('clima_code.js updated successfully');
