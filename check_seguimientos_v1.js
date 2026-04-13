require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
p.query("SELECT column_name FROM information_schema.columns WHERE table_name='seguimientos' ORDER BY ordinal_position")
  .then(r => { console.log('SEGUIMIENTOS cols:', r.rows.map(x => x.column_name).join(', ')); p.end(); })
  .catch(e => { console.error(e.message); p.end(); });
