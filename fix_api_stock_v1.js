/**
 * fix_api_stock_v1.js
 * MaterialesPro GDL — Fix dos bugs en dashboard/api.js
 *
 * BUG 1: importar-stock usa schema viejo (stock, producto_id)
 *        → fix: stock_physical, subquery por codigo
 *
 * BUG 2: PATCH /inventario/:id pasa i.id numerico a actualizarStock()
 *        que espera codigo string → nunca hace match
 *        → fix: query directa con WHERE id=$2
 *
 * EJECUTAR DESDE RAIZ DEL PROYECTO:
 *   node fix_api_stock_v1.js
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'dashboard', 'api.js');

console.log('\n[FIX] Leyendo:', FILE);
let src = fs.readFileSync(FILE, 'utf8');
const original = src;

let fixes = 0;

// ─────────────────────────────────────────────────────────────
// BUG 1A: UPDATE con stock_minimo — schema viejo
// ─────────────────────────────────────────────────────────────
const OLD_1A = `'UPDATE inventario SET stock=$2, stock_minimo=$3, actualizado_en=NOW() WHERE producto_id=$1'`;
const NEW_1A = `'UPDATE inventario SET stock_physical=$2, stock_minimo=$3, actualizado_en=NOW() WHERE catalogo_id=(SELECT id FROM catalogo_productos WHERE codigo=$1)'`;

if (src.includes(OLD_1A)) {
  src = src.replace(OLD_1A, NEW_1A);
  console.log('[FIX 1A] OK — UPDATE stock con stock_minimo corregido');
  fixes++;
} else {
  console.warn('[FIX 1A] WARN — patron no encontrado, ya fue corregido o cambio el texto');
}

// ─────────────────────────────────────────────────────────────
// BUG 1B: UPDATE sin stock_minimo — schema viejo
// ─────────────────────────────────────────────────────────────
const OLD_1B = `'UPDATE inventario SET stock=$2, actualizado_en=NOW() WHERE producto_id=$1'`;
const NEW_1B = `'UPDATE inventario SET stock_physical=$2, actualizado_en=NOW() WHERE catalogo_id=(SELECT id FROM catalogo_productos WHERE codigo=$1)'`;

if (src.includes(OLD_1B)) {
  src = src.replace(OLD_1B, NEW_1B);
  console.log('[FIX 1B] OK — UPDATE stock sin stock_minimo corregido');
  fixes++;
} else {
  console.warn('[FIX 1B] WARN — patron no encontrado');
}

// ─────────────────────────────────────────────────────────────
// BUG 2: PATCH /inventario/:id — pasa id numerico a actualizarStock()
// ─────────────────────────────────────────────────────────────
const OLD_2 = `router.patch('/inventario/:id', authMiddleware(['admin','bodega']), async (req, res) => {
  const { stock } = req.body;
  if (stock === undefined) return res.status(400).json({ error: 'stock requerido' });
  try {
    await actualizarStock(req.params.id, parseInt(stock), req.user.email);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});`;

const NEW_2 = `router.patch('/inventario/:id', authMiddleware(['admin','bodega']), async (req, res) => {
  const { stock } = req.body;
  if (stock === undefined) return res.status(400).json({ error: 'stock requerido' });
  try {
    await query(
      'UPDATE inventario SET stock_physical=$1, actualizado_en=NOW() WHERE id=$2',
      [parseInt(stock), parseInt(req.params.id)]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});`;

if (src.includes(OLD_2)) {
  src = src.replace(OLD_2, NEW_2);
  console.log('[FIX 2] OK — PATCH modal corregido con WHERE id=$2');
  fixes++;
} else {
  // Intentar con CRLF
  const OLD_2_CRLF = OLD_2.replace(/\n/g, '\r\n');
  const NEW_2_CRLF = NEW_2.replace(/\n/g, '\r\n');
  if (src.includes(OLD_2_CRLF)) {
    src = src.replace(OLD_2_CRLF, NEW_2_CRLF);
    console.log('[FIX 2] OK (CRLF) — PATCH modal corregido');
    fixes++;
  } else {
    console.warn('[FIX 2] WARN — patron PATCH no encontrado, verificar manualmente lineas 354-361');
  }
}

// ─────────────────────────────────────────────────────────────
// RESULTADO
// ─────────────────────────────────────────────────────────────
if (fixes === 0) {
  console.log('\n[FIX] Sin cambios — todos los patrones ya estaban corregidos o no coinciden.');
  process.exit(0);
}

if (src === original) {
  console.error('\n[ERROR] El archivo no cambio a pesar de fixes — abortando sin escribir.');
  process.exit(1);
}

// Backup
const BACKUP = FILE + '.bak_fix_api_stock_v1';
fs.writeFileSync(BACKUP, original);
console.log('\n[BACKUP] Guardado en:', BACKUP);

// Escribir
fs.writeFileSync(FILE, src, 'utf8');
console.log('[WRITE] dashboard/api.js actualizado');
console.log(`[DONE] ${fixes}/3 fixes aplicados\n`);
