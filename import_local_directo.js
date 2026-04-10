// import_local_directo.js — MaterialesPro GDL
// Importa catalogo_MASTER directamente a Supabase desde local
// Bypass completo de Render (sin timeout)
// Comando: node import_local_directo.js
//
// ANTES: copiar el Excel como TEMPLATE_IA.xlsx en la raíz del proyecto
// O editar EXCEL_PATH abajo con la ruta completa al archivo

require('dotenv').config();
const XLSX = require('xlsx');
const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

// ── Ruta al Excel ─────────────────────────────────────────────────────────────
const EXCEL_PATH   = path.join(__dirname, 'TEMPLATE_IA.xlsx');
const CATALOG_PATH = path.join(__dirname, 'catalogo.json');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Helpers ───────────────────────────────────────────────────────────────────
function getVal(r, ...keys) {
  for (const k of keys) {
    if (r[k] !== undefined && r[k] !== '') return r[k];
  }
  return '';
}

function parsePrecio(v) {
  if (!v && v !== 0) return 0;
  return parseFloat(String(v).replace(/[^0-9.]/g, '')) || 0;
}

function parseActivo(v) {
  if (v === true || v === 1) return true;
  const s = String(v).toLowerCase().trim();
  return s === 'verdadero' || s === 'true' || s === '1';
}

function limpiar(v) {
  return String(v || '').trim() || null;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n════════════════════════════════════════════════');
  console.log('  MaterialesPro — Import Local Directo a Supabase');
  console.log('════════════════════════════════════════════════\n');

  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`❌ No se encontró: ${EXCEL_PATH}`);
    console.error('   Copia el Excel MASTER como TEMPLATE_IA.xlsx en la raíz del proyecto');
    process.exit(1);
  }

  // 1. Leer Excel
  console.log(`📂 Leyendo: ${EXCEL_PATH}`);
  const wb    = XLSX.readFile(EXCEL_PATH);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows  = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  console.log(`   Filas en Excel: ${rows.length}`);

  // 2. Parsear productos
  const productos = rows.map((r, i) => {
    const nombre = String(getVal(r, 'Artículo', 'nombre') || '').trim();
    if (!nombre) return null;
    if (nombre.startsWith('→') || nombre.startsWith('VERDE')) return null;

    return {
      id:                        String(getVal(r, 'Código CRM', 'id') || '').trim() || `PROD-${String(i+1).padStart(3,'0')}`,
      nombre,
      descripcion:               limpiar(getVal(r, 'descripcion')),
      categoria:                 limpiar(getVal(r, 'Categoría', 'categoria')) || 'General',
      marca:                     limpiar(getVal(r, 'Marca', 'marca')),
      presentacion:              limpiar(getVal(r, 'Presentación', 'presentacion')),
      unidad:                    limpiar(getVal(r, 'Unidad medida', 'unidad')) || 'pza',
      cantidad:                  parseFloat(getVal(r, 'Contenido', 'cantidad') || 0) || null,
      cantidad_minima:           parseFloat(getVal(r, 'Cantidad mínima', 'cantidad_minima') || 0) || null,
      precio_venta:              parsePrecio(getVal(r, 'Precio 1 NETO', 'precio_venta', 'precio')) || null,
      precio_lista:              parsePrecio(getVal(r, 'Precio lista', 'precio_lista')) || null,
      precio_2:                  parsePrecio(getVal(r, 'Precio 2 NETO', 'precio_2')) || null,
      precio_3:                  parsePrecio(getVal(r, 'Precio 3 NETO', 'precio_3')) || null,
      precio_4:                  parsePrecio(getVal(r, 'Precio 4 NETO', 'precio_4')) || null,
      iva:                       parsePrecio(getVal(r, 'IVA', 'iva')) || null,
      costo_neto:                parsePrecio(getVal(r, 'Costo NETO', 'costo_neto', 'costo')) || null,
      descuento_maximo:          parsePrecio(getVal(r, 'Descuento máximo', 'descuento_maximo')) || null,
      rendimiento_m2_por_unidad: parseFloat(getVal(r, 'rendimiento_m2_por_unidad') || 0) || null,
      rendimiento_nota:          limpiar(getVal(r, 'rendimiento_nota')),
      unidades_pallet:           parseInt(getVal(r, 'Unidades pallet', 'unidades_pallet') || 0) || null,
      moneda:                    limpiar(getVal(r, 'Moneda', 'moneda')) || 'MXN',
      fecha_precio:              getVal(r, 'Fecha precio', 'fecha_precio') || null,
      version:                   limpiar(getVal(r, 'Versión', 'version')),
      activo:                    parseActivo(getVal(r, 'Activo', 'activo')),
    };
  }).filter(Boolean);

  console.log(`   ✅ Productos válidos parseados: ${productos.length}`);

  // Resumen por marca
  const marcas = {};
  productos.forEach(p => { marcas[p.marca || 'SIN_MARCA'] = (marcas[p.marca || 'SIN_MARCA'] || 0) + 1; });
  console.log('\n   Por marca:');
  Object.entries(marcas).sort().forEach(([m, c]) => console.log(`     ${m}: ${c}`));

  if (!productos.length) {
    console.error('\n❌ Sin productos válidos. Verificar columnas del Excel.');
    process.exit(1);
  }

  // 3. UPSERT a DB en lotes de 50
  console.log('\n🔄 Iniciando UPSERT a Supabase...');
  const client = await pool.connect();
  let insertados = 0, actualizados = 0, errores = 0;
  const BATCH = 50;

  try {
    for (let i = 0; i < productos.length; i++) {
      const p = productos[i];
      try {
        const r = await client.query(`
          INSERT INTO catalogo_productos (
            codigo, nombre, descripcion, categoria, marca,
            presentacion, unidad, cantidad, cantidad_minima,
            precio_venta, precio_lista, precio_2, precio_3, precio_4,
            iva, costo_neto, descuento_maximo,
            rendimiento_m2_por_unidad, rendimiento_nota,
            unidades_pallet, moneda, fecha_precio, version,
            activo, actualizado_en
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,
            $10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
            $20,$21,$22,$23,$24,NOW()
          )
          ON CONFLICT (codigo) DO UPDATE SET
            nombre=$2, descripcion=$3, categoria=$4, marca=$5,
            presentacion=$6, unidad=$7, cantidad=$8, cantidad_minima=$9,
            precio_venta=$10, precio_lista=$11, precio_2=$12, precio_3=$13, precio_4=$14,
            iva=$15, costo_neto=$16, descuento_maximo=$17,
            rendimiento_m2_por_unidad=$18, rendimiento_nota=$19,
            unidades_pallet=$20, moneda=$21, fecha_precio=$22, version=$23,
            activo=$24, actualizado_en=NOW()
          RETURNING (xmax = 0) AS fue_insert
        `, [
          p.id, p.nombre, p.descripcion, p.categoria, p.marca,
          p.presentacion, p.unidad, p.cantidad, p.cantidad_minima,
          p.precio_venta, p.precio_lista, p.precio_2, p.precio_3, p.precio_4,
          p.iva, p.costo_neto, p.descuento_maximo,
          p.rendimiento_m2_por_unidad, p.rendimiento_nota,
          p.unidades_pallet, p.moneda, p.fecha_precio, p.version,
          p.activo
        ]);
        if (r.rows[0]?.fue_insert) insertados++; else actualizados++;
      } catch (err) {
        errores++;
        console.error(`  ⚠️  Error ${p.id}: ${err.message}`);
      }

      // Progreso cada 50
      if ((i + 1) % BATCH === 0 || i === productos.length - 1) {
        process.stdout.write(`\r   Procesados: ${i+1}/${productos.length} | +${insertados} nuevos | ~${actualizados} updates | ❌${errores} errores`);
      }
    }
    console.log('\n');

    // 4. Contar por marca en DB
    const countDB = await client.query(`
      SELECT marca, COUNT(*) as total FROM catalogo_productos GROUP BY marca ORDER BY total DESC
    `);
    console.log('📊 DB después del import:');
    let total = 0;
    countDB.rows.forEach(r => {
      console.log(`   ${(r.marca || 'SIN_MARCA').padEnd(15)} ${r.total}`);
      total += parseInt(r.total);
    });
    console.log(`   ${'─'.repeat(25)}`);
    console.log(`   TOTAL: ${total}\n`);

    // 5. Regenerar catalogo.json
    console.log('📄 Regenerando catalogo.json...');
    const allProds = await client.query(`
      SELECT codigo, nombre, descripcion, categoria, marca,
             presentacion, unidad, cantidad, cantidad_minima,
             precio_venta, precio_lista, precio_2, precio_3, precio_4,
             iva, costo_neto, descuento_maximo,
             rendimiento_m2_por_unidad, rendimiento_nota,
             unidades_pallet, moneda, fecha_precio, version,
             activo, destacado, en_oferta, precio_oferta, oferta_hasta,
             mas_vendido, orden_display
      FROM catalogo_productos WHERE activo = true
      ORDER BY categoria, marca, nombre
    `);

    const prods = allProds.rows.map(r => ({
      id: r.codigo, codigo: r.codigo, nombre: r.nombre,
      descripcion: r.descripcion || '', categoria: r.categoria || 'General',
      marca: r.marca || '', presentacion: r.presentacion || '',
      unidad: r.unidad || '', cantidad: r.cantidad,
      cantidad_minima: r.cantidad_minima || 1,
      precio: r.precio_venta || 0, precio_venta: r.precio_venta || 0,
      precio_lista: r.precio_lista || 0, precio_2: r.precio_2 || 0,
      precio_3: r.precio_3 || 0, precio_4: r.precio_4 || 0,
      iva: r.iva || 0, costo_neto: r.costo_neto || 0,
      descuento_maximo: r.descuento_maximo || 0,
      rendimiento_m2_por_unidad: r.rendimiento_m2_por_unidad,
      rendimiento_nota: r.rendimiento_nota || '',
      moneda: r.moneda || 'MXN', activo: r.activo,
      destacado: r.destacado || false, en_oferta: r.en_oferta || false,
      precio_oferta: r.precio_oferta, mas_vendido: r.mas_vendido || false,
      orden_display: r.orden_display || 0,
    }));

    const por_categoria = {};
    prods.forEach(p => {
      if (!por_categoria[p.categoria]) por_categoria[p.categoria] = [];
      por_categoria[p.categoria].push(p.codigo);
    });

    const catalogo = {
      meta: {
        total_productos: prods.length,
        categorias: Object.keys(por_categoria).length,
        marcas: [...new Set(prods.map(p => p.marca).filter(Boolean))].sort(),
        moneda: 'MXN',
        generado: new Date().toISOString(),
        version: 'V3-MASTER'
      },
      productos: prods,
      por_categoria,
      indice: Object.fromEntries(prods.map(p => [p.codigo, p]))
    };

    if (fs.existsSync(CATALOG_PATH)) {
      fs.copyFileSync(CATALOG_PATH, CATALOG_PATH + '.bak');
    }
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalogo, null, 2), 'utf8');
    const kb = Math.round(fs.statSync(CATALOG_PATH).size / 1024);
    console.log(`✅ catalogo.json regenerado: ${prods.length} productos (${kb} KB)\n`);

    console.log('═══════════════════════════════════════════════');
    console.log('  ✅ Import completo');
    console.log(`     Nuevos:      ${insertados}`);
    console.log(`     Actualizados: ${actualizados}`);
    console.log(`     Errores:      ${errores}`);
    console.log('═══════════════════════════════════════════════');
    console.log('\n📋 SIGUIENTE PASO — git push:');
    console.log('   git add catalogo.json');
    console.log('   git commit -m "fix: import MASTER 802 productos todas las marcas incl SIKA"');
    console.log('   git push origin master\n');

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('\n❌ Error fatal:', err.message);
  process.exit(1);
});
