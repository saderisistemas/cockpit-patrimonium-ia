const fs = require('fs');

// Ler o workflow
const wf = JSON.parse(fs.readFileSync('IRIS - Análise IA (Supabase API).json', 'utf8'));

// Encontrar o nó "Decidir Abertura OS"
const node = wf.nodes.find(n => n.name === 'Decidir Abertura OS');

if (!node) {
  console.error('Nó "Decidir Abertura OS" não encontrado!');
  process.exit(1);
}

const code = node.parameters.jsCode;

// Texto antigo do fallback
const oldFallback = `// Fallback: manter regra antiga para hipóteses da IA
  } else if (
    hipotese.includes("sensor") ||
    observacaoRecorrencia.includes("sensor") ||
    pontosAtencao.includes("sensor")
  ) {
    grau_suspeita = 'baixa';
    regra_suspeita_aplicada = 'Indicação textual da IA (hipótese/observação contém "sensor")';
    prioridade_os = 'Baixa';
  }`;

// Novo fallback com mínimo de 3 E130 válidos
const newFallback = `// Fallback CORRIGIDO: indicação textual da IA + mínimo de recorrência (>=3 E130 válidos)
  // Removido fallback sem mínimo que causava OS indevida (ex: disparo 129009319)
  } else if (
    e130Validos7d >= 3 && (
      hipotese.includes("sensor") ||
      observacaoRecorrencia.includes("sensor") ||
      pontosAtencao.includes("sensor")
    )
  ) {
    grau_suspeita = 'baixa';
    regra_suspeita_aplicada = \`Indicação textual da IA + >=3 E130 válidos (\${e130Validos7d})\`;
    prioridade_os = 'Baixa';
  }`;

if (code.includes(oldFallback)) {
  node.parameters.jsCode = code.replace(oldFallback, newFallback);
  fs.writeFileSync('IRIS - Análise IA (Supabase API).json', JSON.stringify(wf, null, 2));
  console.log('✅ SUCCESS: Fallback corrigido no workflow!');
  console.log('   - Antes: abria OS se IA mencionava "sensor" (sem mínimo)');
  console.log('   - Agora: exige >= 3 E130 válidos + menção a "sensor"');
} else {
  console.error('❌ Fallback antigo NÃO encontrado no código. Verificando...');
  const idx = code.indexOf('Fallback');
  if (idx >= 0) {
    console.log('Posição do Fallback:', idx);
    console.log('Contexto:', JSON.stringify(code.substring(idx - 10, idx + 300)));
  } else {
    console.log('Palavra "Fallback" não existe no jsCode');
  }
}
