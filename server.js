// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  MaterialesPro GDL â€” Bot ENTERPRISE v10
//  WhatsApp Â· Facebook Â· Instagram Â· FB Comments
//  CRM PostgreSQL Â· Inventario Â· Dashboard Â· Scheduler Â· CampaÃ±as
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

require('dotenv').config();
const express   = require('express');
const twilio    = require('twilio');
const Anthropic = require('@anthropic-ai/sdk');
const axios     = require('axios');
const FormData  = require('form-data');
const XLSX      = require('xlsx');
const fs        = require('fs');
const pathMod   = require('path');

// â”€â”€ MÃ³dulos del sistema â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const { initSchema, upsertCliente, getCliente, logMensaje } = require('./db');
const { registrarContacto, actualizarZona, guardarCotizacion,
        guardarPedido, actualizarEstadoPedido,
        programarSeguimiento, logConversacion }              = require('./crm');
const { syncFromCatalog, verificarStock }                    = require('./inventario');
const { initScheduler }                                      = require('./scheduler');
const { processMetaWebhook }                                 = require('./meta');
const { isTechnicalQuestion, getTechnicalInfo }              = require('./tecnico');
const { processOrderFlow, processVendorReply,
        isVendorNumber, saveLastQuote, getLastQuote }        = require('./pedido');
const { generateAndSendQuote, isPDFRequest }                 = require('./cotizacion');
const dashboardApi                                           = require('./dashboard/api');

// â”€â”€ Singletons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const app      = express();
const aiClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const twClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// â”€â”€ Dashboard estÃ¡tico â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use('/dashboard', express.static(pathMod.join(__dirname, 'dashboard')));
app.get('/dashboard', (_, res) => res.sendFile(pathMod.join(__dirname, 'dashboard/index.html')));
app.use('/api', dashboardApi);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  CATÃLOGO DINÃMICO
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function loadCatalog() {
  return JSON.parse(fs.readFileSync(pathMod.join(__dirname, 'catalogo.json'), 'utf8'));
}

function buildCatalogText(cat) {
  const prods = cat.productos.filter(p => p.activo)
    .map(p => p.nombre + ' $' + p.precio + '/' + p.presentacion + ' Â· ' + p.rendimiento_nota)
    .join('\n- ');
  const e = cat.envios;
  return '- ' + prods
    + '\nENVÃOS: GDL/Zapopan $' + e.gdl_zapopan.precio + ' (' + e.gdl_zapopan.tiempo + ')'
    + ' | ZMG $' + e.zmg.precio + ' (' + e.zmg.tiempo + ')'
    + ' | Gratis +$' + e.gratis_desde + ' | AlmacÃ©n gratis mismo dÃ­a | ' + cat.negocio.horario;
}

let CATALOG     = loadCatalog();
let CATALOG_TXT = buildCatalogText(CATALOG);

function getCatalog() { return CATALOG; }

setInterval(() => {
  try {
    CATALOG     = loadCatalog();
    CATALOG_TXT = buildCatalogText(CATALOG);
    console.log('[CATÃLOGO] Recargado');
  } catch (e) { console.error('[CATÃLOGO]', e.message); }
}, 60 * 60 * 1000);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  CONTACTOS (nombres personalizados WhatsApp)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CONTACTS = {
  // 'whatsapp:+52XXXXXXXXXX': 'Nombre',
};

function getContactName(from) { return CONTACTS[from] || null; }

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  SYSTEM PROMPT
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildSystemPrompt(clientName, channel) {
  channel = channel || 'WhatsApp';
  const saludo  = clientName ? 'El cliente se llama ' + clientName + '. Ãšsalo solo al saludar.' : '';
  const formato = channel === 'comment'
    ? 'Comentario pÃºblico FB. MÃ¡ximo 2 lÃ­neas. Invita a escribir por Messenger o WhatsApp.'
    : 'MÃ¡ximo 4 lÃ­neas por respuesta.';
  const d = CATALOG.descuentos_volumen;
  return 'Eres asesor de ' + CATALOG.negocio.nombre + ' (' + CATALOG.negocio.ciudad + '). Canal: ' + channel + '.\n'
    + (saludo ? saludo + '\n' : '')
    + '\nCATÃLOGO:\n' + CATALOG_TXT
    + '\n\nREGLAS:\n'
    + '- ' + formato + '\n'
    + '- Si dan mÂ²: calcula unidades +10% desperdicio, total y envÃ­o\n'
    + '- Proyecto >$' + d.umbral_pesos + ': ' + d.mensaje + '\n'
    + '- Asesor humano: "Te contactamos al ' + CATALOG.negocio.telefono + '"\n'
    + '- Al cotizar termina con: Â¿Hacemos el pedido?';
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  CACHÃ‰ DE RESPUESTAS FRECUENTES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getCache(msg, clientName) {
  const key = msg.toLowerCase()
    .replace(/[Ã¡Ã Ã¤]/g,'a').replace(/[Ã©Ã¨Ã«]/g,'e').replace(/[Ã­Ã¬Ã¯]/g,'i')
    .replace(/[Ã³Ã²Ã¶]/g,'o').replace(/[ÃºÃ¹Ã¼]/g,'u').replace(/[Â¿Â¡!?.,]/g,'').trim();
  const n = clientName ? ', ' + clientName : '';
  const e = CATALOG.envios;
  const map = {
    'hola':          'Â¡Hola' + n + '! Soy el asesor de ' + CATALOG.negocio.nombre + ' ðŸ‘‹ Â¿QuÃ© material necesitas cotizar?',
    'buenos dias':   'Â¡Buenos dÃ­as' + n + '! Â¿QuÃ© material necesitas?',
    'buenas tardes': 'Â¡Buenas tardes' + n + '! Â¿En quÃ© te ayudo?',
    'buenas noches': 'Â¡Buenas noches' + n + '! Â¿QuÃ© cotizas?',
    'gracias':       'Â¡Con gusto! Â¿Algo mÃ¡s en lo que te pueda ayudar?',
    'horario':       'Atendemos ' + CATALOG.negocio.horario + '. El bot responde 24/7.',
    'envio':         'GDL/Zapopan $' + e.gdl_zapopan.precio + ' (' + e.gdl_zapopan.tiempo + '). ZMG $' + e.zmg.precio + '. Gratis +$' + e.gratis_desde + '.',
    'envÃ­o':         'GDL/Zapopan $' + e.gdl_zapopan.precio + ' (' + e.gdl_zapopan.tiempo + '). ZMG $' + e.zmg.precio + '. Gratis +$' + e.gratis_desde + '.',
    'direccion':     'Estamos en ' + CATALOG.negocio.ciudad + '. Te mando ubicaciÃ³n al confirmar tu pedido.',
    'direcciÃ³n':     'Estamos en ' + CATALOG.negocio.ciudad + '. Te mando ubicaciÃ³n al confirmar tu pedido.',
  };
  return map[key] || null;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  SESIONES EN MEMORIA (historial conversacional)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  PROCESADORES MULTIMEDIA
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      { type: 'text',  text: caption ? 'Cliente enviÃ³ imagen: "' + caption + '"' : 'Analiza esta imagen de material.' }
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
  } catch (_) { return 'No pude leer el PDF. Escribe la lista aquÃ­ y la proceso.'; }
}

async function processExcel(url) {
  try {
    const { buffer } = await downloadMedia(url);
    const wb   = XLSX.read(buffer, { type: 'buffer' });
    const data = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
    return '[Lista Excel]:\n' + data.substring(0, 2000);
  } catch (_) { return 'No pude leer el Excel. Manda la lista en PDF o escrÃ­bela aquÃ­.'; }
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  CLAUDE IA
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function getAIResponse(userMessage, history, clientName, channel) {
  const res = await aiClient.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: channel === 'comment' ? 150 : 300,
    system:     buildSystemPrompt(clientName, channel),
    messages:   [...history, { role: 'user', content: userMessage }]
  });
  return res.content[0].text;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  ENVÃO DE MENSAJES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      || lower.includes('subtotal') || lower.includes('cotizaciÃ³n');
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  WEBHOOK â€” WHATSAPP
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.post('/webhook/whatsapp', async (req, res) => {
  const from     = req.body.From || '';
  const textBody = (req.body.Body || '').trim();
  const hasMedia = parseInt(req.body.NumMedia || '0') > 0;

  res.type('text/xml').send('<Response></Response>'); // ACK inmediato

  const t0   = Date.now();
  const name = getContactName(from);

  try {
    // â”€â”€ CRM: registrar contacto y logear mensaje â”€â”€
    const cliente = await registrarContacto(from, { nombre: name, canal: 'whatsapp' }).catch(() => null);
    if (cliente && textBody) {
      logMensaje(cliente.id, 'whatsapp', 'in', textBody, hasMedia ? 'media' : 'texto').catch(() => {});
    }

    // â”€â”€ 1. Respuesta del VENDEDOR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (isVendorNumber(from) && textBody) {
      const handled = await processVendorReply(textBody, sendToClient);
      if (handled) return;
    }

    let message = textBody;
    let reply   = null;

    // â”€â”€ 2. Multimedia â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (hasMedia) {
      const media = await processMedia(req);
      if (media) message = media;
    }

    // â”€â”€ 3. CachÃ© instantÃ¡neo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (!hasMedia && textBody) reply = getCache(textBody, name);

    // â”€â”€ 4. Flujo de pedido â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (!reply && !hasMedia && textBody) {
      reply = await processOrderFlow(
        from, textBody, name, getLastQuote(from), sendToClient,
        CATALOG.negocio.nombre
      );
    }

    // â”€â”€ 5. Solicitud de PDF â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (!reply && !hasMedia && textBody && isPDFRequest(textBody)) {
      const lastQ = getLastQuote(from);
      if (lastQ) {
        await sendWA(from, 'Generando tu cotizaciÃ³n en PDF... ðŸ“„ La recibirÃ¡s en unos segundos.');
        generateAndSendQuote({
          clientFrom: from, clientName: name, clientPhone: from,
          quoteText: lastQ, catalog: CATALOG,
          entrega: { tipo: 'pickup' }, metodoPago: null,
        }).then(async result => {
          // Guardar cotizaciÃ³n en CRM
          if (result && cliente) {
            const cotId = await guardarCotizacion(from, result.quoteNumber, [], result.total, result.pdfUrl, 'whatsapp').catch(() => null);
            if (cotId) await programarSeguimiento(from, cotId).catch(() => {});
          }
        }).catch(e => console.error('[PDF]', e.message));
        return;
      } else {
        reply = 'Primero dime quÃ© productos necesitas, te hago la cotizaciÃ³n y luego te la mando en PDF. ðŸ“„';
      }
    }

    // â”€â”€ 6. Pregunta tÃ©cnica â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (!reply && !hasMedia && textBody && isTechnicalQuestion(textBody)) {
      const techReply = await getTechnicalInfo(textBody, CATALOG.productos, aiClient).catch(e => {
        console.error('[TÃ‰CNICO]', e.message); return null;
      });
      if (techReply) reply = techReply;
    }

    // â”€â”€ 7. Claude IA general â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (!reply) {
      const history = getHistory('wa:' + from);
      reply = await getAIResponse(message, history, name, 'WhatsApp');
      // Guardar cotizaciÃ³n si aplica
      if (isQuoteResponse(reply)) saveLastQuote(from, reply.substring(0, 400));
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
    sendWA(from, 'Disculpa, hubo un error tÃ©cnico. Intenta de nuevo en un momento.').catch(() => {});
  }
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  WEBHOOK â€” FACEBOOK + INSTAGRAM
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get('/webhook/meta', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.META_VERIFY_TOKEN) {
    res.status(200).send(req.query['hub.challenge']);
  } else { res.sendStatus(403); }
});

app.post('/webhook/meta', async (req, res) => {
  res.sendStatus(200);
  try {
    await processMetaWebhook(req.body, getAIResponse, getHistory, saveHistory, getCatalog);
  } catch (err) { console.error('[META]', err.message); }
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  HEALTH CHECK
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get('/', (req, res) => res.json({
  status:    'online',
  version:   'v10-enterprise',
  bot:       CATALOG.negocio.nombre,
  canales:   ['WhatsApp', 'Facebook Messenger', 'Instagram Direct', 'Facebook Comments'],
  modulos:   ['CRM-PostgreSQL', 'Inventario', 'Dashboard', 'Scheduler', 'CampaÃ±as', 'PDF', 'TÃ©cnico', 'Pedidos'],
  productos: CATALOG.productos.filter(p => p.activo).length,
  sessions:  sessions.size,
  uptime:    Math.floor(process.uptime()) + 's',
  memory:    Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
}));

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  ARRANQUE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log('ðŸš€ ' + CATALOG.negocio.nombre + ' Enterprise v10 â†’ puerto ' + PORT);
  console.log('ðŸ“¦ Productos:', CATALOG.productos.filter(p => p.activo).length);
  console.log('ðŸ—„ï¸  Dashboard: /dashboard');

  // Inicializar base de datos
  try {
    await initSchema();
    await syncFromCatalog(CATALOG.productos);
    console.log('âœ… Base de datos lista');
  } catch (e) {
    console.warn('âš ï¸  DB no disponible (modo sin DB):', e.message);
  }

  // Iniciar tareas programadas
  try {
    initScheduler();
  } catch (e) {
    console.warn('âš ï¸  Scheduler:', e.message);
  }

  // Warmup Claude API
  aiClient.messages.create({
    model: 'claude-haiku-4-5-20251001', max_tokens: 5,
    messages: [{ role: 'user', content: 'ok' }]
  }).then(() => console.log('âœ… Claude API pre-calentada'))
    .catch(e => console.warn('âš ï¸  Warmup:', e.message));
});

module.exports = { getCatalog, getAIResponse, buildSystemPrompt };
