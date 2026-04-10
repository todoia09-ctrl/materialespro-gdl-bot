// check_duplicados.js — MaterialesPro GDL
// Verifica duplicados en catalogo_productos en Supabase
// Ejecutar desde: C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl
// Comando: node check_duplicados.js

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkDuplicados() {
  const client = await pool.connect();
  try {
    console.log('\n=== VERIFICACIÓN DUPLICADOS — catalogo_productos ===\n');

    // Query 1: Duplicados exactos por código
    const q1 = await client.query(`
      SELECT codigo, nombre, COUNT(*) as total
      FROM catalogo_productos
      GROUP BY codigo, nombre
      HAVING COUNT(*) > 1
      ORDER BY total DESC
    `);
    console.log(`--- [1] Duplicados por CÓDIGO+NOMBRE: ${q1.rowCount} ---`);
    if (q1.rowCount === 0) {
      console.log('  ✅ Ninguno — códigos únicos');
    } else {
      q1.rows.forEach(r => console.log(`  ⚠️  ${r.codigo} | ${r.nombre} | count: ${r.total}`));
    }

    // Query 2: Mismo nombre, distintos códigos (variantes presentación)
    const q2 = await client.query(`
      SELECT nombre,
             COUNT(*) as variantes,
             array_agg(codigo ORDER BY codigo) as codigos,
             array_agg(presentacion ORDER BY codigo) as presentaciones
      FROM catalogo_productos
      GROUP BY nombre
      HAVING COUNT(*) > 1
      ORDER BY variantes DESC
    `);
    console.log(`\n--- [2] Mismo NOMBRE, distintos códigos (variantes): ${q2.rowCount} ---`);
    if (q2.rowCount === 0) {
      console.log('  ✅ Ninguno');
    } else {
      q2.rows.forEach(r => {
        console.log(`  "${r.nombre}"`);
        console.log(`     Variantes: ${r.variantes}`);
        console.log(`     Códigos:   ${r.codigos.join(' · ')}`);
        console.log(`     Present.:  ${r.presentaciones.join(' · ')}`);
      });
    }

    // Query 3: Total de productos y resumen por marca
    const q3 = await client.query(`
      SELECT marca, COUNT(*) as total
      FROM catalogo_productos
      GROUP BY marca
      ORDER BY total DESC
    `);
    console.log(`\n--- [3] Resumen por MARCA ---`);
    let grandTotal = 0;
    q3.rows.forEach(r => {
      console.log(`  ${(r.marca || 'SIN_MARCA').padEnd(15)} ${r.total} productos`);
      grandTotal += parseInt(r.total);
    });
    console.log(`  ${'─'.repeat(30)}`);
    console.log(`  TOTAL:          ${grandTotal} productos\n`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDuplicados();
