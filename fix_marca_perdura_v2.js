// fix_marca_perdura_v2.js
// Fix DINÁMICO: bot confunde marcas — genera lista de marcas desde catálogo en memoria
// Así cualquier marca nueva importada se reconoce automáticamente
// REGLA #38: dry-run obligatorio antes de escribir

const fs = require('fs');

const FILE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\server.js';

// ── PATRÓN OLD (línea actual hardcodeada) ──
const OLD = `    + '- Si el cliente menciona una marca (SIKA, FESTER, TRUPER, etc.), filtra y recomienda SOLO productos de esa marca\\n'`;

// ── NUEVO: dinámico desde CATALOG ──
const NEW = `    + '- Las marcas disponibles en el catálogo son: ' + [...new Set((CATALOG.productos||[]).map(p=>p.marca).filter(Boolean))].map(m=>m.toUpperCase()).sort().join(', ') + '. PERDURA y PEGADURO son marcas DISTINTAS — NUNCA confundirlas. Si el cliente menciona una marca, recomienda ÚNICAMENTE productos de ESA marca exacta (coincidencia exacta del campo marca).\\n'`;

// ── LEER ──
const content = fs.readFileSync(FILE, 'utf8');

// ── DRY-RUN ──
const occurrences = content.split(OLD).length - 1;
console.log('\n=== DRY-RUN ===');
console.log('Patrón OLD encontrado:', occurrences, 'vez/veces');

if (occurrences !== 1) {
  console.error('❌ ABORT — patrón no encontrado exactamente 1 vez. No se escribe nada.');
  console.log('\nBuscando línea similar para debug...');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('menciona una marca') || l.includes('SIKA') || l.includes('FESTER')) {
      console.log(`  Línea ${i+1}: ${l.trim()}`);
    }
  });
  process.exit(1);
}

// ── PREVIEW ──
const result = content.replace(OLD, NEW);
const idx = result.indexOf('Las marcas disponibles');
console.log('\nPreview del nuevo texto:');
console.log('...' + result.substring(idx - 10, idx + 220) + '...');
console.log('\n✅ Encontrado 1 vez. Escribiendo...');

// ── ESCRIBIR ──
fs.writeFileSync(FILE, result, { encoding: 'utf8' });
console.log('✅ server.js actualizado.');
console.log('\n⚡ Siguiente: node --check server.js');
