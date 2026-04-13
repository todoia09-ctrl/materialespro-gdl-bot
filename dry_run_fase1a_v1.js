// dry_run_fase1a_v1.js
// Verificacion de patrones FASE 1A — NO escribe nada

var fs = require('fs');
var BASE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\';
var FILE = BASE + 'db.js';

var content = fs.readFileSync(FILE, 'utf8');
var le = content.indexOf('\r\n') > -1 ? '\r\n' : '\n';

// Patron 1: insertar initWMSSchema antes de module.exports
var P1_OLD = "module.exports = { query, initSchema, upsertCliente, getCliente, logMensaje, getPool, saveActiveOrder, deleteActiveOrder, loadActiveOrders };";
var p1Count = content.split(P1_OLD).length - 1;

// Patron 2: agregar await initWMSSchema() dentro de initSchema
var P2_OLD = "  for (const s of stmts) await query(s);" + le + "  console.log('[DB] Esquema listo \\u2705');";
var p2Count = content.split(P2_OLD).length - 1;

// Patron 3: exportar initWMSSchema
var P3_OLD = "module.exports = { query, initSchema, upsertCliente, getCliente, logMensaje, getPool, saveActiveOrder, deleteActiveOrder, loadActiveOrders };";
var p3Count = content.split(P3_OLD).length - 1;

console.log('=== DRY-RUN db.js — FASE 1A ===');
console.log('Line ending:', le === '\r\n' ? 'CRLF' : 'LF');
console.log('P1 (module.exports):', p1Count, p1Count === 1 ? 'OK' : 'FALLO');
console.log('P2 (fin initSchema):', p2Count, p2Count === 1 ? 'OK' : 'FALLO');

if (p1Count !== 1) {
  console.log('Buscando module.exports:');
  content.split('\n').forEach(function(l, i) {
    if (l.indexOf('module.exports') > -1) console.log('  L' + (i+1) + ':', JSON.stringify(l));
  });
}
if (p2Count !== 1) {
  console.log('Buscando fin initSchema:');
  content.split('\n').forEach(function(l, i) {
    if (l.indexOf('Esquema listo') > -1 || l.indexOf('for (const s') > -1) {
      console.log('  L' + (i+1) + ':', JSON.stringify(l));
    }
  });
}

// Verificar que catalogo_productos PK es codigo VARCHAR, no id SERIAL
var hasCatalogoId = content.indexOf('catalogo_productos') > -1;
console.log('\ncatalogo_productos existe en schema:', hasCatalogoId);
content.split('\n').forEach(function(l, i) {
  if (l.indexOf('catalogo_productos') > -1 && l.indexOf('CREATE') > -1) {
    console.log('  L' + (i+1) + ':', l.trim().substring(0, 80));
  }
  if (l.indexOf('catalogo_productos') > -1 && l.indexOf('PRIMARY KEY') > -1) {
    console.log('  PK:', l.trim());
  }
});

// Verificar tipo de inventario.producto_id
content.split('\n').forEach(function(l, i) {
  if (l.indexOf('producto_id') > -1 && l.indexOf('inventario') < 5) {
    console.log('  inventario.producto_id L' + (i+1) + ':', l.trim());
  }
});

var allOk = p1Count === 1 && p2Count === 1;
console.log('\n' + (allOk ? 'TODOS LOS PATRONES OK' : 'HAY FALLOS — NO proceder'));
