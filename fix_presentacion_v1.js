/**
 * fix_presentacion_v1.js
 * MaterialesPro GDL — Agregar campo presentacion a toda la arquitectura
 *
 * CAMBIOS:
 *  1. db.js          → agrega presentacion en CREATE TABLE + ALTER TABLE
 *  2. dashboard/api.js → export agrega columnas Presentación/Unidad medida/Contenido
 *                      → import mapea las 3 columnas
 *  3. server.js      → buildCatalogText usa presentacion para mostrar al cliente
 *
 * Uso: node fix_presentacion_v1.js
 */

const fs   = require('fs');
const path = require('path');

const BASE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl';
const DB_PATH  = path.join(BASE, 'db.js');
const API_PATH = path.join(BASE, 'dashboard', 'api.js');
const SRV_PATH = path.join(BASE, 'server.js');

let errors = 0;

// ════════════════════════════════════════════════════════════════════════════
//  FIX 1 — db.js: agregar presentacion al CREATE TABLE + ALTER TABLE
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── FIX 1: db.js ────────────────────────────────────────');
let db = fs.readFileSync(DB_PATH, 'utf8');

if (db.includes('presentacion')) {
  console.log('  SKIP: presentacion ya existe en db.js');
} else {
  // Agregar presentacion después de marca en CREATE TABLE
  const OLD_MARCA = '      marca                     TEXT,\n      unidad                    VARCHAR(30),';
  const NEW_MARCA = '      marca                     TEXT,\n      presentacion              VARCHAR(80),\n      unidad                    VARCHAR(30),';

  if (!db.includes(OLD_MARCA)) {
    console.log('  ERROR: bloque marca/unidad no encontrado en db.js');
    errors++;
  } else {
    db = db.replace(OLD_MARCA, NEW_MARCA);

    // Agregar ALTER TABLE para DB existente (después de no_campana)
    const OLD_ALTER = '    `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS no_campana    BOOLEAN DEFAULT FALSE`,';
    const NEW_ALTER = '    `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS no_campana    BOOLEAN DEFAULT FALSE`,\n    `ALTER TABLE catalogo_productos ADD COLUMN IF NOT EXISTS presentacion VARCHAR(80)`,';

    if (!db.includes(OLD_ALTER)) {
      console.log('  WARN: ALTER TABLE no_campana no encontrado — ALTER TABLE presentacion no agregado');
    } else {
      db = db.replace(OLD_ALTER, NEW_ALTER);
    }

    fs.writeFileSync(DB_PATH, db, { encoding: 'utf8' });
    console.log('  OK: presentacion agregado a CREATE TABLE catalogo_productos');
    console.log('  OK: ALTER TABLE catalogo_productos ADD COLUMN presentacion agregado');
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  FIX 2 — dashboard/api.js: export + import
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── FIX 2: dashboard/api.js ──────────────────────────────');
let api = fs.readFileSync(API_PATH, 'utf8');

// ── FIX 2A: Export — agregar 3 columnas nuevas ───────────────────────────
if (api.includes("'Presentaci\u00f3n':")) {
  console.log('  SKIP: columnas presentacion ya en export');
} else {
  const OLD_EXPORT_ROW = "      'Se vende por':                  r.unidad   || '',";
  const NEW_EXPORT_ROW = "      'Presentaci\u00f3n':                   r.presentacion || '',\n      'Unidad medida':                 r.unidad   || '',\n      'Contenido':                     r.cantidad  != null ? Number(r.cantidad) : '',";

  if (!api.includes(OLD_EXPORT_ROW)) {
    console.log('  ERROR: fila Se vende por no encontrada en export');
    errors++;
  } else {
    api = api.replace(OLD_EXPORT_ROW, NEW_EXPORT_ROW);

    // Agregar presentacion, cantidad al SELECT del export
    const OLD_SELECT = '`SELECT codigo, nombre, categoria, marca, unidad, descripcion,\n              precio_venta, precio_2, precio_3, precio_4, costo_neto,\n              rendimiento_m2_por_unidad, rendimiento_nota, activo\n       FROM catalogo_productos\n       ORDER BY categoria, nombre`';
    const NEW_SELECT = '`SELECT codigo, nombre, categoria, marca, presentacion, unidad, cantidad, descripcion,\n              precio_venta, precio_2, precio_3, precio_4, costo_neto,\n              rendimiento_m2_por_unidad, rendimiento_nota, activo\n       FROM catalogo_productos\n       ORDER BY categoria, nombre`';

    if (api.includes(OLD_SELECT)) {
      api = api.replace(OLD_SELECT, NEW_SELECT);
      console.log('  OK: SELECT export actualizado con presentacion + cantidad');
    } else {
      console.log('  WARN: SELECT export no encontrado exactamente — revisar manualmente');
    }

    console.log('  OK: Export agrega columnas Presentación / Unidad medida / Contenido');
  }
}

// ── FIX 2B: Import — mapear las 3 columnas nuevas ────────────────────────
if (api.includes("getVal(r, 'Presentaci\u00f3n'")) {
  console.log('  SKIP: import ya mapea presentacion');
} else {
  // Agregar presentacion al objeto de retorno del import (después de marca)
  const OLD_IMPORT_MARCA = "        marca:       String(getVal(r, 'Marca', 'marca') || '').trim(),";
  const NEW_IMPORT_MARCA = "        marca:       String(getVal(r, 'Marca', 'marca') || '').trim(),\n        presentacion: String(getVal(r, 'Presentaci\u00f3n', 'presentacion') || '').trim(),";

  if (!api.includes(OLD_IMPORT_MARCA)) {
    console.log('  ERROR: bloque marca en import no encontrado');
    errors++;
  } else {
    api = api.replace(OLD_IMPORT_MARCA, NEW_IMPORT_MARCA);
    console.log('  OK: Import mapea Presentación → presentacion');
  }

  // Agregar unidad y cantidad como columnas separadas (reemplazar presentacion actual en Se vende por)
  const OLD_IMPORT_PRES = "        presentacion: String(getVal(r, 'Se vende por', 'presentacion') || 'Pieza').trim(),";
  const NEW_IMPORT_PRES = "        presentacion_legacy: String(getVal(r, 'Se vende por', 'presentacion_legacy') || '').trim(),\n        cantidad:    parseFloat(getVal(r, 'Contenido', 'cantidad') || 0) || 0,";

  // Note: La columna 'Se vende por' ahora NO se usa — fue reemplazada por Presentación
  // Mantenemos compatibilidad con archivos viejos via presentacion_legacy (ignorado en upsert)
  if (api.includes(OLD_IMPORT_PRES)) {
    api = api.replace(OLD_IMPORT_PRES, NEW_IMPORT_PRES);
    console.log('  OK: Import mapea Contenido → cantidad');
  }

  // Actualizar unidad en import para usar Unidad medida
  const OLD_IMPORT_UNIDAD = "        presentacion: String(getVal(r, 'Se vende por', 'presentacion') || 'Pieza').trim(),";
  // Already handled above

  // Agregar unidad separada (tipo de medida lt/kg/pza)
  const OLD_IMPORT_PROVEEDOR = "        proveedor:   String(getVal(r, 'Proveedor', 'proveedor') || '').trim(),";
  const NEW_IMPORT_PROVEEDOR = "        unidad:      String(getVal(r, 'Unidad medida', 'unidad') || 'pza').trim(),\n        proveedor:   String(getVal(r, 'Proveedor', 'proveedor') || '').trim(),";

  if (api.includes(OLD_IMPORT_PROVEEDOR)) {
    api = api.replace(OLD_IMPORT_PROVEEDOR, NEW_IMPORT_PROVEEDOR);
    console.log('  OK: Import mapea Unidad medida → unidad');
  }
}

// ── FIX 2C: Upsert DB — agregar presentacion + cantidad al INSERT ─────────
if (api.includes('presentacion,') && api.includes('EXCLUDED.presentacion')) {
  console.log('  SKIP: upsert ya incluye presentacion');
} else {
  // Agregar presentacion al INSERT columns
  const OLD_INSERT_COLS = '            codigo, nombre, descripcion, categoria, marca,\n            unidad, precio_venta, precio_2, precio_3, precio_4,';
  const NEW_INSERT_COLS = '            codigo, nombre, descripcion, categoria, marca,\n            presentacion, unidad, cantidad, precio_venta, precio_2, precio_3, precio_4,';

  if (api.includes(OLD_INSERT_COLS)) {
    api = api.replace(OLD_INSERT_COLS, NEW_INSERT_COLS);
    console.log('  OK: INSERT columns agrega presentacion, cantidad');
  }

  // Agregar VALUES placeholders ($6,$7 shift)
  const OLD_VALUES = '            \$1, \$2, \$3, \$4, \$5,\n            \$6, \$7, \$8, \$9, \$10,\n            \$11, \$12, \$13,';
  const NEW_VALUES = '            \$1, \$2, \$3, \$4, \$5,\n            \$6, \$7, \$8, \$9, \$10, \$11, \$12,\n            \$13, \$14, \$15,';

  if (api.includes(OLD_VALUES)) {
    api = api.replace(OLD_VALUES, NEW_VALUES);
    console.log('  OK: VALUES placeholders actualizados');
  }

  // Agregar al ON CONFLICT UPDATE
  const OLD_CONFLICT_MARCA = '            marca                     = EXCLUDED.marca,\n            unidad                    = EXCLUDED.unidad,';
  const NEW_CONFLICT_MARCA = '            marca                     = EXCLUDED.marca,\n            presentacion              = EXCLUDED.presentacion,\n            unidad                    = EXCLUDED.unidad,\n            cantidad                  = EXCLUDED.cantidad,';

  if (api.includes(OLD_CONFLICT_MARCA)) {
    api = api.replace(OLD_CONFLICT_MARCA, NEW_CONFLICT_MARCA);
    console.log('  OK: ON CONFLICT UPDATE agrega presentacion, cantidad');
  }

  // Actualizar array de params del query (agregar p.presentacion, p.cantidad después de p.marca)
  const OLD_PARAMS = '          p.id,\n          p.nombre,\n          p.descripcion || null,\n          p.categoria || \'General\',\n          p.marca || null,\n          p.presentacion || null,\n          p.precio    || null,';
  const NEW_PARAMS = '          p.id,\n          p.nombre,\n          p.descripcion || null,\n          p.categoria || \'General\',\n          p.marca || null,\n          p.presentacion || null,\n          p.unidad || null,\n          p.cantidad || null,\n          p.precio    || null,';

  if (api.includes(OLD_PARAMS)) {
    api = api.replace(OLD_PARAMS, NEW_PARAMS);
    console.log('  OK: params array actualizado con unidad, cantidad');
  }
}

fs.writeFileSync(API_PATH, api, { encoding: 'utf8' });

// ════════════════════════════════════════════════════════════════════════════
//  FIX 3 — server.js: buildCatalogText usa presentacion
// ════════════════════════════════════════════════════════════════════════════
console.log('\n── FIX 3: server.js ─────────────────────────────────────');
let srv = fs.readFileSync(SRV_PATH, 'utf8');

if (srv.includes('p.presentacion || p.unidad')) {
  console.log('  SKIP: buildCatalogText ya usa presentacion');
} else {
  // formatLine: usar presentacion para mostrar al cliente
  const OLD_FORMAT = "        _u = p.unidad || p.presentacion || 'pza';";
  const NEW_FORMAT = "        _u = p.presentacion || p.unidad || 'pza';";

  if (!srv.includes(OLD_FORMAT)) {
    console.log('  ERROR: formatLine no encontrado en server.js');
    errors++;
  } else {
    srv = srv.replace(OLD_FORMAT, NEW_FORMAT);
    console.log('  OK: formatLine usa presentacion primero');
  }

  // Para ofertas y destacados (desde DB priority products)
  const OLD_U_OFERTA = "      var _u = o.unidad || 'pza';";
  const NEW_U_OFERTA = "      var _u = o.presentacion || o.unidad || 'pza';";

  if (srv.includes(OLD_U_OFERTA)) {
    srv = srv.replace(OLD_U_OFERTA, NEW_U_OFERTA);
    console.log('  OK: ofertas usa presentacion primero');
  }

  // Queries de priority products — agregar presentacion al SELECT
  const OLD_QUERY_OF = '"SELECT codigo, nombre, categoria, unidad, precio_venta, precio_oferta, descuento_maximo FROM catalogo_productos WHERE activo=true AND en_oferta=true AND (oferta_hasta IS NULL OR oferta_hasta >= NOW()) ORDER BY orden_display LIMIT 50"';
  const NEW_QUERY_OF = '"SELECT codigo, nombre, categoria, presentacion, unidad, precio_venta, precio_oferta, descuento_maximo FROM catalogo_productos WHERE activo=true AND en_oferta=true AND (oferta_hasta IS NULL OR oferta_hasta >= NOW()) ORDER BY orden_display LIMIT 50"';

  if (srv.includes(OLD_QUERY_OF)) {
    srv = srv.replace(OLD_QUERY_OF, NEW_QUERY_OF);
    console.log('  OK: query ofertas agrega presentacion');
  }

  const OLD_QUERY_DEST = '"SELECT codigo, nombre, categoria, unidad, precio_venta, descuento_maximo FROM catalogo_productos WHERE activo=true AND destacado=true AND en_oferta IS NOT TRUE ORDER BY orden_display LIMIT 10"';
  const NEW_QUERY_DEST = '"SELECT codigo, nombre, categoria, presentacion, unidad, precio_venta, descuento_maximo FROM catalogo_productos WHERE activo=true AND destacado=true AND en_oferta IS NOT TRUE ORDER BY orden_display LIMIT 10"';

  if (srv.includes(OLD_QUERY_DEST)) {
    srv = srv.replace(OLD_QUERY_DEST, NEW_QUERY_DEST);
    console.log('  OK: query destacados agrega presentacion');
  }

  const OLD_QUERY_MV = '"SELECT codigo, nombre, categoria, unidad, precio_venta, descuento_maximo FROM catalogo_productos WHERE activo=true AND mas_vendido=true AND destacado IS NOT TRUE AND en_oferta IS NOT TRUE ORDER BY orden_display LIMIT 10"';
  const NEW_QUERY_MV = '"SELECT codigo, nombre, categoria, presentacion, unidad, precio_venta, descuento_maximo FROM catalogo_productos WHERE activo=true AND mas_vendido=true AND destacado IS NOT TRUE AND en_oferta IS NOT TRUE ORDER BY orden_display LIMIT 10"';

  if (srv.includes(OLD_QUERY_MV)) {
    srv = srv.replace(OLD_QUERY_MV, NEW_QUERY_MV);
    console.log('  OK: query masVendidos agrega presentacion');
  }

  fs.writeFileSync(SRV_PATH, srv, { encoding: 'utf8' });
}

// ════════════════════════════════════════════════════════════════════════════
//  RESUMEN
// ════════════════════════════════════════════════════════════════════════════
console.log('\n────────────────────────────────────────────────────────');
if (errors === 0) {
  console.log('✅ fix_presentacion_v1 completado sin errores.');
  console.log('\nColumnas Excel finales:');
  console.log('  Código CRM | Artículo | Categoría | Marca');
  console.log('  Presentación (ej: "Cubeta 18L") → lo que ve el cliente');
  console.log('  Unidad medida (lt/kg/pza) → medida interna');
  console.log('  Contenido (18/19/25) → cantidad por unidad de venta');
  console.log('  Precio 1-4 NETO | Costo NETO | rendimiento_* | Activo');
  console.log('\nSiguiente: node --check db.js && node --check dashboard/api.js && node --check server.js');
} else {
  console.log(`❌ ${errors} error(es) — revisar mensajes arriba antes de continuar`);
}
