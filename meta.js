// ══════════════════════════════════════════════════════════════
//  meta.js — Facebook + Instagram + WhatsApp Cloud API Handler
//  v11 — WhatsApp Cloud API integrado (Meta Graph API v22.0)
// ══════════════════════════════════════════════════════════════

const axios = require('axios');

const META_API    = 'https://graph.facebook.com/v22.0';
const WA_PHONE_ID = process.env.META_PHONE_NUMBER_ID;
const WA_TOKEN    = process.env.META_WHATSAPP_TOKEN;

// ─────────────────────────────────────────────────
//  ENVIAR MENSAJE VIA WHATSAPP CLOUD API
// ─────────────────────────────────────────────────
async function sendMetaWAMessage(to, text) {
  try {
    // Meta requiere número en formato internacional sin + (ej: 5213313469831)
    const toClean = to.replace(/\D/g, '');
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
    const errData = err.response?.data?.error;
    console.error('[META WA SEND ERR]', errData?.message || err.message, '| code:', errData?.code);
    throw err;
  }
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
    console.error('[META DM ERR]', err.response?.data?.error?.message || err.message);
  }
}

// ─────────────────────────────────────────────────
//  RESPONDER COMENTARIO FB (público, bajo el comment)
// ─────────────────────────────────────────────────
async function replyComment(commentId, text, token) {
  try {
    await axios.post(
      META_API + '/' + commentId + '/comments',
      { message: text.substring(0, 8000) },
      { params: { access_token: token } }
    );
  } catch (err) {
    console.error('[META COMMENT ERR]', err.response?.data?.error?.message || err.message);
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
//  PROCESADOR MENSAJES WHATSAPP CLOUD API
// ─────────────────────────────────────────────────
async function processWhatsAppMessage(value, getAIResponse, getHistory, saveHistory, getCatalog) {
  const messages = value.messages || [];
  const contacts = value.contacts || [];

  for (const msg of messages) {
    // Ignorar mensajes que no sean de texto (por ahora)
    if (msg.type !== 'text' && msg.type !== 'audio' && msg.type !== 'image') continue;

    const from     = msg.from;                                     // ej: 5213313469831
    const key      = 'meta-wa:' + from;
    const contact  = contacts.find(c => c.wa_id === from);
    const userName = contact?.profile?.name || null;
    const firstName = userName ? userName.split(' ')[0] : null;

    let textContent = '';

    if (msg.type === 'text') {
      textContent = msg.text?.body || '';
    } else if (msg.type === 'audio') {
      // Audio recibido via Meta — marcar para futura transcripción
      textContent = '[Nota de voz recibida. Por favor escribe tu mensaje para atenderte mejor.]';
    } else if (msg.type === 'image') {
      const caption = msg.image?.caption || '';
      textContent = caption
        ? '[Imagen recibida con texto: "' + caption + '"]'
        : '[Imagen recibida. ¿Qué material necesitas cotizar?]';
    }

    if (!textContent) continue;

    console.log('[META WA IN]', from, userName ? '(' + userName + ')' : '', ':', textContent.substring(0, 60));

    try {
      const history = getHistory(key);
      const reply   = await getAIResponse(textContent, history, firstName, 'WhatsApp');

      saveHistory(key, [...history,
        { role: 'user',      content: textContent },
        { role: 'assistant', content: reply        }
      ]);

      await sendMetaWAMessage(from, reply);

    } catch (err) {
      console.error('[META WA ERR]', err.message);
      try {
        const telefono = getCatalog?.()?.negocio?.telefono || '';
        await sendMetaWAMessage(
          from,
          'Disculpa, hubo un error técnico. Intenta de nuevo en un momento.' +
          (telefono ? ' También puedes llamarnos al ' + telefono : '')
        );
      } catch (_) {}
    }
  }
}

// ─────────────────────────────────────────────────
//  PROCESADOR PRINCIPAL DE EVENTOS META
// ─────────────────────────────────────────────────
async function processMetaWebhook(body, getAIResponse, getHistory, saveHistory, getCatalog) {
  const pageToken = process.env.META_PAGE_ACCESS_TOKEN;
  const entries   = body.entry || [];
  const object    = body.object || '';

  for (const entry of entries) {

    // ── WHATSAPP CLOUD API ─────────────────────────────────
    // object === 'whatsapp_business_account'
    // entry.changes[].field === 'messages'
    if (object === 'whatsapp_business_account') {
      for (const change of (entry.changes || [])) {
        if (change.field !== 'messages') continue;
        const value = change.value || {};

        // Ignorar status updates (delivered, read, sent)
        if (value.statuses && !value.messages) continue;

        await processWhatsAppMessage(
          value, getAIResponse, getHistory, saveHistory, getCatalog
        );
      }
      continue; // No procesar entry.messaging para WABA
    }

    // ── MESSENGER y INSTAGRAM DIRECT ──────────────────────
    for (const event of (entry.messaging || [])) {
      if (!event.message || event.message.is_echo) continue;

      const senderId = event.sender.id;
      const text     = event.message.text || '';
      const channel  = object === 'instagram' ? 'Instagram' : 'Messenger';
      const key      = 'meta:' + senderId;

      console.log('[' + channel + ']', senderId, ':', text.substring(0, 60));

      const userName = await getMetaName(senderId, pageToken);

      try {
        const history = getHistory(key);
        const reply   = await getAIResponse(text || '[sin texto]', history, userName, channel);
        saveHistory(key, [...history,
          { role: 'user',      content: text  },
          { role: 'assistant', content: reply }
        ]);
        await sendDM(senderId, reply, pageToken);
      } catch (err) {
        console.error('[' + channel + ' ERR]', err.message);
        const tel = getCatalog?.()?.negocio?.telefono || '';
        await sendDM(
          senderId,
          'Disculpa, hubo un error. Escríbenos por WhatsApp al ' + tel,
          pageToken
        );
      }
    }

    // ── COMENTARIOS EN FACEBOOK ────────────────────────────
    for (const change of (entry.changes || [])) {
      if (change.field !== 'feed') continue;
      const val = change.value;
      if (val.item !== 'comment' || val.verb === 'remove' || val.verb === 'hide') continue;
      if (val.from?.id === entry.id) continue; // Comentario de la propia página

      const commentText = val.message || '';
      if (commentText.length < 4) continue;

      const authorId   = val.from?.id;
      const authorName = val.from?.name || null;
      const firstName  = authorName ? authorName.split(' ')[0] : null;
      const key        = 'fb-comment:' + authorId;

      console.log('[FB Comment]', authorName, ':', commentText.substring(0, 60));

      try {
        const history = getHistory(key);
        const ctx     = '[Comentario público FB de ' + (authorName || 'usuario') + ']: "' + commentText + '"';
        const reply   = await getAIResponse(ctx, history, firstName, 'comment');
        saveHistory(key, [...history,
          { role: 'user',      content: commentText },
          { role: 'assistant', content: reply        }
        ]);
        await replyComment(val.comment_id, reply, pageToken);
      } catch (err) {
        console.error('[FB Comment ERR]', err.message);
      }
    }
  }
}

module.exports = { processMetaWebhook, sendMetaWAMessage };
