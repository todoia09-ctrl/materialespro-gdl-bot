// fix_quote_response_v1.js
// Fix: isQuoteResponse detecta mas patrones de cotizacion del AI
// REGLA #38: dry-run primero, escribir solo si patron unico

const fs   = require('fs');
const path = require('path');

const FILE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\server.js';

const OLD = `function isQuoteResponse(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return (lower.includes('$') && (lower.includes('bolsa') || lower.includes('cubeta') ||
lower.includes('total')))`;

const NEW = `function isQuoteResponse(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  // Requiere: patron de precio ($) + al menos un indicador de producto/cantidad/total
  const hasPrice = lower.includes('$') || /\\d+[.,]\\d{2,}/.test(lower);
  const hasProduct = lower.includes('bolsa') || lower.includes('cubeta') ||
    lower.includes('litro') || lower.includes('pieza') || lower.includes('rollo') ||
    lower.includes('metro') || lower.includes('kg') || lower.includes('caja') ||
    lower.includes('galon') || lower.includes('bote') || lower.includes('pza') ||
    lower.includes('ml') || lower.includes('/u') || lower.includes('x $') ||
    /\\dx /.test(lower) || /\\d+ x /.test(lower);
  const hasTotal = lower.includes('total') || lower.includes('subtotal') ||
    lower.includes('= $') || lower.includes('\\u00d7') || lower.includes('\\u2014 $');
  return (hasPrice && (hasProduct || hasTotal))`;

const content = fs.readFileSync(FILE, 'utf8');
const count   = content.split(OLD).length - 1;

console.log('=== DRY-RUN fix_quote_response_v1 ===');
console.log('Patron encontrado:', count, 'vez/veces');

if (count !== 1) {
  console.error('ABORT — patron no encontrado exactamente 1 vez. No se escribe nada.');
  // Mostrar contexto para diagnostico
  const idx = content.indexOf('function isQuoteResponse');
  if (idx >= 0) {
    console.log('Contexto actual isQuoteResponse:');
    console.log(content.substring(idx, idx + 300));
  }
  process.exit(1);
}

const result = content.replace(OLD, NEW);

if (!result.includes('hasProduct')) {
  console.error('ABORT — NEW no quedó en resultado. No se escribe nada.');
  process.exit(1);
}

console.log('');
console.log('OLD encontrado en posicion:', content.indexOf(OLD));
console.log('NEW preview:');
console.log(NEW.substring(0, 150) + '...');
console.log('');
console.log('Escribiendo archivo...');
fs.writeFileSync(FILE, result, { encoding: 'utf8' });
console.log('OK — server.js actualizado');
console.log('Siguiente: node --check server.js');
