// ══════════════════════════════════════════════════════════════
//  tecnico.js — Información Técnica Optimizada
//  Fix #10: usa aiClient inyectado, no instancia propio
//  Fix #11: variable 'query' no usada eliminada
//  Caché 24h por producto
// ══════════════════════════════════════════════════════════════

const axios = require('axios');

// ─────────────────────────────────────────────────
//  CACHÉ 24 HORAS POR PRODUCTO
// ─────────────────────────────────────────────────
const cache    = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

function getCached(key) {
  const e = cache.get(key);
  if (!e || Date.now() - e.ts > CACHE_TTL) { cache.delete(key); return null; }
  return e.data;
}
function setCache(key, data) { cache.set(key, { data, ts: Date.now() }); }

// ─────────────────────────────────────────────────
//  DETECTAR PREGUNTAS TÉCNICAS
// ─────────────────────────────────────────────────
const TRIGGERS = [
  'ficha','tecnica','tecnico','instruccion','como se aplica','como aplicar',
  'como usar','modo de uso','modo de aplicacion','cuantas capas','tiempo de secado',
  'rendimiento','cobertura','cuanto rinde','preparar superficie','preparacion',
  'mezclar','dilucion','herramienta','video','tutorial','youtube','especificaciones',
  'datos tecnicos','pdf','manual','hoja de datos','temperatura','humedad','resistencia',
  'se puede usar en','sirve para','compatible con',
];

function isTechnicalQuestion(msg) {
  const c = msg.toLowerCase()
    .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i')
    .replace(/[óòö]/g,'o').replace(/[úùü]/g,'u');
  return TRIGGERS.some(t => c.includes(t));
}

// ─────────────────────────────────────────────────
//  DETECTAR PRODUCTO EN EL MENSAJE
// ─────────────────────────────────────────────────
const CATEGORY_MAP = {
  'adhesivo':          'Ceramico',
  'flex':              'Flex',
  'mosaico':           'Mosaico',
  'texturizado':       'Acrilico',
  'petreo':            'Petreo',
  'impermeabilizante': 'Textural',
  'junta':             'Junta',
  'epoxica':           'Epoxica',
};

function detectProduct(msg, catalogProducts) {
  const c = msg.toLowerCase()
    .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i')
    .replace(/[óòö]/g,'o').replace(/[úùü]/g,'u');

  // Match directo por palabras del nombre del producto (>4 chars)
  for (const p of catalogProducts) {
    const name  = p.nombre.toLowerCase()
      .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i')
      .replace(/[óòö]/g,'o').replace(/[úùü]/g,'u');
    const words = name.split(' ').filter(w => w.length > 4);
    if (words.some(w => c.includes(w))) return p;
  }

  // Match por categoría genérica
  for (const [kw, partial] of Object.entries(CATEGORY_MAP)) {
    if (c.includes(kw)) {
      return catalogProducts.find(p => p.nombre.toLowerCase().includes(partial.toLowerCase())) || null;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────
//  BUSCAR PDF DEL FABRICANTE
// ─────────────────────────────────────────────────
const FALLBACK_PDFS = {
  'ceramico':          { url: 'https://www.boral.com.mx/productos/adhesivos/adhesivo-ceramico', title: 'Ficha Técnica — Boral México' },
  'flex':              { url: 'https://mex.sika.com/es/construccion/fijacion-y-recubrimiento/adhesivos-para-baldosas/sikaceram-flex.html', title: 'Ficha Técnica Flex — Sika México' },
  'texturizado':       { url: 'https://www.imperquimia.com.mx/productos/recubrimientos/texturizados/', title: 'Texturizados — Imperquimia' },
  'impermeabilizante': { url: 'https://www.imperquimia.com.mx/productos/impermeabilizantes/', title: 'Impermeabilizantes — Imperquimia' },
  'mortero':           { url: 'https://www.boral.com.mx/productos/morteros/', title: 'Mortero de Junta — Boral México' },
};

function getFallbackPDF(productName) {
  const lower = productName.toLowerCase()
    .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i')
    .replace(/[óòö]/g,'o').replace(/[úùü]/g,'u');
  for (const [k, v] of Object.entries(FALLBACK_PDFS)) {
    if (lower.includes(k)) return v;
  }
  return null;
}

async function searchPDF(productName) {
  // Opción A: SerpAPI (100 gratis/mes)
  if (process.env.SERP_API_KEY) {
    try {
      const res = await axios.get('https://serpapi.com/search', {
        params: { q: productName + ' ficha tecnica PDF', api_key: process.env.SERP_API_KEY, num: 5, hl: 'es', gl: 'mx' },
        timeout: 6000
      });
      const results = res.data.organic_results || [];
      const hit = results.find(r => r.link && (r.link.includes('.pdf') || (r.title || '').toLowerCase().includes('ficha')));
      if (hit) return { url: hit.link, title: hit.title };
    } catch (e) { console.error('[SERP]', e.message); }
  }

  // Opción B: Google Custom Search (100 gratis/día)
  if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX) {
    try {
      const res = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: { key: process.env.GOOGLE_SEARCH_API_KEY, cx: process.env.GOOGLE_SEARCH_CX, q: productName + ' ficha tecnica PDF', num: 5 },
        timeout: 6000
      });
      const items = res.data.items || [];
      const hit = items.find(i => i.link?.includes('.pdf') || i.fileFormat === 'PDF' || (i.title || '').toLowerCase().includes('ficha'));
      if (hit) return { url: hit.link, title: hit.title };
    } catch (e) { console.error('[GOOGLE]', e.message); }
  }

  return getFallbackPDF(productName);
}

// ─────────────────────────────────────────────────
//  BUSCAR VIDEO EN YOUTUBE
// ─────────────────────────────────────────────────
async function searchYouTube(productName) {
  if (process.env.YOUTUBE_API_KEY) {
    try {
      const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          key: process.env.YOUTUBE_API_KEY,
          q: 'como aplicar ' + productName + ' construccion tutorial',
          part: 'snippet', maxResults: 3, type: 'video',
          relevanceLanguage: 'es', regionCode: 'MX'
        },
        timeout: 6000
      });
      const items = res.data.items || [];
      if (items.length) return { url: 'https://www.youtube.com/watch?v=' + items[0].id.videoId, title: items[0].snippet.title };
    } catch (e) { console.error('[YT]', e.message); }
  }
  // Fallback: búsqueda directa (siempre funciona, sin API key)
  return {
    url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent('como aplicar ' + productName),
    title: 'Videos: Cómo aplicar ' + productName
  };
}

// ─────────────────────────────────────────────────
//  RESUMEN TÉCNICO CON CLAUDE
//  Recibe aiClient inyectado desde server.js (FIX #10)
// ─────────────────────────────────────────────────
async function generateSummary(product, question, aiClient) {
  const res = await aiClient.messages.create({
    model: 'claude-haiku-4-5-20251001', max_tokens: 220,
    messages: [{ role: 'user', content:
      'El cliente pregunta: "' + question + '"\n\n'
      + 'Producto: ' + product.nombre + '\n'
      + 'Descripción: ' + product.descripcion + '\n'
      + 'Usos: ' + product.usos + '\n'
      + 'Presentación: ' + product.presentacion + '\n'
      + 'Rendimiento: ' + product.rendimiento_nota + '\n\n'
      + 'Responde en máximo 4 líneas, español mexicano, práctico y directo.'
    }]
  });
  return res.content[0].text;
}

// ─────────────────────────────────────────────────
//  FUNCIÓN PRINCIPAL (FIX #10 — aiClient inyectado)
// ─────────────────────────────────────────────────
async function getTechnicalInfo(userMessage, catalogProducts, aiClient) {
  const product     = detectProduct(userMessage, catalogProducts);
  const productName = product
    ? product.nombre
    : userMessage.replace(/ficha|tecnica|instrucciones|como|aplicar|usar/gi, '').trim().substring(0, 60);

  const cacheKey = productName.toLowerCase().replace(/\s+/g, '-').substring(0, 50);
  const cached   = getCached(cacheKey);
  if (cached) { console.log('[TÉCNICO CACHE]', cacheKey); return cached; }

  console.log('[TÉCNICO] Buscando:', productName);

  // Búsqueda en paralelo: PDF + YouTube + Resumen IA (FIX #11 — sin vars no usadas)
  const [pdfResult, videoResult, summaryResult] = await Promise.allSettled([
    searchPDF(productName),
    searchYouTube(productName),
    product && aiClient ? generateSummary(product, userMessage, aiClient) : Promise.resolve(null)
  ]);

  const pdf     = pdfResult.status     === 'fulfilled' ? pdfResult.value     : null;
  const video   = videoResult.status   === 'fulfilled' ? videoResult.value   : null;
  const summary = summaryResult.status === 'fulfilled' ? summaryResult.value : null;

  if (!pdf && !video && !summary) return null;

  const lines = [];
  if (summary) { lines.push(summary); lines.push(''); }
  if (pdf)     { lines.push('📄 *Ficha técnica:*'); lines.push(pdf.url); }
  if (video)   { lines.push(''); lines.push('🎥 *Video tutorial:*'); lines.push(video.url); }
  lines.push(''); lines.push('¿Tienes dudas o quieres cotizar?');

  const response = lines.join('\n');
  setCache(cacheKey, response);
  return response;
}

module.exports = { isTechnicalQuestion, getTechnicalInfo };
