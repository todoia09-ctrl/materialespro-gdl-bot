/**
 * fix_schema_seguimientos_v1.js
 * MaterialesPro GDL — Fix schema viejo en crm.js y api.js
 *
 * FIX 1 — crm.js: programarSeguimiento INSERT usa columnas inexistentes
 *   cotizacion_id → no existe en seguimientos
 *   whatsapp      → no existe en seguimientos
 *   programado_en → es programado_para
 *
 * FIX 2 — api.js: stock alerts query usa producto_id / stock_minimo directo
 *   (verificar si rompe — si inventario tiene alias estos pueden funcionar)
 *
 * EJECUTAR:
 *   node C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\fix_schema_seguimientos_v1.js
 */

const fs   = require('fs');
const path = require('path');

const CRM  = path.join(__dirname, 'crm.js');
const API  = path.join(__dirname, 'dashboard', 'api.js');

// Backups
fs.writeFileSync(CRM + '.bak_fix_schema_v1', fs.readFileSync(CRM));
fs.writeFileSync(API + '.bak_fix_schema_v1', fs.readFileSync(API));
console.log('[BACKUP] crm.js y api.js respaldados\n');

let fixes = 0;

function applyFix(file, label, oldStr, newStr) {
  let src = fs.readFileSync(file, 'utf8');
  if (src.includes(oldStr)) {
    fs.writeFileSync(file, src.replace(oldStr, newStr), 'utf8');
    console.log('[OK LF] ' + label); fixes++; return;
  }
  const o2 = oldStr.replace(/\n/g, '\r\n');
  const n2 = newStr.replace(/\n/g, '\r\n');
  src = fs.readFileSync(file, 'utf8');
  if (src.includes(o2)) {
    fs.writeFileSync(file, src.replace(o2, n2), 'utf8');
    console.log('[OK CRLF] ' + label); fixes++; return;
  }
  console.warn('[WARN] No encontrado: ' + label);
}

// ─────────────────────────────────────────────────
// FIX 1 — crm.js: programarSeguimiento schema nuevo
// ─────────────────────────────────────────────────
applyFix(CRM, 'FIX 1 — crm.js programarSeguimiento INSERT schema nuevo',
`async function programarSeguimiento(whatsapp, cotizacionId) {
  try {
    const cliente = await getCliente(whatsapp);
    if (!cliente) return;

    // 24 horas despu\u00e9s
    await query(\`
      INSERT INTO seguimientos(cotizacion_id,cliente_id,whatsapp,tipo,programado_en)
      VALUES($1,$2,$3,'24h', NOW() + INTERVAL '24 hours')
      ON CONFLICT DO NOTHING\`,
      [cotizacionId, cliente.id, whatsapp]
    );
    // 48 horas despu\u00e9s
    await query(\`
      INSERT INTO seguimientos(cotizacion_id,cliente_id,whatsapp,tipo,programado_en)
      VALUES($1,$2,$3,'48h', NOW() + INTERVAL '48 hours')
      ON CONFLICT DO NOTHING\`,
      [cotizacionId, cliente.id, whatsapp]
    );
  } catch (e) { console.error('[CRM] programarSeguimiento:', e.message); }
}`,
`async function programarSeguimiento(whatsapp, cotizacionId) {
  try {
    const cliente = await getCliente(whatsapp);
    if (!cliente) return;

    const nota = cotizacionId ? 'Cotizacion: ' + cotizacionId : null;

    // 24 horas despu\u00e9s
    await query(
      'INSERT INTO seguimientos(cliente_id, tipo, programado_para, estado, notas) ' +
      "VALUES($1,'24h', NOW() + INTERVAL '24 hours', 'pendiente', $2) " +
      'ON CONFLICT DO NOTHING',
      [cliente.id, nota]
    );
    // 48 horas despu\u00e9s
    await query(
      'INSERT INTO seguimientos(cliente_id, tipo, programado_para, estado, notas) ' +
      "VALUES($1,'48h', NOW() + INTERVAL '48 hours', 'pendiente', $2) " +
      'ON CONFLICT DO NOTHING',
      [cliente.id, nota]
    );
  } catch (e) { console.error('[CRM] programarSeguimiento:', e.message); }
}`
);

// ─────────────────────────────────────────────────
// FIX 2 — api.js: stock alerts query
// producto_id y stock_minimo son alias en inventario — pueden funcionar
// pero la query usa c.codigo=i.producto_id que puede fallar
// Cambiamos a JOIN correcto con catalogo_id
// ─────────────────────────────────────────────────
applyFix(API, 'FIX 2 — api.js stock alerts JOIN correcto',
  '"SELECT i.producto_id, i.stock, i.stock_minimo, i.unidad, c.nombre"' + '\n' +
  '        + " FROM inventario i LEFT JOIN catalogo_productos c ON c.codigo=i.producto_id"',
  '"SELECT cp.codigo AS producto_id, i.stock_physical AS stock, i.stock_minimo, i.unidad, cp.nombre"' + '\n' +
  '        + " FROM inventario i JOIN catalogo_productos cp ON cp.id = i.catalogo_id"'
);

// ─────────────────────────────────────────────────
// FIX 3 — api.js: edit producto UPDATE WHERE producto_id
// producto_id es alias de catalogo_id en inventario — deberia funcionar
// pero cambiamos a catalogo_id para ser explícitos
// ─────────────────────────────────────────────────
applyFix(API, 'FIX 3 — api.js edit producto UPDATE WHERE catalogo_id',
  '"UPDATE inventario SET " + invUpdates.join(", ") + ", actualizado_en = NOW() WHERE producto_id = $1"',
  '"UPDATE inventario SET " + invUpdates.join(", ") + ", actualizado_en = NOW() WHERE catalogo_id = (SELECT id FROM catalogo_productos WHERE codigo = $1)"'
);

console.log('\n=== RESULTADO ===');
console.log('Fixes aplicados: ' + fixes + '/3\n');
