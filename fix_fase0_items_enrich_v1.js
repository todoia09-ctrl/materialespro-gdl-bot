// fix_fase0_items_enrich_v1.js
// FASE 0: Agregar codigo+producto_id a items_json
// REGLA #7 #38: dry-run obligatorio — verifica patron unico antes de escribir
// REGLA #9: preservar CRLF en pedido.js, crm.js, server.js
// 4 archivos: crm.js, pedido.js, server.js, meta.js

var fs = require('fs');
var BASE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\';
var allOk = true;

function check(label, content, pattern) {
  var count = content.split(pattern).length - 1;
  var ok = count === 1;
  if (!ok) allOk = false;
  console.log(label + ':', count, ok ? 'OK' : 'FALLO');
  if (!ok) console.log('  Pattern:', JSON.stringify(pattern));
  return ok;
}

// ═══════════════════════════════════════════════════════════════════
//  1. crm.js — firma guardarPedido + _enrichItems + stringify
// ═══════════════════════════════════════════════════════════════════
var crmPath = BASE + 'crm.js';
var crmRaw  = fs.readFileSync(crmPath);
var crm     = crmRaw.toString('utf8');
var crmLE   = crm.indexOf('\r\n') > -1 ? '\r\n' : '\n';

var C1_OLD = 'async function guardarPedido(whatsapp, order, canal) {';
var C1_NEW = 'async function guardarPedido(whatsapp, order, canal, catalogRef) {';

var C2_OLD = 'JSON.stringify(_parseItems(order)),';
var C2_NEW = 'JSON.stringify(_enrichItems(_parseItems(order), catalogRef)),';

// Insertar _enrichItems antes de guardarPedido
var C3_OLD = 'async function guardarPedido(whatsapp, order, canal, catalogRef) {';
var ENRICH_FN = 'function _enrichItems(items, catalogRef) {' + crmLE +
  '  if (!catalogRef || !catalogRef.productos || !items || !items.length) return items;' + crmLE +
  '  return items.map(function(item) {' + crmLE +
  '    var match = catalogRef.productos.find(function(p) {' + crmLE +
  '      return p.nombre && item.nombre &&' + crmLE +
  '             p.nombre.toLowerCase().trim() === item.nombre.toLowerCase().trim();' + crmLE +
  '    });' + crmLE +
  '    if (!match && item.codigo) {' + crmLE +
  '      match = catalogRef.productos.find(function(p) {' + crmLE +
  '        return p.codigo && p.codigo === item.codigo;' + crmLE +
  '      });' + crmLE +
  '    }' + crmLE +
  '    if (match) {' + crmLE +
  '      item.codigo      = match.codigo || null;' + crmLE +
  '      item.producto_id = match.id     || null;' + crmLE +
  '    } else {' + crmLE +
  '      item.codigo      = item.codigo      || null;' + crmLE +
  '      item.producto_id = item.producto_id || null;' + crmLE +
  '    }' + crmLE +
  '    return item;' + crmLE +
  '  });' + crmLE +
  '}' + crmLE + crmLE;

console.log('=== DRY-RUN crm.js ===');
check('C1 firma', crm, C1_OLD);
check('C2 stringify', crm, C2_OLD);

// ═══════════════════════════════════════════════════════════════════
//  2. pedido.js — firma processOrderFlow + llamada guardarPedido
// ═══════════════════════════════════════════════════════════════════
var pedPath = BASE + 'pedido.js';
var pedRaw  = fs.readFileSync(pedPath);
var ped     = pedRaw.toString('utf8');

var P1_OLD = 'async function processOrderFlow(from, msg, clientName, lastQuote, sendToClient, negocioNombre) {';
var P1_NEW = 'async function processOrderFlow(from, msg, clientName, lastQuote, sendToClient, negocioNombre, catalogRef) {';

var P2_OLD = "const _result = await guardarPedido(from, order, 'whatsapp');";
var P2_NEW = "const _result = await guardarPedido(from, order, 'whatsapp', catalogRef);";

console.log('\n=== DRY-RUN pedido.js ===');
check('P1 firma', ped, P1_OLD);
check('P2 llamada', ped, P2_OLD);

// ═══════════════════════════════════════════════════════════════════
//  3. server.js — llamada processOrderFlow con getCatalog()
// ═══════════════════════════════════════════════════════════════════
var srvPath = BASE + 'server.js';
var srvRaw  = fs.readFileSync(srvPath);
var srv     = srvRaw.toString('utf8');
var srvLE   = srv.indexOf('\r\n') > -1 ? '\r\n' : '\n';

var S1_OLD = 'from, textBody, name, getLastQuote(from), sendToClient,' + srvLE + '        CATALOG.negocio.nombre';
var S1_NEW = 'from, textBody, name, getLastQuote(from), sendToClient,' + srvLE + '        CATALOG.negocio.nombre, getCatalog()';

console.log('\n=== DRY-RUN server.js ===');
check('S1 processOrderFlow', srv, S1_OLD);

// ═══════════════════════════════════════════════════════════════════
//  4. meta.js — llamada processOrderFlow con catalog
// ═══════════════════════════════════════════════════════════════════
var metaPath = BASE + 'meta.js';
var meta     = fs.readFileSync(metaPath, 'utf8');
var metaLE   = meta.indexOf('\r\n') > -1 ? '\r\n' : '\n';

var M1_OLD = 'fromNorm, textContent, firstName, getLastQuote(fromNorm), sendToClient,' + metaLE + "          (catalog.negocio && catalog.negocio.nombre) || 'MaterialesPro GDL'";
var M1_NEW = 'fromNorm, textContent, firstName, getLastQuote(fromNorm), sendToClient,' + metaLE + "          (catalog.negocio && catalog.negocio.nombre) || 'MaterialesPro GDL', catalog";

console.log('\n=== DRY-RUN meta.js ===');
check('M1 processOrderFlow', meta, M1_OLD);

// ═══════════════════════════════════════════════════════════════════
//  RESUMEN DRY-RUN
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== RESUMEN DRY-RUN ===');
if (!allOk) {
  console.error('ABORT — hay patrones que no matchean exactamente 1 vez');
  process.exit(1);
}
console.log('Todos los patrones OK (6/6). Procediendo a escribir...\n');

// ═══════════════════════════════════════════════════════════════════
//  ESCRITURA — solo si dry-run paso
// ═══════════════════════════════════════════════════════════════════

// 1. crm.js
var crmResult = crm.replace(C1_OLD, C1_NEW);
crmResult = crmResult.replace(C2_OLD, C2_NEW);
// Insertar _enrichItems antes de la firma ya modificada
crmResult = crmResult.replace(C1_NEW, ENRICH_FN + C1_NEW);
fs.writeFileSync(crmPath, crmResult, { encoding: 'utf8' });
var crmWritten = fs.readFileSync(crmPath);
console.log('crm.js escrito — CRLF preserved:', crmWritten.indexOf(13) > -1);

// 2. pedido.js
var pedResult = ped.replace(P1_OLD, P1_NEW).replace(P2_OLD, P2_NEW);
fs.writeFileSync(pedPath, pedResult, { encoding: 'utf8' });
var pedWritten = fs.readFileSync(pedPath);
console.log('pedido.js escrito — CRLF preserved:', pedWritten.indexOf(13) > -1);

// 3. server.js
var srvResult = srv.replace(S1_OLD, S1_NEW);
fs.writeFileSync(srvPath, srvResult, { encoding: 'utf8' });
var srvWritten = fs.readFileSync(srvPath);
console.log('server.js escrito — CRLF preserved:', srvWritten.indexOf(13) > -1);

// 4. meta.js
var metaResult = meta.replace(M1_OLD, M1_NEW);
fs.writeFileSync(metaPath, metaResult, { encoding: 'utf8' });
console.log('meta.js escrito');

console.log('\nFASE 0 escritura completa.');
console.log('Siguiente: node --check para cada archivo');
