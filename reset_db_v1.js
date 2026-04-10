/**
 * reset_db_v1.js
 * MaterialesPro GDL — Reset completo DB + catalogo.json
 *
 * ✅ Borra datos de: catalogo_productos, inventario, pedidos,
 *    cotizaciones, clientes, mensajes, seguimientos,
 *    active_orders, campaign_sessions, campanas
 *
 * 🔒 CONSERVA: usuarios (acceso dashboard)
 * 🔒 CONSERVA: estructura catalogo.json (negocio, tarifas_envio, envios)
 *
 * Uso: node reset_db_v1.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

const CATALOG_PATH = path.join(__dirname, 'catalogo.json');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function reset() {
  const client = await pool.connect();

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('  MaterialesPro GDL — RESET COMPLETO');
  console.log('  ⚠️  ESTO BORRARÁ TODOS LOS DATOS OPERATIVOS');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // Verificar usuarios antes de proceder
  const usersCheck = await client.query('SELECT COUNT(*) as n FROM usuarios');
  console.log(`🔒 Usuarios protegidos: ${usersCheck.rows[0].n} (NO se borran)`);

  if (parseInt(usersCheck.rows[0].n) === 0) {
    console.error('❌ ERROR: No hay usuarios en DB — abortando para evitar pérdida de acceso');
    process.exit(1);
  }

  try {
    // ── PASO 1: Borrar en orden correcto (respetar foreign keys) ─────────────
    console.log('\n🗑️  Limpiando tablas...\n');

    const tablas = [
      { nombre: 'active_orders',     sql: 'DELETE FROM active_orders'     },
      { nombre: 'campaign_sessions', sql: 'DELETE FROM campaign_sessions' },
      { nombre: 'seguimientos',      sql: 'DELETE FROM seguimientos'      },
      { nombre: 'mensajes',          sql: 'DELETE FROM mensajes'          },
      { nombre: 'campanas',          sql: 'DELETE FROM campanas'          },
      { nombre: 'cotizaciones',      sql: 'DELETE FROM cotizaciones'      },
      { nombre: 'pedidos',           sql: 'DELETE FROM pedidos'           },
      { nombre: 'clientes',          sql: 'DELETE FROM clientes'          },
      { nombre: 'inventario',        sql: 'DELETE FROM inventario'        },
      { nombre: 'catalogo_productos',sql: 'DELETE FROM catalogo_productos'},
    ];

    for (const t of tablas) {
      const r = await client.query(t.sql + ' RETURNING *');
      console.log(`   ✅ ${t.nombre.padEnd(22)} — ${r.rowCount} registros eliminados`);
    }

    // ── PASO 2: Reset sequences (IDs desde 1) ────────────────────────────────
    console.log('\n🔄 Reseteando sequences...\n');

    const sequences = [
      'ALTER SEQUENCE IF EXISTS pedidos_id_seq RESTART WITH 1',
      'ALTER SEQUENCE IF EXISTS cotizaciones_id_seq RESTART WITH 1',
      'ALTER SEQUENCE IF EXISTS clientes_id_seq RESTART WITH 1',
      'ALTER SEQUENCE IF EXISTS mensajes_id_seq RESTART WITH 1',
      'ALTER SEQUENCE IF EXISTS seguimientos_id_seq RESTART WITH 1',
      'ALTER SEQUENCE IF EXISTS campanas_id_seq RESTART WITH 1',
      'ALTER SEQUENCE IF EXISTS inventario_id_seq RESTART WITH 1',
      'ALTER SEQUENCE IF EXISTS active_orders_id_seq RESTART WITH 1',
    ];

    for (const s of sequences) {
      await client.query(s);
      const name = s.match(/SEQUENCE IF EXISTS (\S+)/)[1];
      console.log(`   ✅ ${name}`);
    }

    // ── PASO 3: Verificar usuarios intactos ──────────────────────────────────
    const users = await client.query('SELECT id, nombre, email, rol FROM usuarios ORDER BY id');
    console.log('\n🔒 Usuarios conservados:');
    users.rows.forEach(u => {
      console.log(`   [${u.id}] ${u.email.padEnd(30)} rol: ${u.rol}`);
    });

    // ── PASO 4: Reset catalogo.json → conservar estructura, vaciar productos ─
    console.log('\n📄 Reseteando catalogo.json...');

    const cat = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

    // Backup
    const backupPath = CATALOG_PATH + '.reset_backup_' + Date.now();
    fs.writeFileSync(backupPath, JSON.stringify(cat, null, 2), 'utf8');
    console.log(`   💾 Backup guardado: ${path.basename(backupPath)}`);

    // Conservar negocio, tarifas_envio, envios — vaciar productos
    const catReset = {
      negocio:        cat.negocio        || {},
      tarifas_envio:  cat.tarifas_envio  || {},
      envios:         cat.envios         || {},
      meta: {
        total_productos: 0,
        categorias: 0,
        marcas: [],
        moneda: 'MXN',
        generado: new Date().toISOString(),
        version: 'RESET',
      },
      productos:      [],
      por_categoria:  {},
      indice:         {},
    };

    fs.writeFileSync(CATALOG_PATH, JSON.stringify(catReset, null, 2), 'utf8');
    console.log('   ✅ catalogo.json reseteado — productos: []');
    console.log('   ✅ negocio + tarifas_envio + envios conservados');

    // ── PASO 5: Verificación final ───────────────────────────────────────────
    console.log('\n📊 Verificación final:\n');

    const checks = [
      'SELECT COUNT(*) as n FROM catalogo_productos',
      'SELECT COUNT(*) as n FROM inventario',
      'SELECT COUNT(*) as n FROM pedidos',
      'SELECT COUNT(*) as n FROM clientes',
      'SELECT COUNT(*) as n FROM cotizaciones',
      'SELECT COUNT(*) as n FROM usuarios',
    ];

    const nombres = ['catalogo_productos','inventario','pedidos','clientes','cotizaciones','usuarios (protegidos)'];

    for (let i = 0; i < checks.length; i++) {
      const r = await client.query(checks[i]);
      const n = r.rows[0].n;
      const icon = i === 5 ? '🔒' : (n === '0' ? '✅' : '⚠️ ');
      console.log(`   ${icon} ${nombres[i].padEnd(25)} ${n} registros`);
    }

    console.log('\n🎉 Reset completado exitosamente.');
    console.log('\n📋 SIGUIENTE PASO:');
    console.log('   1. Dashboard → Catálogo → ⬇️ Descargar Plantilla Excel');
    console.log('   2. Llenar con datos SIKA + PEGADURO');
    console.log('   3. Dashboard → Catálogo → Importar Excel');
    console.log('   4. Verificar resultados\n');

  } catch (err) {
    console.error('\n❌ ERROR durante reset:', err.message);
    console.error('   Verifica el estado de la DB manualmente');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

reset();
