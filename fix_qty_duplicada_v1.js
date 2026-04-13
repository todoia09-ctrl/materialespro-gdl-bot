// fix_qty_duplicada_v1.js
// Fix: "132x 132 × Perdura..." — strip qty duplicado al inicio del nombre capturado
// REGLA #38: dry-run obligatorio

const fs = require('fs');

const FILE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\pedido.js';

const OLD = `      if (nameMatch) {
        producto = nameMatch[1].trim();
      }`;

const NEW = `      if (nameMatch) {
        producto = nameMatch[1].trim().replace(/^\\d+\\s*[x\\u00d7]\\s*/i, '');
      }`;

// ── LEER ──
const content = fs.readFileSync(FILE, 'utf8');

// ── DRY-RUN ──
const occurrences = content.split(OLD).length - 1;
console.log('\n=== DRY-RUN ===');
console.log('Patrón OLD encontrado:', occurrences, 'vez/veces');

if (occurrences !== 1) {
  console.error('❌ ABORT — patrón no encontrado exactamente 1 vez. No se escribe nada.');
  // Debug: buscar líneas similares
  content.split('\n').forEach((l, i) => {
    if (l.includes('nameMatch') || l.includes('producto =')) {
      console.log(`  Línea ${i+1}: ${l}`);
    }
  });
  process.exit(1);
}

// ── PREVIEW ──
const result = content.replace(OLD, NEW);
const idx = result.indexOf('replace(/^\\d');
console.log('\nPreview del nuevo texto:');
console.log(result.substring(idx - 30, idx + 80));
console.log('\n✅ Patrón encontrado 1 vez. Escribiendo...');

// ── ESCRIBIR ──
fs.writeFileSync(FILE, result, { encoding: 'utf8' });
console.log('✅ pedido.js actualizado.');
console.log('⚡ Siguiente: node --check pedido.js');
