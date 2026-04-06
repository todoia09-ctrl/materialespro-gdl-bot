/**
 * importar-catalogo.js
 * MaterialesPro GDL — Importador de Catálogo
 * 
 * Lee TEMPLATE_IA.xlsx → genera catalogo.json + inserta en Supabase
 * 
 * Uso:
 *   node importar-catalogo.js
 * 
 * Requisitos:
 *   npm install xlsx pg dotenv
 * 
 * El archivo TEMPLATE_IA.xlsx debe estar en la misma carpeta que este script.
 */

require('dotenv').config();
const XLSX   = require('xlsx');
const { Pool } = require('pg');
const fs     = require('fs');
const path   = require('path');

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const EXCEL_PATH    = path.join(__dirname, 'TEMPLATE_IA.xlsx');
const CATALOGO_PATH = path.join(__dirname, 'catalogo.json');

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * Determina unidad y cantidad del producto.
 * KG y LT son mutuamente excluyentes en el Excel.
 */
function resolverUnidad(kg, lt, minMultiple) {
  if (kg && kg > 0) {
    return { unidad: 'kg', cantidad: kg, cantidad_minima: minMultiple || 1 };
  }
  if (lt && lt > 0) {
    return { unidad: 'lt', cantidad: lt, cantidad_minima: minMultiple || 1 };
  }
  return { unidad: 'pieza', cantidad: 1, cantidad_minima: minMultiple || 1 };
}

/**
 * Limpia string: elimina espacios dobles, trim.
 */
function limpiar(str) {
  if (!str) return '';
  return String(str).replace(/\s+/g, ' ').trim();
}

/**
 * Redondea a 2 decimales.
 */
function redondear(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

// ─── LECTURA EXCEL ───────────────────────────────────────────────────────────

function leerExcel() {
  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(`No se encontró el archivo Excel: ${EXCEL_PATH}`);
  }

  console.log(`\n📂 Leyendo: ${EXCEL_PATH}`);
  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json(ws, { raw: true, defval: null });

  console.log(`   Total filas en Excel: ${filas.length}`);

  const productos = [];
  let saltados = 0;

  for (const fila of filas) {
    // Solo productos activos
    if (!fila['ACTIVO']) {
      saltados++;
      continue;
    }

    // Validar campos obligatorios
    const codigo = fila['Code'];
    const nombre = limpiar(fila['Product Name']);
    const precioAjustado = fila['Precio Ajustado (Múltiplo de 5)'];

    if (!codigo || !nombre || !precioAjustado) {
      console.warn(`   ⚠️  Fila incompleta, saltada: código=${codigo} nombre=${nombre}`);
      saltados++;
      continue;
    }

    const { unidad, cantidad, cantidad_minima } = resolverUnidad(
      fila['KG'],
      fila['LT'],
      fila['Min/Multiple']
    );

    const producto = {
      codigo:             String(Math.round(codigo)),
      nombre:             nombre,
      descripcion:        limpiar(fila['Description']),
      categoria:          limpiar(fila['Category']),
      marca:              limpiar(fila['Marca']) || 'SIKA',
      unidad:             unidad,
      cantidad:           cantidad,
      cantidad_minima:    cantidad_minima,
      precio_venta:       redondear(precioAjustado),           // Precio Ajustado (columna O) — con IVA, redondeado
      precio_lista:       redondear(fila['List Price'] || 0),  // Sin IVA
      iva:                redondear(fila['IVA'] || 0),
      costo_neto:         redondear(fila['COSTO'] || 0),
      descuento_maximo:   fila['DESCUENTO'] || 0,              // 0.3 = 30%
      unidades_pallet:    fila['Units per Pallet'] || null,
      moneda:             fila['Currency'] || 'MXN',
      fecha_precio:       fila['Fecha Lista Precio']
                            ? new Date(fila['Fecha Lista Precio']).toISOString().split('T')[0]
                            : null,
      version:            limpiar(fila['Version']) || null,
      activo:             true,
    };

    productos.push(producto);
  }

  console.log(`   ✅ Productos activos procesados: ${productos.length}`);
  console.log(`   ⏭️  Saltados (inactivos/incompletos): ${saltados}`);
  return productos;
}

// ─── GENERAR catalogo.json ────────────────────────────────────────────────────

function generarCatalogoJSON(productos) {
  // Índice por código para búsqueda rápida del bot
  const indice = {};
  for (const p of productos) {
    indice[p.codigo] = p;
  }

  // Agrupado por categoría para navegación
  const porCategoria = {};
  for (const p of productos) {
    if (!porCategoria[p.categoria]) porCategoria[p.categoria] = [];
    porCategoria[p.categoria].push(p);
  }

  const catalogo = {
    meta: {
      total_productos: productos.length,
      categorias:      Object.keys(porCategoria).length,
      marcas:          [...new Set(productos.map(p => p.marca))],
      moneda:          'MXN',
      generado:        new Date().toISOString(),
      version:         productos[0]?.version || 'V2',
    },
    productos,        // Array plano — para búsqueda por IA
    por_categoria:    porCategoria,   // Agrupado — para navegación
    indice,           // Mapa código→producto — para lookup rápido
  };

  fs.writeFileSync(CATALOGO_PATH, JSON.stringify(catalogo, null, 2), 'utf8');
  const kb = (fs.statSync(CATALOGO_PATH).size / 1024).toFixed(1);
  console.log(`\n📄 catalogo.json generado: ${CATALOGO_PATH} (${kb} KB)`);
}

// ─── SUPABASE INSERT ──────────────────────────────────────────────────────────

async function insertarEnSupabase(productos) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn('\n⚠️  DATABASE_URL no definido en .env — saltando inserción en Supabase.');
    return;
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  console.log('\n🗄️  Conectado a Supabase...');

  try {
    // Crear tabla si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS catalogo_productos (
        codigo              VARCHAR(20)     PRIMARY KEY,
        nombre              TEXT            NOT NULL,
        descripcion         TEXT,
        categoria           TEXT,
        marca               TEXT,
        unidad              VARCHAR(10),
        cantidad            NUMERIC(10,3),
        cantidad_minima     NUMERIC(10,3),
        precio_venta        NUMERIC(12,2)   NOT NULL,
        precio_lista        NUMERIC(12,2),
        iva                 NUMERIC(12,2),
        costo_neto          NUMERIC(12,2),
        descuento_maximo    NUMERIC(5,2),
        unidades_pallet     INTEGER,
        moneda              VARCHAR(5)      DEFAULT 'MXN',
        fecha_precio        DATE,
        version             VARCHAR(10),
        activo              BOOLEAN         DEFAULT true,
        creado_en           TIMESTAMPTZ     DEFAULT NOW(),
        actualizado_en      TIMESTAMPTZ     DEFAULT NOW()
      );
    `);
    console.log('   ✅ Tabla catalogo_productos lista');

    // Upsert por lotes de 50
    const BATCH = 50;
    let insertados = 0;
    let actualizados = 0;

    for (let i = 0; i < productos.length; i += BATCH) {
      const lote = productos.slice(i, i + BATCH);

      for (const p of lote) {
        const res = await client.query(`
          INSERT INTO catalogo_productos (
            codigo, nombre, descripcion, categoria, marca,
            unidad, cantidad, cantidad_minima,
            precio_venta, precio_lista, iva, costo_neto, descuento_maximo,
            unidades_pallet, moneda, fecha_precio, version, activo,
            actualizado_en
          ) VALUES (
            $1,$2,$3,$4,$5,
            $6,$7,$8,
            $9,$10,$11,$12,$13,
            $14,$15,$16,$17,$18,
            NOW()
          )
          -- IMPORTANTE: NO incluir campos comerciales aquí (destacado, en_oferta,
          -- precio_oferta, oferta_hasta, mas_vendido, orden_display).
          -- Esos campos se gestionan manualmente desde el dashboard admin.
          ON CONFLICT (codigo) DO UPDATE SET
            nombre           = EXCLUDED.nombre,
            descripcion      = EXCLUDED.descripcion,
            categoria        = EXCLUDED.categoria,
            marca            = EXCLUDED.marca,
            unidad           = EXCLUDED.unidad,
            cantidad         = EXCLUDED.cantidad,
            cantidad_minima  = EXCLUDED.cantidad_minima,
            precio_venta     = EXCLUDED.precio_venta,
            precio_lista     = EXCLUDED.precio_lista,
            iva              = EXCLUDED.iva,
            costo_neto       = EXCLUDED.costo_neto,
            descuento_maximo = EXCLUDED.descuento_maximo,
            unidades_pallet  = EXCLUDED.unidades_pallet,
            moneda           = EXCLUDED.moneda,
            fecha_precio     = EXCLUDED.fecha_precio,
            version          = EXCLUDED.version,
            activo           = EXCLUDED.activo,
            actualizado_en   = NOW()
          RETURNING (xmax = 0) AS fue_insert
        `, [
          p.codigo, p.nombre, p.descripcion, p.categoria, p.marca,
          p.unidad, p.cantidad, p.cantidad_minima,
          p.precio_venta, p.precio_lista, p.iva, p.costo_neto, p.descuento_maximo,
          p.unidades_pallet, p.moneda, p.fecha_precio, p.version, p.activo,
        ]);

        if (res.rows[0]?.fue_insert) insertados++;
        else actualizados++;
      }

      const pct = Math.round(((i + lote.length) / productos.length) * 100);
      process.stdout.write(`\r   Progreso: ${pct}% (${i + lote.length}/${productos.length})`);
    }

    console.log(`\n   ✅ Insertados nuevos: ${insertados}`);
    console.log(`   🔄 Actualizados: ${actualizados}`);

    // Verificación final
    const count = await client.query('SELECT COUNT(*) FROM catalogo_productos WHERE activo = true');
    console.log(`   📊 Total activos en DB: ${count.rows[0].count}`);

  } finally {
    client.release();
    await pool.end();
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  MaterialesPro GDL — Importador de Catálogo');
  console.log('═══════════════════════════════════════════════════');

  try {
    // 1. Leer Excel
    const productos = leerExcel();

    if (productos.length === 0) {
      throw new Error('No se encontraron productos activos en el Excel.');
    }

    // 2. Generar catalogo.json
    generarCatalogoJSON(productos);

    // 3. Insertar en Supabase
    await insertarEnSupabase(productos);

    console.log('\n🎉 Importación completada exitosamente.');
    console.log('═══════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('\n❌ Error durante la importación:');
    console.error(err.message);
    process.exit(1);
  }
}

main();
