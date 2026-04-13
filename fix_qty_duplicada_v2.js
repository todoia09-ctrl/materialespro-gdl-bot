// fix_qty_duplicada_v2.js
// Fix: "132x 132 × Perdura..." — strip qty duplicado al inicio del nombre
// v2: patrón una sola línea (evita CRLF mismatch en pedido.js)
// REGLA #38: dry-run obligatorio

const fs = require('fs');

const FILE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\pedido.js';

// Una sola línea — única en el archivo (nameMatch vs nameMatch2 en línea 135)
const OLD = "        producto = nameMatch[1].trim();";
const NEW = "        producto = nameMatch[1].trim().replace(/^\\d+\\s*[x\\u00d7]\\s*/i, '');";

// ── LEER ──
const content = fs.readFileSync(FILE, 'utf8');

// ── DRY-RUN ──
const occurrences = content.split(OLD).length - 1;
console.log('\n=== DRY-RUN ===');
console.log('Patrón OLD encontrado:', occurrences, 'vez/veces');
console.log('OLD literal:', JSON.stringify(OLD));

if (occurrences !== 1) {
  console.error('❌ ABORT — no encontrado exactamente 1 vez.');
  // Debug: mostrar líneas 129-136 raw
  const lines = content.split('\n');
  console.log('\nLíneas 129-136 raw:');
  lines.slice(128, 136).forEach((l, i) => {
    console.log(`  ${129+i}: ${JSON.stringify(l)}`);
  });
  process.exit(1);
}

// ── PREVIEW ──
const result = content.replace(OLD, NEW);
const idx = result.indexOf("replace(/^\\d");
console.log('\nPreview:');
console.log('...' + result.substring(idx - 20, idx + 70) + '...');
console.log('\n✅ Patrón único confirmado. Escribiendo...');

// ── ESCRIBIR ──
fs.writeFileSync(FILE, result, { encoding: 'utf8' });
console.log('✅ pedido.js actualizado.');
console.log('⚡ Siguiente: node --check pedido.js');
