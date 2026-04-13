// fix_order_summary_v5.js
// FIX RAIZ: usar content.replace(PATTERN, function(){ return NEW; })
// porque $' en NEW es patron especial de JS replace()
const fs = require('fs');
const { execSync } = require('child_process');

const FILE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\pedido.js';
const TEMP = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\pedido_temp_check.js';

const content = fs.readFileSync(FILE, 'utf8');

const PATTERN = /  if \(order\.rawQuote\) \{\r?\n    lines\.push\('\*Cotizaci[^']*n:\*'\);\r?\n    lines\.push\('  ' \+ order\.rawQuote\.replace[^\n]+\);\r?\n    lines\.push\(''\);\r?\n  \}/;

const match = content.match(PATTERN);
console.log('=== DRY-RUN fix_order_summary_v5 ===');
console.log('Patron encontrado:', match ? 1 : 0, 'vez/veces');

if (!match) {
  console.error('ABORT — patron no encontrado.');
  process.exit(1);
}

const SEP = content.includes('\r\n') ? '\r\n' : '\n';

var NEW = '';
NEW += '  if (order.items && order.items.length > 0) {' + SEP;
NEW += "    lines.push('\\uD83D\\uDCE6 *Productos:*');" + SEP;
NEW += '    order.items.forEach(function(i) {' + SEP;
NEW += '      var _qty = (i.qty || 1);' + SEP;
NEW += "      var _nom = (i.nombre || 'Producto');" + SEP;
NEW += "      var _prc = '';" + SEP;
NEW += '      if (i.precio && i.precio > 0) {' + SEP;
NEW += "        _prc = ' - ' + Number(i.precio).toLocaleString('es-MX') + '/u';" + SEP;
NEW += '      }' + SEP;
NEW += "      lines.push('  * ' + _qty + 'x ' + _nom + _prc);" + SEP;
NEW += '    });' + SEP;
NEW += "    lines.push('');" + SEP;
NEW += '  } else if (order.rawQuote && order.rawQuote !== \'Cotizaci\u00F3n del chat\') {' + SEP;
NEW += "    lines.push('\\uD83D\\uDCCB *Cotizaci\u00F3n:*');" + SEP;
NEW += "    lines.push('  ' + order.rawQuote.replace(/\\n/g, '\\n  '));" + SEP;
NEW += "    lines.push('');" + SEP;
NEW += '  }';

// CLAVE: usar funcion para evitar que $' se interprete como patron especial
var result = content.replace(PATTERN, function() { return NEW; });

if (!result.includes('order.items.forEach')) {
  console.error('ABORT — NEW no quedo en resultado.');
  process.exit(1);
}

// Verificar con temp .js
fs.writeFileSync(TEMP, result, { encoding: 'utf8' });
try {
  execSync('node --check "' + TEMP + '"', { stdio: 'pipe' });
  console.log('node --check TEMP: OK');
} catch(e) {
  fs.unlinkSync(TEMP);
  console.error('ABORT — node --check fallo:');
  console.error(e.stderr ? e.stderr.toString() : e.message);
  process.exit(1);
}

fs.unlinkSync(TEMP);
fs.writeFileSync(FILE, result, { encoding: 'utf8' });
console.log('OK — pedido.js actualizado y verificado');
console.log('Siguiente: node --check pedido.js');
