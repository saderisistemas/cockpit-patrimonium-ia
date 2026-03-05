const fs = require('fs');
let code = fs.readFileSync('C:\\Users\\patrimonium\\Documents\\APP Iris IA\\enrich_code.txt', 'utf8');

// 1. Update E301 in CATALOGO
// The catalog is a JSON-like object string.
code = code.replace(
    /\"E301\":\{([^}]*)\}/,
    (match, content) => {
        if (content.includes('\"cor\":')) return match; // Already updated
        return `\"E301\":{${content},\"cor\":\"preta\"}`;
    }
);

// 2. Update eventoCatalogo structure
code = code.replace(
    /requer_despacho: catalogoItem \? \(catalogoItem\.requer_despacho \|\| false\) : false,\n  catalogado: !!catalogoItem/,
    `requer_despacho: catalogoItem ? (catalogoItem.requer_despacho || false) : false,\n  cor: catalogoItem ? (catalogoItem.cor || 'vermelha') : 'vermelha',\n  catalogado: !!catalogoItem`
);

// 3. Inject climate fetching logic
code = code.replace(
    /const historicoFormatado = historico\.slice\(0, 20\)\.map\(h => \({/,
    `let clima = null;\ntry {\n  clima = $('Climate Data (Open-Meteo)').first().json;\n} catch (e) {\n  clima = { error: \"Não foi possível obter dados climáticos\" };\n}\n\nconst historicoFormatado = historico.slice(0, 20).map(h => ({`
);

// 4. Update return object
code = code.replace(
    /total_historico: historico\.length,\n    id_disparo: pendencia\.id_disparo,/,
    `total_historico: historico.length,\n    clima: clima,\n    id_disparo: pendencia.id_disparo,`
);

fs.writeFileSync('C:\\Users\\patrimonium\\Documents\\APP Iris IA\\modified_enrich_code.txt', code, 'utf8');
console.log('Code modified successfully');
