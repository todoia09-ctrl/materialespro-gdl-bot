// dry_run_fase0_prompt_v1.js
// Solo verificacion de patron — NO escribe nada

var fs = require('fs');
var BASE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\';
var FILE = BASE + 'server.js';

var raw = fs.readFileSync(FILE);
var content = raw.toString('utf8');
var le = content.indexOf('\r\n') > -1 ? '\r\n' : '\n';

// Ancla: ultima regla antes del cierre de buildSystemPrompt
var OLD = "- Si el cliente responde \"no\", \"nada\", \"gracias\", \"estoy bien\", \"es todo\", \"nada m\\u00e1s\" u otra frase de cierre despu\\u00e9s de \"\\u00bfalgo m\\u00e1s?\", desp\\u00eddete c\\u00e1lidamente SIN hacer otra pregunta. Ejemplo: \"\\u00a1Perfecto ' + (clientName || '') + '! Fue un placer atenderte. \\u00a1Hasta pronto! \\uD83D\\uDC4B\"\\n';";

var count = content.split(OLD).length - 1;
console.log('=== DRY-RUN server.js — prompt rule ===');
console.log('Patron OLD encontrado:', count, 'vez/veces');
console.log('CRLF:', le === '\r\n' ? 'SI' : 'NO');

if (count !== 1) {
  console.log('Buscando ancla alternativa...');
  // Buscar por substring mas corto
  var alt = "Fue un placer atenderte";
  var altCount = content.split(alt).length - 1;
  console.log('Substring "Fue un placer atenderte":', altCount, 'ocurrencias');

  // Mostrar lineas cercanas
  content.split('\n').forEach(function(l, i) {
    if (l.indexOf('despid') > -1 || l.indexOf('Fue un placer') > -1 || l.indexOf('algo m') > -1) {
      console.log('  L' + (i + 1) + ':', JSON.stringify(l.substring(0, 120)));
    }
  });
}
