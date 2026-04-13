// fase1_confirmacion_v2.js
const fs = require('fs');
const { execSync } = require('child_process');

const FILE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\pedido.js';
const TEMP = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\pedido_fase1_check.js';

const content = fs.readFileSync(FILE, 'utf8');
const SEP = content.includes('\r\n') ? '\r\n' : '\n';

console.log('=== DRY-RUN fase1_confirmacion_v2 ===');

// Verificar patrones clave existen
const hasVendorWA  = content.includes('[VENDOR WA]');
const hasStockFalt = content.includes('_stockCheck.faltantes.map');
const hasPickupMsg = content.includes('return _pickupMsg;');

console.log('[VENDOR WA] existe:', hasVendorWA);
console.log('_stockCheck.faltantes.map existe:', hasStockFalt);
console.log('return _pickupMsg existe:', hasPickupMsg);

if (!hasVendorWA || !hasStockFalt || !hasPickupMsg) {
  console.error('ABORT — uno o mas patrones no encontrados.');
  process.exit(1);
}

var result = content;

// ─────────────────────────────────────────────────
// PATCH 1: Agregar notifyBodegaWhatsApp despues del catch de notifyVendorWhatsApp
// Patron: la linea "] catch (err) { console.error('[VENDOR WA]'..." seguida de cierre }
// ─────────────────────────────────────────────────
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

// Insertar despues de: } catch (err) { console.error('[VENDOR WA]', err.message); }\n}
result = result.replace(
  /(\} catch \(err\) \{ console\.error\('\[VENDOR WA\]', err\.message\); \}\s*\})\s*\n(\/\/[^\n]+NOTIFICAR VENDEDOR[^\n]+Email)/,
  function(m, p1, p2) { return p1 + BODEGA_FN + SEP + SEP + p2; }
);

if (!result.includes('notifyBodegaWhatsApp')) {
  console.error('ABORT — PATCH 1 no quedo. Intentando patron alternativo...');
  // Alternativa: buscar por linea unica
  const idx = result.indexOf("} catch (err) { console.error('[VENDOR WA]', err.message); }");
  if (idx < 0) {
    console.error('ABORT TOTAL — patron [VENDOR WA] catch no encontrado en contenido real.');
    console.log('Muestra alrededor de [VENDOR WA]:');
    const i2 = result.indexOf('[VENDOR WA]');
    console.log(JSON.stringify(result.substring(i2-50, i2+100)));
    process.exit(1);
  }
  process.exit(1);
}
console.log('PATCH 1 (notifyBodega): OK');

// ─────────────────────────────────────────────────
// PATCH 2: Pickup auto-confirm → alerta info a VENDOR_WHATSAPP
// Insertar ANTES de "return _pickupMsg;"
// ─────────────────────────────────────────────────
const VENDOR_ALERT = 
'      // Alerta info a VENDOR_WHATSAPP (Fase 1)' + SEP +
'      try {' + SEP +
"        var _vn = (process.env.VENDOR_WHATSAPP || '').replace('whatsapp:', '').replace('+', '');" + SEP +
'        if (_vn) {' + SEP +
"          var _va = '\\uD83D\\uDCE6 *PICKUP AUTO-CONFIRMADO*\\n\\n'" + SEP +
"            + '\\uD83D\\uDC64 Cliente: ' + (order.clientName || from) + '\\n'" + SEP +
"            + '\\uD83D\\uDCC5 Fecha: ' + _pickupDate + '\\n\\n'" + SEP +
'            + (order.items && order.items.length > 0' + SEP +
"              ? '\\uD83D\\uDCE6 Productos:\\n' + order.items.map(function(i) {" + SEP +
"                  return '\\u2022 ' + (i.qty||1) + 'x ' + (i.nombre||'Producto');" + SEP +
"                }).join('\\n') + '\\n\\n' : '')" + SEP +
"            + '\\uD83D\\uDCB3 Pago: ' + (order.payment || 'efectivo') + '\\n'" + SEP +
"            + '\\uD83D\\uDCB0 Total: ' + Number(order.total||0).toLocaleString('es-MX');" + SEP +
"          const { sendMetaWAMessage } = require('./meta');" + SEP +
'          await sendMetaWAMessage(_vn, _va);' + SEP +
'        }' + SEP +
"      } catch(_ve) { console.error('[PICKUP VENDOR ALERT]', _ve.message); }" + SEP;

result = result.replace(/      return _pickupMsg;/, function(m) {
  return VENDOR_ALERT + m;
});

if (!result.includes('PICKUP AUTO-CONFIRMADO')) {
  console.error('ABORT — PATCH 2 no quedo en resultado.');
  process.exit(1);
}
console.log('PATCH 2 (vendor alert pickup): OK');

// ─────────────────────────────────────────────────
// PATCH 3: Stock insuficiente → alerta a BODEGA_WHATSAPP
// Insertar ANTES de "const _falt = _stockCheck.faltantes.map"
// ─────────────────────────────────────────────────
const STOCK_ALERT =
'      // Alerta stock a BODEGA_WHATSAPP (Fase 1)' + SEP +
'      notifyBodegaWhatsApp(' + SEP +
"        '\\u26A0\\uFE0F *STOCK INSUFICIENTE*\\n\\n'" + SEP +
"        + '\\uD83D\\uDC64 Cliente: ' + (order.clientName || from) + '\\n'" + SEP +
"        + '\\uD83D\\uDECD\\uFE0F Tipo: ' + (order.type === 'pickup' ? 'Pickup' : 'Entrega') + '\\n\\n'" + SEP +
'        + _stockCheck.faltantes.map(function(f) {' + SEP +
"            return '\\u2022 ' + f.producto + ': pedido ' + f.pedido + ', disponible ' + f.disponible;" + SEP +
"          }).join('\\n')" + SEP +
"      ).catch(function() {});" + SEP + SEP;

result = result.replace(/      const _falt = _stockCheck\.faltantes\.map/, function(m) {
  return STOCK_ALERT + m;
});

if (!result.includes('STOCK INSUFICIENTE')) {
  console.error('ABORT — PATCH 3 no quedo en resultado.');
  process.exit(1);
}
console.log('PATCH 3 (bodega stock alert): OK');

// ─────────────────────────────────────────────────
// Verificar sintaxis con temp
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
