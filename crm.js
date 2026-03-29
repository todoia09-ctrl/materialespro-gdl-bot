// ══════════════════════════════════════════════════════════════
//  crm.js — CRM Completo
//  Perfil 360° del cliente, historial de pedidos/cotizaciones,
//  detección de zona, guardado de pedidos en DB
// ══════════════════════════════════════════════════════════════

const { query, upsertCliente, getCliente, logMensaje } = require('./db');

// ─────────────────────────────────────────────────
//  DETECCIÓN DE ZONA POR COLONIA/MUNICIPIO
// ─────────────────────────────────────────────────
const ZONAS = {
  norte: ['zapopan','colinas','santa fe','ciudad granja','tesistan','nextipac',
          'los laureles','la venta','el colli','jardines del sol','jardines de la cruz'],
  sur:   ['tlaquepaque','santa anita','san pedro','toluquilla','la calerilla',
          'las pintas','el verde','miravalle','lomas del gallo'],
  este:  ['tonala','san gaspar','el salto','juanacatlan','el verde','san antonio',
          'nueva santa maria','jauja','el rosario'],
};

function detectarZona(texto) {
  if (!texto) return null;
  const t = texto.toLowerCase()
    .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e')
    .replace(/[íìï]/g,'i').replace(/[óòö]/g,'o').replace(/[úùü]/g,'u');
  for (const [zona, keywords] of Object.entries(ZONAS)) {
    if (keywords.some(k => t.includes(k))) return zona;
  }
  return null;
}

// ─────────────────────────────────────────────────
//  REGISTRO / ACTUALIZACIÓN DE CLIENTE
// ─────────────────────────────────────────────────
async function registrarContacto(whatsapp, opts = {}) {
  try {
    const cliente = await upsertCliente(whatsapp, {
      nombre: opts.nombre || null,
      canal:  opts.canal  || 'whatsapp',
      zona:   opts.zona   || null,
      rfc:    opts.rfc    || null,
      email:  opts.email  || null,
    });
    return cliente;
  } catch (e) {
    console.error('[CRM] registrarContacto:', e.message);
    return null;
  }
}

// ─────────────────────────────────────────────────
//  ACTUALIZAR ZONA CUANDO SE RECIBE DIRECCIÓN
// ─────────────────────────────────────────────────
async function actualizarZona(whatsapp, colonia) {
  const zona = detectarZona(colonia);
  if (!zona) return;
  try {
    await query('UPDATE clientes SET zona=$1 WHERE whatsapp=$2', [zona, whatsapp]);
  } catch (e) { console.error('[CRM] actualizarZona:', e.message); }
  return zona;
}

// ─────────────────────────────────────────────────
//  GUARDAR COTIZACIÓN EN DB
// ─────────────────────────────────────────────────
async function guardarCotizacion(whatsapp, folio, items, total, pdfUrl, canal) {
  try {
    const cliente = await getCliente(whatsapp);
    if (!cliente) return null;
    const r = await query(`
      INSERT INTO cotizaciones(folio,cliente_id,canal,items_json,total,pdf_url)
      VALUES($1,$2,$3,$4,$5,$6)
      ON CONFLICT(folio) DO UPDATE SET pdf_url=EXCLUDED.pdf_url
      RETURNING id`,
      [folio, cliente.id, canal||'whatsapp', JSON.stringify(items||[]), total||0, pdfUrl||null]
    );
    return r.rows[0]?.id;
  } catch (e) {
    console.error('[CRM] guardarCotizacion:', e.message);
    return null;
  }
}

// ─────────────────────────────────────────────────
//  GUARDAR PEDIDO EN DB
// ─────────────────────────────────────────────────
async function guardarPedido(whatsapp, order, canal) {
  try {
    const cliente = await getCliente(whatsapp);
    if (!cliente) return null;

    const folio = 'PED-' + Date.now();
    const r     = await query(`
      INSERT INTO pedidos(
        folio,cliente_id,canal,tipo,estado,items_json,subtotal,costo_envio,total,
        metodo_pago,factura,cfdi_uso,cfdi_email,
        calle,colonia,referencia,contacto_obra,tel_alterno,maps_link,
        fecha_entrega,fecha_recoger,zona
      ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      RETURNING id`,
      [
        folio, cliente.id, canal||'whatsapp',
        order.type||'pickup', 'pendiente',
        JSON.stringify(order.items||[]),
        order.subtotal||0, order.costoEnvio||0, order.total||0,
        order.payment||null,
        order.invoice||false, order.cfdi||null, order.invEmail||null,
        order.street||null, order.colony||null, order.reference||null,
        order.contact||null, order.altPhone||null, order.mapsLink||null,
        order.datetime||null, order.pickupDate||null,
        detectarZona(order.colony||''),
      ]
    );

    // Actualizar stats del cliente
    await query(`
      UPDATE clientes SET
        num_pedidos   = num_pedidos + 1,
        total_compras = total_compras + $1,
        zona          = COALESCE(zona, $2)
      WHERE id = $3`,
      [order.total||0, detectarZona(order.colony||''), cliente.id]
    );

    return { pedidoId: r.rows[0]?.id, folio };
  } catch (e) {
    console.error('[CRM] guardarPedido:', e.message);
    return null;
  }
}

// ─────────────────────────────────────────────────
//  ACTUALIZAR ESTADO DE PEDIDO
// ─────────────────────────────────────────────────
async function actualizarEstadoPedido(pedidoId, estado) {
  try {
    const extra = estado === 'confirmado' ? ', confirmado_en=NOW()' : '';
    await query(
      'UPDATE pedidos SET estado=$1, actualizado_en=NOW()' + extra + ' WHERE id=$2',
      [estado, pedidoId]
    );
  } catch (e) { console.error('[CRM] actualizarEstado:', e.message); }
}

// ─────────────────────────────────────────────────
//  PROGRAMAR SEGUIMIENTO POST-COTIZACIÓN
// ─────────────────────────────────────────────────
async function programarSeguimiento(whatsapp, cotizacionId) {
  try {
    const cliente = await getCliente(whatsapp);
    if (!cliente) return;

    // 24 horas después
    await query(`
      INSERT INTO seguimientos(cotizacion_id,cliente_id,whatsapp,tipo,programado_en)
      VALUES($1,$2,$3,'24h', NOW() + INTERVAL '24 hours')
      ON CONFLICT DO NOTHING`,
      [cotizacionId, cliente.id, whatsapp]
    );
    // 48 horas después
    await query(`
      INSERT INTO seguimientos(cotizacion_id,cliente_id,whatsapp,tipo,programado_en)
      VALUES($1,$2,$3,'48h', NOW() + INTERVAL '48 hours')
      ON CONFLICT DO NOTHING`,
      [cotizacionId, cliente.id, whatsapp]
    );
  } catch (e) { console.error('[CRM] programarSeguimiento:', e.message); }
}

// ─────────────────────────────────────────────────
//  HISTORIAL DEL CLIENTE (para el dashboard)
// ─────────────────────────────────────────────────
async function getHistorialCliente(whatsapp) {
  try {
    const cliente = await getCliente(whatsapp);
    if (!cliente) return null;

    const [pedidos, cots, msgs] = await Promise.all([
      query('SELECT * FROM pedidos    WHERE cliente_id=$1 ORDER BY creado_en DESC LIMIT 10', [cliente.id]),
      query('SELECT * FROM cotizaciones WHERE cliente_id=$1 ORDER BY creado_en DESC LIMIT 10', [cliente.id]),
      query('SELECT * FROM mensajes   WHERE cliente_id=$1 ORDER BY creado_en DESC LIMIT 20', [cliente.id]),
    ]);

    return {
      cliente,
      pedidos:      pedidos.rows,
      cotizaciones: cots.rows,
      mensajes:     msgs.rows,
    };
  } catch (e) {
    console.error('[CRM] getHistorial:', e.message);
    return null;
  }
}

// ─────────────────────────────────────────────────
//  LOG DE MENSAJE (registra toda conversación)
// ─────────────────────────────────────────────────
async function logConversacion(whatsapp, canal, direccion, contenido, tipo) {
  try {
    const cliente = await getCliente(whatsapp);
    if (cliente) await logMensaje(cliente.id, canal, direccion, contenido, tipo);
  } catch (_) {}
}

module.exports = {
  registrarContacto,
  actualizarZona,
  guardarCotizacion,
  guardarPedido,
  actualizarEstadoPedido,
  programarSeguimiento,
  getHistorialCliente,
  logConversacion,
  detectarZona,
};
