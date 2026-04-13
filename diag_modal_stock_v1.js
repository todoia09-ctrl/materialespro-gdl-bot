/**
 * diag_modal_stock_v1.js
 * MaterialesPro GDL — Diagnostico: endpoint POST stock modal dashboard
 * 
 * EJECUTAR: node diag_modal_stock_v1.js
 * Esto prueba directamente el endpoint del modal sin pasar por el browser.
 * 
 * AJUSTA: BASE_URL y TOKEN si aplica
 */

const BASE_URL = 'https://materialespro-gdl-bot.onrender.com';

async function testModal() {
  console.log('\n[DIAG MODAL] Probando endpoint stock...\n');

  // Test 1: GET inventario (debe funcionar si dashboard funciona)
  const r1 = await fetch(`${BASE_URL}/api/inventario?limit=3`);
  console.log(`GET /api/inventario: ${r1.status} ${r1.statusText}`);
  if (r1.ok) {
    const d = await r1.json();
    console.log('  Sample keys:', d?.data?.[0] ? Object.keys(d.data[0]) : d);
  }

  console.log('');

  // Test 2: POST ajuste stock (simula lo que hace el modal)
  // Primero obtenemos un catalogo_id real
  const r2 = await fetch(`${BASE_URL}/api/inventario?limit=1`);
  const inv = await r2.json();
  const item = inv?.data?.[0];
  if (!item) { console.log('[ERROR] No hay items en inventario'); return; }

  console.log('Item de prueba:', JSON.stringify(item));
  console.log('');

  // Prueba payload v1: { catalogo_id, cantidad, tipo }
  const payload1 = {
    catalogo_id: item.catalogo_id || item.id,
    cantidad: 1,
    tipo: 'AJUSTE',
    nota: 'test diag_modal_stock_v1'
  };
  console.log('Test payload v1:', JSON.stringify(payload1));
  const r3 = await fetch(`${BASE_URL}/api/inventario/ajuste`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload1)
  });
  console.log(`POST /api/inventario/ajuste (v1): ${r3.status} ${r3.statusText}`);
  const body3 = await r3.text();
  console.log('  Response:', body3.substring(0, 300));

  console.log('');

  // Prueba payload v2: { producto_id, cantidad, tipo }
  const payload2 = {
    producto_id: item.catalogo_id || item.id,
    cantidad: 1,
    tipo: 'AJUSTE',
    nota: 'test diag_modal_stock_v1'
  };
  console.log('Test payload v2:', JSON.stringify(payload2));
  const r4 = await fetch(`${BASE_URL}/api/inventario/ajuste`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload2)
  });
  console.log(`POST /api/inventario/ajuste (v2): ${r4.status} ${r4.statusText}`);
  const body4 = await r4.text();
  console.log('  Response:', body4.substring(0, 300));

  // Prueba endpoint alternativo
  console.log('');
  const r5 = await fetch(`${BASE_URL}/api/stock/ajuste`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload1)
  });
  console.log(`POST /api/stock/ajuste: ${r5.status} ${r5.statusText}`);
  const body5 = await r5.text();
  console.log('  Response:', body5.substring(0, 200));
}

testModal().catch(console.error);
