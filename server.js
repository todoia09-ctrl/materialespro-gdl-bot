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
const { initSchema, upsertCliente, getCliente, logMensaje } = require('./db');
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
  const prods = (cat.productos || []).filter(p => p.activo !== false)
    .map(p => {
      var _u = 'pza';
      var _n = p.nombre || '';
      // Si el nombre NO contiene presentación, usar unidad del catálogo
      if (!/ \(\d/.test(_n) && !/ \d+[,.]\d+ /.test(_n)) {
        _u = p.unidad || p.presentacion || 'pza';
      }
      var _c = p.categoria ? ' (' + p.categoria + ')' : '';
      return _n + " $" + precioNivel(p) + "/" + _u + _c;
    })
    .join("\n- ");
  const e = cat.envios || {};
  const gdl = e.gdl_zapopan || { precio: "consultar", tiempo: "1-2 dias" };
  const zmg = e.zmg || { precio: "consultar", tiempo: "1-3 dias" };
  const horario = (cat.negocio || cat.meta || {}).horario || "Lun-Sab 8am-6pm";
  return "- " + prods
    + "\nENVIOS: GDL/Zapopan $" + gdl.precio + " (" + gdl.tiempo + ")"
    + " | ZMG $" + zmg.precio + " (" + zmg.tiempo + ")"
    + (e.gratis_desde ? " | Gratis +$" + e.gratis_desde : "") + " | " + horario;
}
let CATALOG     = loadCatalog();
let CATALOG_TXT = buildCatalogText(CATALOG);

function getCatalog() { return CATALOG; }

setInterval(() => {
  try {
    CATALOG     = loadCatalog();
    CATALOG_TXT = buildCatalogText(CATALOG);
    console.log('[CATÁLOGO] Recargado');
  } catch (e) { console.error('[CATÁLOGO]', e.message); }
}, 60 * 60 * 1000);

// ─────────────────────────────────────────────────
//  CONTACTOS (nombres personalizados WhatsApp)
// ─────────────────────────────────────────────────
const CONTACTS = {
  // 'whatsapp:+52XXXXXXXXXX': 'Nombre',
};

function getContactName(from) { return CONTACTS[from] || null; }

// ─────────────────────────────────────────────────
//  SYSTEM PROMPT
// ─────────────────────────────────────────────────
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
    const cliente = await registrarContacto(from, { nombre: name, canal: 'whatsapp' }).catch(() => null);
    if (cliente && textBody) {
      logMensaje(cliente.id, 'whatsapp', 'in', textBody, hasMedia ? 'media' : 'texto').catch(() => {});
    }

    // ── 1. Respuesta del VENDEDOR ─────────────────
    if (isVendorNumber(from) && textBody) {
      const handled = await processVendorReply(textBody, sendToClient);
      if (handled) return;
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
            const cotId = await guardarCotizacion(from, result.quoteNumber, [], result.total, result.pdfUrl, 'whatsapp').catch(() => null);
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
    await processMetaWebhook(req.body, getAIResponse, getHistory, saveHistory, getCatalog, getCache, isQuoteResponse);
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


