require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const hash = await bcrypt.hash('Admin2024!', 10);
  await pool.query(
    "INSERT INTO usuarios (nombre,email,password_hash,rol,activo) VALUES ($1,$2,$3,$4,TRUE) ON CONFLICT (email) DO UPDATE SET password_hash=$3, activo=TRUE",
    ['Administrador', 'admin@materialespro.com', hash, 'admin']
  );
  console.log('✅ Usuario admin creado: admin@materialespro.com / Admin2024!');
  process.exit(0);
}

run().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
