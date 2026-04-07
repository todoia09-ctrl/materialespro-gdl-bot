// ══════════════════════════════════════════════════════════════
//  meta.js — Facebook + Instagram + WhatsApp Cloud API Handler
//  v13 — Pipeline completa + normalización número Meta→CRM
// ══════════════════════════════════════════════════════════════

const axios     = require('axios');
const Anthropic = require('@anthropic-ai/sdk');

const { logMensaje }                                           = require('./db');
const { registrarContacto, guardarCotizacion, programarSeguimiento, getNivelPrecio } = require('./crm');
const { processOrderFlow, getLastQuote, saveLastQuote } = require('./pedido');
const { isTechnicalQuestion, getTechnicalInfo }                = require('./tecnico');
const { generateAndSendQuote, isPDFRequest }                   = require('./cotizacion');

const META_API    = 'https://graph.facebook.com/v22.0';

// ── Deduplicación de mensajes Meta ──────────────
const _processedMsgIds = new Map();
function isDuplicate(msgId) {
  if (!msgId) return false;
  if (_processedMsgIds.has(msgId)) return true;
  _processedMsgIds.set(msgId, Date.now());
  return false;
}
setInterval(function() {
  var now = Date.now();
  var cutoff = now - 60 * 60 * 1000;
  for (var [id, ts] of _processedMsgIds) {
    if (ts < cutoff) _processedMsgIds.delete(id);
  }
}, 60 * 60 * 1000);
const WA_PHONE_ID = process.env.META_PHONE_NUMBER_ID;
const WA_TOKEN    = process.env.META_WHATSAPP_TOKEN;

const _aiClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─────────────────────────────────────────────────
//  NORMALIZAR NÚMERO Meta → formato CRM
//  Meta envía: 5213313469831
//  CRM espera: whatsapp:+5213313469831
// ─────────────────────────────────────────────────
function normalizarNumero(from) {
  const digits = String(from).replace(/\D/g, '');
  return 'whatsapp:+' + digits;
}

// ─────────────────────────────────────────────────
//  ENVIAR MENSAJE VIA WHATSAPP CLOUD API
// ─────────────────────────────────────────────────
async function sendMetaWAMessage(to, text) {
  try {
    const toClean = String(to).replace(/\D/g, '');
    const res = await axios.post(
      META_API + '/' + WA_PHONE_ID + '/messages',
      {
        messaging_product: 'whatsapp',
        recipient_type:    'individual',
        to:                toClean,
        type:              'text',
        text:              { preview_url: false, body: text.substring(0, 4096) }
      },
      {
        headers: {
          'Authorization': 'Bearer ' + WA_TOKEN,
          'Content-Type':  'application/json'
        }
      }
    );
    console.log('[META WA OUT]', toClean, '>', text.substring(0, 60));
    return res.data;
  } catch (err) {
    const errData = err.response && err.response.data && err.response.data.error;
    console.error('[META WA SEND ERR]', errData ? errData.message : err.message);
    throw err;
  }
}

// sendToClient compatible con processOrderFlow
function makeSendToClient(fromDigits) {
  return async function sendToClient(sessionKey, text) {
    const num = String(sessionKey).replace('order:', '').replace(/\D/g, '') || fromDigits;
    await sendMetaWAMessage(num, text);
  };
}

// ─────────────────────────────────────────────────
//  ENVIAR MENSAJE DIRECTO (Messenger / Instagram)
// ─────────────────────────────────────────────────
async function sendDM(recipientId, text, token) {
  try {
    await axios.post(
      META_API + '/me/messages',
      { recipient: { id: recipientId }, message: { text: text.substring(0, 2000) } },
      { params: { access_token: token } }
    );
  } catch (err) {
    console.error('[META DM ERR]', err.response && err.response.data && err.response.data.error ? err.response.data.error.message : err.message);
  }
}

// ─────────────────────────────────────────────────
//  RESPONDER COMENTARIO FB
// ─────────────────────────────────────────────────
async function replyComment(commentId, text, token) {
  try {
    await axios.post(
      META_API + '/' + commentId + '/comments',
      { message: text.substring(0, 8000) },
      { params: { access_token: token } }
    );
  } catch (err) {
    console.error('[META COMMENT ERR]', err.message);
  }
}

// ─────────────────────────────────────────────────
//  OBTENER NOMBRE DEL USUARIO DE META
// ─────────────────────────────────────────────────
async function getMetaName(userId, token) {
  try {
    const res = await axios.get(META_API + '/' + userId, {
      params: { fields: 'first_name,name', access_token: token }
    });
    return res.data.first_name || res.data.name || null;
  } catch (_) { return null; }
}

// ─────────────────────────────────────────────────
//  PIPELINE COMPLETA — WHATSAPP CLOUD API
// ─────────────────────────────────────────────────
async function processWhatsAppMessage(value, getAIResponse, getHistory, saveHistory, getCatalog, getCache, isQuoteResponse, handoff) {
  const messages = value.messages || [];
  const contacts = value.contacts || [];

  for (const msg of messages) {
    if (!['text', 'audio', 'image', 'document', 'button', 'interactive'].includes(msg.type)) continue;
    if (isDuplicate(msg.id)) { console.log('[META WA] Duplicado ignorado:', msg.id); continue; }

    const from        = msg.from;                    // ej: 5213313469831
    const fromNorm    = normalizarNumero(from);      // whatsapp:+5213313469831
    const contact     = contacts.find(function(c) { return c.wa_id === from; });
    const userName    = contact && contact.profile ? contact.profile.name : null;
    const firstName   = userName ? userName.split(' ')[0] : null;
    const catalog     = getCatalog();
    const sendToClient = makeSendToClient(from);

    let textContent = '';
    if (msg.type === 'text') {
      textContent = msg.text && msg.text.body ? msg.text.body : '';
    } else if (msg.type === 'audio') {
      textContent = '[Nota de voz recibida. Por favor escribe tu mensaje para atenderte mejor.]';
    } else if (msg.type === 'image') {
      const caption = msg.image && msg.image.caption ? msg.image.caption : '';
      textContent = caption ? '[Imagen recibida: "' + caption + '"]' : '[Imagen recibida. Que material necesitas?]';
    } else if (msg.type === 'document') {
      textContent = '[Documento recibido. Escribe la lista de materiales y la cotizo.]';
    } else if (msg.type === 'button') {
      textContent = msg.button && msg.button.text ? msg.button.text : '';
    } else if (msg.type === 'interactive') {
      if (msg.interactive && msg.interactive.button_reply) {
        textContent = msg.interactive.button_reply.title || '';
      } else if (msg.interactive && msg.interactive.list_reply) {
        textContent = msg.interactive.list_reply.title || '';
      }
    }

    if (!textContent) continue;

    console.log('[META WA IN]', from, userName ? '(' + userName + ')' : '', ':', textContent.substring(0, 60));

    try {
      // 1. CRM — usar número normalizado
      const cliente = await registrarContacto(fromNorm, { nombre: userName, canal: 'whatsapp_meta' }).catch(function() { return null; });
      if (cliente && textContent) logMensaje(cliente.id, 'whatsapp_meta', 'in', textContent, 'texto').catch(function() {});

      // 1b. Handoff a asesor humano
      if (handoff) {
        if (handoff.isInHandoff(fromNorm)) continue;
        if (textContent && handoff.isHandoffTrigger(textContent)) {
          var history = getHistory('meta-wa:' + from);
          await handoff.activateHandoff(fromNorm, userName, from, textContent, history);
          await sendMetaWAMessage(from, 'Entiendo, te conecto con un asesor ahora mismo. En unos minutos te contactar\u00e1 nuestro equipo. \ud83d\ude4b');
          continue;
        }
      }

      let reply = null;

      // 2. Cache
      if (getCache) reply = getCache(textContent, firstName);

      // 3. Flujo de pedido — usar número normalizado
      if (!reply) {
        reply = await processOrderFlow(
          fromNorm, textContent, firstName, getLastQuote(fromNorm), sendToClient,
          (catalog.negocio && catalog.negocio.nombre) || 'MaterialesPro GDL'
        );
      }

      // 4. PDF
      if (!reply && isPDFRequest(textContent)) {
        const lastQ = getLastQuote(fromNorm);
        if (lastQ) {
          await sendMetaWAMessage(from, 'Generando tu cotizacion en PDF... 📄');
          generateAndSendQuote({
            clientFrom: fromNorm, clientName: userName, clientPhone: from,
            quoteText: lastQ, catalog, entrega: { tipo: 'pickup' }, metodoPago: null,
          }).then(async function(result) {
            if (result && result.pdfUrl) {
              await sendMetaWAMessage(from, '📄 Tu cotizacion: ' + result.pdfUrl);
              if (cliente) {
                const cotId = await guardarCotizacion(fromNorm, result.quoteNumber, [], result.total, result.pdfUrl, 'whatsapp_meta').catch(function() { return null; });
                if (cotId) programarSeguimiento(fromNorm, cotId).catch(function() {});
              }
            }
          }).catch(function(e) { console.error('[META PDF]', e.message); });
          continue;
        }
        reply = 'Primero dime que productos necesitas y te hago la cotizacion. 📄';
      }

      // 5. Tecnico
      if (!reply && isTechnicalQuestion(textContent)) {
        const techReply = await getTechnicalInfo(textContent, catalog.productos || [], _aiClient).catch(function() { return null; });
        if (techReply) reply = techReply;
      }

      // 6. Claude IA
      if (!reply) {
        const history = getHistory('meta-wa:' + from);
        const _nivelMeta = cliente ? await getNivelPrecio(fromNorm).catch(function() { return null; }) : null;
        reply = await getAIResponse(textContent, history, firstName, 'WhatsApp', _nivelMeta);
        if (isQuoteResponse && isQuoteResponse(reply)) saveLastQuote(fromNorm, reply.substring(0, 1200));
        saveHistory('meta-wa:' + from, [...history,
          { role: 'user',      content: textContent },
          { role: 'assistant', content: reply        }
        ]);
      }

      if (!reply) continue;

      // 7. Enviar
      await sendMetaWAMessage(from, reply);
      if (cliente) logMensaje(cliente.id, 'whatsapp_meta', 'out', reply, 'texto').catch(function() {});

    } catch (err) {
      console.error('[META WA ERR]', err.message);
      try {
        const tel = getCatalog && getCatalog() && getCatalog().negocio ? getCatalog().negocio.telefono : '';
        await sendMetaWAMessage(from, 'Disculpa, hubo un error tecnico. Intenta de nuevo.' + (tel ? ' Tel: ' + tel : ''));
      } catch (_) {}
    }
  }
}

// ─────────────────────────────────────────────────
//  PROCESADOR PRINCIPAL DE EVENTOS META
// ─────────────────────────────────────────────────
async function processMetaWebhook(body, getAIResponse, getHistory, saveHistory, getCatalog, getCache, isQuoteResponse, handoff) {
  const pageToken = process.env.META_PAGE_ACCESS_TOKEN;
  const entries   = body.entry || [];
  const object    = body.object || '';

  for (const entry of entries) {

    if (object === 'whatsapp_business_account') {
      for (const change of (entry.changes || [])) {
        if (change.field !== 'messages') continue;
        const value = change.value || {};
        if (value.statuses && !value.messages) continue;
        await processWhatsAppMessage(value, getAIResponse, getHistory, saveHistory, getCatalog, getCache, isQuoteResponse, handoff);
      }
      continue;
    }

    for (const event of (entry.messaging || [])) {
      if (!event.message || event.message.is_echo) continue;
      if (isDuplicate(event.message.mid)) { console.log('[META] Duplicado ignorado:', event.message.mid); continue; }
      const senderId = event.sender.id;
      const text     = event.message.text || '';
      const channel  = object === 'instagram' ? 'Instagram' : 'Messenger';
      const key      = 'meta:' + senderId;
      console.log('[' + channel + ']', senderId, ':', text.substring(0, 60));
      const userName = await getMetaName(senderId, pageToken);
      try {
        const history = getHistory(key);
        const reply   = await getAIResponse(text || '[sin texto]', history, userName, channel);
        saveHistory(key, [...history, { role: 'user', content: text }, { role: 'assistant', content: reply }]);
        await sendDM(senderId, reply, pageToken);
      } catch (err) {
        console.error('[' + channel + ' ERR]', err.message);
        await sendDM(senderId, 'Disculpa, hubo un error. Escribenos por WhatsApp.', pageToken);
      }
    }

    for (const change of (entry.changes || [])) {
      if (change.field !== 'feed') continue;
      const val = change.value;
      if (val.item !== 'comment' || val.verb === 'remove' || val.verb === 'hide') continue;
      if (val.from && val.from.id === entry.id) continue;
      const commentText = val.message || '';
      if (commentText.length < 4) continue;
      const authorName = val.from ? val.from.name : null;
      const firstName  = authorName ? authorName.split(' ')[0] : null;
      const key        = 'fb-comment:' + (val.from ? val.from.id : 'unknown');
      console.log('[FB Comment]', authorName, ':', commentText.substring(0, 60));
      try {
        const history = getHistory(key);
        const ctx     = '[Comentario publico FB de ' + (authorName || 'usuario') + ']: "' + commentText + '"';
        const reply   = await getAIResponse(ctx, history, firstName, 'comment');
        saveHistory(key, [...history, { role: 'user', content: commentText }, { role: 'assistant', content: reply }]);
        await replyComment(val.comment_id, reply, pageToken);
      } catch (err) { console.error('[FB Comment ERR]', err.message); }
    }
  }
}

module.exports = { processMetaWebhook, sendMetaWAMessage };
