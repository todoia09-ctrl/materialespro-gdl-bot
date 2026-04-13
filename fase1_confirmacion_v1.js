// fase1_confirmacion_v1.js
// Fase 1: 
//   1. Pickup auto-confirm → alerta info a VENDOR_WHATSAPP
//   2. Stock insuficiente → alerta a BODEGA_WHATSAPP
// REGLA #38: dry-run + auto node--check con temp
const fs = require('fs');
const { execSync } = require('child_process');

const FILE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\pedido.js';
const TEMP = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\pedido_fase1_check.js';

const content = fs.readFileSync(FILE, 'utf8');
const SEP = content.includes('\r\n') ? '\r\n' : '\n';

// ─────────────────────────────────────────────────
// PATCH 1: Agregar funcion notifyBodegaWhatsApp
// Insertar DESPUES de notifyVendorWhatsApp (despues del bloque que cierra con catch)
// ─────────────────────────────────────────────────
const PATTERN1 = /(\s*console\.log\('\[VENDOR META WA\][^']+'\);\s*\} catch \(err\) \{ console\.error\('\[VENDOR WA\]', err\.message\); \}\s*\})/;

const match1 = content.match(PATTERN1);
console.log('=== DRY-RUN fase1_confirmacion_v1 ===');
console.log('PATCH 1 (notifyBodega insert):', match1 ? 'ENCONTRADO' : 'NO ENCONTRADO');
if (!match1) {
  console.error('ABORT — PATCH 1 no encontrado.');
  process.exit(1);
}

var BODEGA_FN = SEP + SEP +
'// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500' + SEP +
'//  NOTIFICAR BODEGA \u2014 WhatsApp (stock / despacho)' + SEP +
'// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500' + SEP +
'async function notifyBodegaWhatsApp(msg) {' + SEP +
'  try {' + SEP +
'    const bodegaNum = process.env.BODEGA_WHATSAPP || \'\';' + SEP +
'    if (!bodegaNum) return;' + SEP +
'    const toNum = bodegaNum.replace(\'whatsapp:\', \'\').replace(\'+\', \'\');' + SEP +
'    const { sendMetaWAMessage } = require(\'./meta\');' + SEP +
'    await sendMetaWAMessage(toNum, msg);' + SEP +
'    console.log(\'[BODEGA WA] Notificacion enviada a\', toNum);' + SEP +
'  } catch (err) { console.error(\'[BODEGA WA]\', err.message); }' + SEP +
'}';

var result = content.replace(PATTERN1, function(m) { return m + BODEGA_FN; });

if (!result.includes('notifyBodegaWhatsApp')) {
  console.error('ABORT — PATCH 1 no quedo en resultado.');
  process.exit(1);
}
console.log('PATCH 1: OK');

// ─────────────────────────────────────────────────
// PATCH 2: Despues de pickup auto-confirm → alerta info a VENDOR_WHATSAPP
// Insertar ANTES del return _pickupMsg
// ─────────────────────────────────────────────────
const PATTERN2 = /(      return _pickupMsg;\s*\}\s*\/\/ \u2500\u2500 REGLA 2)/;
const match2 = result.match(PATTERN2);
console.log('PATCH 2 (vendor alert after pickup):', match2 ? 'ENCONTRADO' : 'NO ENCONTRADO');
if (!match2) {
  // Try alternate pattern
  const alt = result.match(/return _pickupMsg;[\r\n]+    \}/);
  console.log('PATCH 2 alt:', alt ? 'ENCONTRADO' : 'NO ENCONTRADO');
  if (!alt) {
    console.error('ABORT — PATCH 2 no encontrado.');
    process.exit(1);
  }
}

var VENDOR_ALERT = SEP +
'      // Alerta info a VENDOR_WHATSAPP (Fase 1)' + SEP +
'      try {' + SEP +
'        var _vendorNum = (process.env.VENDOR_WHATSAPP || \'\').replace(\'whatsapp:\', \'\').replace(\'+\', \'\');' + SEP +
'        if (_vendorNum) {' + SEP +
'          var _vendorAlert = \'\uD83D\uDCE6 *PICKUP AUTO-CONFIRMADO*\n\n\'' + SEP +
'            + \'\uD83D\uDC64 Cliente: \' + (order.clientName || from) + \'\n\'' + SEP +
'            + \'\uD83D\uDCC5 Fecha: \' + _pickupDate + \'\n\n\'' + SEP +
'            + (order.items && order.items.length > 0 ? \'\uD83D\uDCE6 Productos:\n\' + order.items.map(function(i) {' + SEP +
'                return \'\u2022 \' + (i.qty||1) + \'x \' + (i.nombre||\'Producto\');' + SEP +
'              }).join(\'\n\') + \'\n\n\' : \'\')' + SEP +
'            + \'\uD83D\uDCB3 Pago: \' + (order.payment || \'efectivo\') + \'\n\'' + SEP +
'            + \'\uD83D\uDCB0 Total: $\' + Number(order.total||0).toLocaleString(\'es-MX\');' + SEP +
'          const { sendMetaWAMessage } = require(\'./meta\');' + SEP +
'          await sendMetaWAMessage(_vendorNum, _vendorAlert);' + SEP +
'        }' + SEP +
'      } catch(_va) { console.error(\'[PICKUP VENDOR ALERT]\', _va.message); }' + SEP;

result = result.replace(/(      return _pickupMsg;)/, function(m) { return VENDOR_ALERT + m; });

if (!result.includes('PICKUP AUTO-CONFIRMADO')) {
  console.error('ABORT — PATCH 2 no quedo en resultado.');
  process.exit(1);
}
console.log('PATCH 2: OK');

// ─────────────────────────────────────────────────
// PATCH 3: Stock insuficiente → alerta a BODEGA_WHATSAPP
// ─────────────────────────────────────────────────
const PATTERN3 = /(const _falt = _stockCheck\.faltantes\.map\(f =>)/;
const match3 = result.match(PATTERN3);
console.log('PATCH 3 (bodega stock alert):', match3 ? 'ENCONTRADO' : 'NO ENCONTRADO');
if (!match3) {
  console.error('ABORT — PATCH 3 no encontrado.');
  process.exit(1);
}

var STOCK_ALERT = '      // Alerta stock a BODEGA_WHATSAPP (Fase 1)' + SEP +
'      notifyBodegaWhatsApp(' + SEP +
'        \'\u26A0\uFE0F *STOCK INSUFICIENTE*\n\n\'' + SEP +
'        + \'\uD83D\uDC64 Cliente: \' + (order.clientName || from) + \'\n\'' + SEP +
'        + \'\uD83D\uDECD\uFE0F Tipo: \' + (order.type === \'pickup\' ? \'Pickup\' : \'Entrega\') + \'\n\n\'' + SEP +
'        + _stockCheck.faltantes.map(function(f) {' + SEP +
'            return \'\u2022 \' + f.producto + \': pedido \' + f.pedido + \', disponible \' + f.disponible;' + SEP +
'          }).join(\'\n\')' + SEP +
'      ).catch(function() {});' + SEP + SEP;

result = result.replace(PATTERN3, function(m) { return STOCK_ALERT + m; });

if (!result.includes('STOCK INSUFICIENTE')) {
  console.error('ABORT — PATCH 3 no quedo en resultado.');
  process.exit(1);
}
console.log('PATCH 3: OK');

// ─────────────────────────────────────────────────
// Verificar con temp .js
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
console.log('OK — pedido.js Fase 1 aplicada');
console.log('Siguiente: node --check pedido.js');
