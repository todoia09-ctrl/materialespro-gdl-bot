// check_inv_ids.js
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    // IDs en inventario para PERDURA
    const inv = await client.query(`
      SELECT producto_id, nombre, stock FROM inventario 
      WHERE nombre ILIKE '%perdura%' OR producto_id ILIKE '%PER%'
      ORDER BY nombre LIMIT 10
    `);
    console.log('\n=== inventario (PERDURA) ===');
    inv.rows.forEach(r => console.log(`  ${r.producto_id} | ${r.nombre} | stock:${r.stock}`));

    // IDs en catalogo_productos para PERDURA
    const cat = await client.query(`
      SELECT codigo, nombre FROM catalogo_productos 
      WHERE marca ILIKE '%perdura%' 
      ORDER BY nombre LIMIT 10
    `);
    console.log('\n=== catalogo_productos (PERDURA) ===');
    cat.rows.forEach(r => console.log(`  ${r.codigo} | ${r.nombre}`));

  } finally {
    client.release();
    await pool.end();
  }
}
run().catch(console.error);
