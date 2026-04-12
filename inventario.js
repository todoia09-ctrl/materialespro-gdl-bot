// ══════════════════════════════════════════════════════════════
//  inventario.js — Gestion de Inventario
//  Schema nuevo: catalogo_id BIGINT FK, stock_physical, stock_reserved
//  JOIN con catalogo_productos para nombre, unidad, etc.
// ══════════════════════════════════════════════════════════════

const { query } = require('./db');

// ───────────────────────────────────────────────
//  SINCRONIZAR INVENTARIO DESDE catalogo.json
//  Usa catalogo_id (BIGINT) como FK a catalogo_productos
// ───────────────────────────────────────────────
async function syncFromCatalog(catalogProducts) {
  for (const p of catalogProducts) {
    if (!p.activo) continue;
    try {
      const codigo = p.codigo || p.id;
      if (!codigo) continue;
      const r = await query(
        'SELECT id FROM catalogo_productos WHERE codigo = $1',
        [codigo]
      );
      if (!r.rows.length) continue;
      const catalogoId = r.rows[0].id;
      await query(
        'INSERT INTO inventario (catalogo_id, stock_physical, stock_reserved, stock_minimo) ' +
        'VALUES ($1, 0, 0, 0) ' +
        'ON CONFLICT (catalogo_id) DO NOTHING',
        [catalogoId]
      );
    } catch (e) {
      console.error('[INV] syncFromCatalog:', e.message);
    }
  }
  console.log('[INV] syncFromCatalog completado');
}

// ───────────────────────────────────────────────
//  VERIFICAR STOCK PARA UN PEDIDO
//  items: [{ id: codigo, cantidad: N }]
//  Devuelve: { ok: true } o { ok: false, faltantes: [...] }
// ───────────────────────────────────────────────
async function verificarStock(items) {
  if (!items || items.length === 0) return { ok: true, faltantes: [] };
  const faltantes = [];
  for (const item of items) {
    if (!item.id || item.id === '001') continue;
    try {
      const r = await query(
        'SELECT i.stock_physical, i.stock_available, ' +
        '       cp.nombre, cp.unidad_medida AS unidad ' +
        'FROM inventario i ' +
        'JOIN catalogo_productos cp ON cp.id = i.catalogo_id ' +
        'WHERE cp.codigo = $1',
        [item.id]
      );
      if (!r.rows.length) continue;
      const row = r.rows[0];
      const disponible = parseFloat(row.stock_available) || 0;
      const fisico = parseFloat(row.stock_physical) || 0;
      if (fisico > 0 && disponible < (item.cantidad || 1)) {
        faltantes.push({
          producto: row.nombre,
          pedido: item.cantidad,
          disponible: disponible,
          unidad: row.unidad,
        });
      }
    } catch (e) {
      console.error('[INV] verificarStock:', e.message);
    }
  }
  return { ok: faltantes.length === 0, faltantes };
}

// ───────────────────────────────────────────────
//  REDUCIR STOCK AL CONFIRMAR PEDIDO
//  Decrementa stock_physical directamente (modo simple)
// ───────────────────────────────────────────────
async function reducirStock(items, pedidoFolio) {
  for (const item of items) {
    if (!item.id || item.id === '001') continue;
    try {
      await query(
        'UPDATE inventario SET ' +
        '  stock_physical = GREATEST(0, stock_physical - $1), ' +
        '  version = version + 1 ' +
        'WHERE catalogo_id = (' +
        '  SELECT id FROM catalogo_productos WHERE codigo = $2' +
        ')',
        [item.cantidad || 1, item.id]
      );
    } catch (e) {
      console.error('[INV] reducirStock:', e.message);
    }
  }
}

// ───────────────────────────────────────────────
//  OBTENER ALERTAS DE STOCK BAJO
// ───────────────────────────────────────────────
async function getAlertasStock() {
  try {
    const r = await query(
      'SELECT cp.codigo AS producto_id, cp.nombre, cp.unidad_medida AS unidad, ' +
      '       i.stock_physical AS stock, i.stock_minimo ' +
      'FROM inventario i ' +
      'JOIN catalogo_productos cp ON cp.id = i.catalogo_id ' +
      'WHERE i.stock_physical <= i.stock_minimo ' +
      'AND i.stock_minimo > 0 ' +
      'ORDER BY i.stock_physical ASC'
    );
    return r.rows;
  } catch (e) {
    console.error('[INV] getAlertas:', e.message);
    return [];
  }
}

// ───────────────────────────────────────────────
//  ACTUALIZAR STOCK (desde dashboard)
//  productoId = codigo del producto (string)
// ───────────────────────────────────────────────
async function actualizarStock(productoId, nuevoStock, usuario) {
  await query(
    'UPDATE inventario SET ' +
    '  stock_physical = $1, ' +
    '  version = version + 1 ' +
    'WHERE catalogo_id = (' +
    '  SELECT id FROM catalogo_productos WHERE codigo = $2' +
    ')',
    [nuevoStock, productoId]
  );
}

// ───────────────────────────────────────────────
//  OBTENER INVENTARIO COMPLETO (para dashboard)
//  JOIN con catalogo_productos para todos los campos
// ───────────────────────────────────────────────
async function getInventarioCompleto() {
  try {
    const r = await query(
      'SELECT i.id, cp.codigo AS producto_id, cp.nombre, ' +
      '       cp.unidad_medida AS unidad, cp.categoria, cp.marca, ' +
      '       cp.precio_unitario AS precio_venta, ' +
      '       i.stock_physical AS stock, i.stock_reserved, ' +
      '       i.stock_available, i.stock_minimo, i.stock_maximo, ' +
      '       i.version ' +
      'FROM inventario i ' +
      'JOIN catalogo_productos cp ON cp.id = i.catalogo_id ' +
      'ORDER BY cp.nombre ASC'
    );
    return r.rows;
  } catch (e) {
    console.error('[INV] getCompleto:', e.message);
    return [];
  }
}

// ───────────────────────────────────────────────
//  FORMATEAR ALERTA PARA WHATSAPP
// ───────────────────────────────────────────────
function formatAlertaStock(alertas) {
  if (!alertas || !alertas.length) return null;
  const lines = ['⚠️ *ALERTA DE STOCK BAJO*\n'];
  alertas.forEach(function(a) {
    lines.push('\u2022 ' + a.nombre + ': *' + a.stock + ' ' + a.unidad + '* (min. ' + a.stock_minimo + ')');
  });
  lines.push('\nActualiza el inventario en el dashboard.');
  return lines.join('\n');
}

module.exports = {
  syncFromCatalog,
  verificarStock,
  reducirStock,
  getAlertasStock,
  actualizarStock,
  getInventarioCompleto,
  formatAlertaStock,
};
