// fix_varchar_codigo.js — MaterialesPro GDL
// Amplía columna codigo de VARCHAR(10) a VARCHAR(50) en catalogo_productos
// Ejecutar ANTES de re-correr import_local_directo.js
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
  const client = await pool.connect();
  try {
    console.log('\n=== Fix VARCHAR codigo — catalogo_productos ===\n');

    // Ver tamaño actual
    const before = await client.query(`
      SELECT column_name, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'catalogo_productos'
        AND column_name IN ('codigo', 'unidad', 'moneda', 'version')
      ORDER BY column_name
    `);
    console.log('Antes:');
    before.rows.forEach(r => console.log(`  ${r.column_name}: VARCHAR(${r.character_maximum_length})`));

    // Ampliar columnas que podrían ser cortas
    await client.query(`ALTER TABLE catalogo_productos ALTER COLUMN codigo      TYPE VARCHAR(50)`);
    await client.query(`ALTER TABLE catalogo_productos ALTER COLUMN unidad      TYPE VARCHAR(50)`);
    await client.query(`ALTER TABLE catalogo_productos ALTER COLUMN moneda      TYPE VARCHAR(10)`);
    await client.query(`ALTER TABLE catalogo_productos ALTER COLUMN version     TYPE VARCHAR(50)`);
    await client.query(`ALTER TABLE catalogo_productos ALTER COLUMN presentacion TYPE VARCHAR(100)`);

    // Ver tamaño nuevo
    const after = await client.query(`
      SELECT column_name, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'catalogo_productos'
        AND column_name IN ('codigo', 'unidad', 'moneda', 'version', 'presentacion')
      ORDER BY column_name
    `);
    console.log('\nDespués:');
    after.rows.forEach(r => console.log(`  ${r.column_name}: VARCHAR(${r.character_maximum_length})`));

    console.log('\n✅ Migration completada — ahora corre: node import_local_directo.js\n');
  } finally {
    client.release();
    await pool.end();
  }
}

fix().catch(console.error);
