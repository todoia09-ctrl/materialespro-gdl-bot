/**
 * fix_modal_patch_v2.js
 * MaterialesPro GDL — Fix: PATCH /inventario/:id recibe codigo string "PEG-0167"
 * parseInt("PEG-0167") = NaN → error bigint
 *
 * FIX: WHERE id=$2 → WHERE catalogo_id=(SELECT id FROM catalogo_productos WHERE codigo=$2)
 *
 * EJECUTAR:
 *   node C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\fix_modal_patch_v2.js
 */

const fs   = require('fs');
const path = require('path');
const FILE = path.join(__dirname, 'dashboard', 'api.js');

let src = fs.readFileSync(FILE, 'utf8');
fs.writeFileSync(FILE + '.bak_fix_modal_v2', src);
console.log('[BACKUP]', FILE + '.bak_fix_modal_v2');

const OLD = `    await query(
      'UPDATE inventario SET stock_physical=$1, actualizado_en=NOW() WHERE id=$2',
      [parseInt(stock), parseInt(req.params.id)]
    );`;

const NEW = `    await query(
      'UPDATE inventario SET stock_physical=$1, actualizado_en=NOW() WHERE catalogo_id=(SELECT id FROM catalogo_productos WHERE codigo=$2)',
      [parseInt(stock), req.params.id]
    );`;

if (src.includes(OLD)) {
  fs.writeFileSync(FILE, src.replace(OLD, NEW), 'utf8');
  console.log('[OK LF] Fix aplicado');
} else {
  const OLD2 = OLD.replace(/\n/g, '\r\n');
  const NEW2 = NEW.replace(/\n/g, '\r\n');
  src = fs.readFileSync(FILE, 'utf8');
  if (src.includes(OLD2)) {
    fs.writeFileSync(FILE, src.replace(OLD2, NEW2), 'utf8');
    console.log('[OK CRLF] Fix aplicado');
  } else {
    console.error('[ERROR] Patron no encontrado — verificar manualmente');
    process.exit(1);
  }
}
console.log('[DONE]\n');
