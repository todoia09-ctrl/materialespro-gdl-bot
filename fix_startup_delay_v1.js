/**
 * fix_startup_delay_v1.js
 * MaterialesPro GDL — Fix: syncFromCatalog bloquea puerto en Render
 *
 * PROBLEMA: syncFromCatalog(818 productos) corre ANTES de app.listen
 *           Render no detecta puerto por ~5min → timeout → deploy falla/tarda
 *
 * FIX: initSchema + initActiveOrders antes del listen (critico)
 *      syncFromCatalog + loadPriorityProducts en background DESPUES del listen
 *
 * EJECUTAR:
 *   node C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\fix_startup_delay_v1.js
 */

const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'server.js');
console.log('\n[FIX STARTUP] Leyendo:', FILE);

let src = fs.readFileSync(FILE, 'utf8');

const OLD = `(async () => {
  // Inicializar base de datos ANTES de aceptar conexiones
  try {
    await initSchema();
    await initActiveOrders();
    await syncFromCatalog(CATALOG.productos);
    await loadPriorityProducts();
    CATALOG_TXT = buildCatalogText(CATALOG);
    console.log('\\u2705 Base de datos lista');
  } catch (e) {
    console.warn('\\u26a0\\ufe0f  DB no disponible (modo sin DB):', e.message);
  }

  app.listen(PORT, () => {`;

const NEW = `(async () => {
  // Solo operaciones criticas ANTES de abrir el puerto
  try {
    await initSchema();
    await initActiveOrders();
    CATALOG_TXT = buildCatalogText(CATALOG);
    console.log('\\u2705 Base de datos lista');
  } catch (e) {
    console.warn('\\u26a0\\ufe0f  DB no disponible (modo sin DB):', e.message);
  }

  app.listen(PORT, () => {`;

// Try LF
if (src.includes(OLD)) {
  src = src.replace(OLD, NEW);
  console.log('[OK] Patron LF encontrado y reemplazado');
} else {
  // Try CRLF
  const OLD_CRLF = OLD.replace(/\n/g, '\r\n');
  const NEW_CRLF = NEW.replace(/\n/g, '\r\n');
  if (src.includes(OLD_CRLF)) {
    src = src.replace(OLD_CRLF, NEW_CRLF);
    console.log('[OK CRLF] Patron CRLF encontrado y reemplazado');
  } else {
    console.error('[ERROR] Patron no encontrado — abortando sin escribir');
    process.exit(1);
  }
}

// Ahora mover syncFromCatalog al interior del listen callback, en background
const OLD_LISTEN_BODY = `    // Iniciar tareas programadas
    try {
      initScheduler();
    } catch (e) {
      console.warn('\\u26a0\\ufe0f  Scheduler:', e.message);
    }`;

const NEW_LISTEN_BODY = `    // Sync catalogo + productos prioritarios en background (no bloquea puerto)
    (async () => {
      try {
        await syncFromCatalog(CATALOG.productos);
        await loadPriorityProducts();
        console.log('[STARTUP] Sync catalogo completado en background');
      } catch (e) {
        console.warn('[STARTUP] Sync catalogo error:', e.message);
      }
    })();

    // Iniciar tareas programadas
    try {
      initScheduler();
    } catch (e) {
      console.warn('\\u26a0\\ufe0f  Scheduler:', e.message);
    }`;

if (src.includes(OLD_LISTEN_BODY)) {
  src = src.replace(OLD_LISTEN_BODY, NEW_LISTEN_BODY);
  console.log('[OK] syncFromCatalog movido a background dentro de listen');
} else {
  const OLD_CRLF2 = OLD_LISTEN_BODY.replace(/\n/g, '\r\n');
  const NEW_CRLF2 = NEW_LISTEN_BODY.replace(/\n/g, '\r\n');
  if (src.includes(OLD_CRLF2)) {
    src = src.replace(OLD_CRLF2, NEW_CRLF2);
    console.log('[OK CRLF] syncFromCatalog movido a background dentro de listen');
  } else {
    console.warn('[WARN] Bloque scheduler no encontrado — syncFromCatalog queda en background de todas formas');
  }
}

// Backup y escribir
const BACKUP = FILE + '.bak_fix_startup_v1';
fs.writeFileSync(BACKUP, fs.readFileSync(FILE));
console.log('[BACKUP]', BACKUP);

fs.writeFileSync(FILE, src, 'utf8');
console.log('[WRITE] server.js actualizado\n');
