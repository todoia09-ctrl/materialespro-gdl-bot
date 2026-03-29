// ══════════════════════════════════════════════════════════════
//  cotizacion.js — Generador de Cotizaciones PDF Optimizado
//  Fix #12: Guard si Cloudinary no está configurado
//  Fix #1:  Usa twClient inyectado (no instancia propio)
// ══════════════════════════════════════════════════════════════

const PDFDocument  = require('pdfkit');
const cloudinary   = require('cloudinary').v2;
const twilio       = require('twilio');
const { Readable } = require('stream');

// ─────────────────────────────────────────────────
//  CONFIGURAR CLOUDINARY
// ─────────────────────────────────────────────────
function initCloudinary() {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return false;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return true;
}
const CLOUDINARY_OK = initCloudinary();

// ─────────────────────────────────────────────────
//  SINGLETON TWILIO (FIX #1)
// ─────────────────────────────────────────────────
let _twClient = null;
function getTwilio() {
  if (!_twClient) _twClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return _twClient;
}

// ─────────────────────────────────────────────────
//  NÚMERO DE COTIZACIÓN
// ─────────────────────────────────────────────────
let cotCounter = 1;
function generateQuoteNumber() {
  const d   = new Date();
  const ymd = d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
  return 'COT-' + ymd + '-' + String(cotCounter++).padStart(3,'0');
}

function formatMXN(n) {
  return '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits:2, maximumFractionDigits:2 }) + ' MXN';
}

function formatDate() {
  return new Date().toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

// ─────────────────────────────────────────────────
//  COLORES
// ─────────────────────────────────────────────────
const C = {
  dark:     '#1a1a18', accent:   '#c85c2a', sand:  '#c4a96b',
  light:    '#f5f2ec', gray:     '#888880', white: '#ffffff',
  tableHd:  '#2d2d2a', tableAlt: '#f9f7f3', border:'#e0ddd6',
};

// ─────────────────────────────────────────────────
//  PARSEAR COTIZACIÓN DESDE TEXTO
// ─────────────────────────────────────────────────
function parseQuoteText(quoteText, catalog) {
  const items = [];
  if (!catalog?.productos) return items;
  for (const p of catalog.productos) {
    if (!p.activo) continue;
    const kws = p.nombre.toLowerCase()
      .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i')
      .replace(/[óòö]/g,'o').replace(/[úùü]/g,'u')
      .split(' ').filter(w => w.length > 4);
    const text = quoteText.toLowerCase();
    if (!kws.some(k => text.includes(k))) continue;
    const rx    = new RegExp('(\\d+)\\s*(?:bolsas?|cubetas?|kits?)?\\s*(?:de\\s+)?' + (kws[0] || ''), 'i');
    const match = quoteText.match(rx);
    const cant  = match ? parseInt(match[1]) : 1;
    items.push({ id: p.id, nombre: p.nombre, presentacion: p.presentacion,
      cantidad: cant, precioUnitario: p.precio, subtotal: cant * p.precio,
      rendimiento: p.rendimiento_nota });
  }
  if (!items.length && quoteText) {
    const mxnMatch = quoteText.match(/\$[\d,]+/g);
    const monto    = mxnMatch ? parseFloat(mxnMatch[0].replace(/[$,]/g,'')) : 0;
    items.push({ id:'001', nombre:'Materiales según cotización', presentacion:'Ver detalle',
      cantidad:1, precioUnitario:monto, subtotal:monto, rendimiento:null });
  }
  return items;
}

// ─────────────────────────────────────────────────
//  GENERAR PDF (PDFKit, en memoria)
// ─────────────────────────────────────────────────
function generatePDF(data) {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin:50, size:'LETTER', compress:true });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end',  ()  => resolve(Buffer.concat(chunks)));
    doc.on('error', e  => reject(e));

    const W = doc.page.width, H = doc.page.height, L = 50, R = W-50, TW = R-L;

    // Header
    doc.rect(0,0,W,120).fill(C.dark);
    doc.rect(0,120,W,4).fill(C.sand);
    doc.rect(0,124,W,2).fill(C.accent);
    doc.fillColor(C.sand).font('Helvetica-Bold').fontSize(26).text(data.negocio.nombre, L, 28);
    doc.fillColor(C.gray).font('Helvetica').fontSize(10).text('Adhesivos · Texturizados · Impermeabilizantes', L, 58);
    doc.fillColor(C.white).fontSize(9).text(data.negocio.ciudad, L, 74);
    doc.fillColor(C.white).fontSize(9).text('Tel: ' + data.negocio.telefono + '   |   ' + data.negocio.horario, L, 90);
    doc.rect(R-150,20,150,85).fill(C.accent);
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(14).text('COTIZACIÓN', R-140, 32, {width:130,align:'center'});
    doc.fillColor(C.white).font('Helvetica').fontSize(9).text(data.quoteNumber, R-140, 54, {width:130,align:'center'});
    doc.fillColor(C.sand).fontSize(8).text(formatDate(), R-140, 70, {width:130,align:'center'});
    doc.fillColor(C.white).fontSize(8).text('Válida 7 días', R-140, 86, {width:130,align:'center'});

    let y = 145;

    // Cliente
    doc.rect(L,y,TW,14).fill(C.tableHd);
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(9).text('DATOS DEL CLIENTE', L+8, y+3);
    y += 18;
    doc.rect(L,y,TW,55).fill(C.tableAlt).rect(L,y,TW,55).stroke(C.border);
    doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(9).text('Cliente:', L+8, y+8);
    doc.font('Helvetica').text(data.cliente.nombre, L+65, y+8);
    doc.font('Helvetica-Bold').text('WhatsApp:', L+8, y+22);
    doc.font('Helvetica').text(String(data.cliente.telefono || '').replace('whatsapp:',''), L+65, y+22);
    if (data.cliente.rfc) {
      doc.font('Helvetica-Bold').text('RFC:', L+8, y+36);
      doc.font('Helvetica').text(data.cliente.rfc, L+65, y+36);
    }
    y += 68;

    // Tabla header
    doc.rect(L,y,TW,14).fill(C.tableHd);
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(9).text('PRODUCTOS', L+8, y+3);
    y += 14;
    const COL = { id:L, nom:L+35, pr:L+250, cant:L+340, pu:L+385, sub:L+445 };
    doc.rect(L,y,TW,18).fill(C.accent);
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(8);
    ['#','PRODUCTO','PRESENTACIÓN','CANT.','P. UNIT.','SUBTOTAL'].forEach((t,i) => {
      const x = [COL.id+4,COL.nom,COL.pr,COL.cant,COL.pu,COL.sub][i];
      const w = [28,185,85,40,55,65][i];
      const a = i>=3 ? 'right' : 'left';
      doc.text(t, x, y+5, {width:w, align:a});
    });
    y += 18;

    let subtotal = 0;
    (data.items||[]).forEach((item,i) => {
      const rh   = item.rendimiento ? 26 : 20;
      const fill = i%2===0 ? C.white : C.tableAlt;
      doc.rect(L,y,TW,rh).fill(fill).stroke(C.border);
      doc.fillColor(C.dark).font('Helvetica').fontSize(8);
      doc.text(item.id||String(i+1), COL.id+4, y+6, {width:28});
      doc.text(item.nombre,          COL.nom,  y+6, {width:185});
      doc.text(item.presentacion||'',COL.pr,   y+6, {width:85});
      doc.text(String(item.cantidad),COL.cant, y+6, {width:40,align:'right'});
      doc.text(formatMXN(item.precioUnitario), COL.pu, y+6, {width:55,align:'right'});
      doc.text(formatMXN(item.subtotal),       COL.sub,y+6, {width:65,align:'right'});
      if (item.rendimiento) doc.fillColor(C.gray).fontSize(7).text('↳ '+item.rendimiento, COL.nom, y+16, {width:185});
      subtotal += item.subtotal;
      y += rh;
    });
    y += 4;

    // Totales
    const TX = R-200, TOT_W = 200;
    const envio = data.entrega?.tipo==='delivery'
      ? (subtotal>=(data.gratisDesdeMXN||3000) ? 0 : (data.entrega.costoEnvio||180)) : 0;
    const total = subtotal + envio;

    [[`Subtotal:`,subtotal],[data.entrega?.tipo==='pickup'?'Recoger:':'Envío:',envio],null].forEach((row,i) => {
      if (!row) return;
      doc.rect(TX,y,TOT_W,20).fill(C.tableAlt).stroke(C.border);
      doc.fillColor(C.dark).font('Helvetica').fontSize(9).text(row[0], TX+8, y+6, {width:100});
      doc.text(row[1]===0?'GRATIS':formatMXN(row[1]), TX+8, y+6, {width:TOT_W-16,align:'right'});
      y += 20;
    });
    doc.rect(TX,y,TOT_W,26).fill(C.accent);
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(11).text('TOTAL:', TX+8, y+7, {width:80});
    doc.text(formatMXN(total), TX+8, y+7, {width:TOT_W-16,align:'right'});
    y += 36;

    // Pago
    if (data.metodoPago) {
      const labels = {efectivo:'💵 Efectivo',transferencia:'🏦 Transferencia',tarjeta:'💳 Tarjeta',credito:'📑 Crédito'};
      doc.rect(L,y,TW,data.metodoPago==='transferencia'?36:24).fill(C.tableAlt).stroke(C.border);
      doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(9).text('Método de pago:', L+8, y+7);
      doc.font('Helvetica').text(labels[data.metodoPago]||data.metodoPago, L+120, y+7);
      if (data.metodoPago==='transferencia')
        doc.fillColor(C.accent).fontSize(7).text(
          'CLABE: '+(process.env.BANK_CLABE||'XX')+'  Banco: '+(process.env.BANK_NAME||'BBVA')+'  Beneficiario: '+(process.env.BANK_BENEFICIARY||''),
          L+8, y+20, {width:TW-16});
      y += data.metodoPago==='transferencia' ? 46 : 34;
    }

    // Condiciones
    y += 8;
    doc.rect(L,y,TW,2).fill(C.sand); y += 10;
    const conds = [
      '• Cotización válida por 7 días.',
      '• Precios sujetos a disponibilidad de stock.',
      '• Para pedidos >$8,000 MXN consulta precio especial de volumen.',
    ];
    conds.forEach(c => { doc.fillColor(C.gray).font('Helvetica').fontSize(8).text(c, L, y); y += 12; });

    // Footer
    doc.rect(0,H-45,W,45).fill(C.dark);
    doc.rect(0,H-45,W,3).fill(C.accent);
    doc.fillColor(C.sand).font('Helvetica-Bold').fontSize(9).text(data.negocio.nombre, L, H-35);
    doc.fillColor(C.gray).font('Helvetica').fontSize(8)
       .text(data.negocio.ciudad + '  ·  ' + data.negocio.telefono + '  ·  ' + data.negocio.horario, L, H-22);
    doc.fillColor(C.gray).fontSize(8).text('Folio: '+data.quoteNumber, R-100, H-35, {width:100,align:'right'});

    doc.end();
  });
}

// ─────────────────────────────────────────────────
//  SUBIR A CLOUDINARY (FIX #12 — guard si no config)
// ─────────────────────────────────────────────────
async function uploadToCloudinary(buffer, quoteNumber) {
  if (!CLOUDINARY_OK) throw new Error('Cloudinary no está configurado. Agrega CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET a Railway.');
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type:'raw', public_id:'cotizaciones/'+quoteNumber, format:'pdf', overwrite:true },
      (err, result) => err ? reject(err) : resolve(result.secure_url)
    );
    const r = new Readable();
    r.push(buffer); r.push(null); r.pipe(stream);
  });
}

// ─────────────────────────────────────────────────
//  ENVIAR PDF AL CLIENTE (usa singleton twilio)
// ─────────────────────────────────────────────────
async function sendPDF(to, pdfUrl, quoteNumber, total) {
  await getTwilio().messages.create({
    from:     process.env.TWILIO_WHATSAPP_FROM,
    to,
    body:     '📄 *Cotización ' + quoteNumber + '*\nVálida 7 días · Total: *' + formatMXN(total) + '*\n\n¿Hacemos el pedido?',
    mediaUrl: [pdfUrl],
  });
}

// ─────────────────────────────────────────────────
//  FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────────
async function generateAndSendQuote(params) {
  const { clientFrom, clientName, clientPhone, rfc, cfdi, quoteText, catalog, entrega, metodoPago } = params;

  console.log('[PDF] Generando para:', clientName || clientFrom);

  const items    = parseQuoteText(quoteText || '', catalog);
  const qNum     = generateQuoteNumber();
  const subtotal = items.reduce((s,i) => s + i.subtotal, 0);
  const costoEnv = entrega?.tipo==='delivery' ? (subtotal>=3000 ? 0 : (entrega.costoEnvio||180)) : 0;
  const total    = subtotal + costoEnv;

  const pdfBuffer = await generatePDF({
    quoteNumber: qNum,
    negocio:  { nombre: catalog.negocio.nombre, ciudad: catalog.negocio.ciudad,
                telefono: catalog.negocio.telefono, horario: catalog.negocio.horario },
    cliente:  { nombre: clientName||'Cliente', telefono: clientPhone||clientFrom, rfc: rfc||null, cfdi: cfdi||null },
    items, entrega: entrega||{tipo:'pickup'}, metodoPago: metodoPago||null,
    gratisDesdeMXN: catalog.envios.gratis_desde||3000, subtotal, costoEnv, total,
  });

  console.log('[PDF] Generado:', Math.round(pdfBuffer.length/1024) + 'KB');

  const pdfUrl = await uploadToCloudinary(pdfBuffer, qNum);
  console.log('[PDF] URL:', pdfUrl);

  await sendPDF(clientFrom, pdfUrl, qNum, total);
  console.log('[PDF] Enviado a:', clientFrom);

  return { quoteNumber: qNum, pdfUrl, total };
}

// ─────────────────────────────────────────────────
//  DETECTAR SOLICITUD DE PDF
// ─────────────────────────────────────────────────
const PDF_TRIGGERS = [
  'cotizacion','pdf','documento','por escrito','formal',
  'manda la cotizacion','mandame la cotizacion','quiero la cotizacion',
  'en pdf','enviame','enviame la cotizacion','mandame',
];

function isPDFRequest(msg) {
  const c = msg.toLowerCase()
    .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i')
    .replace(/[óòö]/g,'o').replace(/[úùü]/g,'u').replace(/[¿¡!?.,]/g,'').trim();
  return PDF_TRIGGERS.some(t => c.includes(t));
}

module.exports = { generateAndSendQuote, isPDFRequest };
