// add_tablero_v2.js
// Agrega pagina Tablero al dashboard
// REGLA #38: dry-run obligatorio
const fs = require('fs');
const { execSync } = require('child_process');

const FILE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\dashboard\\index.html';
const TEMP = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\dashboard\\tablero_check.html';

const content = fs.readFileSync(FILE, 'utf8');
const SEP = content.includes('\r\n') ? '\r\n' : '\n';

console.log('=== DRY-RUN add_tablero_v2 ===');

if (content.includes("showPage('tablero')")) {
  console.error('ABORT — Tablero ya existe.');
  process.exit(1);
}

var result = content;

// ─── PATCH 1: Nav item ───
const navAnchor = content.includes('onclick="showPage(\'pedidos\')"')
  ? 'onclick="showPage(\'pedidos\')"'
  : "onclick=\"showPage('pedidos')\"";

const idx1 = result.indexOf(navAnchor);
console.log('PATCH 1 nav indexOf:', idx1);
if (idx1 < 0) { console.error('ABORT P1'); process.exit(1); }
const divStart1 = result.lastIndexOf('<div class="nav-item"', idx1);
const NAV_NEW = '<div class="nav-item" onclick="showPage(\'tablero\')"><span class="icon">\uD83D\uDCCB</span> Tablero</div>' + SEP + '    ';
result = result.substring(0, divStart1) + NAV_NEW + result.substring(divStart1);
console.log('PATCH 1: OK');

// ─── PATCH 2: CSS ───
const cssIdx = result.indexOf('</style>');
console.log('PATCH 2 CSS indexOf:', cssIdx);
if (cssIdx < 0) { console.error('ABORT P2'); process.exit(1); }
const CSS =
'.tb-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:1.25rem}' + SEP +
'.tb-stat{background:var(--dark);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:.75rem 1rem}' + SEP +
'.tb-stat-val{font-size:22px;font-weight:600;color:var(--white)}' + SEP +
'.tb-stat-lbl{font-size:11px;color:var(--gray);margin-top:2px}' + SEP +
'.tb-filters{display:flex;gap:8px;margin-bottom:1.25rem;flex-wrap:wrap}' + SEP +
'.tb-filter{padding:5px 14px;border-radius:20px;border:1px solid rgba(255,255,255,.12);background:transparent;color:var(--gray);font-size:12px;cursor:pointer}' + SEP +
'.tb-filter.active{background:rgba(200,92,42,.15);border-color:var(--rust);color:var(--sand)}' + SEP +
'.tb-section{margin-bottom:1.5rem}' + SEP +
'.tb-lbl{font-size:11px;font-weight:600;color:var(--gray);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.6rem;display:flex;align-items:center;gap:8px}' + SEP +
'.tb-dot{width:8px;height:8px;border-radius:50%;display:inline-block}' + SEP +
'.tb-dot-hoy{background:#E24B4A}.tb-dot-man{background:#EF9F27}.tb-dot-fut{background:#1D9E75}' + SEP +
'.tb-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:10px}' + SEP +
'.tb-card{background:var(--dark);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:1rem;position:relative;overflow:hidden}' + SEP +
'.tb-card:hover{border-color:rgba(255,255,255,.18)}' + SEP +
'.tb-acc{position:absolute;left:0;top:0;bottom:0;width:4px}' + SEP +
'.tb-acc-p{background:#378ADD}.tb-acc-e{background:#D85A30}' + SEP +
'.tb-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.4rem;padding-left:10px}' + SEP +
'.tb-folio{font-size:10px;color:var(--gray);font-family:monospace}' + SEP +
'.tb-bgs{display:flex;gap:4px}' + SEP +
'.tb-bg{font-size:10px;font-weight:600;padding:2px 7px;border-radius:8px}' + SEP +
'.tb-bg-p{background:rgba(55,138,221,.15);color:#85B7EB}' + SEP +
'.tb-bg-e{background:rgba(216,90,48,.15);color:#F0997B}' + SEP +
'.tb-bg-ok{background:rgba(99,153,34,.15);color:#97C459}' + SEP +
'.tb-bg-nd{background:rgba(186,117,23,.15);color:#FAC775}' + SEP +
'.tb-cli{font-size:14px;font-weight:600;color:var(--white);padding-left:10px;margin-bottom:3px}' + SEP +
'.tb-fec{font-size:12px;color:var(--gray);padding-left:10px;margin-bottom:.5rem}' + SEP +
'.tb-prd{font-size:11px;color:var(--gray);padding-left:10px;margin-bottom:.65rem;line-height:1.5}' + SEP +
'.tb-foot{display:flex;justify-content:space-between;align-items:center;padding-left:10px;border-top:1px solid rgba(255,255,255,.06);padding-top:.6rem}' + SEP +
'.tb-tot{font-size:13px;font-weight:600;color:var(--sand)}' + SEP +
'.tb-pag{font-size:10px;color:var(--gray);margin-top:2px}' + SEP +
'.tb-btn{font-size:11px;padding:5px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:transparent;color:var(--sand);cursor:pointer}' + SEP +
'.tb-btn:hover{background:rgba(200,92,42,.15);border-color:var(--rust)}' + SEP +
'.tb-empty{color:var(--gray);font-size:13px;padding:.4rem 0}' + SEP;
result = result.substring(0, cssIdx) + CSS + result.substring(cssIdx);
console.log('PATCH 2: OK');

// ─── PATCH 3: HTML page ───
const pageAnchor = 'id="page-pedidos"';
const idx3 = result.indexOf(pageAnchor);
console.log('PATCH 3 page indexOf:', idx3);
if (idx3 < 0) { console.error('ABORT P3'); process.exit(1); }
const divStart3 = result.lastIndexOf('<div', idx3);
const PAGE_HTML =
'<div class="page" id="page-tablero">' + SEP +
'  <div class="page-header"><h1 class="page-title">Tablero de despacho</h1>' + SEP +
'  <button class="btn btn-secondary btn-sm" onclick="loadTablero()">\uD83D\uDD04 Actualizar</button></div>' + SEP +
'  <div class="tb-stats" id="tbStats"><div class="tb-stat"><div class="tb-stat-val">-</div><div class="tb-stat-lbl">Cargando...</div></div></div>' + SEP +
'  <div class="tb-filters">' + SEP +
'    <button class="tb-filter active" onclick="tbFiltro(\'todos\',this)">Todos</button>' + SEP +
'    <button class="tb-filter" onclick="tbFiltro(\'pickup\',this)">Recoger</button>' + SEP +
'    <button class="tb-filter" onclick="tbFiltro(\'entrega\',this)">Entrega</button>' + SEP +
'    <button class="tb-filter" onclick="tbFiltro(\'pendiente\',this)">Pendientes</button>' + SEP +
'    <button class="tb-filter" onclick="tbFiltro(\'confirmado\',this)">Confirmados</button>' + SEP +
'  </div>' + SEP +
'  <div id="tbBoard"><div class="tb-empty">Cargando pedidos...</div></div>' + SEP +
'</div>' + SEP + SEP;
result = result.substring(0, divStart3) + PAGE_HTML + result.substring(divStart3);
console.log('PATCH 3: OK');

// ─── PATCH 4: JS ───
const bodyIdx = result.lastIndexOf('</body>');
console.log('PATCH 4 body indexOf:', bodyIdx);
if (bodyIdx < 0) { console.error('ABORT P4'); process.exit(1); }

// Escribir el JS como archivo separado para evitar escaping issues
const JS_CODE = [
'<script>',
'var _tbAll = [];',
'var _tbF = "todos";',
'',
'async function loadTablero() {',
'  try {',
'    var tk = localStorage.getItem("mp_token");',
'    var r = await fetch("/api/pedidos?limit=100", { headers: { Authorization: "Bearer " + tk } });',
'    _tbAll = await r.json();',
'    if (!Array.isArray(_tbAll)) _tbAll = [];',
'    tbRender();',
'  } catch(e) { document.getElementById("tbBoard").innerHTML = "<div class=\\"tb-empty\\">Error cargando pedidos</div>"; }',
'}',
'',
'function tbDia(p) {',
'  var f = p.tipo === "pickup" ? (p.fecha_recoger || "") : (p.fecha_entrega || "");',
'  f = String(f).toLowerCase();',
'  if (!f || f.length < 2) return "futuro";',
'  if (f.includes("hoy") || f.includes("ahora")) return "hoy";',
'  if (f.includes("ma\\u00F1ana") || f.includes("manana")) return "man";',
'  var hoyNom = new Date().toLocaleDateString("es-MX",{weekday:"long"}).toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g,"");',
'  var fNorm = f.normalize("NFD").replace(/[\\u0300-\\u036f]/g,"");',
'  if (fNorm.includes(hoyNom)) return "hoy";',
'  return "futuro";',
'}',
'',
'function tbFiltro(f, el) {',
'  _tbF = f;',
'  document.querySelectorAll(".tb-filter").forEach(function(b){ b.classList.remove("active"); });',
'  if (el) el.classList.add("active");',
'  tbRender();',
'}',
'',
'function tbRender() {',
'  var excl = ["cancelado","entregado"];',
'  var base = _tbAll.filter(function(p){ return excl.indexOf(p.estado) < 0; });',
'  var lista = base;',
'  if (_tbF === "pickup") lista = lista.filter(function(p){ return p.tipo === "pickup"; });',
'  else if (_tbF === "entrega") lista = lista.filter(function(p){ return p.tipo === "entrega" || p.tipo === "domicilio"; });',
'  else if (_tbF === "pendiente") lista = lista.filter(function(p){ return p.estado === "pendiente"; });',
'  else if (_tbF === "confirmado") lista = lista.filter(function(p){ return p.estado === "confirmado"; });',
'',
'  var g = { hoy: [], man: [], futuro: [] };',
'  lista.forEach(function(p){ var d = tbDia(p); if (g[d]) g[d].push(p); else g.futuro.push(p); });',
'',
'  var nHoy = base.filter(function(p){ return tbDia(p)==="hoy"; }).length;',
'  var nMan = base.filter(function(p){ return tbDia(p)==="man"; }).length;',
'  var nPend = base.filter(function(p){ return p.estado==="pendiente"; }).length;',
'  var nMxn = lista.reduce(function(s,p){ return s+(parseFloat(p.total)||0); },0);',
'  document.getElementById("tbStats").innerHTML =',
'    "<div class=\\"tb-stat\\"><div class=\\"tb-stat-val\\">" + nHoy + "</div><div class=\\"tb-stat-lbl\\">Para hoy</div></div>"',
'    + "<div class=\\"tb-stat\\"><div class=\\"tb-stat-val\\">" + nMan + "</div><div class=\\"tb-stat-lbl\\">Para ma\\u00F1ana</div></div>"',
'    + "<div class=\\"tb-stat\\"><div class=\\"tb-stat-val\\">" + nPend + "</div><div class=\\"tb-stat-lbl\\">Pendientes</div></div>"',
'    + "<div class=\\"tb-stat\\"><div class=\\"tb-stat-val\\">$" + Math.round(nMxn).toLocaleString("es-MX") + "</div><div class=\\"tb-stat-lbl\\">En tr\\u00E1nsito</div></div>";',
'',
'  var secs = [',
'    { k:"hoy", lbl:"Hoy", dot:"tb-dot-hoy" },',
'    { k:"man", lbl:"Ma\\u00F1ana", dot:"tb-dot-man" },',
'    { k:"futuro", lbl:"Pr\\u00F3ximos d\\u00EDas", dot:"tb-dot-fut" }',
'  ];',
'  var html = "";',
'  secs.forEach(function(s) {',
'    var items = g[s.k] || [];',
'    html += "<div class=\\"tb-section\\">";',
'    html += "<div class=\\"tb-lbl\\"><span class=\\"tb-dot " + s.dot + "\\"></span>" + s.lbl + " (" + items.length + ")</div>";',
'    html += "<div class=\\"tb-cards\\">";',
'    if (!items.length) { html += "<div class=\\"tb-empty\\">Sin pedidos</div>"; }',
'    items.forEach(function(p) {',
'      var isPU = p.tipo === "pickup";',
'      var fecha = isPU ? (p.fecha_recoger || "Fecha por confirmar") : (p.fecha_entrega || "Fecha por confirmar");',
'      var bTipo = isPU ? "<span class=\\"tb-bg tb-bg-p\\">Recoger</span>" : "<span class=\\"tb-bg tb-bg-e\\">Entrega</span>";',
'      var bEst = p.estado === "confirmado" ? "<span class=\\"tb-bg tb-bg-ok\\">Confirmado</span>" : "<span class=\\"tb-bg tb-bg-nd\\">Pendiente</span>";',
'      var arr = [];',
'      try { arr = Array.isArray(p.items_json) ? p.items_json : (p.items_json ? JSON.parse(p.items_json) : []); } catch(e){}',
'      var prods = arr.length ? arr.map(function(i){ return "\\u2022 " + (i.qty||1) + "x " + (i.nombre||"Producto"); }).join("<br>") : (p.folio || "-");',
'      var aLbl = isPU ? "Marcar recogido" : "Marcar entregado";',
'      html += "<div class=\\"tb-card\\">";',
'      html += "<div class=\\"tb-acc " + (isPU?"tb-acc-p":"tb-acc-e") + "\\"></div>";',
'      html += "<div class=\\"tb-top\\"><span class=\\"tb-folio\\">" + String(p.folio||p.id||"").substring(0,22) + "</span>";',
'      html += "<div class=\\"tb-bgs\\">" + bTipo + bEst + "</div></div>";',
'      html += "<div class=\\"tb-cli\\">" + (p.cliente_nombre||"Cliente") + "</div>";',
'      html += "<div class=\\"tb-fec\\">\uD83D\uDCC5 " + fecha + "</div>";',
'      html += "<div class=\\"tb-prd\\">" + prods + "</div>";',
'      html += "<div class=\\"tb-foot\\">";',
'      html += "<div><div class=\\"tb-tot\\">$" + Number(p.total||0).toLocaleString("es-MX") + "</div><div class=\\"tb-pag\\">" + (p.metodo_pago||"") + "</div></div>";',
'      html += "<button class=\\"tb-btn\\" onclick=\\"tbMarcar(" + p.id + ")\\">" + aLbl + "</button>";',
'      html += "</div></div>";',
'    });',
'    html += "</div></div>";',
'  });',
'  document.getElementById("tbBoard").innerHTML = html;',
'}',
'',
'async function tbMarcar(id) {',
'  if (!confirm("\\u00BFMarcar pedido como entregado/recogido?\\nEsto actualizar\\u00E1 el estado.")) return;',
'  try {',
'    var tk = localStorage.getItem("mp_token");',
'    var r = await fetch("/api/pedidos/" + id + "/estado", {',
'      method: "PATCH",',
'      headers: { Authorization: "Bearer " + tk, "Content-Type": "application/json" },',
'      body: JSON.stringify({ estado: "entregado" })',
'    });',
'    var d = await r.json();',
'    if (d.ok || d.id || d.estado) {',
'      if (typeof toast === "function") toast("\\u2705 Pedido actualizado", "success");',
'      loadTablero();',
'    } else { alert("Error: " + (d.error || "respuesta inesperada")); }',
'  } catch(e) { alert("Error: " + e.message); }',
'}',
'</script>'
].join(SEP);

result = result.substring(0, bodyIdx) + SEP + JS_CODE + SEP + result.substring(bodyIdx);
console.log('PATCH 4: OK');

// ─── PATCH 5: showPage case ───
var showAnchor5 = "case 'pedidos': loadPedidos();";
var idx5 = result.indexOf(showAnchor5);
if (idx5 < 0) showAnchor5 = 'case "pedidos": loadPedidos();', idx5 = result.indexOf(showAnchor5);
console.log('PATCH 5 showPage indexOf:', idx5);
if (idx5 >= 0) {
  result = result.substring(0, idx5) +
    "case 'tablero': loadTablero(); break;" + SEP + "      " +
    result.substring(idx5);
  console.log('PATCH 5: OK');
} else {
  console.log('PATCH 5: omitido (se carga al hacer click)');
}

// ─── Escribir y verificar ───
fs.writeFileSync(TEMP, result, { encoding: 'utf8' });
console.log('Archivo escrito. Lineas:', result.split(SEP).length);

// Verificar que los elementos clave existen
var checks = [
  ['page-tablero', result.includes('id="page-tablero"')],
  ['loadTablero', result.includes('function loadTablero()')],
  ['tbRender', result.includes('function tbRender()')],
  ['tbMarcar', result.includes('function tbMarcar(')],
  ['nav tablero', result.includes("showPage('tablero')")],
  ['CSS tb-card', result.includes('.tb-card{')],
];
var allOk = true;
checks.forEach(function(c) {
  console.log(c[0] + ':', c[1] ? 'OK' : 'FALTA');
  if (!c[1]) allOk = false;
});

if (!allOk) {
  fs.unlinkSync(TEMP);
  console.error('ABORT — verificacion fallida.');
  process.exit(1);
}

fs.unlinkSync(TEMP);
fs.writeFileSync(FILE, result, { encoding: 'utf8' });
console.log('');
console.log('OK — Tablero agregado al dashboard');
console.log('Siguiente: git add + commit + push');
