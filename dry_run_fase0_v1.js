// dry_run_fase0_v1.js
// Verificación de patrones FASE 0 — conteo de ocurrencias
// NO modifica ningún archivo — solo lectura + console.log

var fs = require('fs');
var BASE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\';

// ── crm.js ──────────────────────────────────────────────────────────
var crm = fs.readFileSync(BASE + 'crm.js', 'utf8');

var C1_OLD = 'async function guardarPedido(whatsapp, order, canal) {';
var C1_NEW = 'async function guardarPedido(whatsapp, order, canal, catalogRef) {';

var C2_OLD = 'JSON.stringify(_parseItems(order)),';
var C2_NEW = 'JSON.stringify(_enrichItems(_parseItems(order), catalogRef)),';

console.log('=== crm.js ===');
console.log('C1 (firma guardarPedido):', crm.split(C1_OLD).length - 1, 'ocurrencias');
console.log('  OLD:', JSON.stringify(C1_OLD));
console.log('  NEW:', JSON.stringify(C1_NEW));
console.log('C2 (stringify parseItems):', crm.split(C2_OLD).length - 1, 'ocurrencias');
console.log('  OLD:', JSON.stringify(C2_OLD));
console.log('  NEW:', JSON.stringify(C2_NEW));
console.log('CRLF:', fs.readFileSync(BASE + 'crm.js').indexOf(13) > -1);
console.log('');

// ── pedido.js ───────────────────────────────────────────────────────
var ped = fs.readFileSync(BASE + 'pedido.js', 'utf8');

var P1_OLD = 'async function processOrderFlow(from, msg, clientName, lastQuote, sendToClient, negocioNombre) {';
var P1_NEW = 'async function processOrderFlow(from, msg, clientName, lastQuote, sendToClient, negocioNombre, catalogRef) {';

var P2_OLD = "const _result = await guardarPedido(from, order, 'whatsapp');";
var P2_NEW = "const _result = await guardarPedido(from, order, 'whatsapp', catalogRef);";

console.log('=== pedido.js ===');
console.log('P1 (firma processOrderFlow):', ped.split(P1_OLD).length - 1, 'ocurrencias');
console.log('  OLD:', JSON.stringify(P1_OLD));
console.log('  NEW:', JSON.stringify(P1_NEW));
console.log('P2 (llamada guardarPedido):', ped.split(P2_OLD).length - 1, 'ocurrencias');
console.log('  OLD:', JSON.stringify(P2_OLD));
console.log('  NEW:', JSON.stringify(P2_NEW));
console.log('CRLF:', fs.readFileSync(BASE + 'pedido.js').indexOf(13) > -1);
console.log('');

// ── server.js ───────────────────────────────────────────────────────
var srv = fs.readFileSync(BASE + 'server.js', 'utf8');

// Detectar line ending real en server.js
var srvLE = srv.indexOf('\r\n') > -1 ? '\r\n' : '\n';
var S1_OLD = 'from, textBody, name, getLastQuote(from), sendToClient,' + srvLE + '        CATALOG.negocio.nombre';
var S1_NEW = 'from, textBody, name, getLastQuote(from), sendToClient,' + srvLE + '        CATALOG.negocio.nombre, getCatalog()';

console.log('=== server.js ===');
console.log('S1 (llamada processOrderFlow):', srv.split(S1_OLD).length - 1, 'ocurrencias');
console.log('  OLD:', JSON.stringify(S1_OLD));
console.log('  NEW:', JSON.stringify(S1_NEW));
console.log('CRLF:', fs.readFileSync(BASE + 'server.js').indexOf(13) > -1);
console.log('Line ending detectado:', srvLE === '\r\n' ? 'CRLF' : 'LF');
console.log('');

// ── meta.js ─────────────────────────────────────────────────────────
var meta = fs.readFileSync(BASE + 'meta.js', 'utf8');

// Detectar line ending real en meta.js
var metaLE = meta.indexOf('\r\n') > -1 ? '\r\n' : '\n';
var M1_OLD = 'fromNorm, textContent, firstName, getLastQuote(fromNorm), sendToClient,' + metaLE + "          (catalog.negocio && catalog.negocio.nombre) || 'MaterialesPro GDL'";
var M1_NEW = 'fromNorm, textContent, firstName, getLastQuote(fromNorm), sendToClient,' + metaLE + "          (catalog.negocio && catalog.negocio.nombre) || 'MaterialesPro GDL', catalog";

console.log('=== meta.js ===');
console.log('M1 (llamada processOrderFlow):', meta.split(M1_OLD).length - 1, 'ocurrencias');
console.log('  OLD:', JSON.stringify(M1_OLD));
console.log('  NEW:', JSON.stringify(M1_NEW));
console.log('CRLF:', fs.readFileSync(BASE + 'meta.js').indexOf(13) > -1);
console.log('Line ending detectado:', metaLE === '\r\n' ? 'CRLF' : 'LF');
console.log('');

// ── RESUMEN ─────────────────────────────────────────────────────────
var allOk = true;
var checks = [
  ['crm.js C1', crm.split(C1_OLD).length - 1],
  ['crm.js C2', crm.split(C2_OLD).length - 1],
  ['pedido.js P1', ped.split(P1_OLD).length - 1],
  ['pedido.js P2', ped.split(P2_OLD).length - 1],
  ['server.js S1', srv.split(S1_OLD).length - 1],
  ['meta.js M1', meta.split(M1_OLD).length - 1],
];
console.log('=== RESUMEN ===');
for (var i = 0; i < checks.length; i++) {
  var ok = checks[i][1] === 1;
  if (!ok) allOk = false;
  console.log(checks[i][0] + ':', checks[i][1], ok ? 'OK' : 'FALLO');
}
console.log('');
console.log(allOk ? 'TODOS LOS PATRONES OK — safe to proceed' : 'HAY FALLOS — NO proceder');
