// fix_btn_final.js
// Reemplaza la línea rota del botón ✏️ en filterInventario
// Ejecutar: node fix_btn_final.js

var fs   = require('fs');
var path = require('path');

var HTML_PATH = path.join(
  'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl',
  'dashboard', 'index.html'
);

var content = fs.readFileSync(HTML_PATH, 'utf8');
var lines   = content.split('\n');

// Encontrar la línea que tiene openEditProducto
var targetIdx = -1;
for (var i = 0; i < lines.length; i++) {
  if (lines[i].indexOf('openEditProducto') !== -1) {
    targetIdx = i;
    break;
  }
}

if (targetIdx === -1) {
  console.error('No se encontro openEditProducto en index.html');
  process.exit(1);
}

console.log('Linea', targetIdx + 1, 'encontrada');
console.log('OLD:', JSON.stringify(lines[targetIdx].substring(0, 100)));

// Construir la línea correcta parte por parte
// En el archivo HTML, esta línea es código JS que usa strings con comillas simples
// onclick usa \" para poner comillas dobles dentro del HTML attr
// Para el onclick del botón se necesita: onclick="openEditProducto(\'ID\')"
// Dentro del string JS con comillas simples:
//   comilla doble  = " (sin escape)
//   comilla simple = \' (con escape)

var p = [];
p.push("      + '<td>");
p.push('<div style="display:flex;gap:.3rem;align-items:center">');
p.push('<input class="inv-input" type="number" id="inv-\' + p.producto_id + \'" value="\' + p.stock + \'" min="0" style="width:70px;padding:.25rem .4rem;font-size:.82rem">');
p.push('<button class="btn btn-primary btn-sm" onclick="saveStock(\\\'\' + p.producto_id + \'\\\')">');
p.push('\uD83D\uDCBE');  // 💾
p.push('</button>');
p.push('<button class="btn btn-secondary btn-sm" onclick="openEditProducto(\\\'\' + p.producto_id + \'\\\')">');
p.push('\u270F\uFE0F');  // ✏️
p.push('</button>');
p.push("</div></td>'");

var correctLine = p.join('');
console.log('NEW:', JSON.stringify(correctLine.substring(0, 100)));

lines[targetIdx] = correctLine;

var newContent = lines.join('\n');
fs.writeFileSync(HTML_PATH, newContent, { encoding: 'utf8' });
console.log('Archivo guardado. Verifica en Chrome DevTools que no haya SyntaxError.');
