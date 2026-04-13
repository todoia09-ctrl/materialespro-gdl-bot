// fix_order_summary_v3.js
// Fix: sin caracteres unicode especiales para evitar SyntaxError
// REGLA #38: dry-run obligatorio

const fs = require('fs');

const FILE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\pedido.js';

const content = fs.readFileSync(FILE, 'utf8');

// Patron con \r?\n para CRLF
const PATTERN = /  if \(order\.rawQuote\) \{\r?\n    lines\.push\('\*Cotizaci[^']*n:\*'\);\r?\n    lines\.push\('  ' \+ order\.rawQuote\.replace[^\n]+\);\r?\n    lines\.push\(''\);\r?\n  \}/;

const match = content.match(PATTERN);
console.log('=== DRY-RUN fix_order_summary_v3 ===');
console.log('Patron encontrado:', match ? 1 : 0, 'vez/veces');

if (!match) {
  console.error('ABORT — patron no encontrado.');
  const lines = content.split(/\r?\n/);
  console.log('Lineas 264-272:');
  lines.slice(263, 272).forEach(function(l, i) {
    console.log((264+i) + ': ' + JSON.stringify(l));
  });
  process.exit(1);
}

console.log('Texto encontrado OK');

// Detectar separador de linea
const SEP = content.includes('\r\n') ? '\r\n' : '\n';
const I   = '  ';  // 2 espacios indentacion base
const I2  = '    '; // 4 espacios

// Construir NEW sin unicode escapado — usar texto ASCII simple
var NEW = '';
NEW += I  + 'if (order.items && order.items.length > 0) {' + SEP;
NEW += I2 + "lines.push('\\uD83D\\uDCE6 *Productos:*');" + SEP;
NEW += I2 + 'order.items.forEach(function(i) {' + SEP;
NEW += I2 + "  var _qty = (i.qty || 1);" + SEP;
NEW += I2 + "  var _nom = (i.nombre || 'Producto');" + SEP;
NEW += I2 + "  var _prc = (i.precio && i.precio > 0) ? ' - $' + Number(i.precio).toLocaleString('es-MX') + '/u' : '';" + SEP;
NEW += I2 + "  lines.push('  * ' + _qty + 'x ' + _nom + _prc);" + SEP;
NEW += I2 + '});' + SEP;
NEW += I2 + "lines.push('');" + SEP;
NEW += I  + '} else if (order.rawQuote && order.rawQuote !== ' + "'Cotizaci\u00F3n del chat'" + ') {' + SEP;
NEW += I2 + "lines.push('\\uD83D\\uDCCB *Cotizaci\u00F3n:*');" + SEP;
NEW += I2 + "lines.push('  ' + order.rawQuote.replace(/\\n/g, '\\n  '));" + SEP;
NEW += I2 + "lines.push('');" + SEP;
NEW += I  + '}';

const result = content.replace(PATTERN, NEW);

if (!result.includes('order.items.forEach')) {
  console.error('ABORT — NEW no quedo en resultado.');
  process.exit(1);
}

console.log('NEW preview (primeros 200 chars):');
console.log(NEW.substring(0, 200));
console.log('');

// Verificar sintaxis escribiendo a temp primero
const TEMP = FILE + '.tmp';
fs.writeFileSync(TEMP, result, { encoding: 'utf8' });

const { execSync } = require('child_process');
try {
  execSync('node --check "' + TEMP + '"', { stdio: 'pipe' });
  console.log('node --check TEMP: OK');
} catch(e) {
  console.error('ABORT — node --check fallo en TEMP:');
  console.error(e.stderr ? e.stderr.toString() : e.message);
  fs.unlinkSync(TEMP);
  process.exit(1);
}

// Si pasa check, reemplazar el original
fs.unlinkSync(TEMP);
fs.writeFileSync(FILE, result, { encoding: 'utf8' });
console.log('OK — pedido.js actualizado y verificado');
console.log('Siguiente: node --check pedido.js (doble verificacion)');
