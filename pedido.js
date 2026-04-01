// ══════════════════════════════════════════════════════════════
//  pedido.js — Flujo de Pedido v3 Optimizado
//  Fixes: unused axios removed, isBuyIntent mejorado,
//  quiereFact false-positive corregido, negocio dinámico
// ══════════════════════════════════════════════════════════════

const twilio        = require('twilio');
const nodemailer    = require('nodemailer');
const { guardarPedido, actualizarEstadoPedido } = require('./crm');

// ─────────────────────────────────────────────────
//  SINGLETON TWILIO (FIX #1)
// ─────────────────────────────────────────────────
let _twClient = null;
function getTwilio() {
  if (!_twClient) _twClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return _twClient;
}

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
];

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
    if (order.pickupDate) lines.push('📅 *Fecha/hora:* ' + order.pickupDate);
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
    await getTwilio().messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to:   'whatsapp:' + process.env.VENDOR_WHATSAPP,
      body: summary + '\n\n─────────────────\n'
          + '¿Confirmas existencias?\n✅ *SI-' + token + '*\n❌ *NO-' + token + '*\n'
          + '─────────────────\n⏰ 15 minutos para responder.'
    });
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
    const order = data.order;
    const isPickup = order.type === 'pickup';
    let msg = '✅ *¡Pedido confirmado!*\n\n';
    if (isPickup) {
      msg += '📍 Te esperamos en el almacén.\n📅 ' + (order.pickupDate || 'Coordinamos fecha') + '\n\n';
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
  return from === 'whatsapp:' + vendor || from === vendor;
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
async function processOrderFlow(from, msg, clientName, lastQuote, sendToClient, negocioNombre) {
  const key      = 'order:' + from;
  const existing = activeOrders.get(key) || { state: S.IDLE, order: {} };
  const { state, order } = existing;

  function set(newState) { activeOrders.set(key, { ...existing, state: newState, order }); }

  // IDLE
  if (state === S.IDLE) {
    if (!isBuyIntent(msg)) return null;
    order.clientPhone = from;
    order.clientName  = clientName;
    order.rawQuote    = lastQuote || 'Cotización del chat';
    order.ts          = Date.now();
    set(S.ASKING_TYPE);
    return '¡Perfecto! ¿Cómo prefieres recibir tu pedido?\n\n'
         + '1️⃣ *Recoger en almacén* — Zapopan (gratis)\n'
         + '2️⃣ *Entrega a domicilio* — GDL/Zapopan $180 · ZMG $250';
  }

  if (state === S.ASKING_TYPE) {
    // FIX BUG A: escape si cliente quiere cancelar o cambiar de tema
    const _escA = normalize(msg);
    const _wantsEscape = _escA.includes('cancel') || _escA.includes('no quiero')
      || _escA.includes('asesor') || _escA.includes('cotizar') || _escA.includes('otro')
      || _escA.includes('olvidalo') || _escA.includes('olvida') || _escA.includes('dejalo')
      || _escA.includes('espera') || _escA.includes('stop') || _escA.includes('salir');
    if (_wantsEscape) { activeOrders.delete(key); return null; }
    const type = detectOrderType(msg);
    if (!type) return 'Por favor elige:\n1️⃣ Recoger en almacén\n2️⃣ Entrega a domicilio';
    order.type = type;
    if (type === 'pickup') {
      set(S.ASKING_DATE);
      return '📍 *Recoger en almacén*\nHorario: Lunes a Sábado 8am–6pm\n\n¿Qué día y hora planeas pasar?';
    }
    set(S.ASKING_STREET);
    return '🚚 *Entrega a domicilio*\n\n¿Cuál es la calle y número de entrega?';
  }

  if (state === S.ASKING_DATE)      { order.pickupDate = msg; set(S.ASKING_PAYMENT); return '¿Cuál será tu método de pago?\n\n' + getPaymentOptions('pickup', from); }
  if (state === S.ASKING_STREET)    { order.street    = msg; set(S.ASKING_COLONY);    return '¿Cuál es la colonia?'; }
  if (state === S.ASKING_COLONY)    { order.colony    = msg; set(S.ASKING_REFERENCE); return '¿Alguna referencia para encontrar el lugar?\n(ej: entre Av. López y calle Robles, frente a la farmacia)'; }
  if (state === S.ASKING_REFERENCE) { order.reference = msg; set(S.ASKING_CONTACT);   return '¿Nombre de la persona que recibe el pedido?'; }
  if (state === S.ASKING_CONTACT)   { order.contact   = msg; set(S.ASKING_PHONE);     return '¿Teléfono alterno de contacto?'; }
  if (state === S.ASKING_PHONE)     { order.altPhone  = msg; set(S.ASKING_DATETIME);  return '¿Qué día y horario prefieres para la entrega?\n(ej: Mañana jueves de 9am a 12pm)'; }
  if (state === S.ASKING_DATETIME)  { order.datetime  = msg; set(S.ASKING_MAPS);      return '¿Tienes link de Google Maps de la dirección? 🗺️\n(Opcional — responde "no" para continuar)'; }

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
    vendorTokens.set(token, key);

    await Promise.allSettled([
      notifyVendorWhatsApp(order, token, negocioNombre),
      notifyVendorEmail(order, token, negocioNombre)
    ]);

        // ── Extraer total del rawQuote ────────────────────
    if (!order.total && order.rawQuote) {
      var _rq = order.rawQuote;
      var _tm = _rq.match(new RegExp('TOTAL[^\\d]*(\\d[\\d,]+)', 'i'))
             || _rq.match(new RegExp('\\$(\\d[\\d,]+)', 'i'));
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

    return '✅ *Pedido recibido*\n\nVerificando stock con el almacén. 🔍\nTe confirmamos en los próximos *15 minutos*.';
  }

  if (state === S.WAITING_VENDOR) {
    // FIX BUG B: permitir cotizar otro producto mientras espera
    const _wv = normalize(msg);
    const _wantsNew = _wv.includes('cotizar') || _wv.includes('necesito')
      || _wv.includes('precio') || _wv.includes('cuanto') || _wv.includes('tienes')
      || _wv.includes('otro') || _wv.includes('hola');
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

module.exports = { processOrderFlow, processVendorReply, isVendorNumber, saveLastQuote, getLastQuote };
