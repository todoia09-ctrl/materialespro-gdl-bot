// ══════════════════════════════════════════════════════════════
//  meta.js — Facebook + Instagram + WhatsApp Cloud API Handler
//  v13 — Pipeline completa + normalización número Meta→CRM
// ══════════════════════════════════════════════════════════════

const axios     = require('axios');
const Anthropic = require('@anthropic-ai/sdk');

const { logMensaje, query }                                    = require('./db');
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
async function _setCampCat(phone, val) { await query('INSERT INTO campaign_sessions(phone,cat_data,updated_at) VALUES($1,$2,NOW()) ON CONFLICT(phone) DO UPDATE SET cat_data=$2,updated_at=NOW()', [phone, JSON.stringify(val)]); }
async function _getCampCat(phone) { try { var r = await query('SELECT cat_data FROM campaign_sessions WHERE phone=$1', [phone]); return r.rows[0] ? JSON.parse(r.rows[0].cat_data) : null; } catch(e) { return null; } }
async function _delCampCat(phone) { await query('UPDATE campaign_sessions SET cat_data=NULL,updated_at=NOW() WHERE phone=$1', [phone]); }
async function _setCampProd(phone, val) { await query('INSERT INTO campaign_sessions(phone,prod_data,updated_at) VALUES($1,$2,NOW()) ON CONFLICT(phone) DO UPDATE SET prod_data=$2,updated_at=NOW()', [phone, JSON.stringify(val)]); }
async function _getCampProd(phone) { try { var r = await query('SELECT prod_data FROM campaign_sessions WHERE phone=$1', [phone]); return r.rows[0] ? JSON.parse(r.rows[0].prod_data) : null; } catch(e) { return null; } }
async function _delCampProd(phone) { await query('UPDATE campaign_sessions SET prod_data=NULL,updated_at=NOW() WHERE phone=$1', [phone]); }
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
    const endpoint = process.env.META_IG_USER_ID
      ? META_API + '/' + process.env.META_IG_USER_ID + '/messages'
      : META_API + '/me/messages';
    await axios.post(
      endpoint,
      {
        recipient: { id: recipientId },
        message: { text: text.substring(0, 1000) },
        messaging_type: 'RESPONSE'
      },
      { headers: { Authorization: 'Bearer ' + token }, params: { access_token: token } }
    );
  } catch (err) {
    const errMsg = err.response && err.response.data && err.response.data.error ? err.response.data.error.message : err.message;
    console.error('[META DM ERR]', errMsg);
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

      // 2-pre. Selecci\u00f3n de producto o cantidad para producto de campa\u00f1a
      var _campProdData = (!reply && textContent) ? await _getCampProd(fromNorm) : null;
      if (!reply && textContent && _campProdData !== null) {
        // Si es array → el cliente elige producto por n\u00famero
        if (Array.isArray(_campProdData)) {
          var _selNum = parseInt(textContent.trim());
          if (!isNaN(_selNum) && _selNum >= 1 && _selNum <= _campProdData.length) {
            var _chosen = _campProdData[_selNum - 1];
            await _setCampProd(fromNorm, _chosen);
            reply = '\u00bfCu\u00e1ntas unidades de *' + _chosen.nombre + '* necesitas?';
          } else {
            reply = 'Responde con el n\u00famero del producto (1, 2, etc.)';
          }
        } else {
          // Es objeto single → el cliente indica cantidad
          var _qtyMatch = textContent.match(/(\d+)/);
          if (_qtyMatch) {
            var _qty = parseInt(_qtyMatch[1]);
            var _prod = _campProdData;
            await _delCampProd(fromNorm);
            if (_qty > 0 && _prod) {
              var _po = Math.round(parseFloat(_prod.precio_oferta));
              var _total = _qty * _po;
              reply = '\u00a1Perfecto! Cotizando ' + _qty + ' x ' + _prod.nombre
                + ' a precio de oferta $' + _po.toLocaleString('es-MX') + ':\n\n'
                + _qty + ' x $' + _po.toLocaleString('es-MX')
                + ' = *$' + _total.toLocaleString('es-MX') + '*\n\n'
                + '\u00bfHacemos el pedido?';
              var _cleanQuote = _prod.nombre + ': ' + _qty + ' \u00d7 $' + _po.toLocaleString('es-MX') + ' = $' + _total.toLocaleString('es-MX');
              saveLastQuote(fromNorm, _cleanQuote);
            }
          }
        }
      }

      // 2a. Respuesta num\u00e9rica a promociones de campa\u00f1a
      var _campCatData = (!reply && textContent && /^\d{1,2}$/.test(textContent.trim())) ? await _getCampCat(fromNorm) : null;
      if (!reply && textContent && /^\d{1,2}$/.test(textContent.trim()) && _campCatData !== null) {
        try {
          var _selIdx = parseInt(textContent.trim()) - 1;
          var _savedCats = _campCatData;
          if (_selIdx >= 0 && _selIdx < _savedCats.length) {
            var _selCat = _savedCats[_selIdx];
            var _catEmojis2 = { impermeabilizantes:'\uD83C\uDFE0', morteros:'\uD83E\uDDF1', selladores:'\uD83D\uDD27', adhesivos:'\uD83E\uDDEA', pisos:'\uD83C\uDFD7\uFE0F', anclajes:'\u2693', aditivos:'\u2697\uFE0F', grouts:'\uD83C\uDFDB\uFE0F', complementos:'\uD83D\uDEE0\uFE0F' };
            var _catProds = await query(
              "SELECT nombre, precio_venta, precio_oferta, unidad FROM catalogo_productos WHERE en_oferta=true AND activo=true AND categoria=$1 ORDER BY nombre",
              [_selCat]
            );
            if (_catProds && _catProds.rows && _catProds.rows.length > 0) {
              var _ek = Object.keys(_catEmojis2).find(function(k) { return _selCat.toLowerCase().indexOf(k) !== -1; });
              var _em = _ek ? _catEmojis2[_ek] : '\uD83D\uDCE6';
              var _catReply = _em + ' *' + _selCat + '* en oferta:\n\n';
              var _pn = 1;
              for (var _cp of _catProds.rows) {
                var _cpo = Number(_cp.precio_oferta).toLocaleString('es-MX');
                var _cu = _cp.unidad || 'pza';
                _catReply += '*' + _pn + '.* ' + _cp.nombre + ' \u2014 *$' + _cpo + '/' + _cu + '*\n';
                _pn++;
              }
              if (_catProds.rows.length === 1) {
                _catReply += '\n\u00bfCu\u00e1ntas unidades necesitas?';
                await _setCampProd(fromNorm, _catProds.rows[0]);
              } else {
                _catReply += '\n\u00bfCu\u00e1l te interesa? Responde *1*' + (_catProds.rows.length > 1 ? ' o *' + _catProds.rows.length + '*' : '') + '.';
                await _setCampProd(fromNorm, _catProds.rows);
              }
              reply = _catReply;
            }
          }
          await _delCampCat(fromNorm);
        } catch (_e) { console.error('[META CAMPAIGN CAT]', _e.message); }
      }

      // 2b. Intercept campa\u00f1a "S\u00ed, me interesa"
      if (!reply && textContent && /^s[i\u00ed],?\s*me\s+interesa$/i.test(textContent.trim())) {
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
            var _campMsg = '\uD83D\uDD25 \u00a1Hola ' + (firstName || '') + '! Aqu\u00ed est\u00e1n nuestras promociones de esta semana:\n\n';
            var _n = 1;
            for (var _catName in _cats) {
              var _emojiKey = Object.keys(_catEmojis).find(function(k) { return _catName.toLowerCase().indexOf(k) !== -1; });
              var _emoji = _emojiKey ? _catEmojis[_emojiKey] : '\uD83D\uDCE6';
              _campMsg += _emoji + ' *' + _n + '. ' + _catName + '*\n';
              for (var _p of _cats[_catName]) {
                var _pv = Number(_p.precio_venta).toLocaleString('es-MX');
                var _po = Number(_p.precio_oferta).toLocaleString('es-MX');
                _campMsg += '  \u2022 ' + _p.nombre + ' ~~$' + _pv + '~~ \u2192 *$' + _po + '*\n';
              }
              _campMsg += '\n';
              _n++;
            }
            _campMsg += '\u00bfQu\u00e9 categor\u00eda te interesa? Responde el n\u00famero o escr\u00edbeme qu\u00e9 necesitas.';
            reply = _campMsg;
            await _setCampCat(fromNorm, Object.keys(_cats));
          }
        } catch (_e) { console.error('[META CAMPAIGN INTEREST]', _e.message); }
      }

      // 3. Flujo de pedido — usar número normalizado
      if (!reply) {
        reply = await processOrderFlow(
          fromNorm, textContent, firstName, getLastQuote(fromNorm), sendToClient,
          (catalog.negocio && catalog.negocio.nombre) || 'MaterialesPro GDL', catalog
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
        const _dmToken = pageToken;
        await sendDM(senderId, reply, _dmToken);
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
