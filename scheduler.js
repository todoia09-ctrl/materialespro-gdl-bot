// ══════════════════════════════════════════════════════════════
//  scheduler.js — Tareas Automáticas Programadas
//  - Seguimiento 24h y 48h post-cotización
//  - Reporte diario al dueño a las 7pm
//  - Alerta de stock bajo cada mañana 8am
// ══════════════════════════════════════════════════════════════

const cron   = require('node-cron');
const twilio = require('twilio');
const { query }            = require('./db');
const { getAlertasStock, formatAlertaStock } = require('./inventario');

let _tw = null;
function tw() {
  if (!_tw) _tw = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return _tw;
}

async function sendWA(to, body) {
  try {
    await tw().messages.create({ from: process.env.TWILIO_WHATSAPP_FROM, to, body });
  } catch (e) { console.error('[SCHEDULER WA]', e.message); }
}

// ─────────────────────────────────────────────────
//  SEGUIMIENTO AUTOMÁTICO — cada 10 minutos revisa
//  si hay seguimientos pendientes de enviar
// ─────────────────────────────────────────────────
async function procesarSeguimientos() {
  try {
    // Buscar seguimientos vencidos no enviados
    const r = await query(
      'SELECT s.id, s.tipo, s.notas, cl.whatsapp, cl.nombre ' +
      'FROM seguimientos s ' +
      'JOIN clientes cl ON cl.id = s.cliente_id ' +
      "WHERE s.estado = 'pendiente' " +
      '  AND s.programado_para <= NOW() ' +
      'LIMIT 20'
    );

    for (const seg of r.rows) {
      let msg;
      const nombre = seg.nombre ? ', ' + seg.nombre.split(' ')[0] : '';
      const total  = seg.total ? ' ($' + Number(seg.total).toLocaleString('es-MX') + ' MXN)' : '';

      if (seg.tipo === '24h') {
        msg = '¡Hola' + nombre + '! 👋 Te escribimos de MaterialesPro GDL.\n\n'
            + 'Vimos que te enviamos la cotización *' + seg.folio + '*' + total + ' ayer.\n\n'
            + '¿Pudiste revisarla? ¿Tienes alguna duda o te gustaría hacer el pedido?';
      } else if (seg.tipo === '48h') {
        msg = 'Hola' + nombre + ', un último aviso sobre tu cotización *' + seg.folio + '*' + total + '.\n\n'
            + 'Está a punto de vencer. Si necesitas ajustar cantidades o tienes preguntas, con gusto te ayudamos.\n\n'
            + '¿Hacemos el pedido hoy?';
      }

      if (msg) {
        await sendWA(seg.whatsapp, msg);
        await query(
          'UPDATE seguimientos SET estado=$1, completado_at=NOW() WHERE id=$2',
          ['completado', seg.id]
        );
        console.log('[SCHEDULER] Seguimiento', seg.tipo, 'enviado a', seg.whatsapp);
      }

      // Pequeña pausa entre envíos para no saturar Twilio
      await new Promise(r => setTimeout(r, 1200));
    }
  } catch (e) { console.error('[SCHEDULER] seguimientos:', e.message); }
}

// ─────────────────────────────────────────────────
//  REPORTE DIARIO — 7pm
// ─────────────────────────────────────────────────
async function enviarReporteDiario() {
  try {
    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    const [pedidos, cots, clientes, ingresos] = await Promise.all([
      query(`SELECT COUNT(*) FROM pedidos       WHERE creado_en >= $1`, [hoy]),
      query(`SELECT COUNT(*) FROM cotizaciones  WHERE creado_en >= $1`, [hoy]),
      query(`SELECT COUNT(*) FROM clientes      WHERE primer_contacto >= $1`, [hoy]),
      query(`SELECT COALESCE(SUM(total),0) as total FROM pedidos WHERE estado='confirmado' AND creado_en >= $1`, [hoy]),
    ]);

    const pendientes = await query(`
      SELECT COUNT(*) FROM pedidos WHERE estado='pendiente' AND creado_en >= $1`, [hoy]);
    const alertas = await getAlertasStock();

    const fecha = hoy.toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long' });

    const reporte = '📊 *Reporte del día — ' + fecha + '*\n\n'
      + '💬 Mensajes recibidos: ver dashboard\n'
      + '📄 Cotizaciones enviadas: *' + cots.rows[0].count + '*\n'
      + '📦 Pedidos confirmados: *' + pedidos.rows[0].count + '*\n'
      + '⏳ Pedidos pendientes: *' + pendientes.rows[0].count + '*\n'
      + '👤 Clientes nuevos: *' + clientes.rows[0].count + '*\n'
      + '💰 Ingresos del día: *$' + Number(ingresos.rows[0].total).toLocaleString('es-MX') + ' MXN*\n'
      + (alertas.length ? '\n⚠️ Productos con stock bajo: *' + alertas.length + '*\nRevisa el inventario en el dashboard.' : '\n✅ Inventario sin alertas')
      + '\n\nDashboard: ' + (process.env.DASHBOARD_URL || 'Ver en Railway');

    const owner = process.env.OWNER_WHATSAPP || process.env.VENDOR_WHATSAPP;
    if (owner) {
      await sendWA('whatsapp:' + owner, reporte);
      console.log('[SCHEDULER] Reporte diario enviado');
    }
  } catch (e) { console.error('[SCHEDULER] reporte:', e.message); }
}

// ─────────────────────────────────────────────────
//  ALERTA DE STOCK BAJO — 8am
// ─────────────────────────────────────────────────
async function alertaStockManana() {
  try {
    const alertas = await getAlertasStock();
    if (!alertas.length) return;
    const msg = formatAlertaStock(alertas);
    const owner = process.env.OWNER_WHATSAPP || process.env.VENDOR_WHATSAPP;
    if (msg && owner) {
      await sendWA('whatsapp:' + owner, msg);
      console.log('[SCHEDULER] Alerta stock enviada —', alertas.length, 'productos');
    }
  } catch (e) { console.error('[SCHEDULER] alertaStock:', e.message); }
}

// ─────────────────────────────────────────────────
//  LIMPIAR SESIONES EXPIRADAS DE COTIZACIONES
// ─────────────────────────────────────────────────
async function marcarCotizacionesExpiradas() {
  try {
    const r = await query(`
      UPDATE cotizaciones SET estado='expirada'
      WHERE estado='enviada' AND expira_en < NOW()`
    );
    if (r.rowCount > 0) console.log('[SCHEDULER] Cotizaciones expiradas:', r.rowCount);
  } catch (e) { console.error('[SCHEDULER] expiradas:', e.message); }
}

// ─────────────────────────────────────────────────
//  ARRANCAR TODOS LOS CRON JOBS
// ─────────────────────────────────────────────────
function initScheduler() {
  // Seguimientos — cada 10 minutos
  cron.schedule('*/10 * * * *', procesarSeguimientos, { timezone: 'America/Mexico_City' });

  // Reporte diario — 7pm hora México
  cron.schedule('0 19 * * *', enviarReporteDiario, { timezone: 'America/Mexico_City' });

  // Alerta de stock — 8am hora México
  cron.schedule('0 8 * * *', alertaStockManana, { timezone: 'America/Mexico_City' });

  // Limpiar cotizaciones expiradas — medianoche
  cron.schedule('0 0 * * *', marcarCotizacionesExpiradas, { timezone: 'America/Mexico_City' });

  console.log('[SCHEDULER] Jobs activos: seguimientos(10min) · reporte(7pm) · stock(8am) ✅');
}

module.exports = { initScheduler, procesarSeguimientos, enviarReporteDiario };
