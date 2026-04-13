// fix_horario_v1.js
// Fix: horario correcto Lun-Vie 8am-6pm · Sáb 8am-2pm en server.js
// REGLA #38: dry-run obligatorio, verificar cada patrón exactamente 1 vez

const fs = require('fs');

const FILE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\server.js';

const FIXES = [
  {
    desc: 'Línea ~81 — fallback negocio.horario',
    OLD: "horario:  'Lun-Sab 8am-6pm',",
    NEW: "horario:  'Lun-Vie 8am-6pm \u00b7 S\u00e1b 8am-2pm',"
  },
  {
    desc: 'Línea ~215 — fallback buildCatalogText',
    OLD: '"Lun-Sab 8am-6pm"',
    NEW: "'Lun-Vie 8am-6pm \u00b7 S\u00e1b 8am-2pm'"
  }
];

let content = fs.readFileSync(FILE, 'utf8');
let aborted = false;

console.log('\n=== DRY-RUN ===');

for (const fix of FIXES) {
  const count = content.split(fix.OLD).length - 1;
  console.log(`\n[${fix.desc}]`);
  console.log('  Ocurrencias:', count);
  if (count !== 1) {
    console.error('  ❌ ABORT — patrón no encontrado exactamente 1 vez.');
    aborted = true;
  } else {
    const preview = content.replace(fix.OLD, fix.NEW);
    const idx = preview.indexOf('Lun-Vie');
    console.log('  Preview:', preview.substring(idx - 5, idx + 50));
    console.log('  ✅ OK');
  }
}

if (aborted) {
  console.error('\n❌ Abortado — no se escribió nada.');
  process.exit(1);
}

// ── APLICAR AMBOS FIXES ──
for (const fix of FIXES) {
  content = content.replace(fix.OLD, fix.NEW);
}

fs.writeFileSync(FILE, content, { encoding: 'utf8' });
console.log('\n✅ server.js actualizado con horario correcto.');
console.log('⚡ Siguiente: node --check server.js');
