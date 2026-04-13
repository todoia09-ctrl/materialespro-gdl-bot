// verify_modules_fase0.js — Verificacion completa de modulos post-FASE 0
require('dotenv').config();
try {
  require('./meta');
  require('./pedido');
  require('./crm');
  require('./cotizacion');
  require('./tecnico');
  require('./db');
  require('./inventario');
  require('./scheduler');
  console.log('ALL OK');
} catch (e) {
  console.error('FALLO:', e.message);
  console.error(e.stack);
  process.exit(1);
}
