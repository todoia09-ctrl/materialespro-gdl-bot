// fix_order_summary_v1.js
// Fix: formatOrderSummary muestra items estructurados en lugar de rawQuote texto plano
// REGLA #38: dry-run primero, escribir solo si patron unico

const fs   = require('fs');
const path = require('path');

const FILE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\pedido.js';

const OLD = `  if (order.rawQuote) {
    lines.push('*CotizaciÃ³n:*');
    lines.push('  ' + order.rawQuote.replace(/\\n/g, '\\n  '));
    lines.push('');
  }`;

const NEW = `  if (order.items && order.items.length > 0) {
    lines.push('\\uD83D\\uDCE6 *Productos:*');
    order.items.forEach(function(i) {
      var _line = '  \\u2022 ' + (i.qty||1) + 'x ' + (i.nombre||'Producto');
      if (i.precio && i.precio > 0) _line += ' \\u2014 $' + Number(i.precio).toLocaleString('es-MX') + '/u';
      lines.push(_line);
    });
    lines.push('');
  } else if (order.rawQuote && order.rawQuote !== 'Cotizaci\\u00F3n del chat') {
    lines.push('\\uD83D\\uDCCB *Cotizaci\\u00F3n:*');
    lines.push('  ' + order.rawQuote.replace(/\\n/g, '\\n  '));
    lines.push('');
  }`;

const content = fs.readFileSync(FILE, 'utf8');
const count   = content.split(OLD).length - 1;

console.log('=== DRY-RUN fix_order_summary_v1 ===');
console.log('Patron encontrado:', count, 'vez/veces');

if (count !== 1) {
  console.error('ABORT — patron no encontrado exactamente 1 vez. No se escribe nada.');
  process.exit(1);
}

const result = content.replace(OLD, NEW);

// Verificar que el NEW quedó en el resultado
if (!result.includes('Productos:*')) {
  console.error('ABORT — NEW no quedó en resultado. No se escribe nada.');
  process.exit(1);
}

console.log('');
console.log('OLD encontrado en posicion:', content.indexOf(OLD));
console.log('NEW preview:');
console.log(NEW.substring(0, 120) + '...');
console.log('');
console.log('Escribiendo archivo...');
fs.writeFileSync(FILE, result, { encoding: 'utf8' });
console.log('OK — pedido.js actualizado');
console.log('Siguiente: node --check pedido.js');
