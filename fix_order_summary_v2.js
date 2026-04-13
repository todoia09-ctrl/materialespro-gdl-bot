// fix_order_summary_v2.js
// Fix: usa regex para manejar CRLF en pedido.js
// REGLA #38: dry-run primero

const fs = require('fs');

const FILE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\pedido.js';

const content = fs.readFileSync(FILE, 'utf8');

// Patron con \r?\n para soportar CRLF y LF
const PATTERN = /  if \(order\.rawQuote\) \{\r?\n    lines\.push\('\*Cotizaci[^']*n:\*'\);\r?\n    lines\.push\('  ' \+ order\.rawQuote\.replace[^\n]+\);\r?\n    lines\.push\(''\);\r?\n  \}/;

const match = content.match(PATTERN);
console.log('=== DRY-RUN fix_order_summary_v2 ===');
console.log('Patron encontrado:', match ? 1 : 0, 'vez/veces');

if (!match) {
  console.error('ABORT — patron no encontrado. No se escribe nada.');
  // Debug: mostrar lineas 264-272 del archivo real
  const lines = content.split(/\r?\n/);
  console.log('\nLineas 264-272 (indice 263-271):');
  lines.slice(263, 272).forEach(function(l, i) {
    console.log((264+i) + ': ' + JSON.stringify(l));
  });
  process.exit(1);
}

console.log('Texto encontrado:');
console.log(JSON.stringify(match[0]));

// Detectar separador de linea del archivo
const SEP = content.includes('\r\n') ? '\r\n' : '\n';

const NEW = '  if (order.items && order.items.length > 0) {' + SEP +
  '    lines.push(\'\\uD83D\\uDCE6 *Productos:*\');' + SEP +
  '    order.items.forEach(function(i) {' + SEP +
  '      var _line = \'  \\u2022 \' + (i.qty||1) + \'x \' + (i.nombre||\'Producto\');' + SEP +
  '      if (i.precio && i.precio > 0) _line += \' \\u2014 $\' + Number(i.precio).toLocaleString(\'es-MX\') + \'/u\';' + SEP +
  '      lines.push(_line);' + SEP +
  '    });' + SEP +
  '    lines.push(\'\');' + SEP +
  '  } else if (order.rawQuote && order.rawQuote !== \'Cotizaci\\u00F3n del chat\') {' + SEP +
  '    lines.push(\'\\uD83D\\uDCCB *Cotizaci\\u00F3n:*\');' + SEP +
  '    lines.push(\'  \' + order.rawQuote.replace(/\\n/g, \'\\n  \'));' + SEP +
  '    lines.push(\'\');' + SEP +
  '  }';

const result = content.replace(PATTERN, NEW);

if (!result.includes('Productos:*')) {
  console.error('ABORT — NEW no quedo en resultado.');
  process.exit(1);
}

console.log('\nNEW preview:');
console.log(NEW.substring(0, 100) + '...');
console.log('\nEscribiendo archivo...');
fs.writeFileSync(FILE, result, { encoding: 'utf8' });
console.log('OK — pedido.js actualizado');
console.log('Siguiente: node --check pedido.js');
