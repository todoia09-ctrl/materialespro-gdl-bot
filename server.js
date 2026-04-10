// ══════════════════════════════════════════════════════════════
//  MaterialesPro GDL — Bot ENTERPRISE v10
//  WhatsApp · Facebook · Instagram · FB Comments
//  CRM PostgreSQL · Inventario · Dashboard · Scheduler · Campañas
// ══════════════════════════════════════════════════════════════

const express   = require('express');
const twilio    = require('twilio');
const Anthropic = require('@anthropic-ai/sdk');
const axios     = require('axios');
const FormData  = require('form-data');
const XLSX      = require('xlsx');
const fs        = require('fs');
const pathMod   = require('path');

// ── Módulos del sistema ──────────────────────────
const { initSchema, upsertCliente, getCliente, logMensaje, query } = require('./db');
const { registrarContacto, actualizarZona, guardarCotizacion,
        guardarPedido, actualizarEstadoPedido,
        programarSeguimiento, logConversacion,
        getNivelPrecio, calcularPrecio, etiquetaNivel }       = require('./crm');
const { syncFromCatalog, verificarStock }                    = require('./inventario');
const { initScheduler }                                      = require('./scheduler');
const { processMetaWebhook }                                 = require('./meta');
const { isTechnicalQuestion, getTechnicalInfo }              = require('./tecnico');
const { processOrderFlow, processVendorReply,
        isVendorNumber, saveLastQuote, getLastQuote, recentlyConfirmed, initActiveOrders }        = require('./pedido');
const { generateAndSendQuote, isPDFRequest }                 = require('./cotizacion');
const dashboardApi                                           = require('./dashboard/api');

// ── Singletons ───────────────────────────────────
const app      = express();
const aiClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const twClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '10mb' }));

// ── Basic Auth para Dashboard y API ──────────────
const _dashUser = process.env.DASHBOARD_USER;
const _dashPass = process.env.DASHBOARD_PASS;
if (!_dashUser || !_dashPass) {
  console.warn('[AUTH] \u26a0\ufe0f  DASHBOARD_USER / DASHBOARD_PASS no configurados — dashboard SIN protección');
}
function dashboardAuth(req, res, next) {
  if (!_dashUser || !_dashPass) return next();
  const hdr = req.headers.authorization || '';
  if (hdr.startsWith('Basic ')) {
    const decoded = Buffer.from(hdr.slice(6), 'base64').toString();
    const [u, p] = decoded.split(':');
    if (u === _dashUser && p === _dashPass) return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="MaterialesPro Dashboard"');
  return res.status(401).send('Acceso no autorizado');
}

// ── Dashboard estático ───────────────────────────
app.use('/dashboard', dashboardAuth, express.static(pathMod.join(__dirname, 'dashboard')));
app.get('/dashboard', dashboardAuth, (_, res) => res.sendFile(pathMod.join(__dirname, 'dashboard/index.html')));
app.get('/privacy', (_, res) => res.sendFile(pathMod.join(__dirname, 'privacy.html')));
app.use('/api', dashboardApi);

// ─────────────────────────────────────────────────
//  CATÁLOGO DINÁMICO
// ─────────────────────────────────────────────────
function loadCatalog() {
  const _cat = JSON.parse(fs.readFileSync(pathMod.join(__dirname, 'catalogo.json'), 'utf8'));
  if (!_cat.negocio && _cat.meta) {
    _cat.negocio = {
      nombre:   'MaterialesPro GDL',
      ciudad:   'Zapopan / Guadalajara, Jalisco',
      telefono: process.env.VENDOR_WHATSAPP || '+52 33 XXXX XXXX',
      horario:  'Lun-Sab 8am-6pm',
      whatsapp: process.env.VENDOR_WHATSAPP || '+52 33 XXXX XXXX',
    };
  }
  if (!_cat.envios) _cat.envios = {};
  // Tarifas desde catalogo.json (editables via dashboard)
  const _tf = _cat.tarifas_envio || {};
  _cat.envios.gdl_zapopan  = _tf.norte      || { precio: 150, tiempo: '1-2 dias' };
  _cat.envios.sur          = _tf.sur        || { precio: 180, tiempo: '1-2 dias' };
  _cat.envios.este         = _tf.este       || { precio: 200, tiempo: '1-3 dias' };
  _cat.envios.zmg          = _tf.default    || { precio: 250, tiempo: '2-3 dias' };
  if (!_cat.envios.gratis_desde) _cat.envios.gratis_desde = 5000;
  if (!_cat.descuentos_volumen) _cat.descuentos_volumen = { umbral_pesos: 5000, mensaje: 'Descuento especial en proyectos grandes' };
  return _cat;
}

// ── Productos prioritarios (cache desde DB) ─────
let _priorityProducts = { ofertas: [], destacados: [], masVendidos: [] };

async function loadPriorityProducts() {
  try {
    var ofertas = await query(
      "SELECT codigo, nombre, categoria, presentacion, unidad, precio_venta, precio_oferta, descuento_maximo FROM catalogo_productos WHERE activo=true AND en_oferta=true AND (oferta_hasta IS NULL OR oferta_hasta >= NOW()) ORDER BY orden_display LIMIT 50"
    );
    var destacados = await query(
      "SELECT codigo, nombre, categoria, presentacion, unidad, precio_venta, descuento_maximo FROM catalogo_productos WHERE activo=true AND destacado=true AND en_oferta IS NOT TRUE ORDER BY orden_display LIMIT 10"
    );
    var masVendidos = await query(
      "SELECT codigo, nombre, categoria, presentacion, unidad, precio_venta, descuento_maximo FROM catalogo_productos WHERE activo=true AND mas_vendido=true AND destacado IS NOT TRUE AND en_oferta IS NOT TRUE ORDER BY orden_display LIMIT 10"
    );
    _priorityProducts = {
      ofertas:     (ofertas && ofertas.rows) || [],
      destacados:  (destacados && destacados.rows) || [],
      masVendidos: (masVendidos && masVendidos.rows) || []
    };
    var total = _priorityProducts.ofertas.length + _priorityProducts.destacados.length + _priorityProducts.masVendidos.length;
    if (total > 0) console.log('[CAT\u00c1LOGO] Prioritarios:', _priorityProducts.ofertas.length, 'ofertas,', _priorityProducts.destacados.length, 'destacados,', _priorityProducts.masVendidos.length, 'mas vendidos');
  } catch (e) {
    console.warn('[CAT\u00c1LOGO] No se pudieron cargar prioritarios:', e.message);
  }
}

function buildCatalogText(cat, nivelInfo) {
    const _nivel = nivelInfo ? nivelInfo.nivel : 1;
    const _dp2   = nivelInfo ? nivelInfo.descuento_p2 : 5;
    const _dp3   = nivelInfo ? nivelInfo.descuento_p3 : 10;
    function precioNivel(p) {
      const base = p.precio_venta || p.precio || 0;
      if (_nivel === 2) return Math.round(base * (1 - _dp2 / 100));
      if (_nivel === 3) return Math.round(base * (1 - _dp3 / 100));
      if (_nivel === 4) return Math.round(base * (1 - (p.descuento_maximo || 0.20)));
      return base;
    }
    // Map de ofertas por codigo para cross-reference
    var ofertasMap = {};
    for (var oi = 0; oi < _priorityProducts.ofertas.length; oi++) {
      var _of = _priorityProducts.ofertas[oi];
      if (_of.codigo && _of.precio_oferta > 0) ofertasMap[_of.codigo] = _of;
    }
    function formatLine(p) {
      var _u = 'pza';
      var _n = p.nombre || '';
      if (!/ \(\d/.test(_n) && !/ \d+[,.]\d+ /.test(_n)) {
        _u = p.presentacion || p.unidad || 'pza';
      }
      var _c = p.categoria ? ' (' + p.categoria + ')' : '';
      var oferta = p.codigo ? ofertasMap[p.codigo] : null;
      if (oferta) {
        return '\uD83D\uDD25 ' + _n + ' $' + Math.round(parseFloat(oferta.precio_oferta)) + '/' + _u + ' \uD83D\uDD25 OFERTA' + _c;
      }
      return _n + " $" + precioNivel(p) + "/" + _u + _c;
    }

  // Productos prioritarios (desde DB)
  var priorityLines = [];
  var priorityCodigos = new Set();
  var pp = _priorityProducts;

  if (pp.ofertas.length > 0) {
    priorityLines.push('\ud83d\udd25 OFERTAS:');
    for (var i = 0; i < pp.ofertas.length; i++) {
      var o = pp.ofertas[i];
      var precioOrig = precioNivel(o);
      var precioOfe = o.precio_oferta ? Math.round(parseFloat(o.precio_oferta)) : precioOrig;
      var _u = o.presentacion || o.unidad || 'pza';
      var _c = o.categoria ? ' (' + o.categoria + ')' : '';
      priorityLines.push('\ud83d\udd25 ' + o.nombre + ' ~$' + precioOrig + '~ $' + precioOfe + '/' + _u + _c);
      // No add to priorityCodigos — ofertas also appear in full catalog with offer price via formatLine
    }
  }
  if (pp.destacados.length > 0) {
    priorityLines.push('\u2b50 DESTACADOS:');
    for (var i = 0; i < pp.destacados.length; i++) {
      priorityLines.push('\u2b50 ' + formatLine(pp.destacados[i]));
      priorityCodigos.add(pp.destacados[i].codigo);
    }
  }
  if (pp.masVendidos.length > 0) {
    priorityLines.push('TOP VENTAS:');
    for (var i = 0; i < pp.masVendidos.length; i++) {
      priorityLines.push(formatLine(pp.masVendidos[i]));
      priorityCodigos.add(pp.masVendidos[i].codigo);
    }
  }

  // Resto de productos (excluir los que ya están en prioritarios)
  const restProds = (cat.productos || []).filter(p => p.activo !== false && !priorityCodigos.has(p.codigo || p.id))
    .map(p => formatLine(p))
    .join("\n- ");

  var allProds = priorityLines.length > 0
    ? priorityLines.join('\n- ') + '\n\nCAT\u00c1LOGO COMPLETO:\n- ' + restProds
    : '- ' + restProds;

  const e = cat.envios || {};
  const gdl = e.gdl_zapopan || { precio: "consultar", tiempo: "1-2 dias" };
  const zmg = e.zmg || { precio: "consultar", tiempo: "1-3 dias" };
  const horario = (cat.negocio || cat.meta || {}).horario || "Lun-Sab 8am-6pm";
  return allProds
    + "\nENVIOS: GDL/Zapopan $" + gdl.precio + " (" + gdl.tiempo + ")"
    + " | ZMG $" + zmg.precio + " (" + zmg.tiempo + ")"
    + (e.gratis_desde ? " | Gratis +$" + e.gratis_desde : "") + " | " + horario;
}
let CATALOG     = loadCatalog();
let CATALOG_TXT = buildCatalogText(CATALOG);

function getCatalog() { return CATALOG; }

setInterval(async () => {
  try {
    CATALOG     = loadCatalog();
    await loadPriorityProducts();
    CATALOG_TXT = buildCatalogText(CATALOG);
    console.log('[CAT\u00c1LOGO] Recargado');
  } catch (e) { console.error('[CAT\u00c1LOGO]', e.message); }
}, 60 * 60 * 1000);

// ─────────────────────────────────────────────────
//  CONTACTOS (nombres personalizados WhatsApp)
// ─────────────────────────────────────────────────
const CONTACTS = {
  // 'whatsapp:+52XXXXXXXXXX': 'Nombre',
};

function getContactName(from) { return CONTACTS[from] || null; }

// ─────────────────────────────────────────────────
//  HANDOFF A ASESOR HUMANO
// ─────────────────────────────────────────────────
const _handoffMap = new Map();
const HANDOFF_TTL = 30 * 60 * 1000;

function isHandoffTrigger(msg) {
  var m = msg.toLowerCase()
    .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i')
    .replace(/[óòö]/g,'o').replace(/[úùü]/g,'u').replace(/[¿¡!?.,]/g,'').trim();
  var triggers = [
    'quiero hablar con alguien','necesito un asesor','hablar con humano',
    'hablar con una persona','hablar con alguien','no me ayudas',
    'quiero un asesor','pasame con un asesor','comuniquenme con alguien',
    'asesor humano','atencion humana','agente real',
    'manager','gerente','supervisor','quiero hablar con un humano',
    'no me sirve el bot','no me entiendes','no entiendes'
  ];
  for (var i = 0; i < triggers.length; i++) {
    if (m.includes(triggers[i])) return true;
  }
  return false;
}

function isInHandoff(clientKey) {
  var entry = _handoffMap.get(clientKey);
  if (!entry) return false;
  if (Date.now() - entry.ts > HANDOFF_TTL) {
    _handoffMap.delete(clientKey);
    return false;
  }
  return true;
}

async function activateHandoff(clientKey, clientName, clientPhone, lastMessage, history) {
  _handoffMap.set(clientKey, { ts: Date.now() });
  console.log('[HANDOFF] Activado para', clientKey, '- asesor humano por 30 min');
  // Notificar al vendedor
  var vendorPhone = process.env.VENDOR_WHATSAPP || '';
  if (!vendorPhone) return;
  var summary = (history || []).filter(function(h) { return h.role === 'user'; })
    .slice(-3).map(function(h) { return '\u2022 ' + (h.content || '').substring(0, 80); }).join('\n');
  var notif = '\ud83d\udea8 *HANDOFF — Cliente solicita asesor*\n\n'
    + '\ud83d\udc64 ' + (clientName || 'Sin nombre') + '\n'
    + '\ud83d\udcf1 ' + clientPhone + '\n'
    + '\ud83d\udcac \u00daltimo mensaje: "' + (lastMessage || '').substring(0, 200) + '"\n'
    + (summary ? '\n\ud83d\udcdd Resumen conversaci\u00f3n:\n' + summary : '')
    + '\n\n\u23f0 El bot se pausa 30 min para este cliente.';
  try {
    var { sendMetaWAMessage } = require('./meta');
    await sendMetaWAMessage(vendorPhone.replace('+',''), notif);
  } catch (e) { console.error('[HANDOFF] Error notificando vendor:', e.message); }
}

// ─────────────────────────────────────────────────
//  SYSTEM PROMPT
// ─────────────────────────────────────────────────
var SINONIMOS_TXT = 'SIN\u00d3NIMOS Y EQUIVALENCIAS (interpreta el lenguaje del cliente):\n'
  + '- losa, azotea, techo, gotera, filtraci\u00f3n, humedad en techo \u2192 Impermeabilizantes acr\u00edlicos / asf\u00e1lticos / base poliuretano\n'
  + '- manto, membrana, fieltro \u2192 Sika Imper Mantos / Membranas prefabricadas de Impermeabilizaci\u00f3n\n'
  + '- junta, grieta, fisura, crack \u2192 Sellos para juntas impermeables / Sellado de juntas y adhesivos el\u00e1sticos\n'
  + '- pega azulejo, pega cer\u00e1mica, pega piso, adhesivo cer\u00e1mica \u2192 Morteros adhesivos y emboquilladores\n'
  + '- boquilla, fragua, jechadura \u2192 Morteros adhesivos y emboquilladores\n'
  + '- ep\u00f3xico, epoxi, pegamento estructural \u2192 Adhesivos ep\u00f3xicos\n'
  + '- ancla, taquete qu\u00edmico, perno \u2192 Anclajes\n'
  + '- grout, lechada, relleno columna \u2192 Grouts cementosos / Grouts Polim\u00e9ricos\n'
  + '- aditivo concreto, acelerante, retardante, impermeabilizante integral \u2192 Aditivos para cemento y mortero / Aditivos y adiciones para concreto\n'
  + '- nivelador, autonivelante, piso parejo \u2192 Niveladores Cement\u00edcios\n'
  + '- piso industrial, piso de bodega, endurecedor \u2192 Endurecedores superficiales para pisos\n'
  + '- piso ep\u00f3xico, recubrimiento ep\u00f3xico \u2192 Resinas Ep\u00f3xicas para pisos y recubrimientos\n'
  + '- poliuretano piso, recubrimiento PU \u2192 Resinas Base Poliuretano para pisos y recubrimientos\n'
  + '- cancha, pista, piso deportivo, hule \u2192 Resina Base Acrilica para canchas deportivas\n'
  + '- protecci\u00f3n concreto, pintura concreto, sellador \u2192 Protecci\u00f3n de concreto y mamposteria\n'
  + '- reparaci\u00f3n concreto, parche, resane \u2192 Morteros para reparaci\u00f3n y protecci\u00f3n de concreto\n'
  + '- carretera, junta expansion, pavimento \u2192 Sellado de juntas, especialidad carreteras\n'
  + '- diluyente, limpiador, rodillo, esp\u00e1tula \u2192 Complementos para aplicaci\u00f3n de pisos industriales\n';

function buildSystemPrompt(clientName, channel, nivelInfo) {
  channel = channel || 'WhatsApp';
  const saludo  = clientName ? 'El cliente se llama ' + clientName + '. Úsalo solo al saludar.' : '';
  const formato = channel === 'comment'
    ? 'Comentario público FB. Máximo 2 líneas. Invita a escribir por Messenger o WhatsApp.'
    : 'Máximo 4 líneas por respuesta.';
  const d = CATALOG.descuentos_volumen;
  const catalogTxt = nivelInfo ? buildCatalogText(CATALOG, nivelInfo) : CATALOG_TXT;
  const nivelLabel = nivelInfo && nivelInfo.nivel > 1 ? etiquetaNivel(nivelInfo.nivel) : null;
  const nivelMsg   = nivelLabel ? '- Este cliente tiene nivel ' + nivelLabel + '. Precios ya incluyen descuento.\n' : '';
  return 'Eres asesor de ' + CATALOG.negocio.nombre + ' (' + CATALOG.negocio.ciudad + '). Canal: ' + channel + '. Fecha actual: ' + new Date().toLocaleDateString('es-MX', {weekday:'long',year:'numeric',month:'long',day:'numeric',timeZone:'America/Mexico_City'}) + '.\n'
    + (saludo ? saludo + '\n' : '')
    + '\nCATÁLOGO (precios para este cliente):\n' + catalogTxt
    + '\n' + SINONIMOS_TXT
    + '\n\nREGLAS:\n'
    + '- ' + formato + '\n'
    + nivelMsg
    + '- Cada precio es por pieza/presentacion completa, NO por litro ni kg\n'
    + '- Si dan m²: calcula unidades +10% desperdicio y subtotal SIN envio\n'
    + '- NO incluyas costo de envio en cotizaciones — el envio se agrega solo si el cliente elige entrega a domicilio\n'
    + '- Proyecto >$' + d.umbral_pesos + ': ' + d.mensaje + '\n'
    + '- Asesor humano: "Te contactamos al ' + CATALOG.negocio.telefono + '"\n'
    + '- Al cotizar termina SIEMPRE con: ¿Hacemos el pedido?\n'
    + '- SOLO cotiza productos que existen EXACTAMENTE en el catálogo. Si no existe, di que no está disponible y ofrece alternativas del catálogo real.\n'
    + '- NUNCA cierres ni confirmes un pedido tú mismo. Cuando el cliente dice sí/confirma/seria todo → responde SOLO: ¿Hacemos el pedido? El sistema se encarga del resto.\n'
    + '- NUNCA menciones costo de envío en cotizaciones. El envío se determina después de elegir tipo de entrega.\n'
    + '- NUNCA uses tablas markdown (|col|) — WhatsApp no las renderiza. Usa listas con guión o asterisco.\n'
    + '- Formato cotización: *NxNombre*: N × $precio = *$total*\n'
    + '- Si el cliente responde "no", "nada", "gracias", "estoy bien", "es todo", "nada más" u otra frase de cierre después de "¿algo más?", despídete cálidamente SIN hacer otra pregunta. Ejemplo: "\u00a1Perfecto ' + (clientName || '') + '! Fue un placer atenderte. \u00a1Hasta pronto! \uD83D\uDC4B"\n';
}

// ─────────────────────────────────────────────────
//  CACHÉ DE RESPUESTAS FRECUENTES
// ─────────────────────────────────────────────────
function getCache(msg, clientName) {
  const key = msg.toLowerCase()
    .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i')
    .replace(/[óòö]/g,'o').replace(/[úùü]/g,'u').replace(/[¿¡!?.,]/g,'').trim();
  const n = clientName ? ', ' + clientName : '';
  const e = CATALOG.envios;
  const map = {
    'hola':          '¡Hola' + n + '! Soy el asesor de ' + CATALOG.negocio.nombre + ' 👋 ¿Qué material necesitas cotizar?',
    'buenos dias':   '¡Buenos días' + n + '! ¿Qué material necesitas?',
    'buenas tardes': '¡Buenas tardes' + n + '! ¿En qué te ayudo?',
    'buenas noches': '¡Buenas noches' + n + '! ¿Qué cotizas?',
    'gracias':       '¡Con gusto! ¿Algo más en lo que te pueda ayudar?',
    'horario':       'Atendemos ' + CATALOG.negocio.horario + '. El bot responde 24/7.',
    'envio':         'GDL/Zapopan $' + e.gdl_zapopan.precio + ' (' + e.gdl_zapopan.tiempo + '). ZMG $' + e.zmg.precio + '. Gratis +$' + e.gratis_desde + '.',
    'envío':         'GDL/Zapopan $' + e.gdl_zapopan.precio + ' (' + e.gdl_zapopan.tiempo + '). ZMG $' + e.zmg.precio + '. Gratis +$' + e.gratis_desde + '.',
    'direccion':     'Estamos en ' + CATALOG.negocio.ciudad + '. Te mando ubicación al confirmar tu pedido.',
    'dirección':     'Estamos en ' + CATALOG.negocio.ciudad + '. Te mando ubicación al confirmar tu pedido.',
  };
  return map[key] || null;
}

// ─────────────────────────────────────────────────
//  SESIONES EN MEMORIA (historial conversacional)
// ─────────────────────────────────────────────────
const sessions = new Map();
const TTL      = 4 * 60 * 60 * 1000;

function getHistory(key) {
  const s = sessions.get(key);
  if (!s || Date.now() - s.ts > TTL) return [];
  return s.history;
}

function saveHistory(key, history) {
  sessions.set(key, { history: history.slice(-8), ts: Date.now() });
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of sessions) if (now - v.ts > TTL) sessions.delete(k);
}, 60 * 60 * 1000);

// ─────────────────────────────────────────────────
//  PROCESADORES MULTIMEDIA
// ─────────────────────────────────────────────────
async function downloadMedia(url) {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    auth: { username: process.env.TWILIO_ACCOUNT_SID, password: process.env.TWILIO_AUTH_TOKEN }
  });
  return { buffer: Buffer.from(res.data), contentType: res.headers['content-type'] };
}

async function transcribeAudio(url) {
  try {
    const { buffer, contentType } = await downloadMedia(url);
    const ext  = contentType.includes('ogg') ? 'ogg' : contentType.includes('mp4') ? 'mp4' : 'mp3';
    const form = new FormData();
    form.append('file', buffer, { filename: 'audio.' + ext, contentType });
    form.append('model', 'whisper-1');
    form.append('language', 'es');
    const res = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
      headers: { ...form.getHeaders(), 'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY }
    });
    return '[Nota de voz]: "' + res.data.text + '"';
  } catch (_) { return '[Nota de voz no procesada. Por favor escribe tu mensaje.]'; }
}

async function analyzeImage(url, caption) {
  const { buffer, contentType } = await downloadMedia(url);
  const mime = contentType.includes('png') ? 'image/png' : contentType.includes('webp') ? 'image/webp' : 'image/jpeg';
  const res  = await aiClient.messages.create({
    model: 'claude-haiku-4-5-20251001', max_tokens: 400,
    system: buildSystemPrompt(null, 'WhatsApp'),
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: mime, data: buffer.toString('base64') } },
      { type: 'text',  text: caption ? 'Cliente envió imagen: "' + caption + '"' : 'Analiza esta imagen de material.' }
    ]}]
  });
  return res.content[0].text;
}

async function processPDF(url) {
  try {
    const { buffer } = await downloadMedia(url);
    const res = await aiClient.messages.create({
      model: 'claude-haiku-4-5-20251001', max_tokens: 500,
      system: buildSystemPrompt(null, 'WhatsApp'),
      messages: [{ role: 'user', content: [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: buffer.toString('base64') } },
        { type: 'text', text: 'Lista de materiales en PDF. Cotiza cada producto con precio y total.' }
      ]}]
    });
    return res.content[0].text;
  } catch (_) { return 'No pude leer el PDF. Escribe la lista aquí y la proceso.'; }
}

async function processExcel(url) {
  try {
    const { buffer } = await downloadMedia(url);
    const wb   = XLSX.read(buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
    return '[Lista Excel]:\n' + data.substring(0, 2000);
  } catch (_) { return 'No pude leer el Excel. Manda la lista en PDF o escríbela aquí.'; }
}

async function processMedia(req) {
  if (parseInt(req.body.NumMedia || '0') === 0) return null;
  const type    = req.body.MediaContentType0 || '';
  const url     = req.body.MediaUrl0 || '';
  const caption = (req.body.Body || '').trim();
  if (type.includes('audio') || type.includes('ogg'))                            return transcribeAudio(url);
  if (type.includes('image'))                                                     return analyzeImage(url, caption);
  if (type.includes('pdf'))                                                       return processPDF(url);
  if (type.includes('sheet') || type.includes('excel') || type.includes('xlsx')) return processExcel(url);
  return null;
}

// ─────────────────────────────────────────────────
//  CLAUDE IA
// ─────────────────────────────────────────────────
async function getAIResponse(userMessage, history, clientName, channel, nivelInfo) {
  const res = await aiClient.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: channel === 'comment' ? 150 : 300,
    system:     buildSystemPrompt(clientName, channel, nivelInfo),
    messages:   [...history, { role: 'user', content: userMessage }]
  });
  return res.content[0].text;
}

// ─────────────────────────────────────────────────
//  ENVÍO DE MENSAJES
// ─────────────────────────────────────────────────
async function sendWA(to, body) {
  await twClient.messages.create({ from: process.env.TWILIO_WHATSAPP_FROM, to, body });
}

async function sendToClient(sessionKey, text) {
  await sendWA(sessionKey.replace('order:', ''), text);
}

function isQuoteResponse(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return (lower.includes('$') && (lower.includes('bolsa') || lower.includes('cubeta') || lower.includes('total')))
      || lower.includes('subtotal') || lower.includes('cotización');
}

// ─────────────────────────────────────────────────
//  WEBHOOK — WHATSAPP
// ─────────────────────────────────────────────────
app.post('/webhook/whatsapp', async (req, res) => {
  const from     = req.body.From || '';
  const textBody = (req.body.Body || '').trim();
  const hasMedia = parseInt(req.body.NumMedia || '0') > 0;

  res.type('text/xml').send('<Response></Response>'); // ACK inmediato

  const t0   = Date.now();
  const name = getContactName(from);

  try {
    // ── CRM: registrar contacto y logear mensaje ──
    const cliente = await registrarContacto(from, { nombre: name, canal: 'whatsapp' }).catch(e => { console.error('[CRM] registrarContacto FAILED:', e.message); return null; });
    if (cliente && textBody) {
      logMensaje(cliente.id, 'whatsapp', 'in', textBody, hasMedia ? 'media' : 'texto').catch(() => {});
    }

    // ── 1. Respuesta del VENDEDOR ─────────────────
    if (isVendorNumber(from) && textBody) {
      const handled = await processVendorReply(textBody, sendToClient);
      if (handled) return;
    }

    // ── 1b. Handoff a asesor humano ────────────────
    if (isInHandoff(from)) return;
    if (textBody && isHandoffTrigger(textBody)) {
      const history = getHistory('wa:' + from);
      await activateHandoff(from, name, from, textBody, history);
      await sendWA(from, 'Entiendo, te conecto con un asesor ahora mismo. En unos minutos te contactar\u00e1 nuestro equipo. \ud83d\ude4b');
      return;
    }

    let message = textBody;
    let reply   = null;

    // ── 2. Multimedia ─────────────────────────────
    if (hasMedia) {
      const media = await processMedia(req);
      if (media) message = media;
    }

    // ── 3. Caché instantáneo ──────────────────────
    if (!hasMedia && textBody) reply = getCache(textBody, name);

    // ── 3b. Intercept campa\u00f1a "S\u00ed, me interesa" ──
    if (!reply && textBody && /^s[i\u00ed],?\s*me\s+interesa$/i.test(textBody.trim())) {
      try {
        var _catEmojis = { impermeabilizantes:'\uD83C\uDFE0', morteros:'\uD83E\uDDF1', selladores:'\uD83D\uDD27', adhesivos:'\uD83E\uDDEA', pisos:'\uD83C\uDFD7\uFE0F', anclajes:'\u2693', aditivos:'\u2697\uFE0F', grouts:'\uD83C\uDFDB\uFE0F', complementos:'\uD83D\uDEE0\uFE0F' };
        var _ofertas = await query(
          "SELECT categoria, nombre, precio_venta, precio_oferta FROM catalogo_productos WHERE en_oferta=true AND activo=true ORDER BY categoria, nombre"
        );
        if (_ofertas && _ofertas.rows && _ofertas.rows.length > 0) {
          var _cats = {};
          for (var _o of _ofertas.rows) {
            var _cat = _o.categoria || 'Otros';
            if (!_cats[_cat]) _cats[_cat] = [];
            _cats[_cat].push(_o);
          }
          var _msg = '\uD83D\uDD25 \u00a1Hola ' + (name || '') + '! Aqu\u00ed est\u00e1n nuestras promociones de esta semana:\n\n';
          var _n = 1;
          for (var _catName in _cats) {
            var _emojiKey = Object.keys(_catEmojis).find(function(k) { return _catName.toLowerCase().indexOf(k) !== -1; });
            var _emoji = _emojiKey ? _catEmojis[_emojiKey] : '\uD83D\uDCE6';
            _msg += _emoji + ' *' + _n + '. ' + _catName + '*\n';
            for (var _p of _cats[_catName]) {
              var _pv = Number(_p.precio_venta).toLocaleString('es-MX');
              var _po = Number(_p.precio_oferta).toLocaleString('es-MX');
              _msg += '  \u2022 ' + _p.nombre + ' ~~$' + _pv + '~~ \u2192 *$' + _po + '*\n';
            }
            _msg += '\n';
            _n++;
          }
          _msg += '\u00bfQu\u00e9 categor\u00eda te interesa? Responde el n\u00famero o escr\u00edbeme qu\u00e9 necesitas.';
          reply = _msg;
        }
      } catch (_e) { console.error('[CAMPAIGN INTEREST]', _e.message); }
    }

    // ── 4. Flujo de pedido ────────────────────────
    if (!reply && !hasMedia && textBody) {
      reply = await processOrderFlow(
        from, textBody, name, getLastQuote(from), sendToClient,
        CATALOG.negocio.nombre
      );
    }

    // ── 5. Solicitud de PDF ───────────────────────
    if (!reply && !hasMedia && textBody && isPDFRequest(textBody)) {
      const lastQ = getLastQuote(from);
      if (lastQ) {
        await sendWA(from, 'Generando tu cotización en PDF... 📄 La recibirás en unos segundos.');
        generateAndSendQuote({
          clientFrom: from, clientName: name, clientPhone: from,
          quoteText: lastQ, catalog: CATALOG,
          entrega: { tipo: 'pickup' }, metodoPago: null,
        }).then(async result => {
          // Guardar cotización en CRM
          if (result && cliente) {
            const cotId = await guardarCotizacion(from, result.quoteNumber, [], result.total, result.pdfUrl, 'whatsapp').catch(e => { console.error('[COT]', e.message); return null; });
            if (cotId) await programarSeguimiento(from, cotId).catch(() => {});
          }
        }).catch(e => console.error('[PDF]', e.message));
        return;
      } else {
        reply = 'Primero dime qué productos necesitas, te hago la cotización y luego te la mando en PDF. 📄';
      }
    }

    // ── 6. Pregunta técnica ───────────────────────
    if (!reply && !hasMedia && textBody && isTechnicalQuestion(textBody)) {
      const techReply = await getTechnicalInfo(textBody, CATALOG.productos, aiClient).catch(e => {
        console.error('[TÉCNICO]', e.message); return null;
      });
      if (techReply) reply = techReply;
    }

    // ── 7. Claude IA general ──────────────────────
    // BUG P FIX: no responder si timer acaba de confirmar el pedido
    const _orderKey = 'order:' + from;
    if (recentlyConfirmed.has(_orderKey)) { reply = null; }
    if (!reply) {
      const history = getHistory('wa:' + from);
      const _nivelWA = cliente ? await getNivelPrecio(from).catch(() => null) : null;
      reply = await getAIResponse(message, history, name, 'WhatsApp', _nivelWA);
      // Guardar cotización si aplica
      if (isQuoteResponse(reply)) saveLastQuote(from, reply.substring(0, 1200)); // FIX: 400→1200 para capturar productos completos
      saveHistory('wa:' + from, [...history,
        { role: 'user',      content: message },
        { role: 'assistant', content: reply   }
      ]);
    }

    if (!reply) return;

    // Enviar y loguear respuesta
    await sendWA(from, reply);
    if (cliente) logMensaje(cliente.id, 'whatsapp', 'out', reply, 'texto').catch(() => {});
    console.log('[WA]', (Date.now()-t0) + 'ms', name || from, '>', reply.substring(0, 60));

  } catch (err) {
    console.error('[WA ERR]', err.message);
    sendWA(from, 'Disculpa, hubo un error técnico. Intenta de nuevo en un momento.').catch(() => {});
  }
});

// ─────────────────────────────────────────────────
//  WEBHOOK — FACEBOOK + INSTAGRAM
// ─────────────────────────────────────────────────
app.get('/webhook/meta', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.META_VERIFY_TOKEN) {
    res.status(200).send(req.query['hub.challenge']);
  } else { res.sendStatus(403); }
});

app.post('/webhook/meta', async (req, res) => {
  res.sendStatus(200);
  try {
    await processMetaWebhook(req.body, getAIResponse, getHistory, saveHistory, getCatalog, getCache, isQuoteResponse, { isInHandoff, isHandoffTrigger, activateHandoff });
  } catch (err) { console.error('[META ERR]', err.message); }
});

// ─────────────────────────────────────────────────
//  HEALTH CHECK
// ─────────────────────────────────────────────────
app.get('/', (req, res) => res.json({
  status:    'online',
  version:   'v10-enterprise',
  bot:       CATALOG.negocio.nombre,
  canales:   ['WhatsApp', 'Facebook Messenger', 'Instagram Direct', 'Facebook Comments'],
  modulos:   ['CRM-PostgreSQL', 'Inventario', 'Dashboard', 'Scheduler', 'Campañas', 'PDF', 'Técnico', 'Pedidos'],
  productos: CATALOG.productos.filter(p => p.activo).length,
  sessions:  sessions.size,
  uptime:    Math.floor(process.uptime()) + 's',
  memory:    Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
}));

// ─────────────────────────────────────────────────
//  ARRANQUE
// ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

// ── Keep-Alive ping ──────────────────────────────
app.get('/ping', (_, res) => res.json({ ok: true, ts: new Date().toISOString() }));

(async () => {
  // Inicializar base de datos ANTES de aceptar conexiones
  try {
    await initSchema();
    await initActiveOrders();
    await syncFromCatalog(CATALOG.productos);
    await loadPriorityProducts();
    CATALOG_TXT = buildCatalogText(CATALOG);
    console.log('\u2705 Base de datos lista');
  } catch (e) {
    console.warn('\u26a0\ufe0f  DB no disponible (modo sin DB):', e.message);
  }

  app.listen(PORT, () => {
    console.log('\ud83d\ude80 ' + CATALOG.negocio.nombre + ' Enterprise v10 \u2192 puerto ' + PORT);
    console.log('\ud83d\udce6 Productos:', CATALOG.productos.filter(p => p.activo).length);
    console.log('\ud83d\uddc4\ufe0f  Dashboard: /dashboard');

    // Iniciar tareas programadas
    try {
      initScheduler();
    } catch (e) {
      console.warn('\u26a0\ufe0f  Scheduler:', e.message);
    }

    // Warmup Claude API
    aiClient.messages.create({
      model: 'claude-haiku-4-5-20251001', max_tokens: 5,
      messages: [{ role: 'user', content: 'ok' }]
    }).then(() => console.log('\u2705 Claude API pre-calentada'))
      .catch(e => console.warn('\u26a0\ufe0f  Warmup:', e.message));
  });
})();

module.exports = { getCatalog, getAIResponse, buildSystemPrompt };


