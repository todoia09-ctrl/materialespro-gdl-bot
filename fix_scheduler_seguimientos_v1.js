/**
 * fix_scheduler_seguimientos_v1.js
 * MaterialesPro GDL — Fix: procesarSeguimientos usa schema viejo
 *
 * CAMBIOS:
 *   cotizacion_id    → no existe (tabla tiene pedido_id)
 *   programado_en    → programado_para
 *   enviado_en       → completado_at
 *   whatsapp         → viene de JOIN clientes
 *   folio/total      → removidos (no hay cotizacion)
 *
 * EJECUTAR:
 *   node C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\fix_scheduler_seguimientos_v1.js
 */

const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'scheduler.js');
console.log('\n[FIX SEGUIMIENTOS] Leyendo:', FILE);

const OLD = `async function procesarSeguimientos() {
  try {
    // Buscar seguimientos vencidos no enviados
    const r = await query(\`
      SELECT s.id, s.whatsapp, s.tipo, s.cotizacion_id,
             c.folio, c.total, cl.nombre
      FROM seguimientos s
      JOIN cotizaciones c  ON c.id = s.cotizacion_id
      JOIN clientes    cl  ON cl.id = s.cliente_id
      WHERE s.estado = 'pendiente'
        AND s.programado_en <= NOW()
      LIMIT 20\`
    );

    for (const seg of r.rows) {
      let msg;
      const nombre = seg.nombre ? ', ' + seg.nombre.split(' ')[0] : '';
      const total  = seg.total ? ' ($' + Number(seg.total).toLocaleString('es-MX') + ' MXN)' : '';

      if (seg.tipo === '24h') {
        msg = 'Â¡Hola' + nombre + '! ðŸ'‹ Te escribimos de MaterialesPro GDL.\\n\\n'
            + 'Vimos que te enviamos la cotizaciÃ³n *' + seg.folio + '*' + total + ' ayer.\\n\\n'
            + 'Â¿Pudiste revisarla? Â¿Tienes alguna duda o te gustarÃ­a hacer el pedido?';
      } else if (seg.tipo === '48h') {
        msg = 'Hola' + nombre + ', un Ãºltimo aviso sobre tu cotizaciÃ³n *' + seg.folio + '*' + total + '.\\n\\n'
            + 'EstÃ¡ a punto de vencer. Si necesitas ajustar cantidades o tienes preguntas, con gusto te ayudamos.\\n\\n'
            + 'Â¿Hacemos el pedido hoy?';
      }

      if (msg) {
        await sendWA(seg.whatsapp, msg);
        await query(
          'UPDATE seguimientos SET estado=$1, enviado_en=NOW() WHERE id=$2',
          ['enviado', seg.id]
        );
        console.log('[SCHEDULER] Seguimiento', seg.tipo, 'enviado a', seg.whatsapp);
      }

      // PequeÃ±a pausa entre envÃ­os para no saturar Twilio
      await new Promise(r => setTimeout(r, 1200));
    }
  } catch (e) { console.error('[SCHEDULER] seguimientos:', e.message); }
}`;

const NEW = `async function procesarSeguimientos() {
  try {
    // Buscar seguimientos vencidos no enviados — schema nuevo
    const r = await query(
      'SELECT s.id, s.tipo, s.notas, cl.whatsapp, cl.nombre ' +
      'FROM seguimientos s ' +
      'JOIN clientes cl ON cl.id = s.cliente_id ' +
      "WHERE s.estado = 'pendiente' " +
      '  AND s.programado_para <= NOW() ' +
      'LIMIT 20'
    );

    for (const seg of r.rows) {
      if (!seg.whatsapp) continue;
      let msg;
      const nombre = seg.nombre ? ', ' + seg.nombre.split(' ')[0] : '';

      if (seg.tipo === '24h') {
        msg = '\\u00a1Hola' + nombre + '! \\ud83d\\udc4b Te escribimos de MaterialesPro GDL.\\n\\n'
            + 'Queremos saber si tienes alguna duda sobre tu cotizaci\\u00f3n o si podemos ayudarte a concretar tu pedido.\\n\\n'
            + '\\u00bfTe gustar\\u00eda que lo revisemos juntos?';
      } else if (seg.tipo === '48h') {
        msg = 'Hola' + nombre + ', \\u00faltimo aviso de MaterialesPro GDL. \\ud83d\\udce6\\n\\n'
            + 'Tu cotizaci\\u00f3n est\\u00e1 por vencer. Si necesitas ajustar cantidades o tienes preguntas, con gusto te ayudamos.\\n\\n'
            + '\\u00bfHacemos el pedido hoy?';
      } else if (seg.tipo === 'recordatorio') {
        msg = 'Hola' + nombre + '! Te recordamos que tienes una cotizaci\\u00f3n pendiente en MaterialesPro GDL.\\n\\n'
            + (seg.notas ? seg.notas + '\\n\\n' : '')
            + '\\u00bfPodemos ayudarte a continuar?';
      }

      if (msg) {
        await sendWA(seg.whatsapp, msg);
        await query(
          'UPDATE seguimientos SET estado=$1, completado_at=NOW() WHERE id=$2',
          ['completado', seg.id]
        );
        console.log('[SCHEDULER] Seguimiento', seg.tipo, 'enviado a', seg.whatsapp);
      }

      await new Promise(r => setTimeout(r, 1200));
    }
  } catch (e) { console.error('[SCHEDULER] seguimientos:', e.message); }
}`;

let src = fs.readFileSync(FILE, 'utf8');
const backup = FILE + '.bak_fix_seguimientos_v1';
fs.writeFileSync(backup, src);
console.log('[BACKUP]', backup);

// Try exact match first
if (src.includes(OLD)) {
  src = src.replace(OLD, NEW);
  fs.writeFileSync(FILE, src, 'utf8');
  console.log('[OK] Fix aplicado (LF)');
} else {
  // CRLF version
  const OLD_CRLF = OLD.replace(/\n/g, '\r\n');
  const NEW_CRLF = NEW.replace(/\n/g, '\r\n');
  if (src.includes(OLD_CRLF)) {
    src = src.replace(OLD_CRLF, NEW_CRLF);
    fs.writeFileSync(FILE, src, 'utf8');
    console.log('[OK] Fix aplicado (CRLF)');
  } else {
    // Fallback: replace just the query block which is the root cause
    console.warn('[WARN] Patron exacto no encontrado — aplicando fix minimo a la query');
    const OLD_QUERY = `    const r = await query(\`
      SELECT s.id, s.whatsapp, s.tipo, s.cotizacion_id,
             c.folio, c.total, cl.nombre
      FROM seguimientos s
      JOIN cotizaciones c  ON c.id = s.cotizacion_id
      JOIN clientes    cl  ON cl.id = s.cliente_id
      WHERE s.estado = 'pendiente'
        AND s.programado_en <= NOW()
      LIMIT 20\`
    );`;
    const NEW_QUERY = `    const r = await query(
      'SELECT s.id, s.tipo, s.notas, cl.whatsapp, cl.nombre ' +
      'FROM seguimientos s ' +
      'JOIN clientes cl ON cl.id = s.cliente_id ' +
      "WHERE s.estado = 'pendiente' " +
      '  AND s.programado_para <= NOW() ' +
      'LIMIT 20'
    );`;
    const OLD_Q_CRLF = OLD_QUERY.replace(/\n/g, '\r\n');
    const NEW_Q_CRLF = NEW_QUERY.replace(/\n/g, '\r\n');
    if (src.includes(OLD_QUERY)) {
      src = src.replace(OLD_QUERY, NEW_QUERY);
    } else if (src.includes(OLD_Q_CRLF)) {
      src = src.replace(OLD_Q_CRLF, NEW_Q_CRLF);
    }
    // Fix UPDATE enviado_en -> completado_at
    src = src.replace(
      "'UPDATE seguimientos SET estado=$1, enviado_en=NOW() WHERE id=$2'",
      "'UPDATE seguimientos SET estado=$1, completado_at=NOW() WHERE id=$2'"
    );
    src = src.replace("['enviado', seg.id]", "['completado', seg.id]");
    fs.writeFileSync(FILE, src, 'utf8');
    console.log('[OK] Fix minimo aplicado');
  }
}

console.log('\n[DONE] scheduler.js actualizado\n');
