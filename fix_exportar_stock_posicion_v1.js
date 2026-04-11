#!/usr/bin/env node
// fix_exportar_stock_posicion_v1.js
// Extrae el bloque exportar-stock de su posición incorrecta
// y lo reinserta justo antes de module.exports = router
// Uso: node fix_exportar_stock_posicion_v1.js

const fs   = require('fs');
const path = require('path');

const FILE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\dashboard\\api.js';

console.log('📄 Leyendo api.js...');
let api = fs.readFileSync(FILE, { encoding: 'utf8' });
if (api.charCodeAt(0) === 0xFEFF) api = api.slice(1);

// ── PASO 1: Extraer y remover el bloque exportar-stock donde está ahora ──
const BLOCK_START = '\n// GET /api/inventario/exportar-stock';
const BLOCK_END   = "console.error('[STOCK EXPORT]', e.message);\n    res.status(500).json({ error: 'Error al exportar: ' + e.message });\n  }\n});";

const startIdx = api.indexOf(BLOCK_START);
if (startIdx === -1) {
  console.log('❌ No encontró inicio del bloque exportar-stock');
  process.exit(1);
}

const endIdx = api.indexOf(BLOCK_END, startIdx);
if (endIdx === -1) {
  console.log('❌ No encontró cierre del bloque exportar-stock');
  process.exit(1);
}

const blockEndFull = endIdx + BLOCK_END.length;
const exportarBlock = api.slice(startIdx, blockEndFull);

console.log('✅ Bloque exportar-stock extraído (' + exportarBlock.length + ' chars)');
console.log('   Posición actual: línea ~' + api.slice(0, startIdx).split('\n').length);

// Remover el bloque de su posición actual
api = api.slice(0, startIdx) + api.slice(blockEndFull);
console.log('✅ Bloque removido de posición incorrecta');

// ── PASO 2: Reinsertar justo antes de module.exports ──
const MODULE_EXPORTS = '\nmodule.exports = router;';
const meIdx = api.indexOf(MODULE_EXPORTS);

if (meIdx === -1) {
  console.log('❌ No encontró module.exports = router');
  process.exit(1);
}

api = api.slice(0, meIdx) + '\n' + exportarBlock + '\n' + api.slice(meIdx);
console.log('✅ Bloque exportar-stock insertado antes de module.exports');

// ── PASO 3: Guardar ──
fs.writeFileSync(FILE, api, { encoding: 'utf8' });

const check = fs.readFileSync(FILE);
console.log('BOM:', check[0] === 0xEF ? '❌ BOM presente' : '✅ Sin BOM');

// Verificar posición final
const finalIdx = api.indexOf('router.get(\'/inventario/exportar-stock\'');
const lineNum = api.slice(0, finalIdx).split('\n').length;
console.log('✅ exportar-stock ahora en línea ~' + lineNum);
console.log('\n🎯 Fix aplicado — corre node --check api.js para verificar');
