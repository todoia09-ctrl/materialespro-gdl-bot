// ══════════════════════════════════════════════════════════════
//  pedido.js — Flujo de Pedido v3 Optimizado
//  Fixes: unused axios removed, isBuyIntent mejorado,
//  quiereFact false-positive corregido, negocio dinámico
// ══════════════════════════════════════════════════════════════

// Twilio eliminado — notificación vendedor via Meta WA (sendMetaWAMessage)
const nodemailer    = require('nodemailer');
const { guardarPedido, actualizarEstadoPedido, calcularEnvio, detectarZona } = require('./crm');
const { saveActiveOrder, deleteActiveOrder, loadActiveOrders } = require('./db');
const { verificarStock, reducirStock } = require('./inventario'); // stock real
// meta.js se carga lazy en notifyVendorWhatsApp para evitar dependencia circular

// Twilio singleton removido — usando Meta WA

// ─────────────────────────────────────────────────
//  ESTADOS DEL FLUJO
// ─────────────────────────────────────────────────
const S = {
  IDLE:             'idle',
  ASKING_TYPE:      'asking_type',
  ASKING_DATE:      'asking_date',
  ASKING_STREET:    'asking_street',
  ASKING_COLONY:    'asking_colony',
  ASKING_REFERENCE: 'asking_reference',
  ASKING_CONTACT:   'asking_contact',
  ASKING_PHONE:     'asking_phone',
  ASKING_DATETIME:  'asking_datetime',
  ASKING_MAPS:      'asking_maps',
  ASKING_PAYMENT:   'asking_payment',
  ASKING_CREDIT:    'asking_credit',
  ASKING_INVOICE:   'asking_invoice',
  ASKING_RFC:       'asking_rfc',
  ASKING_CFDI:      'asking_cfdi',
  ASKING_INV_EMAIL: 'asking_inv_email',
  CONFIRMING:       'confirming',
  WAITING_VENDOR:   'waiting_vendor',
  CONFIRMED:        'confirmed',
  CANCELLED:        'cancelled',
};

// ─────────────────────────────────────────────────
//  USOS DE CFDI
// ─────────────────────────────────────────────────
const CFDI_USOS = {
  'g03': 'G03 – Gastos en general',
  'g01': 'G01 – Adquisición de mercancias',
  'i01': 'I01 – Construcciones',
  'i03': 'I03 – Equipo de transporte',
  'd01': 'D01 – Honorarios médicos',
  'p01': 'P01 – Por definir',
};
const CFDI_LIST = Object.values(CFDI_USOS).join('\n');

// ─────────────────────────────────────────────────
//  ESTADO DE PEDIDOS
// ─────────────────────────────────────────────────
const activeOrders = new Map();
const recentlyConfirmed = new Set();

async function initActiveOrders() {
  try {
    const rows = await loadActiveOrders();
    let count = 0;
    for (const row of rows) {
      if (['confirmed','cancelled'].includes(row.state)) continue;
      const order = typeof row.order_json==='string' ? JSON.parse(row.order_json) : row.order_json;
      activeOrders.set(row.session_key, { state: row.state, order, token: row.token, timer: null });
      count++;
    }
    if (count>0) console.log('[PEDIDOS] Restaurados desde DB:', count);
    // BUG2 FIX: restaurar vendorTokens para tokens pendientes
    for (const row of rows) {
      if (row.state === 'waiting_vendor' && row.token) {
        const _restoredOrder = activeOrders.get(row.session_key);
        const _orderTs = (_restoredOrder && _restoredOrder.order && _restoredOrder.order.ts) || 0;
        const _orderAge = Date.now() - _orderTs;
        // FIX: si lleva mas de 5 min en WAITING_VENDOR, limpiar — evita estado atrapado tras restart
        if (_orderAge > 5 * 60 * 1000) {
          activeOrders.delete(row.session_key);
          deleteActiveOrder(row.session_key).catch(() => {});
          console.log('[PEDIDOS] Token expirado, limpiado:', row.token);
        } else {
          vendorTokens.set(row.token, row.session_key);
          console.log('[PEDIDOS] Token restaurado:', row.token);
        }
      }
    }
  } catch(e) { console.error('[PEDIDOS] initActiveOrders:', e.message); }
} // BUG P: evitar doble mensaje
const vendorTokens = new Map();
const lastQuotes   = new Map();

// ─────────────────────────────────────────────────
//  CRÉDITO PRE-AUTORIZADO
// ─────────────────────────────────────────────────
const CREDIT_CLIENTS = {
  // 'whatsapp:+52XXXXXXXXXX': 50000,
};

function hasCredit(from)      { return Object.prototype.hasOwnProperty.call(CREDIT_CLIENTS, from); }
function getCreditLimit(from) { return CREDIT_CLIENTS[from] || 0; }

// ─────────────────────────────────────────────────
//  NORMALIZAR TEXTO
// ─────────────────────────────────────────────────
function normalize(msg) {
  return msg.toLowerCase()
    .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i')
    .replace(/[óòö]/g,'o').replace(/[úùü]/g,'u').replace(/[¿¡!?.,]/g,'').trim();
}

// ─────────────────────────────────────────────────
//  DETECTAR INTENCIÓN DE COMPRA (FIX #7, #8)
//  Todos los triggers en español normalizado (sin acentos)
//  para que normalize() no rompa los matches
// ─────────────────────────────────────────────────
const BUY_TRIGGERS = [
  'si','dale','va','listo','lo quiero','quiero pedir',
  'hacemos el pedido','haz el pedido','confirmo','acepto',
  'me lo llevas','lo necesito','lo compro','vamos','ok',
  'anotame','me lo mandan','enviame','me interesa',
  'quiero comprarlo','como lo pido','quiero el pedido',
  // slang mexicano — fixes para pedidos no capturados
  'me late','me lates','va que va','orale','andale','sale',
  'de una','le entro','chido','trato','trato hecho','hecho',
  'firmado','ya mero','ya la hicimos','eso','eso mero',
  'a donde pago','como pago','cuando llega','cuando me lo traen',
  'me lo quedo','me los quedo','me la quedo','cuanto es','pago',
  // cierre de conversación → iniciar pedido
  'seria todo','sería todo','es todo','eso seria todo','eso sería todo',
  'nada mas','nada más','con eso','con eso es todo','perfecto hagamos',
  'listo hagamos','si hagamos','confirmar','quiero confirmar',
];

// ─────────────────────────────────────────────────
//  SLANG COLORES (FIX BUG I)
// ─────────────────────────────────────────────────
const COLOR_SLANG = {
  'bco':'blanco','bca':'blanco','blco':'blanco','wht':'blanco','white':'blanco',
  'gro':'gris','grs':'gris','gry':'gris','grey':'gris','gray':'gris','gc':'gris concreto',
  'ngr':'negro','neg':'negro','blk':'negro','black':'negro',
  'rjo':'rojo','rdo':'rojo','red':'rojo',
  'azl':'azul','blu':'azul','blue':'azul',
  'mfg':'madera','cafe':'cafe','crm':'crema','bej':'beige',
};
function normalizeColor(msg) {
  const c = normalize(msg);
  for (const [k,v] of Object.entries(COLOR_SLANG)) {
    if (c === k || c.includes(' '+k) || c.includes(k+' ') || c.startsWith(k)) return v;
  }
  return null;
}
module.exports && (module.exports.normalizeColor = normalizeColor);

function isBuyIntent(msg) {
  const c = normalize(msg);
  // Exact match OR contained as whole word (FIX #7: evita "si" dentro de "sino")
  return BUY_TRIGGERS.some(t => {
    if (c === t) return true;
    // Solo acepta el trigger si está rodeado por espacios o es inicio/fin
    const re = new RegExp('(^|\\s)' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\s|$)');
    return re.test(c);
  });
}

// ─────────────────────────────────────────────────
//  DETECTAR TIPO DE PEDIDO
// ─────────────────────────────────────────────────
function detectOrderType(msg) {
  const c = normalize(msg);
  if (c.includes('recog') || c.includes('paso') || c.includes('voy') ||
      c.includes('almacen') || c.includes('sucursal') || msg.trim() === '1')
    return 'pickup';
  if (c.includes('entrega') || c.includes('domicilio') || c.includes('traer') ||
      c.includes('envio') || c.includes('manden') || c.includes('lleven') ||
      msg.trim() === '2')
    return 'delivery';
  return null;
}

// ─────────────────────────────────────────────────
//  OPCIONES DE PAGO
// ─────────────────────────────────────────────────
function getPaymentOptions(orderType, from) {
  const credit = hasCredit(from);
  if (orderType === 'pickup') {
    return '1️⃣ *Efectivo* — al recoger\n'
         + '2️⃣ *Transferencia* — antes de recoger\n'
         + '3️⃣ *Tarjeta* — débito/crédito en almacén'
         + (credit ? '\n4️⃣ *Crédito* — límite: $' + getCreditLimit(from).toLocaleString() + ' MXN' : '');
  }
  return '1️⃣ *Efectivo* — contra entrega\n'
       + '2️⃣ *Transferencia* — antes de entregar'
       + (credit ? '\n3️⃣ *Crédito* — límite: $' + getCreditLimit(from).toLocaleString() + ' MXN' : '');
}

function parsePaymentChoice(msg, orderType, from) {
  const c = normalize(msg);
  if (c.includes('efectivo') || msg.trim() === '1') return 'efectivo';
  if (c.includes('transfer') || msg.trim() === '2') return 'transferencia';
  if (orderType === 'pickup' && (c.includes('tarjeta') || msg.trim() === '3')) return 'tarjeta';
  const creditNum = orderType === 'pickup' ? '4' : '3';
  if (c.includes('credito') || msg.trim() === creditNum)
    return hasCredit(from) ? 'credito' : 'credito_no_autorizado';
  return null;
}

// ─────────────────────────────────────────────────
//  RESUMEN DEL PEDIDO (FIX #6 — negocio dinámico)
// ─────────────────────────────────────────────────
function formatOrderSummary(order, forVendor, negocioNombre) {
  const title = forVendor
    ? '🔔 *NUEVO PEDIDO — ' + (negocioNombre || 'MaterialesPro GDL') + '*'
    : '📋 *Resumen de tu pedido:*';
  const lines = [title, ''];

  if (order.rawQuote) {
    lines.push('*Cotización:*');
    lines.push('  ' + order.rawQuote.replace(/\n/g, '\n  '));
    lines.push('');
  }

  if (order.type === 'pickup') {
    lines.push('📍 *Tipo:* Recoger en almacén');
    const _pdVal = order.pickupDate || '';
  const _pdOk = _pdVal.length > 2 && !/^\d$/.test(_pdVal.trim());
  if (_pdOk) lines.push('📅 *Fecha/hora:* ' + _pdVal);
  else if (order.type === 'pickup') lines.push('📅 *Fecha/hora:* Coordinamos contigo');
  } else {
    lines.push('🚚 *Tipo:* Entrega a domicilio');
    if (order.street)    lines.push('📍 *Dirección:* ' + order.street);
    if (order.colony)    lines.push('🏘️ *Colonia:* ' + order.colony);
    if (order.reference) lines.push('📌 *Refs:* ' + order.reference);
    if (order.contact)   lines.push('👷 *Contacto:* ' + order.contact);
    if (order.altPhone)  lines.push('📞 *Tel alterno:* ' + order.altPhone);
    if (order.datetime)  lines.push('📅 *Fecha/hora:* ' + order.datetime);
    if (order.mapsLink)  lines.push('🗺️ *Mapa:* ' + order.mapsLink);
  }
  lines.push('');

  const payLabels = { efectivo:'💵 Efectivo', transferencia:'🏦 Transferencia', tarjeta:'💳 Tarjeta', credito:'📑 Crédito' };
  if (order.payment) lines.push('💳 *Pago:* ' + (payLabels[order.payment] || order.payment));

  if (order.invoice) {
    lines.push('🧾 *Factura:* Sí');
    if (order.rfc)      lines.push('   RFC: ' + order.rfc);
    if (order.cfdi)     lines.push('   CFDI: ' + order.cfdi);
    if (order.invEmail) lines.push('   Correo: ' + order.invEmail);
  } else {
    lines.push('🧾 *Factura:* No');
  }

  lines.push('');
  lines.push('👤 *Cliente:* ' + (order.clientName || 'Sin nombre'));
  if (forVendor && order.clientPhone)
    lines.push('📱 *WhatsApp:* ' + order.clientPhone.replace('whatsapp:', ''));
  if (forVendor && order.payment === 'credito')
    lines.push('\n⚠️ *Solicita pago a CRÉDITO — verificar autorización*');

  return lines.join('\n');
}

// ─────────────────────────────────────────────────
//  TOKEN PARA CONFIRMACIÓN DEL VENDEDOR
// ─────────────────────────────────────────────────
function generateToken() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ─────────────────────────────────────────────────
//  NOTIFICAR VENDEDOR — WhatsApp
// ─────────────────────────────────────────────────
async function notifyVendorWhatsApp(order, token, negocioNombre) {
  try {
    const summary = formatOrderSummary(order, true, negocioNombre);
    const vendorNum = process.env.VENDOR_WHATSAPP || '';
    // Normalizar número — Meta necesita formato sin 'whatsapp:'
    const toNum = vendorNum.replace('whatsapp:', '').replace('+', '');
    // Lazy require para evitar dependencia circular con meta.js
    const { sendMetaWAMessage } = require('./meta');
    await sendMetaWAMessage(
      toNum,
      summary + '\n\n─────────────────\n'
        + '¿Confirmas existencias?\n✅ *SI-' + token + '*\n❌ *NO-' + token + '*\n'
        + '─────────────────\n⏰ 15 minutos para responder.'
    );
    console.log('[VENDOR META WA] Notificación enviada a', toNum);
  } catch (err) { console.error('[VENDOR WA]', err.message); }
}

// ─────────────────────────────────────────────────
//  NOTIFICAR VENDEDOR — Email
// ─────────────────────────────────────────────────
async function notifyVendorEmail(order, token, negocioNombre) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    const summary = formatOrderSummary(order, true, negocioNombre).replace(/\*/g, '');
    await transporter.sendMail({
      from:    '"Bot" <' + process.env.EMAIL_USER + '>',
      to:      process.env.VENDOR_EMAIL,
      subject: '🔔 NUEVO PEDIDO [' + token + ']' + (order.payment === 'credito' ? ' ⚠️ CRÉDITO' : ''),
      html:    '<pre style="font-family:Arial;font-size:14px">'
             + summary.replace(/\n/g,'<br>')
             + '<br><br><b>Responde en WhatsApp:</b><br>✅ SI-' + token + '<br>❌ NO-' + token
             + '</pre>'
    });
  } catch (err) { console.error('[VENDOR EMAIL]', err.message); }
}

// ─────────────────────────────────────────────────
//  TIMER 15 MINUTOS
// ─────────────────────────────────────────────────
function startVendorTimer(sessionKey, sendToClient) {
  // Auto-confirmar en 2 minutos si no hay respuesta del vendedor
  return setTimeout(async () => {
    const data = activeOrders.get(sessionKey);
    if (!data || data.state !== S.WAITING_VENDOR) return;
    data.state = S.CONFIRMED;
    activeOrders.set(sessionKey, data);
    // BUG P FIX: marcar para evitar doble mensaje de Claude IA
    recentlyConfirmed.add(sessionKey);
    setTimeout(() => recentlyConfirmed.delete(sessionKey), 8000); // limpiar en 8s
    const order = data.order;
    const isPickup = order.type === 'pickup';
    let msg = '✅ *¡Pedido confirmado!*\n\n';
    if (isPickup) {
      msg += '📍 *Te esperamos en:*\n'
        + '*MaterialesPro GDL* — Av. López Mateos Sur 6506, Zapopan\n'
        + '🗺️ https://maps.app.goo.gl/C8tAwaQYiEvsqwrHA\n'
        + '🕐 Horario: Lunes a Sábado 8am–6pm\n'
        + '📅 ' + ((order.pickupDate && order.pickupDate.length > 2) ? order.pickupDate : 'Coordinamos fecha contigo') + '\n\n';
    } else {
      msg += '🚚 Entrega coordinada.\n📅 ' + (order.datetime || 'Coordinamos fecha') + '\n📍 ' + (order.street || '') + ', Col. ' + (order.colony || '') + '\n\n';
    }
    msg += 'Nuestro equipo se comunicará contigo para confirmar pago y entrega. 📞\n';
    msg += '\n¿Algo más en lo que te podamos ayudar?';
    await sendToClient(sessionKey, msg);
    console.log('[VENDOR TIMER] Auto-confirmado:', sessionKey);
  }, 2 * 60 * 1000);
}

// ─────────────────────────────────────────────────
//  PROCESAR RESPUESTA DEL VENDEDOR
// ─────────────────────────────────────────────────
function parseVendorResponse(msg) {
  const c = msg.toUpperCase().trim().replace(/[\s-]/g,'');
  const si = c.match(/^SI([A-Z0-9]{4,8})$/);
  const no = c.match(/^NO([A-Z0-9]{4,8})$/);
  if (si) return { confirmed: true,  token: si[1] };
  if (no) return { confirmed: false, token: no[1] };
  return null;
}

function isVendorNumber(from) {
  const vendor = process.env.VENDOR_WHATSAPP || '';
  // Normalizar: quitar prefijo whatsapp: y el '1' de celular México (+521 vs +52)
  function norm(n) { return n.replace('whatsapp:','').replace('+521','+52').replace(/\s/g,''); }
  return norm(from) === norm(vendor);
}

async function processVendorReply(msg, sendToClient) {
  const parsed = parseVendorResponse(msg);
  if (!parsed) return false;

  const sessionKey = vendorTokens.get(parsed.token);
  if (!sessionKey) return false;

  const data = activeOrders.get(sessionKey);
  if (!data) return false;

  if (data.timer) clearTimeout(data.timer);
  vendorTokens.delete(parsed.token);

  const order    = data.order;
  const isPickup = order.type === 'pickup';

  if (parsed.confirmed) {
    data.state = S.CONFIRMED;
    activeOrders.set(sessionKey, data);

    // -- Reducir stock al confirmar --
    try { await reducirStock(order.items || [], order.folio || order.pedidoId || 'unk'); }
    catch (_re) { console.error('[INV] reducirStock:', _re.message); }

    // ── Actualizar estado en DB ──────────────────────────────
    if (order.pedidoId) {
      await actualizarEstadoPedido(order.pedidoId, 'confirmado').catch(e =>
        console.error('[PEDIDO DB] actualizarEstado:', e.message)
      );
    }
    // ────────────────────────────────────────────────────────

    const payInstructions = {
      efectivo:      isPickup ? 'Pago en efectivo al llegar.' : 'El repartidor cobra en efectivo.',
      transferencia: 'Datos para transferencia:\nBanco: ' + (process.env.BANK_NAME || 'BBVA')
                   + '\nCLABE: ' + (process.env.BANK_CLABE || 'XXXXXXXXXXXXXXXXXX')
                   + '\nBeneficiario: ' + (process.env.BANK_BENEFICIARY || 'MaterialesPro GDL')
                   + '\n' + (isPickup ? 'Envía comprobante antes de pasar.' : 'Envía comprobante antes de la entrega.'),
      tarjeta:       'Pago con tarjeta en el almacén.',
      credito:       'Pedido a tu cuenta de crédito. ✅',
    };

    let msg2 = '🎉 *¡Pedido confirmado!*\n\n';
    if (isPickup) {
      msg2 += '📍 Te esperamos en el almacén.\n📅 ' + order.pickupDate + '\n\n';
    } else {
      msg2 += '🚚 Entrega:\n📅 ' + order.datetime + '\n📍 ' + order.street + ', Col. ' + order.colony + '\n\n';
    }
    msg2 += '💳 ' + (payInstructions[order.payment] || '');
    if (order.invoice) msg2 += '\n\n🧾 Factura al correo ' + order.invEmail + ' en 24-48 hrs.';
    msg2 += '\n\n¿Algo más en lo que te pueda ayudar?';

    await sendToClient(sessionKey, msg2);

  } else {
    data.state = S.CANCELLED;
    activeOrders.set(sessionKey, data);
    await sendToClient(sessionKey,
      'Lo sentimos, no contamos con suficiente stock en este momento. 😔\n\n'
      + '¿Qué prefieres?\n1️⃣ Avisarme cuando llegue\n2️⃣ Ver alternativa similar\n3️⃣ Hablar con un asesor'
    );
  }
  return true;
}

// ─────────────────────────────────────────────────
//  PROCESADOR PRINCIPAL DEL FLUJO
// ─────────────────────────────────────────────────
// HELPER: extraer hora numerica de un mensaje
function parseHoraMsg(msg) {
  const m = msg.toLowerCase();
  const m12 = m.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
  if (m12) {
    let h = parseInt(m12[1]);
    const min = m12[2] ? parseInt(m12[2]) : 0;
    if (m12[3] === 'pm' && h < 12) h += 12;
    if (m12[3] === 'am' && h === 12) h = 0;
    return h + min / 60;
  }
  const m24 = m.match(/(\d{1,2})(?::(\d{2}))?\s*(?:hrs?|h\b)/);
  if (m24) { const h = parseInt(m24[1]); return (h >= 0 && h <= 23) ? h + (m24[2] ? parseInt(m24[2]) / 60 : 0) : null; }
  const mT = m.match(/(\d{1,2})\s*(?:de la tarde|de la noche)/);
  if (mT) { let h = parseInt(mT[1]); return h < 12 ? h + 12 : h; }
  const mM = m.match(/(\d{1,2})\s*de la ma/);
  if (mM) return parseInt(mM[1]);
  return null;
}

async function processOrderFlow(from, msg, clientName, lastQuote, sendToClient, negocioNombre) {
  const key      = 'order:' + from;
  const existing = activeOrders.get(key) || { state: S.IDLE, order: {} };
  const { state, order } = existing;

  function set(newState) {
    activeOrders.set(key, { ...existing, state: newState, order });
    saveActiveOrder(key, newState, order, existing.token).catch(()=>{});
  }

  // IDLE
  // FIX BUG M: limpiar estado CONFIRMED/CANCELLED — no reiniciar pedido automáticamente
  if (state === S.CONFIRMED || state === S.CANCELLED) {
    activeOrders.delete(key);
    deleteActiveOrder(key).catch(()=>{});
    return null;
  }

if (state === S.IDLE) {
    if (!isBuyIntent(msg)) return null;
    order.clientPhone = from;
    order.clientName  = clientName;
    order.rawQuote    = lastQuote || 'Cotización del chat';
    order.ts          = Date.now();
    set(S.ASKING_TYPE);
    return '¡Perfecto! ¿Cómo prefieres recibir tu pedido?\n\n'
         + '1️⃣ *Recoger en almacén* — Zapopan (gratis)\n'
         + '2️⃣ *Entrega a domicilio*\n'
         + '   📍 GDL/Zapopan: $150 · Sur: $180 · Tonalá: $200 · Tlajomulco: $250';
  }

  if (state === S.ASKING_TYPE) {
    // FIX BUG A: escape si cliente quiere cancelar o cambiar de tema
    const _escA = normalize(msg);
    const _wantsEscape = _escA.includes('cancel') || _escA.includes('no quiero')
      || _escA.includes('asesor') || _escA.includes('cotizar') || _escA.includes('otro')
      || _escA.includes('olvidalo') || _escA.includes('olvida') || _escA.includes('dejalo')
      || _escA.includes('espera') || _escA.includes('stop') || _escA.includes('salir')
      || _escA.includes('cuanto') || _escA.includes('cuesta') || _escA.includes('precio')
      || _escA.includes('tienes') || _escA.includes('tienen') || _escA.includes('hola');
    if (_wantsEscape) { activeOrders.delete(key); return null; }
    const type = detectOrderType(msg);
    if (!type) return 'Por favor elige:\n1️⃣ Recoger en almacén\n2️⃣ Entrega a domicilio';
    order.type = type;
    if (type === 'pickup') {
      set(S.ASKING_DATE);
      return '📍 *Recoger en almacén*\nHorario: Lun–Vie 8am–6pm · Sáb 8am–2pm\n\n¿Qué día y hora planeas pasar?';
    }
    set(S.ASKING_STREET);
    return '🚚 *Entrega a domicilio*\n\n¿Cuál es la calle y número de entrega?';
  }

  if (state === S.ASKING_DATE) {
    order.pickupDate = msg;
    // FIX DOMINGO: rechazar "domingo" como palabra antes del check numerico
    const _msgNorm = normalize(msg);
    if (_msgNorm.includes('domingo') || _msgNorm === 'domingo') {
      set(S.ASKING_DATE);
      return '⚠️ Los *domingos estamos cerrados*. Atendemos *Lunes a Sábado 8am–6pm*.\n¿Qué otro día planeas pasar?';
    }
    // FIX HORARIO: Lun-Vie 8am-6pm, Sab 8am-2pm
    const _esSabado = _msgNorm.includes('sabado') || _msgNorm.includes('sábado');
    const _horaMsg = parseHoraMsg(msg);
    if (_horaMsg !== null) {
      if (_horaMsg < 8) {
        set(S.ASKING_DATE);
        return '⚠️ Abrimos a las *8am*. ¿Qué hora te funciona dentro de nuestro horario?\n\n⏰ Lun–Vie: 8am–6pm · Sáb: 8am–2pm';
      }
      if (_esSabado && _horaMsg >= 14) {
        set(S.ASKING_DATE);
        return '⚠️ Los *sábados cerramos a las 2pm*.\n\n¿Puedes pasar antes de las 2pm, o prefieres otro día?\n\n⏰ Lun–Vie: 8am–6pm · Sáb: 8am–2pm';
      }
      if (!_esSabado && _horaMsg >= 18) {
        set(S.ASKING_DATE);
        return '⚠️ Cerramos a las *6pm*. ¿Qué hora te funciona?\n\n⏰ Lun–Vie: 8am–6pm · Sáb: 8am–2pm';
      }
    }

    // BUG D FIX: validar día de semana
    const _dias = ['lunes','martes','miercoles','miércoles','jueves','viernes','sabado','sábado'];
    const _msgLow = msg.toLowerCase();
    const _fechaMatch = _msgLow.match(/(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?/);
    if (_fechaMatch) {
      const _d = parseInt(_fechaMatch[1]), _m = parseInt(_fechaMatch[2]) - 1;
      const _y = _fechaMatch[3] ? parseInt(_fechaMatch[3]) : new Date().getFullYear();
      const _fecha = new Date(_y < 100 ? _y + 2000 : _y, _m, _d);
      const _dow = _fecha.getDay(); // 0=dom, 6=sab
      const _nombresDia = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
      if (_dow === 0) {
        set(S.ASKING_DATE);
        return '⚠️ Esa fecha es *domingo* y estamos cerrados. Atendemos Lunes a Sábado 8am-6pm.\n\n¿Qué otro día planeas pasar?';
      }
      const _nombreReal = _nombresDia[_dow];
      const _diaEscrito = _dias.find(d => _msgLow.includes(d));
      if (_diaEscrito) {
        const _realNorm = _nombreReal.replace('é','e').replace('á','a');
        const _escNorm = _diaEscrito.replace('é','e').replace('á','a');
        if (!_realNorm.startsWith(_escNorm.substring(0,4))) {
          // FIX J: detener flujo y pedir confirmación del día correcto
          order._fechaConflicto = { d: _d, m: _m+1, y: _y, diaReal: _nombreReal.toUpperCase(), diaEscrito: _diaEscrito.toUpperCase() };
          set(S.ASKING_DATE);
          return '⚠️ *Hay un conflicto de fecha:*\n'
            + 'El ' + _d + '/' + (_m+1) + '/' + _y + ' es *' + _nombreReal.toUpperCase() + '*, no ' + _diaEscrito.toUpperCase() + '.\n\n'
            + '¿Qué prefieres?\n'
            + '1️⃣ *' + _nombreReal.toUpperCase() + ' ' + _d + '/' + (_m+1) + '* (la fecha que pusiste)\n'
            + '2️⃣ *' + _diaEscrito.toUpperCase() + '* — dame la fecha correcta';
        }
      }
    }
    set(S.ASKING_PAYMENT); return '¿Cuál será tu método de pago?\n\n' + getPaymentOptions('pickup', from);
  }
  if (state === S.ASKING_STREET)    { order.street    = msg; set(S.ASKING_COLONY);    return '¿Cuál es la colonia?'; }
  if (state === S.ASKING_COLONY)    { order.colony = msg;
    // Calcular costo envío por zona
    const _zonaCol = detectarZona(msg);
    if (_zonaCol) { const _t = calcularEnvio(_zonaCol); order.costoEnvio = _t.precio; order.zonaEnvio = _t.label; }
    else { order.costoEnvio = 250; } // default ZMG
    set(S.ASKING_REFERENCE); return '¿Alguna referencia para encontrar el lugar?\n(ej: entre Av. López y calle Robles, frente a la farmacia)'; }
  if (state === S.ASKING_REFERENCE) { order.reference = msg; set(S.ASKING_CONTACT);   return '¿Nombre de la persona que recibe el pedido?'; }
  if (state === S.ASKING_CONTACT)   { order.contact   = msg; set(S.ASKING_PHONE);     return '¿Teléfono alterno de contacto?'; }
  if (state === S.ASKING_PHONE)     { order.altPhone  = msg; set(S.ASKING_DATETIME);  return '¿Qué día y horario prefieres para la entrega?\n(ej: Mañana jueves de 9am a 12pm)'; }
  if (state === S.ASKING_DATETIME)  {
    // FIX conflicto fecha delivery
    if (order._fechaConflicto) {
      const _fc = order._fechaConflicto;
      const _resp = msg.trim();
      if (_resp === '1' || _resp.toLowerCase().includes(_fc.diaReal.toLowerCase().substring(0,4))) {
        order.datetime = _fc.diaReal + ' ' + _fc.d + '/' + _fc.m + '/' + _fc.y;
        delete order._fechaConflicto;
        set(S.ASKING_MAPS);
        return '✅ Agendado para *' + order.datetime + '*\n\n¿Tienes link de Google Maps? 🗺️\n(Opcional — responde \'no\' para continuar)';
      } else if (_resp === '2') {
        delete order._fechaConflicto;
        return '📅 Dame la fecha correcta\n(ej: jueves 10/04/2026 de 9am a 12pm)';
      }
      delete order._fechaConflicto;
    }
    // FIX: validar día de semana en fecha de entrega (mismo que ASKING_DATE)
    const _dtLow = msg.toLowerCase();
    const _dtMatch = _dtLow.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
    if (_dtMatch) {
      const _dd = parseInt(_dtMatch[1]), _mm = parseInt(_dtMatch[2]) - 1;
      const _yy = _dtMatch[3] ? parseInt(_dtMatch[3]) : new Date().getFullYear();
      const _dtFecha = new Date(_yy < 100 ? _yy + 2000 : _yy, _mm, _dd);
      const _dtDow = _dtFecha.getDay();
      const _dtNombres = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
      const _dtReal = _dtNombres[_dtDow];
      if (_dtDow === 0) {
        return '⚠️ Esa fecha es *domingo* y no hacemos entregas. Atendemos Lunes a Sábado.\n\n¿Qué otro día prefieres?';
      }
      const _dtDias = ['lunes','martes','miercoles','miércoles','jueves','viernes','sabado','sábado'];
      const _dtEscrito = _dtDias.find(d => _dtLow.includes(d));
      if (_dtEscrito) {
        const _dtRealNorm = _dtReal.replace('é','e').replace('á','a');
        const _dtEscNorm  = _dtEscrito.replace('é','e').replace('á','a');
        if (!_dtRealNorm.startsWith(_dtEscNorm.substring(0,4))) {
          return '⚠️ *Conflicto de fecha:*\n'
            + 'El ' + _dd + '/' + (_mm+1) + '/' + _yy + ' es *' + _dtReal.toUpperCase() + '*, no ' + _dtEscrito.toUpperCase() + '.\n\n'
            + '¿Qué prefieres?\n'
            + '1️⃣ *' + _dtReal.toUpperCase() + ' ' + _dd + '/' + (_mm+1) + '* (la fecha que pusiste)\n'
            + '2️⃣ Escríbeme la fecha correcta';
        }
      }
    }
    order.datetime = msg; set(S.ASKING_MAPS);      return '¿Tienes link de Google Maps de la dirección? 🗺️\n(Opcional — responde "no" para continuar)'; }

  if (state === S.ASKING_MAPS) {
    order.mapsLink = normalize(msg) === 'no' || msg.length < 8 ? null : msg;
    set(S.ASKING_PAYMENT);
    return '¿Cuál será tu método de pago?\n\n' + getPaymentOptions('delivery', from);
  }

  if (state === S.ASKING_PAYMENT) {
    const payment = parsePaymentChoice(msg, order.type, from);
    if (!payment) return 'Por favor elige una opción:\n\n' + getPaymentOptions(order.type, from);
    if (payment === 'credito_no_autorizado')
      return 'No tienes línea de crédito activa. Elige otra opción:\n\n' + getPaymentOptions(order.type, from);
    if (payment === 'credito') {
      order.payment = 'credito';
      set(S.ASKING_CREDIT);
      return '📑 Crédito pre-autorizado: $' + getCreditLimit(from).toLocaleString() + ' MXN\n'
           + '¿Confirmas pago a crédito? Responde *SÍ* o elige otro método:\n\n' + getPaymentOptions(order.type, from);
    }
    order.payment = payment;
    set(S.ASKING_INVOICE);
    return '¿Requieres factura?\n\n1️⃣ Sí, necesito factura\n2️⃣ No, sin factura';
  }

  if (state === S.ASKING_CREDIT) {
    const c = normalize(msg);
    if (c === 'si') { order.payment = 'credito'; set(S.ASKING_INVOICE); return '¿Requieres factura?\n\n1️⃣ Sí\n2️⃣ No'; }
    const alt = parsePaymentChoice(msg, order.type, from);
    if (alt && alt !== 'credito' && alt !== 'credito_no_autorizado') {
      order.payment = alt;
      set(S.ASKING_INVOICE);
      return '¿Requieres factura?\n\n1️⃣ Sí\n2️⃣ No';
    }
    return 'Responde *SÍ* para crédito, o elige otro método:\n\n' + getPaymentOptions(order.type, from);
  }

  if (state === S.ASKING_INVOICE) {
    const c = normalize(msg);
    // FIX #9 — evitar que "sin factura" o "2" detecten 'si' como afirmativo
    const quiereFact = msg.trim() === '1'
      || (c === 'si' || c === 'si necesito factura' || c === 'con factura')
      || (c.includes('si') && c.includes('factura') && !c.startsWith('sin'));

    if (quiereFact) {
      order.invoice = true;
      set(S.ASKING_RFC);
      return '🧾 *Datos de facturación*\n\nEnvía tu constancia de situación fiscal o escribe tu RFC.\n(ej: XAXX010101000)';
    }
    order.invoice = false;
    set(S.CONFIRMING);
    return formatOrderSummary(order, false, negocioNombre)
         + '\n\n¿Todo correcto? Responde *SÍ* para confirmar o *NO* para corregir.';
  }

  if (state === S.ASKING_RFC) {
    order.rfc = msg.toUpperCase().trim();
    set(S.ASKING_CFDI);
    return '¿Cuál es el uso de CFDI?\n\n' + CFDI_LIST + '\n\nEscribe el código (ej: G03) o la descripción.';
  }

  if (state === S.ASKING_CFDI) {
    const c   = msg.toUpperCase().trim();
    const hit = Object.entries(CFDI_USOS).find(([k, v]) =>
      c.startsWith(k.toUpperCase()) || v.toUpperCase().includes(c)
    );
    order.cfdi = hit ? hit[1] : msg;
    set(S.ASKING_INV_EMAIL);
    return '¿A qué correo electrónico enviamos la factura?';
  }

  if (state === S.ASKING_INV_EMAIL) {
    order.invEmail = msg.toLowerCase().trim();
    set(S.CONFIRMING);
    return formatOrderSummary(order, false, negocioNombre)
         + '\n\n¿Todo correcto? Responde *SÍ* para confirmar o *NO* para corregir.';
  }

  if (state === S.CONFIRMING) {
    const c = normalize(msg);
    if (c === 'no' || c.includes('corregir') || c.includes('cambiar')) {
      activeOrders.delete(key);
      return 'Sin problema. Dime qué necesitas corregir y empezamos de nuevo.';
    }
    const _confirmTriggers = ['si','dale','ok','confirmo','listo','va','sale','claro','ai','ahi','ahí','correcto','perfecto','andale','ándale','sip','yep','yes','adelante','procede'];
    if (!_confirmTriggers.includes(c) && !c.startsWith('si ') && !c.startsWith('dale '))
      return '¿Confirmas? Responde *SÍ* o *NO*.';

    const token = generateToken();
        // -- Verificar stock antes de notificar al vendedor --
    const _stockCheck = await verificarStock(order.items || []);
    if (!_stockCheck.ok) {
      activeOrders.delete(key);
      await deleteActiveOrder(key).catch(()=>{});
      const _falt = _stockCheck.faltantes.map(f =>
        '• ' + f.producto + ': pedido ' + f.pedido + ' ' + f.unidad + ', disponible ' + f.disponible
      ).join('\n');
      return '⚠️ Sin stock suficiente.\n\n' + _falt +
        '\n\n¿Qué prefieres?\n1️⃣ Avísame cuando llegue\n2️⃣ Ver alternativa\n3️⃣ Hablar con un asesor';
    }

    vendorTokens.set(token, key);

    await Promise.allSettled([
      notifyVendorWhatsApp(order, token, negocioNombre),
      notifyVendorEmail(order, token, negocioNombre)
    ]);

        // ── Extraer/calcular total ────────────────────────
    // FIX: calcular desde items_json primero (más confiable)
    if (!order.total || order.total === 0) {
      if (order.items && order.items.length > 0) {
        const _itemsTotal = order.items.reduce((s,i) => s + ((i.qty||1) * (i.precio||0)), 0);
        if (_itemsTotal > 0) order.total = _itemsTotal;
      }
    }
    // Fallback: parsear rawQuote buscando TOTAL o último precio grande
    if (!order.total && order.rawQuote) {
      var _rq = order.rawQuote;
      // Buscar 'Total: $X,XXX' primero
      var _tm = _rq.match(new RegExp('[Tt]otal[^\\d]*(\\d[\\d,]+)', 'i'))
             || _rq.match(new RegExp('[Ss]ubtotal[^\\d]*(\\d[\\d,]+)', 'i'));
      // Si no, tomar el último precio mencionado
      if (!_tm) {
        var _allPrices = [..._rq.matchAll(new RegExp('\\$(\\d[\\d,]+)', 'g'))];
        if (_allPrices.length > 0) _tm = _allPrices[_allPrices.length - 1];
      }
      if (_tm) order.total = parseFloat(_tm[1].replace(/,/g, ''));
    }
    // ── Guardar pedido en DB ────────────────────────
    try {
      const _result = await guardarPedido(from, order, 'whatsapp');
      if (_result && _result.folio) {
        order.pedidoId = _result.pedidoId;
        console.log('[PEDIDO DB] Guardado folio:', _result.folio, 'cliente:', from);
      }
    } catch (_dbErr) {
      console.error('[PEDIDO DB] Error al guardar:', _dbErr.message);
    }
    // ─────────────────────────────────────────────────────
    const timer = startVendorTimer(key, sendToClient);
    activeOrders.set(key, { state: S.WAITING_VENDOR, order, token, timer });
    saveActiveOrder(key, S.WAITING_VENDOR, order, token).catch(()=>{});

    return '✅ *Pedido recibido*\n\nVerificando stock con el almacén. 🔍\nTe confirmamos en los próximos *15 minutos*.';
  }

  if (state === S.WAITING_VENDOR) {
    // FIX BUG B: permitir cotizar otro producto mientras espera
    const _wv = normalize(msg);
    const _wantsNew = _wv.includes('cotizar') || _wv.includes('necesito')
      || _wv.includes('precio') || _wv.includes('cuanto') || _wv.includes('tienes')
      || _wv.includes('otro') || _wv.includes('hola')
      || _wv.includes('quiero') || _wv.includes('busco') || _wv.includes('dame')
      || _wv.includes('tienen') || _wv.includes('cual') || _wv.includes('impermeabilizante')
      || _wv.includes('sika') || _wv.includes('producto') || _wv.includes('material')
      || _wv.includes('cuantos') || _wv.includes('hay') || _wv.includes('vendeme');
    if (_wantsNew) return null;
    return 'Tu pedido está en revisión. ⏳ Te avisamos en máximo 15 minutos.';
  }

  return null;
}

// ─────────────────────────────────────────────────
//  QUOTE HELPERS
// ─────────────────────────────────────────────────
function saveLastQuote(from, text) { lastQuotes.set(from, text); }
function getLastQuote(from)        { return lastQuotes.get(from) || null; }

module.exports = { processOrderFlow, processVendorReply, isVendorNumber, saveLastQuote, getLastQuote, recentlyConfirmed, initActiveOrders };
