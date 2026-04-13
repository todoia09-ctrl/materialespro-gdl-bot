/**
 * fix_inventario_ui_v1.js
 * MaterialesPro GDL — 3 fixes inventario
 *
 * FIX 1: Decimales UI — stock/stock_minimo muestran 50.000 → 50
 * FIX 2: Export Excel — agregar columna "activo"
 * FIX 3: Import Excel — leer columna "activo" y actualizar catalogo_productos
 *
 * EJECUTAR:
 *   node C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\fix_inventario_ui_v1.js
 */

const fs   = require('fs');
const path = require('path');

const BASE  = path.join(__dirname);
const HTML  = path.join(BASE, 'dashboard', 'index.html');
const API   = path.join(BASE, 'dashboard', 'api.js');

let fixes = 0;

function applyFix(file, label, oldStr, newStr) {
  let src = fs.readFileSync(file, 'utf8');
  if (src.includes(oldStr)) {
    src = src.replace(oldStr, newStr);
    fs.writeFileSync(file, src, 'utf8');
    console.log('[OK] ' + label);
    fixes++;
    return true;
  }
  // Try CRLF
  const oldCrlf = oldStr.replace(/\n/g, '\r\n');
  const newCrlf = newStr.replace(/\n/g, '\r\n');
  src = fs.readFileSync(file, 'utf8');
  if (src.includes(oldCrlf)) {
    src = src.replace(oldCrlf, newCrlf);
    fs.writeFileSync(file, src, 'utf8');
    console.log('[OK CRLF] ' + label);
    fixes++;
    return true;
  }
  console.warn('[WARN] No encontrado: ' + label);
  return false;
}

// Backups
fs.writeFileSync(HTML + '.bak_fix_ui_v1', fs.readFileSync(HTML));
fs.writeFileSync(API  + '.bak_fix_ui_v1', fs.readFileSync(API));
console.log('[BACKUP] index.html y api.js respaldados\n');

// ─────────────────────────────────────────────────
// FIX 1A — Parsear stock como entero al cargar datos
// ─────────────────────────────────────────────────
applyFix(HTML,
  'FIX 1A — stock: Math.round al cargar',
  '      stock: item.stock || 0,',
  '      stock: Math.round(Number(item.stock) || 0),'
);

// ─────────────────────────────────────────────────
// FIX 1B — Parsear stock_minimo como entero al cargar
// ─────────────────────────────────────────────────
applyFix(HTML,
  'FIX 1B — stock_minimo: Math.round al cargar',
  '      stock_minimo: item.stock_minimo || 0,',
  '      stock_minimo: Math.round(Number(item.stock_minimo) || 0),'
);

// ─────────────────────────────────────────────────
// FIX 1C — Render tabla: stock sin decimales
// ─────────────────────────────────────────────────
applyFix(HTML,
  'FIX 1C — render stock sin decimales',
  "      + '<td style=\"color:' + color + ';font-weight:600\">' + p.stock + '</td>'",
  "      + '<td style=\"color:' + color + ';font-weight:600\">' + Math.round(p.stock) + '</td>'"
);

// ─────────────────────────────────────────────────
// FIX 1D — Render tabla: stock_minimo sin decimales
// ─────────────────────────────────────────────────
applyFix(HTML,
  'FIX 1D — render stock_minimo sin decimales',
  "      + '<td style=\"color:var(--gray)\">' + p.stock_minimo + '</td>'",
  "      + '<td style=\"color:var(--gray)\">' + Math.round(p.stock_minimo) + '</td>'"
);

// ─────────────────────────────────────────────────
// FIX 1E — Input modal: value sin decimales
// ─────────────────────────────────────────────────
applyFix(HTML,
  'FIX 1E — input value sin decimales',
  'value="' + "' + p.stock + '\" min=\"0\"",
  'value="' + "' + Math.round(p.stock) + '\" min=\"0\""
);

// ─────────────────────────────────────────────────
// FIX 2 — Export Excel: agregar columna activo
// ─────────────────────────────────────────────────
applyFix(API,
  'FIX 2A — Export SELECT agrega activo',
  "'SELECT i.producto_id as codigo, c.nombre, c.marca, c.categoria, c.unidad, i.stock, i.stock_minimo ' +",
  "'SELECT i.producto_id as codigo, c.nombre, c.marca, c.categoria, c.unidad, i.stock, i.stock_minimo, c.activo ' +"
);

applyFix(API,
  'FIX 2B — Export data agrega activo',
  '      stock_minimo:  r.stock_minimo || 0,',
  '      stock_minimo:  r.stock_minimo || 0,\n        activo:        r.activo !== false ? 1 : 0,'
);

// ─────────────────────────────────────────────────
// FIX 3 — Import Excel: leer columna activo
// ─────────────────────────────────────────────────
const OLD_IMPORT_LOOP = `      const stockMin = (row['stock_minimo'] !== undefined) ? parseInt(row['stock_minimo']) : null;
      if (!codigo) continue;
      if (isNaN(stock) || stock < 0) { errores.push(codigo + ': stock invalido'); continue; }
      try {
        if (stockMin !== null && !isNaN(stockMin)) {
          await query(
            'UPDATE inventario SET stock_physical=$2, stock_minimo=$3, actualizado_en=NOW() WHERE catalogo_id=(SELECT id FROM catalogo_productos WHERE codigo=$1)',
            [codigo, stock, stockMin]
          );
        } else {
          await query(
            'UPDATE inventario SET stock_physical=$2, actualizado_en=NOW() WHERE catalogo_id=(SELECT id FROM catalogo_productos WHERE codigo=$1)',
            [codigo, stock]
          );
        }
        actualizados++;
      } catch(e) { errores.push(codigo + ': ' + e.message); }`;

const NEW_IMPORT_LOOP = `      const stockMin = (row['stock_minimo'] !== undefined) ? parseInt(row['stock_minimo']) : null;
      const activoRaw = row['activo'] !== undefined ? row['activo'] : row['Activo'];
      const activoVal = activoRaw === undefined ? null : (Number(activoRaw) === 0 || activoRaw === 'false' || activoRaw === 0 ? false : true);
      if (!codigo) continue;
      if (isNaN(stock) || stock < 0) { errores.push(codigo + ': stock invalido'); continue; }
      try {
        if (stockMin !== null && !isNaN(stockMin)) {
          await query(
            'UPDATE inventario SET stock_physical=$2, stock_minimo=$3, actualizado_en=NOW() WHERE catalogo_id=(SELECT id FROM catalogo_productos WHERE codigo=$1)',
            [codigo, stock, stockMin]
          );
        } else {
          await query(
            'UPDATE inventario SET stock_physical=$2, actualizado_en=NOW() WHERE catalogo_id=(SELECT id FROM catalogo_productos WHERE codigo=$1)',
            [codigo, stock]
          );
        }
        if (activoVal !== null) {
          await query(
            'UPDATE catalogo_productos SET activo=$2, actualizado_en=NOW() WHERE codigo=$1',
            [codigo, activoVal]
          );
        }
        actualizados++;
      } catch(e) { errores.push(codigo + ': ' + e.message); }`;

applyFix(API, 'FIX 3 — Import lee columna activo', OLD_IMPORT_LOOP, NEW_IMPORT_LOOP);

// ─────────────────────────────────────────────────
// RESULTADO
// ─────────────────────────────────────────────────
console.log('\n=== RESULTADO ===');
console.log('Fixes aplicados: ' + fixes + '/8');
if (fixes < 8) console.warn('WARN: Algunos fixes no se aplicaron — verificar manualmente');
else console.log('TODOS los fixes aplicados correctamente');
