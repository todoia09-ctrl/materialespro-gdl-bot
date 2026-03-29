// ══════════════════════════════════════════════════════════════
//  inventario.js — Gestión de Inventario en Tiempo Real
//  Verifica stock antes de confirmar pedidos
//  Alerta automática cuando stock baja del mínimo
// ══════════════════════════════════════════════════════════════

const { query } = require('./db');

// ─────────────────────────────────────────────────
//  SINCRONIZAR INVENTARIO DESDE catalogo.json
//  Crea registros si no existen (con stock=0)
// ─────────────────────────────────────────────────
async function syncFromCatalog(catalogProducts) {
  for (const p of catalogProducts) {
    if (!p.activo) continue;
    await query(`
      INSERT INTO inventario(producto_id, nombre, unidad)
      VALUES($1,$2,$3)
      ON CONFLICT(producto_id) DO UPDATE SET nombre=EXCLUDED.nombre`,
      [p.id, p.nombre, p.presentacion?.includes('kg') ? 'bolsas' : p.presentacion?.includes('L') ? 'cubetas' : 'unidades']
    );
  }
}

// ─────────────────────────────────────────────────
//  VERIFICAR STOCK PARA UN PEDIDO
//  Devuelve: { ok: true } o { ok: false, faltantes: [...] }
// ─────────────────────────────────────────────────
async function verificarStock(items) {
  if (!items || items.length === 0) return { ok: true, faltantes: [] };

  const faltantes = [];

  for (const item of items) {
    if (!item.id || item.id === '001') continue; // item genérico sin ID de catálogo

    try {
      const r = await query(
        'SELECT stock, nombre, unidad FROM inventario WHERE producto_id=$1',
        [item.id]
      );

      if (r.rows.length === 0) continue; // producto no rastreado, skip

      const { stock, nombre, unidad } = r.rows[0];
      if (stock < (item.cantidad || 1)) {
        faltantes.push({
          producto: nombre,
          pedido:   item.cantidad,
          disponible: stock,
          unidad,
        });
      }
    } catch (e) { console.error('[INV] verificarStock:', e.message); }
  }

  return { ok: faltantes.length === 0, faltantes };
}

// ─────────────────────────────────────────────────
//  REDUCIR STOCK AL CONFIRMAR PEDIDO
// ─────────────────────────────────────────────────
async function reducirStock(items, pedidoFolio) {
  for (const item of items) {
    if (!item.id || item.id === '001') continue;
    try {
      await query(`
        UPDATE inventario SET
          stock          = GREATEST(0, stock - $1),
          actualizado_en = NOW(),
          actualizado_por = $2
        WHERE producto_id = $3`,
        [item.cantidad || 1, 'bot:' + pedidoFolio, item.id]
      );
    } catch (e) { console.error('[INV] reducirStock:', e.message); }
  }
}

// ─────────────────────────────────────────────────
//  OBTENER ALERTAS DE STOCK BAJO
// ─────────────────────────────────────────────────
async function getAlertasStock() {
  try {
    const r = await query(`
      SELECT producto_id, nombre, stock, stock_minimo, unidad
      FROM inventario
      WHERE stock <= stock_minimo
      ORDER BY stock ASC`
    );
    return r.rows;
  } catch (e) {
    console.error('[INV] getAlertas:', e.message);
    return [];
  }
}

// ─────────────────────────────────────────────────
//  ACTUALIZAR STOCK (desde dashboard)
// ─────────────────────────────────────────────────
async function actualizarStock(productoId, nuevoStock, usuario) {
  await query(`
    UPDATE inventario SET
      stock = $1, actualizado_en = NOW(), actualizado_por = $2
    WHERE producto_id = $3`,
    [nuevoStock, usuario || 'admin', productoId]
  );
}

// ─────────────────────────────────────────────────
//  OBTENER INVENTARIO COMPLETO (para dashboard)
// ─────────────────────────────────────────────────
async function getInventarioCompleto() {
  try {
    const r = await query('SELECT * FROM inventario ORDER BY nombre ASC');
    return r.rows;
  } catch (e) {
    console.error('[INV] getCompleto:', e.message);
    return [];
  }
}

// ─────────────────────────────────────────────────
//  FORMATEAR ALERTA PARA WHATSAPP
// ─────────────────────────────────────────────────
function formatAlertaStock(alertas) {
  if (!alertas.length) return null;
  const lines = ['⚠️ *ALERTA DE STOCK BAJO*\n'];
  alertas.forEach(a => {
    lines.push('• ' + a.nombre + ': *' + a.stock + ' ' + a.unidad + '* (mín. ' + a.stock_minimo + ')');
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
