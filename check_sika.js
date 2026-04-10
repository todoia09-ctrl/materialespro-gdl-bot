// check_sika.js — MaterialesPro GDL
// Verifica cuántos productos SIKA hay en catalogo.json y en DB
require('dotenv').config();
const { Pool } = require('pg');
const catalogo = require('./catalogo.json');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkSika() {
  // 1. Verificar en catalogo.json
  const sikaJson = catalogo.filter(p => p.marca && p.marca.toUpperCase().includes('SIKA'));
  console.log('\n=== SIKA en catalogo.json ===');
  console.log(`Total: ${sikaJson.length} productos`);
  if (sikaJson.length > 0) {
    console.log('Primeros 3:', sikaJson.slice(0, 3).map(p => `${p.codigo} | ${p.nombre}`));
  }

  // 2. Verificar en DB
  const client = await pool.connect();
  try {
    const r = await client.query(`SELECT COUNT(*) FROM catalogo_productos WHERE marca ILIKE '%sika%'`);
    console.log('\n=== SIKA en DB (catalogo_productos) ===');
    console.log(`Total: ${r.rows[0].count} productos`);

    // 3. Total general DB vs JSON
    const total = await client.query(`SELECT COUNT(*) FROM catalogo_productos`);
    console.log('\n=== RESUMEN GENERAL ===');
    console.log(`catalogo.json : ${catalogo.length} productos`);
    console.log(`DB total      : ${total.rows[0].count} productos`);
    console.log(`Diferencia    : ${catalogo.length - parseInt(total.rows[0].count)}`);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSika().catch(console.error);
