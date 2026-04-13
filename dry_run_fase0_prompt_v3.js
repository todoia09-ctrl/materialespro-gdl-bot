// dry_run_fase0_prompt_v3.js
// Verificar patron final con conteo exacto — NO escribe nada

var fs = require('fs');
var BASE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\';
var content = fs.readFileSync(BASE + 'server.js').toString('utf8');
var le = content.indexOf('\r\n') > -1 ? '\r\n' : '\n';

var OLD = "Hasta pronto! \\uD83D\\uDC4B\"\\n';" + le + "}";
var NEW = "Hasta pronto! \\uD83D\\uDC4B\"\\n'" + le +
  "    + '- Al cotizar productos SIEMPRE usa el nombre EXACTO del cat\\u00e1logo sin abreviar, modificar ni traducir. Ejemplo: NO \"19 L\" \\u2192 S\\u00cd \"19 Lits\"\\n';" + le + "}";

var count = content.split(OLD).length - 1;
console.log('=== DRY-RUN server.js — prompt rule v3 ===');
console.log('Patron OLD encontrado:', count, 'vez/veces');
console.log('CRLF:', le === '\r\n' ? 'SI' : 'NO');

if (count !== 1) {
  console.log('FALLO — buscando alternativa...');
  var alt = "Hasta pronto!";
  console.log('"Hasta pronto!" ocurrencias:', content.split(alt).length - 1);
  content.split('\n').forEach(function(l, i) {
    if (l.indexOf('Hasta pronto') > -1) {
      console.log('  L' + (i + 1) + ':', JSON.stringify(l.substring(l.indexOf('Hasta') - 5)));
    }
  });
} else {
  console.log('OK — patron unico confirmado');
  console.log('');
  console.log('--- OLD ---');
  console.log(OLD);
  console.log('--- NEW ---');
  console.log(NEW);
}
