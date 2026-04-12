// fix_fase0_match_v2.js
// FIX: _enrichItems() match normalizado con startsWith bidireccional
// Problema: Claude Haiku abrevia nombres ("19 L" vs "19 Lits")
// REGLA #7 #38: dry-run obligatorio
// REGLA #9: preservar CRLF

var fs = require('fs');
var BASE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\';
var FILE = BASE + 'crm.js';

var raw = fs.readFileSync(FILE);
var content = raw.toString('utf8');
var le = content.indexOf('\r\n') > -1 ? '\r\n' : '\n';

var OLD = 'function _enrichItems(items, catalogRef) {' + le +
  '  if (!catalogRef || !catalogRef.productos || !items || !items.length) return items;' + le +
  '  return items.map(function(item) {' + le +
  '    var match = catalogRef.productos.find(function(p) {' + le +
  '      return p.nombre && item.nombre &&' + le +
  '             p.nombre.toLowerCase().trim() === item.nombre.toLowerCase().trim();' + le +
  '    });' + le +
  '    if (!match && item.codigo) {' + le +
  '      match = catalogRef.productos.find(function(p) {' + le +
  '        return p.codigo && p.codigo === item.codigo;' + le +
  '      });' + le +
  '    }' + le +
  '    if (match) {' + le +
  '      item.codigo      = match.codigo || null;' + le +
  '      item.producto_id = match.id     || null;' + le +
  '    } else {' + le +
  '      item.codigo      = item.codigo      || null;' + le +
  '      item.producto_id = item.producto_id || null;' + le +
  '    }' + le +
  '    return item;' + le +
  '  });' + le +
  '}';

var NEW = 'function _normalizeName(str) {' + le +
  "  if (!str) return '';" + le +
  '  return str.toLowerCase().trim()' + le +
  "    .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')" + le +
  "    .replace(/\\s+/g, ' ');" + le +
  '}' + le +
  le +
  'function _enrichItems(items, catalogRef) {' + le +
  '  if (!catalogRef || !catalogRef.productos || !items || !items.length) return items;' + le +
  '  return items.map(function(item) {' + le +
  '    var itemNorm = _normalizeName(item.nombre);' + le +
  '    var match = null;' + le +
  le +
  '    // 1. Match exacto normalizado' + le +
  '    match = catalogRef.productos.find(function(p) {' + le +
  '      return _normalizeName(p.nombre) === itemNorm;' + le +
  '    });' + le +
  le +
  '    // 2. startsWith bidireccional (cubre abreviaciones de Haiku)' + le +
  '    if (!match && itemNorm.length >= 10) {' + le +
  '      match = catalogRef.productos.find(function(p) {' + le +
  '        var pNorm = _normalizeName(p.nombre);' + le +
  '        return pNorm.startsWith(itemNorm) || itemNorm.startsWith(pNorm);' + le +
  '      });' + le +
  '    }' + le +
  le +
  '    // 3. Fallback por codigo' + le +
  '    if (!match && item.codigo) {' + le +
  '      match = catalogRef.productos.find(function(p) {' + le +
  '        return p.codigo && p.codigo === item.codigo;' + le +
  '      });' + le +
  '    }' + le +
  le +
  '    if (match) {' + le +
  '      item.codigo      = match.codigo || null;' + le +
  '      item.producto_id = match.id     || null;' + le +
  '    } else {' + le +
  '      item.codigo      = item.codigo      || null;' + le +
  '      item.producto_id = item.producto_id || null;' + le +
  "      console.warn('[ENRICH] Sin match:', item.nombre);" + le +
  '    }' + le +
  '    return item;' + le +
  '  });' + le +
  '}';

// ── DRY-RUN ─────────────────────────────────────────────────────────
var count = content.split(OLD).length - 1;
console.log('=== DRY-RUN crm.js — _enrichItems v2 ===');
console.log('Patron OLD encontrado:', count, 'vez/veces');
console.log('CRLF:', le === '\r\n' ? 'SI' : 'NO');

if (count !== 1) {
  console.error('ABORT — patron no encontrado exactamente 1 vez');
  console.log('Buscando _enrichItems en archivo:');
  content.split('\n').forEach(function(l, i) {
    if (l.indexOf('_enrichItems') > -1 || l.indexOf('_normalizeName') > -1) {
      console.log('  L' + (i + 1) + ':', JSON.stringify(l));
    }
  });
  process.exit(1);
}

console.log('\nPreview del cambio:');
console.log('--- OLD (primeras 3 lineas) ---');
OLD.split(le).slice(0, 3).forEach(function(l) { console.log('  ' + l); });
console.log('--- NEW (primeras 6 lineas) ---');
NEW.split(le).slice(0, 6).forEach(function(l) { console.log('  ' + l); });

console.log('\nEscribiendo...');
var result = content.replace(OLD, NEW);
fs.writeFileSync(FILE, result, { encoding: 'utf8' });

var written = fs.readFileSync(FILE);
console.log('CRLF preserved:', written.indexOf(13) > -1);
console.log('crm.js actualizado con match normalizado + startsWith bidireccional');
console.log('Siguiente: node --check crm.js');
