// fix_quote_response_v2.js
// Fix: isQuoteResponse detecta mas patrones — usa function() replace para evitar $' pattern
const fs = require('fs');
const { execSync } = require('child_process');

const FILE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\server.js';
const TEMP = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\server_temp_check.js';

const content = fs.readFileSync(FILE, 'utf8');

// Patron: funcion isQuoteResponse completa hasta el return
const PATTERN = /function isQuoteResponse\(text\) \{\r?\n  if \(!text\) return false;\r?\n  const lower = text\.toLowerCase\(\);\r?\n  return \(lower\.includes\('\$'\)[^\n]+\n[^\n]+\)/;

const match = content.match(PATTERN);
console.log('=== DRY-RUN fix_quote_response_v2 ===');
console.log('Patron encontrado:', match ? 1 : 0, 'vez/veces');

if (!match) {
  console.error('ABORT — patron no encontrado. Mostrando contexto isQuoteResponse:');
  const idx = content.indexOf('function isQuoteResponse');
  if (idx >= 0) {
    const lines = content.substring(idx, idx + 400);
    console.log(JSON.stringify(lines));
  }
  process.exit(1);
}

console.log('Patron encontrado OK');
const SEP = content.includes('\r\n') ? '\r\n' : '\n';

var NEW = '';
NEW += 'function isQuoteResponse(text) {' + SEP;
NEW += '  if (!text) return false;' + SEP;
NEW += '  const lower = text.toLowerCase();' + SEP;
NEW += "  const hasPrice = lower.includes('$') || /\\d+[.,]\\d{2,}/.test(lower);" + SEP;
NEW += "  const hasProduct = lower.includes('bolsa') || lower.includes('cubeta') ||" + SEP;
NEW += "    lower.includes('litro') || lower.includes('pieza') || lower.includes('rollo') ||" + SEP;
NEW += "    lower.includes('metro') || lower.includes('kg') || lower.includes('caja') ||" + SEP;
NEW += "    lower.includes('galon') || lower.includes('bote') || lower.includes('pza') ||" + SEP;
NEW += "    lower.includes('ml') || lower.includes('/u') ||" + SEP;
NEW += "    /\\d+x /.test(lower) || /\\d+ x /.test(lower);" + SEP;
NEW += "  const hasTotal = lower.includes('total') || lower.includes('subtotal') ||" + SEP;
NEW += "    lower.includes('= $') || lower.includes('x $');" + SEP;
NEW += '  return (hasPrice && (hasProduct || hasTotal))';

var result = content.replace(PATTERN, function() { return NEW; });

if (!result.includes('hasProduct')) {
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
console.log('OK — server.js actualizado y verificado');
console.log('Siguiente: node --check server.js');
