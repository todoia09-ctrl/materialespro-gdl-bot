#!/usr/bin/env node
/**
 * fix_frontend_estado_v1.js
 * Fix: index.html usa c.activo para clientes pero DB tiene c.estado (ENUM)
 * 3 cambios quirúrgicos en el frontend
 */

const fs = require('fs');
const FILE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\dashboard\\index.html';

console.log('Reading:', FILE);
let src = fs.readFileSync(FILE, 'utf8');
const orig = src;

let changes = 0;

// FIX 1: fila tabla clientes — opacity si deshabilitado
// <tr style="${!c.activo ? ...}">
const O1 = '!c.activo ? \'opacity:.45;background:rgba(255,80,80,.06)\' : \'\'';
const N1 = 'c.estado !== \'activo\' ? \'opacity:.45;background:rgba(255,80,80,.06)\' : \'\'';
if (src.includes(O1)) { src = src.replace(O1, N1); changes++; console.log('[OK] FIX 1: fila tabla activo→estado'); }
else console.warn('[WARN] FIX 1 not found');

// FIX 2: ícono ✔/⛔ en columna estado de tabla clientes
const O2 = '!c.activo ? \'<span title="Deshabilitado" style="color:#ff6b6b">&#x26D4;</span>\' : \'<span title="Activo" style="color:#4caf50">&#x2714;</span>\'';
const N2 = 'c.estado !== \'activo\' ? \'<span title="Deshabilitado" style="color:#ff6b6b">&#x26D4;</span>\' : \'<span title="Activo" style="color:#4caf50">&#x2714;</span>\'';
if (src.includes(O2)) { src = src.replace(O2, N2); changes++; console.log('[OK] FIX 2: icono estado tabla'); }
else console.warn('[WARN] FIX 2 not found');

// FIX 3: _clienteActivo — guardar booleano derivado de estado
const O3 = 'window._clienteActivo = c.activo;';
const N3 = 'window._clienteActivo = c.estado === \'activo\';';
if (src.includes(O3)) { src = src.replace(O3, N3); changes++; console.log('[OK] FIX 3: _clienteActivo derivado de estado'); }
else console.warn('[WARN] FIX 3 not found');

if (src === orig) {
  console.error('[ERROR] No changes applied');
  process.exit(1);
}

fs.writeFileSync(FILE, src, 'utf8');
console.log(`[DONE] ${changes} fixes applied to index.html`);
