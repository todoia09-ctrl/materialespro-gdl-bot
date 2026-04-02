// ══════════════════════════════════════════════════════════════
//  campanas.js — Campañas Masivas WhatsApp
//  Meta Cloud API v22.0 (Twilio eliminado)
//  Soporta: mensajes texto libre + template messages aprobados
//  Segmentación por zona, historial, tipo de cliente
// ══════════════════════════════════════════════════════════════

const https  = require('https');
const { query } = require('./db');

// ─────────────────────────────────────────────────
//  CONFIG META WA
// ─────────────────────────────────────────────────
function getMetaConfig() {
  return {
    token:   process.env.META_WA_TOKEN,
    phoneId: process.env.META_PHONE_NUMBER_ID,
  };
}

// ─────────────────────────────────────────────────
//  PLANTILLAS REGISTRADAS
//  Agregar aquí cuando Meta apruebe cada plantilla
// ─────────────────────────────────────────────────
const TEMPLATES = {
  materialespro_promo: {
    name:     'materialespro_promo',
    language: 'es_MX',
    // {{1}} = nombre del cliente
    params:   ['nombre'],
  },
  hello_world: {
    name:     'hello_world',
    language: 'en_US',
    params:   [],
  },
};

// ─────────────────────────────────────────────────
//  SEGMENTOS DISPONIBLES
// ─────────────────────────────────────────────────
const SEGMENTOS = {
  todos:               'Todos los clientes activos',
  zona_norte:          'Clientes GDL Norte / Zapopan',
  zona_sur:            'Clientes GDL Sur / Tlaquepaque',
  zona_este:           'Clientes GDL Este / Tonalá',
  con_credito:         'Clientes con crédito activo',
  sin_compras_30d:     'Clientes sin compras en 30 días',
  compraron_adhesivos: 'Compraron adhesivos alguna vez',
  compraron_texturas:  'Compraron texturizados alguna vez',
  compraron_imperme:   'Compraron impermeabilizantes',
  pedidos_grandes:     'Pedidos históricos > $5,000 MXN',
};

// ─────────────────────────────────────────────────
//  OBTENER CLIENTES POR SEGMENTO
// ─────────────────────────────────────────────────
async function getClientesSegmento(segmento) {
  let sql;
  switch (segmento) {
    case 'todos':
      sql = `SELECT whatsapp, nombre FROM clientes WHERE activo=TRUE AND whatsapp IS NOT NULL`; break;
    case 'zona_norte':
      sql = `SELECT whatsapp, nombre FROM clientes WHERE activo=TRUE AND zona='norte'`; break;
    case 'zona_sur':
      sql = `SELECT whatsapp, nombre FROM clientes WHERE activo=TRUE AND zona='sur'`; break;
    case 'zona_este':
      sql = `SELECT whatsapp, nombre FROM clientes WHERE activo=TRUE AND zona='este'`; break;
    case 'con_credito':
      sql = `SELECT whatsapp, nombre FROM clientes WHERE activo=TRUE AND credito_limite > 0`; break;
    case 'sin_compras_30d':
      sql = `SELECT whatsapp, nombre FROM clientes WHERE activo=TRUE AND ultimo_contacto < NOW() - INTERVAL '30 days'`; break;
    case 'compraron_adhesivos':
      sql = `SELECT DISTINCT c.whatsapp, c.nombre FROM clientes c JOIN pedidos p ON p.cliente_id=c.id WHERE c.activo=TRUE AND p.items_json::text ILIKE '%adhesivo%'`; break;
    case 'compraron_texturas':
      sql = `SELECT DISTINCT c.whatsapp, c.nombre FROM clientes c JOIN pedidos p ON p.cliente_id=c.id WHERE c.activo=TRUE AND p.items_json::text ILIKE '%texturizado%'`; break;
    case 'compraron_imperme':
      sql = `SELECT DISTINCT c.whatsapp, c.nombre FROM clientes c JOIN pedidos p ON p.cliente_id=c.id WHERE c.activo=TRUE AND p.items_json::text ILIKE '%impermeabilizante%'`; break;
    case 'pedidos_grandes':
      sql = `SELECT DISTINCT c.whatsapp, c.nombre FROM clientes c JOIN pedidos p ON p.cliente_id=c.id WHERE c.activo=TRUE AND p.total >= 5000`; break;
    default:
      sql = `SELECT whatsapp, nombre FROM clientes WHERE activo=TRUE AND whatsapp IS NOT NULL`; break;
  }
  try {
    const r = await query(sql);
    return r.rows;
  } catch (e) {
    console.error('[CAMPANA] getSegmento:', e.message);
    return [];
  }
}

// ─────────────────────────────────────────────────
//  ENVIAR MENSAJE VÍA META WA API
//  Soporta: texto libre O template aprobado
// ─────────────────────────────────────────────────
function sendMetaMessage(to, payload) {
  return new Promise((resolve, reject) => {
    const { token, phoneId } = getMetaConfig();
    if (!token || !phoneId) return reject(new Error('META_WA_TOKEN o META_PHONE_NUMBER_ID no configurados'));

    // Normalizar número — quitar prefijos whatsapp: y +
    const toNum = to.replace('whatsapp:', '').replace('+', '').replace(/\s/g, '');

    const body = JSON.stringify({ messaging_product: 'whatsapp', to: toNum, ...payload });

    const options = {
      hostname: 'graph.facebook.com',
      path:     '/v22.0/' + phoneId + '/messages',
      method:   'POST',
      headers:  {
        'Authorization': 'Bearer ' + token,
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', d => { data += d; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error(parsed.error.message));
          else resolve(parsed);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─────────────────────────────────────────────────
//  ENVIAR TEMPLATE APROBADO
//  templateKey: key de TEMPLATES arriba
//  params: { nombre: 'Juan', ... }
// ─────────────────────────────────────────────────
async function sendTemplate(to, templateKey, params) {
  const tpl = TEMPLATES[templateKey];
  if (!tpl) throw new Error('Template no encontrado: ' + templateKey);

  // Construir components con parámetros posicionales
  const components = [];
  if (tpl.params && tpl.params.length > 0) {
    const bodyParams = tpl.params.map(p => ({
      type: 'text',
      text: String(params[p] || ''),
    }));
    components.push({ type: 'body', parameters: bodyParams });
  }

  const payload = {
    type: 'template',
    template: {
      name:     tpl.name,
      language: { code: tpl.language },
      ...(components.length > 0 ? { components } : {}),
    },
  };

  return sendMetaMessage(to, payload);
}

// ─────────────────────────────────────────────────
//  ENVIAR TEXTO LIBRE (solo dentro ventana 24h)
// ─────────────────────────────────────────────────
async function sendTexto(to, texto) {
  return sendMetaMessage(to, {
    type: 'text',
    text: { body: texto, preview_url: false },
  });
}

// ─────────────────────────────────────────────────
//  PERSONALIZAR MENSAJE CON {nombre}
// ─────────────────────────────────────────────────
function personalizarMensaje(template, nombre) {
  const n = nombre ? nombre.split(' ')[0] : 'cliente';
  return template.replace(/\{nombre\}/gi, n);
}

// ─────────────────────────────────────────────────
//  ENVIAR CAMPAÑA MASIVA
//  modoTemplate: true = usar plantilla aprobada
//                false = texto libre (solo clientes activos 24h)
// ─────────────────────────────────────────────────
async function enviarCampana(campanaId, rate = 1) {
  try {
    const campR = await query('SELECT * FROM campanas WHERE id=$1', [campanaId]);
    const camp  = campR.rows[0];
    if (!camp) throw new Error('Campaña no encontrada: ' + campanaId);
    if (camp.estado === 'completada') throw new Error('Campaña ya completada');

    await query('UPDATE campanas SET estado=$1, total_envios=$2 WHERE id=$3', ['enviando', 0, campanaId]);

    const clientes = await getClientesSegmento(camp.segmento);
    console.log('[CAMPANA]', camp.nombre, '— enviando a', clientes.length, 'clientes');
    await query('UPDATE campanas SET total_envios=$1 WHERE id=$2', [clientes.length, campanaId]);

    let enviados = 0, errores = 0;
    const usarTemplate = camp.template_name && TEMPLATES[camp.template_name];

    for (const cliente of clientes) {
      try {
        if (usarTemplate) {
          // Modo template — funciona aunque cliente no haya escrito en 24h
          const nombre = cliente.nombre ? cliente.nombre.split(' ')[0] : 'cliente';
          await sendTemplate(cliente.whatsapp, camp.template_name, { nombre });
        } else {
          // Modo texto libre
          const msg = personalizarMensaje(camp.mensaje, cliente.nombre);
          await sendTexto(cliente.whatsapp, msg);
        }
        enviados++;
      } catch (e) {
        errores++;
        console.error('[CAMPANA] Error enviando a', cliente.whatsapp, ':', e.message);
      }

      if ((enviados + errores) % 10 === 0) {
        await query('UPDATE campanas SET enviados=$1, errores=$2 WHERE id=$3', [enviados, errores, campanaId]);
      }

      // Rate limiting — Meta recomienda max 80 msg/seg en tier gratuito
      await new Promise(r => setTimeout(r, Math.floor(1000 / Math.min(rate, 10))));
    }

    await query(`
      UPDATE campanas SET estado='completada', enviados=$1, errores=$2, completada_en=NOW()
      WHERE id=$3`,
      [enviados, errores, campanaId]
    );

    console.log('[CAMPANA] Completada — enviados:', enviados, '| errores:', errores);
    return { enviados, errores, total: clientes.length };

  } catch (e) {
    console.error('[CAMPANA] Error:', e.message);
    await query("UPDATE campanas SET estado='cancelada' WHERE id=$1", [campanaId]).catch(() => {});
    throw e;
  }
}

// ─────────────────────────────────────────────────
//  CREAR CAMPAÑA (desde dashboard)
// ─────────────────────────────────────────────────
async function crearCampana(nombre, mensaje, segmento, creadoPor, templateName) {
  const r = await query(`
    INSERT INTO campanas(nombre, mensaje, segmento, creado_por, template_name)
    VALUES($1,$2,$3,$4,$5) RETURNING id`,
    [nombre, mensaje || '', segmento, creadoPor, templateName || null]
  );
  return r.rows[0].id;
}

// ─────────────────────────────────────────────────
//  PREVIEW — cuántos clientes recibirán la campaña
// ─────────────────────────────────────────────────
async function previewSegmento(segmento) {
  const clientes = await getClientesSegmento(segmento);
  return { total: clientes.length, descripcion: SEGMENTOS[segmento] || segmento };
}

module.exports = {
  SEGMENTOS,
  TEMPLATES,
  crearCampana,
  enviarCampana,
  previewSegmento,
  getClientesSegmento,
  sendTemplate,
  sendTexto,
};
