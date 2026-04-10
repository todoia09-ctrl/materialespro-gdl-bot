/**
 * fix_schema_v1.js
 * MaterialesPro GDL — Fix initSchema() en db.js
 *
 * FIXES:
 *  1. Agrega CREATE TABLE catalogo_productos completo (con todas las columnas)
 *  2. Agrega ALTER TABLE clientes → nivel_precio, no_campana
 *  3. Elimina ALTER TABLE usuarios duplicados
 *
 * Uso: node fix_schema_v1.js
 */

const fs   = require('fs');
const path = require('path');

const DB_PATH = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\db.js';

let content = fs.readFileSync(DB_PATH, 'utf8');

// ── Verificar que no esté ya aplicado ────────────────────────────────────────
if (content.includes('catalogo_productos')) {
  console.log('WARN: catalogo_productos ya existe en db.js — sin cambios');
  process.exit(0);
}

// ── FIX 1: Eliminar ALTER TABLE duplicados ────────────────────────────────────
const DUPE1 = "    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS empresa VARCHAR(100)`,\n    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono VARCHAR(30)`,\n    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS empresa VARCHAR(100)`,\n    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono VARCHAR(30)`,";
const DUPE1_CLEAN = "    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS empresa VARCHAR(100)`,\n    `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono VARCHAR(30)`,";

if (content.includes(DUPE1)) {
  content = content.replace(DUPE1, DUPE1_CLEAN);
  console.log('OK FIX1: ALTER TABLE usuarios duplicados eliminados');
} else {
  console.log('WARN FIX1: duplicados no encontrados (puede que ya estén limpios)');
}

// ── FIX 2 + 3: Agregar antes del cierre de stmts ─────────────────────────────
const BEFORE_INDEXES = "    `CREATE INDEX IF NOT EXISTS idx_pedidos_estado  ON pedidos(estado)`,";

const NEW_STMTS = `    \`CREATE TABLE IF NOT EXISTS catalogo_productos (
      codigo                    VARCHAR(20)   PRIMARY KEY,
      nombre                    TEXT          NOT NULL,
      descripcion               TEXT,
      categoria                 TEXT,
      marca                     TEXT,
      unidad                    VARCHAR(30),
      cantidad                  NUMERIC(10,3),
      cantidad_minima           NUMERIC(10,3),
      precio_venta              NUMERIC(12,2),
      precio_lista              NUMERIC(12,2),
      precio_2                  NUMERIC(12,2),
      precio_3                  NUMERIC(12,2),
      precio_4                  NUMERIC(12,2),
      iva                       NUMERIC(12,2),
      costo_neto                NUMERIC(12,2),
      descuento_maximo          NUMERIC(5,2),
      rendimiento_m2_por_unidad NUMERIC(10,3),
      rendimiento_nota          TEXT,
      destacado                 BOOLEAN       DEFAULT FALSE,
      en_oferta                 BOOLEAN       DEFAULT FALSE,
      precio_oferta             NUMERIC(12,2),
      oferta_hasta              TIMESTAMPTZ,
      mas_vendido               BOOLEAN       DEFAULT FALSE,
      orden_display             INTEGER       DEFAULT 0,
      unidades_pallet           INTEGER,
      moneda                    VARCHAR(5)    DEFAULT 'MXN',
      fecha_precio              DATE,
      version                   VARCHAR(10),
      activo                    BOOLEAN       DEFAULT TRUE,
      creado_en                 TIMESTAMPTZ   DEFAULT NOW(),
      actualizado_en            TIMESTAMPTZ   DEFAULT NOW()
    )\`,
    \`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nivel_precio  INTEGER DEFAULT 1\`,
    \`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS no_campana    BOOLEAN DEFAULT FALSE\`,
    ${BEFORE_INDEXES}`;

if (!content.includes(BEFORE_INDEXES)) {
  console.error('ERROR: marcador de índices no encontrado en db.js');
  process.exit(1);
}

content = content.replace(BEFORE_INDEXES, NEW_STMTS);
console.log('OK FIX2: CREATE TABLE catalogo_productos agregado a initSchema()');
console.log('OK FIX3: ALTER TABLE clientes nivel_precio + no_campana agregados');

// ── Escribir sin BOM ──────────────────────────────────────────────────────────
fs.writeFileSync(DB_PATH, content, { encoding: 'utf8' });

console.log('\n✅ fix_schema_v1 completado.');
console.log('Siguiente: node --check db.js');
