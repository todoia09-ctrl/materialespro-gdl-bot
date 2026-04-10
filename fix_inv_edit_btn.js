// fix_inv_edit_btn.js
// Agrega botón ✏️ en filas de inventario — reemplaza cadena exacta de línea 1231
// Ejecutar: node fix_inv_edit_btn.js

var fs   = require('fs');
var path = require('path');

var HTML_PATH = path.join(
  'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl',
  'dashboard', 'index.html'
);

var html = fs.readFileSync(HTML_PATH, 'utf8');

// Cadena OLD — exactamente como está en el archivo (emoji literal 💾)
var OLD = "onclick=\"saveStock(\\'' + p.producto_id + '\\')\">\uD83D\uDCBE</button></div></td>'";

// Cadena NEW — agrega botón ✏️ justo antes de </div></td>
var NEW = "onclick=\"saveStock(\\'' + p.producto_id + '\\')\">\uD83D\uDCBE</button>"
        + "<button class=\\\"btn btn-secondary btn-sm\\\" "
        + "onclick=\\\"openEditProducto('\" + p.producto_id + \"')\\\">\u270F\uFE0F</button>"
        + "</div></td>'";

if (!html.includes(OLD)) {
  console.error('❌ Cadena OLD no encontrada. Verifica manualmente línea 1231.');
  console.log('Buscando variantes...');
  // Intentar con el emoji directamente
  var OLD2 = 'onclick=\\"saveStock(\\\'\'+ p.producto_id +\'\\\')\\">';
  console.log('includes saveStock:', html.includes('saveStock'));
  process.exit(1);
}

html = html.replace(OLD, NEW);
console.log('✅ Botón ✏️ agregado en filas de inventario');

fs.writeFileSync(HTML_PATH, html, { encoding: 'utf8' });
console.log('✅ index.html guardado');
