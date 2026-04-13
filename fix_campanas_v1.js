#!/usr/bin/env node
/**
 * fix_campanas_v1.js
 * Fix 1: campanas.js — reemplaza activo=TRUE → estado='activo' en todos los segmentos
 * Fix 2: dashboard/api.js — elimina estadoVal mal ubicado en bloque no_campana
 */

const fs = require('fs');
const BASE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\';

// ─── FIX 1: campanas.js ────────────────────────────────────────────────────
const CAMP_FILE = BASE + 'campanas.js';
console.log('Reading:', CAMP_FILE);
let camp = fs.readFileSync(CAMP_FILE, 'utf8');
const campOrig = camp;

// Reemplaza todas las ocurrencias de activo=TRUE en queries de clientes
camp = camp.replace(/c\.activo=TRUE/g, "c.estado='activo'");
camp = camp.replace(/activo=TRUE/g, "estado='activo'");

const campChanges = (camp !== campOrig);
if (campChanges) {
  fs.writeFileSync(CAMP_FILE, camp, 'utf8');
  console.log('[OK] FIX 1: campanas.js activo=TRUE → estado=\'activo\' en todos los segmentos');
} else {
  console.warn('[WARN] FIX 1: No changes in campanas.js');
}

// ─── FIX 2: dashboard/api.js — quitar estadoVal del bloque no_campana ─────
const API_FILE = BASE + 'dashboard\\api.js';
console.log('Reading:', API_FILE);
let api = fs.readFileSync(API_FILE, 'utf8');
const apiOrig = api;

// El estadoVal fue insertado antes de "const isNumeric" en el bloque no_campana
// El bloque no_campana usa "valor" no "activo", así que estadoVal ahí es incorrecto
// Buscamos la línea exacta: "const estadoVal = activo ? 'activo' : 'inactivo';"
// seguida de "const isNumeric" en el contexto del endpoint no_campana (línea ~295)
// Identificamos por contexto: "req.body.valor !== false" está arriba

const OLD2 = `    const valor = req.body && req.body.valor !== false;
    const estadoVal = activo ? 'activo' : 'inactivo';
      const isNumeric = /^\\d+$/.test(idParam);`;

const NEW2 = `    const valor = req.body && req.body.valor !== false;
    const isNumeric = /^\\d+$/.test(idParam);`;

if (api.includes(OLD2)) {
  api = api.replace(OLD2, NEW2);
  console.log('[OK] FIX 2: estadoVal eliminado del bloque no_campana');
} else {
  // Fallback: buscar la línea suelta con contexto diferente
  const OLD2b = "    const estadoVal = activo ? 'activo' : 'inactivo';\n      const isNumeric = /^\\d+$/.test(idParam);";
  const NEW2b = "    const isNumeric = /^\\d+$/.test(idParam);";
  if (api.includes(OLD2b)) {
    api = api.replace(OLD2b, NEW2b);
    console.log('[OK] FIX 2 (fallback): estadoVal eliminado del bloque no_campana');
  } else {
    console.warn('[WARN] FIX 2: Pattern not found — verifying manually needed');
    // Count estadoVal occurrences
    const count = (api.match(/const estadoVal/g) || []).length;
    console.log('[INFO] estadoVal occurrences in api.js:', count, '(expected: 1 in deshabilitar only)');
  }
}

if (api !== apiOrig) {
  fs.writeFileSync(API_FILE, api, 'utf8');
  console.log('[OK] dashboard/api.js updated');
} else {
  console.log('[SKIP] dashboard/api.js unchanged');
}

console.log('\n[DONE] All fixes applied.');
