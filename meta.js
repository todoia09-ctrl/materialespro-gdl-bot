// ══════════════════════════════════════════════════════════════
//  meta.js — Facebook + Instagram Webhook Handler Optimizado
//  Fix #14: recibe getCatalog() para acceder al catálogo actual
// ══════════════════════════════════════════════════════════════

const axios = require('axios');

const META_API = 'https://graph.facebook.com/v19.0';

// ─────────────────────────────────────────────────
//  ENVIAR MENSAJE DIRECTO (Messenger / Instagram)
// ─────────────────────────────────────────────────
async function sendDM(recipientId, text, token) {
  try {
    await axios.post(META_API + '/me/messages',
      { recipient: { id: recipientId }, message: { text: text.substring(0, 2000) } },
      { params: { access_token: token } }
    );
  } catch (err) { console.error('[META DM]', err.response?.data?.error?.message || err.message); }
}

// ─────────────────────────────────────────────────
//  RESPONDER COMENTARIO (público, debajo del comment)
// ─────────────────────────────────────────────────
async function replyComment(commentId, text, token) {
  try {
    await axios.post(META_API + '/' + commentId + '/comments',
      { message: text.substring(0, 8000) },
      { params: { access_token: token } }
    );
  } catch (err) { console.error('[META COMMENT]', err.response?.data?.error?.message || err.message); }
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
//  PROCESADOR PRINCIPAL DE EVENTOS META
//  FIX #14: getCatalog() inyectado para acceso al catálogo actual
// ─────────────────────────────────────────────────
async function processMetaWebhook(body, getAIResponse, getHistory, saveHistory, getCatalog) {
  const token   = process.env.META_PAGE_ACCESS_TOKEN;
  const entries = body.entry || [];

  for (const entry of entries) {

    // ── MESSENGER y INSTAGRAM DIRECT ──────────────
    for (const event of (entry.messaging || [])) {
      if (!event.message || event.message.is_echo) continue;

      const senderId = event.sender.id;
      const text     = event.message.text || '';
      const channel  = body.object === 'instagram' ? 'Instagram' : 'Messenger';
      const key      = 'meta:' + senderId;

      console.log('[' + channel + ']', senderId, ':', text.substring(0,60));

      // Obtener nombre del usuario (falla silenciosamente)
      const userName = await getMetaName(senderId, token);

      try {
        const history = getHistory(key);
        const reply   = await getAIResponse(text || '[sin texto]', history, userName, channel);
        saveHistory(key, [...history,
          { role: 'user',      content: text  },
          { role: 'assistant', content: reply }
        ]);
        await sendDM(senderId, reply, token);
      } catch (err) {
        console.error('[' + channel + ' ERR]', err.message);
        await sendDM(senderId, 'Disculpa, hubo un error. Escríbenos por WhatsApp al ' + (getCatalog?.()?.negocio?.telefono || ''), token);
      }
    }

    // ── COMENTARIOS EN FACEBOOK ────────────────────
    for (const change of (entry.changes || [])) {
      if (change.field !== 'feed') continue;
      const val = change.value;
      // Solo comentarios nuevos, ignorar borrados/ocultos y propios
      if (val.item !== 'comment' || val.verb === 'remove' || val.verb === 'hide') continue;
      if (val.from?.id === entry.id) continue; // Comentario de la propia página

      const commentText = val.message || '';
      if (commentText.length < 4) continue; // Ignorar emojis solos

      const authorId   = val.from?.id;
      const authorName = val.from?.name || null;
      const firstName  = authorName ? authorName.split(' ')[0] : null;
      const key        = 'fb-comment:' + authorId;

      console.log('[FB Comment]', authorName, ':', commentText.substring(0,60));

      try {
        const history = getHistory(key);
        const ctx     = '[Comentario público FB de ' + (authorName||'usuario') + ']: "' + commentText + '"';
        const reply   = await getAIResponse(ctx, history, firstName, 'comment');
        saveHistory(key, [...history,
          { role: 'user',      content: commentText },
          { role: 'assistant', content: reply       }
        ]);
        await replyComment(val.comment_id, reply, token);
      } catch (err) { console.error('[FB Comment ERR]', err.message); }
    }
  }
}

module.exports = { processMetaWebhook };
