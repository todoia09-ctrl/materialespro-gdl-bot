// fix_btn_syntax.js
// Corrige el SyntaxError en la línea del botón ✏️ de inventario
// El problema: comillas mixtas \" y ' sin escapar dentro del string JS
// Ejecutar: node fix_btn_syntax.js

var fs   = require('fs');
var path = require('path');

var HTML_PATH = path.join(
  'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl',
  'dashboard', 'index.html'
);

var html = fs.readFileSync(HTML_PATH, 'utf8');

// Cadena ROTA (lo que está en el archivo ahora):
// onclick=\"openEditProducto('" + p.producto_id + "')\">
var OLD = '<button class=\\"btn btn-secondary btn-sm\\" onclick=\\"openEditProducto(\'"'
        + ' + p.producto_id + '
        + "\"')\\\">&#x270F;&#xFE0F;</button>";

// Enfoque más robusto: buscar por fragmento único inconfundible
var BROKEN_FRAGMENT = 'onclick=\\"openEditProducto(\'"';

if (!html.includes(BROKEN_FRAGMENT)) {
  // Intentar variante alternativa que puede haberse escrito
  var BROKEN_FRAGMENT2 = "onclick=\\\"openEditProducto('\"";
  if (!html.includes(BROKEN_FRAGMENT2)) {
    console.log('Fragmento no encontrado con escape. Buscando en crudo...');
    // Buscar la línea completa del botón problemático y mostrarla
    var idx = html.indexOf('openEditProducto');
    if (idx !== -1) {
      console.log('Encontrado openEditProducto en posición', idx);
      console.log('Contexto:', JSON.stringify(html.substring(idx - 50, idx + 100)));
    }
    process.exit(1);
  }
}

// Buscar la línea completa del botón inventario para reemplazarla completa
// La celda de Acción en filterInventario — reemplazar TODO el <td> de acción
var ACTION_CELL_START = "'<td><div style=\"display:flex;gap:.3rem;align-items:center\">";
var ACTION_CELL_END   = "</div></td>'";

var startIdx = html.indexOf(ACTION_CELL_START);
if (startIdx === -1) {
  ACTION_CELL_START = "'<td><div style=\\"display:flex;gap:.3rem;align-items:center\\">";
  startIdx = html.indexOf(ACTION_CELL_START);
}

if (startIdx === -1) {
  console.error('❌ No se encontró el inicio de la celda de acción');
  // Mostrar contexto alrededor de openEditProducto
  var oeIdx = html.indexOf('openEditProducto');
  if (oeIdx !== -1) {
    var lineStart = html.lastIndexOf('\n', oeIdx);
    var lineEnd   = html.indexOf('\n', oeIdx);
    console.log('Línea con openEditProducto:');
    console.log(JSON.stringify(html.substring(lineStart, lineEnd)));
  }
  process.exit(1);
}

var endIdx = html.indexOf(ACTION_CELL_END, startIdx);
if (endIdx === -1) {
  console.error('❌ No se encontró el cierre </div></td>');
  process.exit(1);
}

var oldCell = html.substring(startIdx, endIdx + ACTION_CELL_END.length);
console.log('Celda encontrada:');
console.log(JSON.stringify(oldCell.substring(0, 200)));

// Nueva celda correcta — sin mezcla de comillas
var newCell = "'<td>"
  + "<div style=\"display:flex;gap:.3rem;align-items:center\">"
  + "<input class=\"inv-input\" type=\"number\" id=\"inv-' + p.producto_id + '\" value=\"' + p.stock + '\" min=\"0\" style=\"width:70px;padding:.25rem .4rem;font-size:.82rem\">"
  + "<button class=\"btn btn-primary btn-sm\" onclick=\"saveStock(\\'' + p.producto_id + '\\')\">\uD83D\uDCBE</button>"
  + "<button class=\"btn btn-secondary btn-sm\" onclick=\"openEditProducto(\\'' + p.producto_id + '\\')\">\u270F\uFE0F</button>"
  + "</div></td>'";

html = html.substring(0, startIdx) + newCell + html.substring(endIdx + ACTION_CELL_END.length);

fs.writeFileSync(HTML_PATH, html, { encoding: 'utf8' });
console.log('✅ Celda de acción corregida — comillas correctas');
console.log('Abre DevTools y verifica que no haya SyntaxError');
