// ══════════════════════════════════════════════════════════════
//  db.js — Base de Datos PostgreSQL
//  Auto-crea tablas al arrancar. Sin migraciones manuales.
// ══════════════════════════════════════════════════════════════

const { Pool } = require('pg');

let _pool = null;
function getPool() {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: (process.env.DATABASE_URL || '').includes('railway') || (process.env.DATABASE_URL || '').includes('supabase') ? { rejectUnauthorized: false } : false,
      max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000,
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
    console.error('[DB ERR]', e.message, sql.substring(0,80));
    throw e;
  } finally { c.release(); }
}

async function initSchema() {
  const stmts = [
    `CREATE TABLE IF NOT EXISTS clientes (
      id              SERIAL PRIMARY KEY,
      whatsapp        VARCHAR(30) UNIQUE NOT NULL,
      nombre          VARCHAR(120),
      canal           VARCHAR(20)  DEFAULT 'whatsapp',
      zona            VARCHAR(30),
      rfc             VARCHAR(20),
      email           VARCHAR(120),
      credito_limite  NUMERIC(12,2) DEFAULT 0,
      notas           TEXT,
      primer_contacto TIMESTAMPTZ  DEFAULT NOW(),
      ultimo_contacto TIMESTAMPTZ  DEFAULT NOW(),
      total_compras   NUMERIC(12,2) DEFAULT 0,
      num_pedidos     INTEGER      DEFAULT 0,
      activo          BOOLEAN      DEFAULT TRUE
    )`,
    `CREATE TABLE IF NOT EXISTS pedidos (
      id             SERIAL PRIMARY KEY,
      folio          VARCHAR(30)  UNIQUE NOT NULL,
      cliente_id     INTEGER REFERENCES clientes(id),
      canal          VARCHAR(20),
      tipo           VARCHAR(20),
      estado         VARCHAR(30)  DEFAULT 'pendiente',
      items_json     JSONB,
      subtotal       NUMERIC(12,2),
      costo_envio    NUMERIC(10,2) DEFAULT 0,
      total          NUMERIC(12,2),
      metodo_pago    VARCHAR(30),
      factura        BOOLEAN      DEFAULT FALSE,
      cfdi_uso       VARCHAR(10),
      cfdi_email     VARCHAR(120),
      calle          VARCHAR(200),
      colonia        VARCHAR(100),
      referencia     VARCHAR(300),
      contacto_obra  VARCHAR(120),
      tel_alterno    VARCHAR(20),
      maps_link      VARCHAR(500),
      fecha_entrega  VARCHAR(100),
      fecha_recoger  VARCHAR(100),
      vendedor_id    INTEGER,
      zona           VARCHAR(30),
      confirmado_en  TIMESTAMPTZ,
      creado_en      TIMESTAMPTZ  DEFAULT NOW(),
      actualizado_en TIMESTAMPTZ  DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS cotizaciones (
      id          SERIAL PRIMARY KEY,
      folio       VARCHAR(30) UNIQUE NOT NULL,
      cliente_id  INTEGER REFERENCES clientes(id),
      canal       VARCHAR(20),
      items_json  JSONB,
      total       NUMERIC(12,2),
      pdf_url     VARCHAR(500),
      estado      VARCHAR(20)  DEFAULT 'enviada',
      pedido_id   INTEGER REFERENCES pedidos(id),
      expira_en   TIMESTAMPTZ  DEFAULT NOW() + INTERVAL '7 days',
      creado_en   TIMESTAMPTZ  DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS inventario (
      id             SERIAL PRIMARY KEY,
      producto_id    VARCHAR(20) UNIQUE NOT NULL,
      nombre         VARCHAR(150),
      stock          INTEGER     DEFAULT 0,
      stock_minimo   INTEGER     DEFAULT 10,
      unidad         VARCHAR(30) DEFAULT 'unidad',
      actualizado_en TIMESTAMPTZ DEFAULT NOW(),
      actualizado_por VARCHAR(60)
    )`,
    `CREATE TABLE IF NOT EXISTS seguimientos (
      id             SERIAL PRIMARY KEY,
      cotizacion_id  INTEGER REFERENCES cotizaciones(id),
      cliente_id     INTEGER REFERENCES clientes(id),
      whatsapp       VARCHAR(30),
      tipo           VARCHAR(20),
      estado         VARCHAR(20)  DEFAULT 'pendiente',
      programado_en  TIMESTAMPTZ,
      enviado_en     TIMESTAMPTZ,
      creado_en      TIMESTAMPTZ  DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS campanas (
      id             SERIAL PRIMARY KEY,
      nombre         VARCHAR(120),
      mensaje        TEXT,
      segmento       VARCHAR(50),
      estado         VARCHAR(20)  DEFAULT 'borrador',
      total_envios   INTEGER      DEFAULT 0,
      enviados       INTEGER      DEFAULT 0,
      errores        INTEGER      DEFAULT 0,
      programada_en  TIMESTAMPTZ,
      completada_en  TIMESTAMPTZ,
      creado_por     VARCHAR(60),
      creado_en      TIMESTAMPTZ  DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS usuarios (
      id            SERIAL PRIMARY KEY,
      nombre        VARCHAR(100),
      email         VARCHAR(120) UNIQUE NOT NULL,
      password_hash VARCHAR(200),
      rol           VARCHAR(20) DEFAULT 'vendedor',
      zona          VARCHAR(30),
      whatsapp      VARCHAR(30),
      activo        BOOLEAN     DEFAULT TRUE,
      ultimo_login  TIMESTAMPTZ,
      creado_en     TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS mensajes (
      id         SERIAL PRIMARY KEY,
      cliente_id INTEGER REFERENCES clientes(id),
      canal      VARCHAR(20),
      direccion  VARCHAR(10),
      contenido  TEXT,
      tipo       VARCHAR(20) DEFAULT 'texto',
      creado_en  TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_pedidos_estado  ON pedidos(estado)`,
    `CREATE INDEX IF NOT EXISTS idx_pedidos_creado  ON pedidos(creado_en DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_cots_estado     ON cotizaciones(estado)`,
    `CREATE INDEX IF NOT EXISTS idx_cots_expira     ON cotizaciones(expira_en)`,
    `CREATE INDEX IF NOT EXISTS idx_seg_prog        ON seguimientos(estado, programado_en)`,
    `CREATE INDEX IF NOT EXISTS idx_msg_cliente     ON mensajes(cliente_id, creado_en DESC)`,
  ];
  for (const s of stmts) await query(s);
  console.log('[DB] Esquema listo ✅');
}

// ─── Helpers ─────────────────────────────────────
async function upsertCliente(whatsapp, updates = {}) {
  const { nombre, canal, zona, rfc, email } = updates;
  const r = await query(`
    INSERT INTO clientes (whatsapp,nombre,canal,zona,rfc,email)
    VALUES ($1,$2,$3,$4,$5,$6)
    ON CONFLICT (whatsapp) DO UPDATE SET
      nombre          = COALESCE(EXCLUDED.nombre, clientes.nombre),
      canal           = COALESCE(EXCLUDED.canal,  clientes.canal),
      zona            = COALESCE(EXCLUDED.zona,   clientes.zona),
      rfc             = COALESCE(EXCLUDED.rfc,    clientes.rfc),
      email           = COALESCE(EXCLUDED.email,  clientes.email),
      ultimo_contacto = NOW()
    RETURNING *`,
    [whatsapp, nombre||null, canal||'whatsapp', zona||null, rfc||null, email||null]
  );
  return r.rows[0];
}

async function getCliente(whatsapp) {
  const r = await query('SELECT * FROM clientes WHERE whatsapp=$1', [whatsapp]);
  return r.rows[0] || null;
}

async function logMensaje(clienteId, canal, direccion, contenido, tipo='texto') {
  if (!clienteId) return;
  await query(
    'INSERT INTO mensajes(cliente_id,canal,direccion,contenido,tipo) VALUES($1,$2,$3,$4,$5)',
    [clienteId, canal, direccion, (contenido||'').substring(0,2000), tipo]
  );
}

module.exports = { query, initSchema, upsertCliente, getCliente, logMensaje, getPool };

