// fix_fase0_prompt_rule_v1.js
// Fix B: Agregar regla de nombres exactos en buildSystemPrompt()
// REGLA #7 #38: dry-run obligatorio
// REGLA #9: preservar CRLF en server.js

var fs = require('fs');
var BASE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\';
var FILE = BASE + 'server.js';

var raw = fs.readFileSync(FILE);
var content = raw.toString('utf8');
var le = content.indexOf('\r\n') > -1 ? '\r\n' : '\n';

var OLD = "Hasta pronto! \\uD83D\\uDC4B\"\\n';" + le + "}";
var NEW = "Hasta pronto! \\uD83D\\uDC4B\"\\n'" + le +
  "    + '- Al cotizar productos SIEMPRE usa el nombre EXACTO del cat\\u00e1logo sin abreviar, modificar ni traducir. Ejemplo: NO \"19 L\" \\u2192 S\\u00cd \"19 Lits\"\\n';" + le + "}";

// ── DRY-RUN ─────────────────────────────────────────────────────────
var count = content.split(OLD).length - 1;
console.log('=== DRY-RUN server.js — prompt rule ===');
console.log('Patron OLD encontrado:', count, 'vez/veces');
console.log('CRLF:', le === '\r\n' ? 'SI' : 'NO');

if (count !== 1) {
  console.error('ABORT — patron no encontrado exactamente 1 vez');
  process.exit(1);
}

console.log('Escribiendo...');
var result = content.replace(OLD, NEW);
fs.writeFileSync(FILE, result, { encoding: 'utf8' });

var written = fs.readFileSync(FILE);
console.log('CRLF preserved:', written.indexOf(13) > -1);
console.log('server.js actualizado con regla de nombres exactos');
console.log('Siguiente: node --check server.js');
