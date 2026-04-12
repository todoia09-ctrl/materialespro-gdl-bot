// ══════════════════════════════════════════════════════════════
//  db.js — Base de Datos PostgreSQL + Supabase
//  Schema gestionado en Supabase SQL Editor (fuente de verdad)
//  initSchema() solo verifica que las tablas existen
// ══════════════════════════════════════════════════════════════

const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// ─── Pool PostgreSQL directo (para queries raw) ─────────────
let _pool = null;
function getPool() {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: (process.env.DATABASE_URL || '').includes('railway') ||
           (process.env.DATABASE_URL || '').includes('supabase')
           ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    _pool.on('error', e => console.error('[DB POOL]', e.message));
  }
  return _pool;
}

async function query(sql, params = []) {
  const c = await getPool().connect();
  try {
    return await c.query(sql, params);
  } catch (e) {
    console.error('[DB ERR]', e.message, sql.substring(0, 80));
    throw e;
  } finally {
    c.release();
  }
}

// ─── Supabase client (para RPC wms_* y operaciones modernas) ──
let _supabase = null;
function getSupabase() {
  if (!_supabase) {
    const url  = process.env.SUPABASE_URL;
    const key  = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) {
      throw new Error('[DB] SUPABASE_URL o SUPABASE_SERVICE_KEY no definidos');
    }
    _supabase = createClient(url, key, {
      auth: { persistSession: false }
    });
  }
  return _supabase;
}

// ─── initSchema: verificar tablas criticas ─────────────────
async function initSchema() {
  const tablasRequeridas = [
    'catalogo_productos', 'inventario', 'clientes',
    'pedidos', 'cotizaciones', 'mensajes', 'seguimientos',
    'campanas', 'campaign_sessions', 'usuarios',
    'active_orders', 'inventario_movimientos'
  ];
  for (const tabla of tablasRequeridas) {
    const r = await query(
      'SELECT to_regclass(' + "'public." + tabla + "'" + ') AS existe'
    );
    if (!r.rows[0].existe) {
      throw new Error('[DB] Tabla requerida no encontrada: ' + tabla);
    }
  }
  console.log('[DB] Schema verificado — 12 tablas OK ✅');
}

// ─── Helpers clientes ─────────────────────────────────
async function upsertCliente(whatsapp, updates = {}) {
  const { nombre, canal, empresa, rfc, email } = updates;
  const canalValido = ['whatsapp', 'instagram', 'messenger']
    .includes(canal) ? canal : 'whatsapp';
  const r = await query(
    'INSERT INTO clientes (whatsapp, nombre, canal, empresa, rfc, email) ' +
    'VALUES ($1, $2, $3, $4, $5, $6) ' +
    'ON CONFLICT (whatsapp) DO UPDATE SET ' +
    '  nombre     = COALESCE(EXCLUDED.nombre,   clientes.nombre), ' +
    '  canal      = COALESCE(EXCLUDED.canal,    clientes.canal), ' +
    '  empresa    = COALESCE(EXCLUDED.empresa,  clientes.empresa), ' +
    '  rfc        = COALESCE(EXCLUDED.rfc,      clientes.rfc), ' +
    '  email      = COALESCE(EXCLUDED.email,    clientes.email), ' +
    '  updated_at = NOW() ' +
    'RETURNING *',
    [whatsapp, nombre || null, canalValido,
     empresa || null, rfc || null, email || null]
  );
  return r.rows[0];
}

async function getCliente(whatsapp) {
  const r = await query(
    'SELECT * FROM clientes WHERE whatsapp = $1',
    [whatsapp]
  );
  return r.rows[0] || null;
}

async function logMensaje(clienteId, canal, direccion, contenido, tipo) {
  if (!clienteId) return;
  const tipoFinal = tipo || 'text';
  const dirValida = ['inbound', 'outbound'].includes(direccion)
    ? direccion : 'inbound';
  try {
    await query(
      'INSERT INTO mensajes ' +
      '(cliente_id, whatsapp_from, whatsapp_to, direccion, contenido, tipo) ' +
      'VALUES ($1, $2, $3, $4, $5, $6)',
      [clienteId, '', '', dirValida,
       (contenido || '').substring(0, 2000), tipoFinal]
    );
  } catch (e) {
    console.error('[DB logMensaje]', e.message);
  }
}

// ─── ACTIVE ORDERS — nuevo schema ────────────────────────
async function saveActiveOrder(sessionKey, state, order, token) {
  try {
    const clienteWhatsapp = sessionKey || '';
    const vendorWhatsapp  = token || null;
    const itemsJson       = order && order.items ? order.items : [];
    const total           = (order && order.total) ? order.total : 0;
    const pedidoId        = (order && order.pedidoId) ? order.pedidoId : null;
    const expiresAt       = new Date(Date.now() + 2 * 60 * 60 * 1000);
    await query(
      'INSERT INTO active_orders ' +
      '(pedido_id, cliente_whatsapp, vendor_whatsapp, estado, ' +
      ' items_json, total, ultimo_mensaje_at, expires_at) ' +
      'VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7) ' +
      'ON CONFLICT (pedido_id) DO UPDATE SET ' +
      '  estado            = EXCLUDED.estado, ' +
      '  items_json        = EXCLUDED.items_json, ' +
      '  total             = EXCLUDED.total, ' +
      '  vendor_whatsapp   = EXCLUDED.vendor_whatsapp, ' +
      '  ultimo_mensaje_at = NOW(), ' +
      '  expires_at        = EXCLUDED.expires_at, ' +
      '  updated_at        = NOW()',
      [pedidoId, clienteWhatsapp, vendorWhatsapp,
       state || 'esperando_vendor',
       JSON.stringify(itemsJson), total, expiresAt]
    );
  } catch (e) {
    console.error('[DB AO save]', e.message);
  }
}

async function deleteActiveOrder(sessionKey) {
  try {
    await query(
      'DELETE FROM active_orders WHERE cliente_whatsapp = $1',
      [sessionKey]
    );
  } catch (e) {
    console.error('[DB AO delete]', e.message);
  }
}

async function loadActiveOrders() {
  try {
    const r = await query(
      'SELECT * FROM active_orders ORDER BY updated_at DESC'
    );
    return r.rows;
  } catch (e) {
    console.error('[DB AO load]', e.message);
    return [];
  }
}

// ─── WMS RPCs via Supabase ──────────────────────────────
async function wmsReserve(pedidoId, items) {
  const sb = getSupabase();
  const { data, error } = await sb.rpc('wms_reserve', {
    p_pedido_id: pedidoId,
    p_items: items
  });
  if (error) throw new Error('[WMS reserve] ' + error.message);
  return data;
}

async function wmsFulfill(pedidoId) {
  const sb = getSupabase();
  const { data, error } = await sb.rpc('wms_fulfill', {
    p_pedido_id: pedidoId
  });
  if (error) throw new Error('[WMS fulfill] ' + error.message);
  return data;
}

async function wmsRelease(pedidoId, reason) {
  const sb = getSupabase();
  const { data, error } = await sb.rpc('wms_release', {
    p_pedido_id: pedidoId,
    p_reason: reason || 'Cancelacion'
  });
  if (error) throw new Error('[WMS release] ' + error.message);
  return data;
}

module.exports = {
  query,
  getPool,
  getSupabase,
  initSchema,
  upsertCliente,
  getCliente,
  logMensaje,
  saveActiveOrder,
  deleteActiveOrder,
  loadActiveOrders,
  wmsReserve,
  wmsFulfill,
  wmsRelease,
};
