// fase1_confirmacion_v3.js
const fs = require('fs');
const { execSync } = require('child_process');

const FILE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\pedido.js';
const TEMP = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\pedido_fase1_check.js';

const content = fs.readFileSync(FILE, 'utf8');
const SEP = content.includes('\r\n') ? '\r\n' : '\n';

console.log('=== DRY-RUN fase1_confirmacion_v3 ===');
console.log('SEP:', JSON.stringify(SEP));

var result = content;

// ─────────────────────────────────────────────────
// PATCH 1: Insertar notifyBodegaWhatsApp
// Ancla: "} catch (err) { console.error('[VENDOR WA]', err.message); }" + SEP + "}"
// ─────────────────────────────────────────────────
const ANCHOR1 = "} catch (err) { console.error('[VENDOR WA]', err.message); }" + SEP + "}";
const idx1 = result.indexOf(ANCHOR1);
console.log('PATCH 1 ancla indexOf:', idx1);
if (idx1 < 0) {
  // Try without SEP
  const alt1 = result.indexOf("} catch (err) { console.error('[VENDOR WA]', err.message); }");
  console.log('Alt indexOf [VENDOR WA] catch:', alt1);
  if (alt1 >= 0) console.log('Chars after:', JSON.stringify(result.substring(alt1, alt1+20)));
  console.error('ABORT — PATCH 1 ancla no encontrada.');
  process.exit(1);
}

const BODEGA_FN = SEP + SEP +
'// ─────────────────────────────────────────────────' + SEP +
'//  NOTIFICAR BODEGA — WhatsApp' + SEP +
'// ─────────────────────────────────────────────────' + SEP +
'async function notifyBodegaWhatsApp(msg) {' + SEP +
'  try {' + SEP +
"    const bodegaNum = process.env.BODEGA_WHATSAPP || '';" + SEP +
'    if (!bodegaNum) return;' + SEP +
"    const toNum = bodegaNum.replace('whatsapp:', '').replace('+', '');" + SEP +
"    const { sendMetaWAMessage } = require('./meta');" + SEP +
'    await sendMetaWAMessage(toNum, msg);' + SEP +
"    console.log('[BODEGA WA] Notificacion enviada a', toNum);" + SEP +
"  } catch (err) { console.error('[BODEGA WA]', err.message); }" + SEP +
'}';

const insertPos1 = idx1 + ANCHOR1.length;
result = result.substring(0, insertPos1) + BODEGA_FN + result.substring(insertPos1);

if (!result.includes('notifyBodegaWhatsApp')) {
  console.error('ABORT — PATCH 1 no quedo.');
  process.exit(1);
}
console.log('PATCH 1 (notifyBodega): OK');

// ─────────────────────────────────────────────────
// PATCH 2: Pickup auto-confirm → alerta VENDOR_WHATSAPP
// Ancla: primera ocurrencia de "return _pickupMsg;"
// ─────────────────────────────────────────────────
const ANCHOR2 = '      return _pickupMsg;';
const idx2 = result.indexOf(ANCHOR2);
console.log('PATCH 2 ancla indexOf:', idx2);
if (idx2 < 0) {
  console.error('ABORT — PATCH 2 ancla no encontrada.');
  process.exit(1);
}

const VENDOR_ALERT =
'      // Alerta info a VENDOR_WHATSAPP (Fase 1)' + SEP +
'      try {' + SEP +
"        var _vn = (process.env.VENDOR_WHATSAPP || '').replace('whatsapp:', '').replace('+', '');" + SEP +
'        if (_vn) {' + SEP +
"          var _vaMsg = '\\uD83D\\uDCE6 *PICKUP AUTO-CONFIRMADO*\\n\\n'" + SEP +
"            + '\\uD83D\\uDC64 Cliente: ' + (order.clientName || from) + '\\n'" + SEP +
"            + '\\uD83D\\uDCC5 Fecha: ' + _pickupDate + '\\n\\n'" + SEP +
'            + (order.items && order.items.length > 0' + SEP +
"              ? '\\uD83D\\uDCE6 Productos:\\n' + order.items.map(function(i) {" + SEP +
"                  return '\\u2022 ' + (i.qty||1) + 'x ' + (i.nombre||'Producto');" + SEP +
"                }).join('\\n') + '\\n\\n' : '')" + SEP +
"            + '\\uD83D\\uDCB3 Pago: ' + (order.payment || 'efectivo') + '\\n'" + SEP +
"            + '\\uD83D\\uDCB0 Total: ' + Number(order.total||0).toLocaleString('es-MX');" + SEP +
"          const { sendMetaWAMessage: _swa } = require('./meta');" + SEP +
'          await _swa(_vn, _vaMsg);' + SEP +
'        }' + SEP +
"      } catch(_ve) { console.error('[PICKUP VENDOR ALERT]', _ve.message); }" + SEP;

result = result.substring(0, idx2) + VENDOR_ALERT + result.substring(idx2);

if (!result.includes('PICKUP AUTO-CONFIRMADO')) {
  console.error('ABORT — PATCH 2 no quedo.');
  process.exit(1);
}
console.log('PATCH 2 (vendor alert pickup): OK');

// ─────────────────────────────────────────────────
// PATCH 3: Stock insuficiente → alerta BODEGA_WHATSAPP
// Ancla: "const _falt = _stockCheck.faltantes.map"
// ─────────────────────────────────────────────────
const ANCHOR3 = '      const _falt = _stockCheck.faltantes.map';
const idx3 = result.indexOf(ANCHOR3);
console.log('PATCH 3 ancla indexOf:', idx3);
if (idx3 < 0) {
  console.error('ABORT — PATCH 3 ancla no encontrada.');
  process.exit(1);
}

const STOCK_ALERT =
'      // Alerta stock a BODEGA_WHATSAPP (Fase 1)' + SEP +
'      notifyBodegaWhatsApp(' + SEP +
"        '\\u26A0\\uFE0F *STOCK INSUFICIENTE*\\n\\n'" + SEP +
"        + '\\uD83D\\uDC64 Cliente: ' + (order.clientName || from) + '\\n'" + SEP +
"        + '\\uD83D\\uDECD Tipo: ' + (order.type === 'pickup' ? 'Pickup' : 'Entrega') + '\\n\\n'" + SEP +
'        + _stockCheck.faltantes.map(function(f) {' + SEP +
"            return '\\u2022 ' + f.producto + ': pedido ' + f.pedido + ', disponible ' + f.disponible;" + SEP +
"          }).join('\\n')" + SEP +
"      ).catch(function() {});" + SEP + SEP;

result = result.substring(0, idx3) + STOCK_ALERT + result.substring(idx3);

if (!result.includes('STOCK INSUFICIENTE')) {
  console.error('ABORT — PATCH 3 no quedo.');
  process.exit(1);
}
console.log('PATCH 3 (bodega stock alert): OK');

// ─────────────────────────────────────────────────
// Verificar sintaxis
// ─────────────────────────────────────────────────
fs.writeFileSync(TEMP, result, { encoding: 'utf8' });
try {
  execSync('node --check "' + TEMP + '"', { stdio: 'pipe' });
  console.log('node --check TEMP: OK');
} catch(e) {
  fs.unlinkSync(TEMP);
  console.error('ABORT — node --check fallo:');
  console.error(e.stderr ? e.stderr.toString() : e.message);
  process.exit(1);
}

fs.unlinkSync(TEMP);
fs.writeFileSync(FILE, result, { encoding: 'utf8' });
console.log('');
console.log('OK — pedido.js Fase 1 aplicada exitosamente');
console.log('Siguiente: node --check pedido.js');
