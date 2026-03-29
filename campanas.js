// ══════════════════════════════════════════════════════════════
//  campanas.js — Campañas Masivas WhatsApp
//  Segmentación por zona, historial de compras, tipo de cliente
//  Rate limiting para cumplir límites de Twilio
// ══════════════════════════════════════════════════════════════

const twilio = require('twilio');
const { query } = require('./db');

let _tw = null;
function tw() {
  if (!_tw) _tw = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return _tw;
}

// ─────────────────────────────────────────────────
//  SEGMENTOS DISPONIBLES
// ─────────────────────────────────────────────────
const SEGMENTOS = {
  todos:              'Todos los clientes activos',
  zona_norte:         'Clientes GDL Norte / Zapopan',
  zona_sur:           'Clientes GDL Sur / Tlaquepaque',
  zona_este:          'Clientes GDL Este / Tonalá',
  con_credito:        'Clientes con crédito activo',
  sin_compras_30d:    'Clientes sin compras en 30 días',
  compraron_adhesivos:'Compraron adhesivos alguna vez',
  compraron_texturas: 'Compraron texturizados alguna vez',
  compraron_imperme:  'Compraron impermeabilizantes',
  pedidos_grandes:    'Pedidos históricos > $5,000 MXN',
};

// ─────────────────────────────────────────────────
//  OBTENER CLIENTES SEGÚN SEGMENTO
// ─────────────────────────────────────────────────
async function getClientesSegmento(segmento) {
  let sql;

  switch (segmento) {
    case 'todos':
      sql = `SELECT whatsapp, nombre FROM clientes WHERE activo=TRUE AND whatsapp IS NOT NULL`;
      break;
    case 'zona_norte':
      sql = `SELECT whatsapp, nombre FROM clientes WHERE activo=TRUE AND zona='norte'`;
      break;
    case 'zona_sur':
      sql = `SELECT whatsapp, nombre FROM clientes WHERE activo=TRUE AND zona='sur'`;
      break;
    case 'zona_este':
      sql = `SELECT whatsapp, nombre FROM clientes WHERE activo=TRUE AND zona='este'`;
      break;
    case 'con_credito':
      sql = `SELECT whatsapp, nombre FROM clientes WHERE activo=TRUE AND credito_limite > 0`;
      break;
    case 'sin_compras_30d':
      sql = `SELECT whatsapp, nombre FROM clientes
             WHERE activo=TRUE AND ultimo_contacto < NOW() - INTERVAL '30 days'`;
      break;
    case 'compraron_adhesivos':
      sql = `SELECT DISTINCT c.whatsapp, c.nombre FROM clientes c
             JOIN pedidos p ON p.cliente_id=c.id
             WHERE c.activo=TRUE AND p.items_json::text ILIKE '%adhesivo%'`;
      break;
    case 'compraron_texturas':
      sql = `SELECT DISTINCT c.whatsapp, c.nombre FROM clientes c
             JOIN pedidos p ON p.cliente_id=c.id
             WHERE c.activo=TRUE AND p.items_json::text ILIKE '%texturizado%'`;
      break;
    case 'compraron_imperme':
      sql = `SELECT DISTINCT c.whatsapp, c.nombre FROM clientes c
             JOIN pedidos p ON p.cliente_id=c.id
             WHERE c.activo=TRUE AND p.items_json::text ILIKE '%impermeabilizante%'`;
      break;
    case 'pedidos_grandes':
      sql = `SELECT DISTINCT c.whatsapp, c.nombre FROM clientes c
             JOIN pedidos p ON p.cliente_id=c.id
             WHERE c.activo=TRUE AND p.total >= 5000`;
      break;
    default:
      sql = `SELECT whatsapp, nombre FROM clientes WHERE activo=TRUE AND zona=$1`;
      break;
  }

  try {
    const r = await query(sql);
    return r.rows;
  } catch (e) {
    console.error('[CAMPAÑA] getSegmento:', e.message);
    return [];
  }
}

// ─────────────────────────────────────────────────
//  PERSONALIZAR MENSAJE CON {nombre}
// ─────────────────────────────────────────────────
function personalizarMensaje(template, nombre) {
  const n = nombre ? nombre.split(' ')[0] : 'cliente';
  return template.replace(/\{nombre\}/gi, n);
}

// ─────────────────────────────────────────────────
//  ENVIAR CAMPAÑA
//  rate: mensajes por segundo (Twilio recomienda ≤1/seg en sandbox)
// ─────────────────────────────────────────────────
async function enviarCampana(campanaId, rate = 1) {
  try {
    // Cargar campaña
    const campR = await query('SELECT * FROM campanas WHERE id=$1', [campanaId]);
    const camp  = campR.rows[0];
    if (!camp) throw new Error('Campaña no encontrada: ' + campanaId);
    if (camp.estado === 'completada') throw new Error('Campaña ya completada');

    // Marcar como enviando
    await query(
      'UPDATE campanas SET estado=$1, total_envios=$2 WHERE id=$3',
      ['enviando', 0, campanaId]
    );

    // Obtener clientes
    const clientes = await getClientesSegmento(camp.segmento);
    console.log('[CAMPAÑA]', camp.nombre, '— enviando a', clientes.length, 'clientes');

    await query('UPDATE campanas SET total_envios=$1 WHERE id=$2', [clientes.length, campanaId]);

    let enviados = 0, errores = 0;

    for (const cliente of clientes) {
      const msg = personalizarMensaje(camp.mensaje, cliente.nombre);
      try {
        await tw().messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM,
          to:   cliente.whatsapp,
          body: msg,
        });
        enviados++;
      } catch (e) {
        errores++;
        console.error('[CAMPAÑA] Error enviando a', cliente.whatsapp, ':', e.message);
      }

      // Actualizar progreso cada 10 envíos
      if ((enviados + errores) % 10 === 0) {
        await query(
          'UPDATE campanas SET enviados=$1, errores=$2 WHERE id=$3',
          [enviados, errores, campanaId]
        );
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, Math.floor(1000 / rate)));
    }

    // Finalizar
    await query(`
      UPDATE campanas SET
        estado='completada', enviados=$1, errores=$2, completada_en=NOW()
      WHERE id=$3`,
      [enviados, errores, campanaId]
    );

    console.log('[CAMPAÑA] Completada — enviados:', enviados, '| errores:', errores);
    return { enviados, errores, total: clientes.length };

  } catch (e) {
    console.error('[CAMPAÑA] Error:', e.message);
    await query("UPDATE campanas SET estado='cancelada' WHERE id=$1", [campanaId]).catch(() => {});
    throw e;
  }
}

// ─────────────────────────────────────────────────
//  CREAR CAMPAÑA (desde dashboard)
// ─────────────────────────────────────────────────
async function crearCampana(nombre, mensaje, segmento, creadoPor) {
  const r = await query(`
    INSERT INTO campanas(nombre,mensaje,segmento,creado_por)
    VALUES($1,$2,$3,$4) RETURNING id`,
    [nombre, mensaje, segmento, creadoPor]
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
  crearCampana,
  enviarCampana,
  previewSegmento,
  getClientesSegmento,
};
