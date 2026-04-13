/**
 * fix_catalogo_patch_stock_v1.js
 * MaterialesPro GDL — Fix: PATCH catalogo actualiza "stock" en vez de "stock_physical"
 *
 * EJECUTAR:
 *   node C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\fix_catalogo_patch_stock_v1.js
 */

const fs   = require('fs');
const path = require('path');
const FILE = path.join(__dirname, 'dashboard', 'api.js');

let src = fs.readFileSync(FILE, 'utf8');
fs.writeFileSync(FILE + '.bak_catalogo_patch_v1', src);
console.log('[BACKUP]', FILE + '.bak_catalogo_patch_v1');

const OLD = `      invUpdates.push("stock = $" + invParams.length);`;
const NEW = `      invUpdates.push("stock_physical = $" + invParams.length);`;

if (src.includes(OLD)) {
  fs.writeFileSync(FILE, src.replace(OLD, NEW), 'utf8');
  console.log('[OK LF] stock → stock_physical corregido');
} else {
  const OLD2 = OLD.replace(/\n/g, '\r\n');
  const NEW2 = NEW.replace(/\n/g, '\r\n');
  src = fs.readFileSync(FILE, 'utf8');
  if (src.includes(OLD2)) {
    fs.writeFileSync(FILE, src.replace(OLD2, NEW2), 'utf8');
    console.log('[OK CRLF] stock → stock_physical corregido');
  } else {
    console.error('[ERROR] Patron no encontrado');
    process.exit(1);
  }
}
console.log('[DONE]\n');
