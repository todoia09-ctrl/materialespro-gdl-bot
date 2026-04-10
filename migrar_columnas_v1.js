/**
 * migrar_columnas_v1.js
 * MaterialesPro GDL — Migración DB
 *
 * Agrega columnas faltantes a catalogo_productos:
 *   - precio_2, precio_3, precio_4  → niveles de precio por cliente
 *   - rendimiento_m2_por_unidad     → dato técnico
 *   - rendimiento_nota              → texto técnico
 *
 * NOTA: costo_neto YA EXISTE en DB — no se toca.
 *
 * Uso:
 *   node migrar_columnas_v1.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrar() {
  const client = await pool.connect();
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('  MaterialesPro GDL — Migración columnas DB');
  console.log('╚══════════════════════════════════════════════╝\n');

  const migraciones = [
    {
      nombre: 'precio_2 (Nivel 2 — Frecuente)',
      sql: `ALTER TABLE catalogo_productos ADD COLUMN IF NOT EXISTS precio_2 NUMERIC(12,2)`
    },
    {
      nombre: 'precio_3 (Nivel 3 — Distribuidor)',
      sql: `ALTER TABLE catalogo_productos ADD COLUMN IF NOT EXISTS precio_3 NUMERIC(12,2)`
    },
    {
      nombre: 'precio_4 (Nivel 4 — VIP)',
      sql: `ALTER TABLE catalogo_productos ADD COLUMN IF NOT EXISTS precio_4 NUMERIC(12,2)`
    },
    {
      nombre: 'rendimiento_m2_por_unidad',
      sql: `ALTER TABLE catalogo_productos ADD COLUMN IF NOT EXISTS rendimiento_m2_por_unidad NUMERIC(10,3)`
    },
    {
      nombre: 'rendimiento_nota',
      sql: `ALTER TABLE catalogo_productos ADD COLUMN IF NOT EXISTS rendimiento_nota TEXT`
    },
  ];

  try {
    for (const m of migraciones) {
      await client.query(m.sql);
      console.log(`  ✅ ${m.nombre}`);
    }

    // Verificar columnas finales
    const check = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'catalogo_productos'
      ORDER BY ordinal_position
    `);

    console.log('\n📊 Columnas actuales en catalogo_productos:');
    check.rows.forEach(r => {
      console.log(`   ${r.column_name.padEnd(32)} ${r.data_type}`);
    });

    // Verificar totales
    const total = await client.query(`SELECT COUNT(*) as n FROM catalogo_productos`);
    console.log(`\n📦 Total productos en DB: ${total.rows[0].n}`);

    const sika = await client.query(`SELECT COUNT(*) as n FROM catalogo_productos WHERE marca = 'SIKA' OR marca = 'Sika'`);
    console.log(`   SIKA:     ${sika.rows[0].n}`);

    const peg = await client.query(`SELECT COUNT(*) as n FROM catalogo_productos WHERE codigo LIKE 'PROD-%'`);
    console.log(`   PEGADURO: ${peg.rows[0].n}`);

    console.log('\n🎉 Migración completada exitosamente.');

  } catch (err) {
    console.error('\n❌ Error en migración:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrar();
