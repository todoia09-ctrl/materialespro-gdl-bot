#!/usr/bin/env node
// diag_schema_v1.js — muestra columnas reales de tablas criticas
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const TABLAS = ['pedidos', 'campaign_sessions', 'clientes', 'usuarios', 'cotizaciones'];

async function main() {
  for (const tabla of TABLAS) {
    const r = await pool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_schema='public' AND table_name=$1 
       ORDER BY ordinal_position`,
      [tabla]
    );
    console.log(`\n=== ${tabla.toUpperCase()} ===`);
    r.rows.forEach(c => console.log(`  ${c.column_name}  (${c.data_type})`));
  }
  await pool.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
