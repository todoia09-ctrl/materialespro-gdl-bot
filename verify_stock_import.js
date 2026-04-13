// verify_stock_import.js
// Verifica que el import de stock actualizó correctamente inventario en DB

require('dotenv').config();
const { query } = require('./db');

async function verify() {
  console.log('🔍 Verificando stock en DB...\n');

  // 1. Conteo total y productos con stock=50
  const r1 = await query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE stock = 50) as con_stock_50,
      COUNT(*) FILTER (WHERE stock = 0) as con_stock_0,
      COUNT(*) FILTER (WHERE stock IS NULL) as stock_null,
      MIN(stock) as min_stock,
      MAX(stock) as max_stock,
      AVG(stock)::numeric(10,2) as avg_stock
    FROM inventario
  `);
  const stats = r1.rows[0];
  console.log('📊 ESTADÍSTICAS INVENTARIO:');
  console.log(`   Total productos:    ${stats.total}`);
  console.log(`   Stock = 50:         ${stats.con_stock_50}`);
  console.log(`   Stock = 0:          ${stats.con_stock_0}`);
  console.log(`   Stock NULL:         ${stats.stock_null}`);
  console.log(`   Min stock:          ${stats.min_stock}`);
  console.log(`   Max stock:          ${stats.max_stock}`);
  console.log(`   Promedio stock:     ${stats.avg_stock}`);

  // 2. Verificar por marca
  const r2 = await query(`
    SELECT 
      i.marca,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE i.stock = 50) as con_50,
      COUNT(*) FILTER (WHERE i.stock = 0) as con_0
    FROM inventario i
    GROUP BY i.marca
    ORDER BY i.marca
  `);
  console.log('\n📦 POR MARCA:');
  r2.rows.forEach(row => {
    const ok = row.con_50 == row.total ? '✅' : '⚠️';
    console.log(`   ${ok} ${row.marca}: ${row.con_50}/${row.total} con stock=50 (${row.con_0} en 0)`);
  });

  // 3. Muestra 3 productos random para confirmar datos
  const r3 = await query(`
    SELECT codigo, nombre, stock, stock_minimo, marca
    FROM inventario
    ORDER BY RANDOM()
    LIMIT 3
  `);
  console.log('\n🎲 MUESTRA ALEATORIA (3 productos):');
  r3.rows.forEach(p => {
    console.log(`   ${p.codigo} | ${p.nombre.substring(0,30)} | stock:${p.stock} | min:${p.stock_minimo} | ${p.marca}`);
  });

  // 4. Verificar stock_minimo
  const r4 = await query(`
    SELECT COUNT(*) FILTER (WHERE stock_minimo = 10) as con_min_10 FROM inventario
  `);
  console.log(`\n✅ stock_minimo = 10: ${r4.rows[0].con_min_10} productos`);

  // 5. Verificar que catalogo_productos tiene los mismos productos
  const r5 = await query(`
    SELECT COUNT(*) as total FROM catalogo_productos WHERE activo = true
  `);
  console.log(`✅ catalogo_productos activos: ${r5.rows[0].total}`);

  console.log('\n' + (stats.con_stock_50 == stats.total ? '✅ IMPORT EXITOSO — todos los productos tienen stock=50' : '⚠️  IMPORT PARCIAL — algunos productos no actualizados'));

  process.exit(0);
}

verify().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
