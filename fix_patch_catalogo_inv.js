// fix_patch_catalogo_inv.js
// El PATCH /api/catalogo/:codigo ya actualiza catalogo_productos
// pero NO actualiza inventario.nombre/categoria/marca/presentacion/unidad
// Este patch corrige el endpoint para que actualice ambas tablas
// Ejecutar: node fix_patch_catalogo_inv.js

var fs   = require('fs');
var path = require('path');

var API_PATH = path.join(
  'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl',
  'dashboard', 'api.js'
);

var content = fs.readFileSync(API_PATH, 'utf8');

// Buscar la línea del update de inventario (stock/stock_minimo) en el PATCH /catalogo/:codigo
// Actualmente solo actualiza stock y stock_minimo
// Necesitamos agregar nombre, categoria, marca, presentacion, unidad

var OLD_INV_UPDATE = [
  '    // Actualizar inventario si se proporcionó stock o stock_minimo',
  '    var invUpdates = [];',
  '    var invParams  = [codigo];',
  '    if (b.stock !== undefined && b.stock !== "") {',
  '      invParams.push(pi(b.stock));',
  '      invUpdates.push("stock = $" + invParams.length);',
  '    }',
  '    if (b.stock_minimo !== undefined && b.stock_minimo !== "") {',
  '      invParams.push(pi(b.stock_minimo));',
  '      invUpdates.push("stock_minimo = $" + invParams.length);',
  '    }',
  '    if (invUpdates.length) {',
  '      var invSql = "UPDATE inventario SET " + invUpdates.join(", ") + ", actualizado_en = NOW() WHERE producto_id = $1";',
  '      await query(invSql, invParams);',
  '    }',
].join('\n');

var NEW_INV_UPDATE = [
  '    // Actualizar inventario — stock, stock_minimo Y campos descriptivos sincronizados',
  '    var invUpdates = [];',
  '    var invParams  = [codigo];',
  '    if (b.stock !== undefined && b.stock !== "") {',
  '      invParams.push(pi(b.stock));',
  '      invUpdates.push("stock = $" + invParams.length);',
  '    }',
  '    if (b.stock_minimo !== undefined && b.stock_minimo !== "") {',
  '      invParams.push(pi(b.stock_minimo));',
  '      invUpdates.push("stock_minimo = $" + invParams.length);',
  '    }',
  '    // Sincronizar campos descriptivos en inventario',
  '    if (ps(b.nombre)) {',
  '      invParams.push(ps(b.nombre));',
  '      invUpdates.push("nombre = $" + invParams.length);',
  '    }',
  '    if (ps(b.categoria)) {',
  '      invParams.push(ps(b.categoria));',
  '      invUpdates.push("categoria = $" + invParams.length);',
  '    }',
  '    if (ps(b.marca)) {',
  '      invParams.push(ps(b.marca));',
  '      invUpdates.push("marca = $" + invParams.length);',
  '    }',
  '    if (ps(b.presentacion)) {',
  '      invParams.push(ps(b.presentacion));',
  '      invUpdates.push("presentacion = $" + invParams.length);',
  '    }',
  '    if (ps(b.unidad)) {',
  '      invParams.push(ps(b.unidad));',
  '      invUpdates.push("unidad = $" + invParams.length);',
  '    }',
  '    if (invUpdates.length) {',
  '      var invSql = "UPDATE inventario SET " + invUpdates.join(", ") + ", actualizado_en = NOW() WHERE producto_id = $1";',
  '      await query(invSql, invParams);',
  '    }',
].join('\n');

if (content.includes('// Sincronizar campos descriptivos en inventario')) {
  console.log('✅ Fix ya aplicado — no se modifica nada');
  process.exit(0);
}

if (!content.includes(OLD_INV_UPDATE)) {
  console.error('❌ No se encontró el bloque de update de inventario');
  // Debug: buscar fragmento
  var idx = content.indexOf('Actualizar inventario si se proporcionó stock');
  if (idx !== -1) {
    console.log('Contexto encontrado:', JSON.stringify(content.substring(idx, idx + 400)));
  } else {
    console.log('Buscando "invUpdates"...');
    var idx2 = content.indexOf('invUpdates');
    if (idx2 !== -1) {
      console.log('Contexto:', JSON.stringify(content.substring(idx2 - 50, idx2 + 300)));
    }
  }
  process.exit(1);
}

content = content.replace(OLD_INV_UPDATE, NEW_INV_UPDATE);
fs.writeFileSync(API_PATH, content, { encoding: 'utf8' });
console.log('✅ PATCH /catalogo/:codigo ahora actualiza también inventario.nombre/categoria/marca/presentacion/unidad');
console.log('Verifica: node --check dashboard/api.js');
