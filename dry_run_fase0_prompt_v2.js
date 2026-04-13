// dry_run_fase0_prompt_v2.js
// Dump exacto de linea 351 para construir patron correcto

var fs = require('fs');
var BASE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\';
var content = fs.readFileSync(BASE + 'server.js').toString('utf8');
var lines = content.split('\n');

// Mostrar lineas 349-352 con JSON.stringify para ver bytes exactos
for (var i = 349; i <= 352; i++) {
  console.log('L' + (i + 1) + ':', JSON.stringify(lines[i]));
}
