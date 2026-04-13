// fix_catalog_filter_v1.js
// Fix rate limit 429: filtrar catálogo por marca/categoria detectada en mensaje
// REGLA #38: dry-run + auto node--check con temp
const fs = require('fs');
const { execSync } = require('child_process');

const FILE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\server.js';
const TEMP = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\server_filter_check.js';

const content = fs.readFileSync(FILE, 'utf8');
const SEP = content.includes('\r\n') ? '\r\n' : '\n';

console.log('=== DRY-RUN fix_catalog_filter_v1 ===');

// Verificar anclas
const hasDetectFiltro   = content.includes('detectFiltro');
const hasBuildCatalog   = content.includes('function buildCatalogText(cat, nivelInfo)');
const hasBuildSystem    = content.includes('function buildSystemPrompt(clientName, channel, nivelInfo)');
const hasGetAIResponse  = content.includes('system:     buildSystemPrompt(clientName, channel, nivelInfo)');

console.log('detectFiltro ya existe:', hasDetectFiltro);
console.log('buildCatalogText:', hasBuildCatalog);
console.log('buildSystemPrompt:', hasBuildSystem);
console.log('getAIResponse usa buildSystemPrompt:', hasGetAIResponse);

if (hasDetectFiltro) {
  console.error('ABORT — detectFiltro ya existe. Script ya fue aplicado.');
  process.exit(1);
}
if (!hasBuildCatalog || !hasBuildSystem || !hasGetAIResponse) {
  console.error('ABORT — una o mas anclas no encontradas.');
  process.exit(1);
}

var result = content;

// ─────────────────────────────────────────────────
// PATCH 1: Agregar detectFiltro() ANTES de buildCatalogText
// ─────────────────────────────────────────────────
const DETECT_FN =
'// ─────────────────────────────────────────────────' + SEP +
'//  DETECTOR DE MARCA/CATEGORÍA PARA FILTRADO' + SEP +
'// ─────────────────────────────────────────────────' + SEP +
'function detectFiltro(msgText) {' + SEP +
"  if (!msgText) return { marca: null, categoria: null };" + SEP +
'  var t = msgText.toLowerCase()' + SEP +
"    .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ');" + SEP +
'  // Deteccion de marca (orden importa — mas especifico primero)' + SEP +
"  if (t.includes('pegaduro'))          return { marca: 'PEGADURO',  categoria: null };" + SEP +
"  if (t.includes('perdura'))           return { marca: 'PERDURA',   categoria: null };" + SEP +
"  if (t.includes('fester'))            return { marca: 'FESTER',    categoria: null };" + SEP +
"  if (t.includes('crest'))             return { marca: 'CREST',     categoria: null };" + SEP +
"  if (t.includes('sika'))              return { marca: 'SIKA',      categoria: null };" + SEP +
'  // Deteccion de categoria' + SEP +
"  if (t.includes('impermeabil') || t.includes('imperme') || t.includes('techo') || t.includes('azotea'))" + SEP +
"    return { marca: null, categoria: 'impermeabilizantes' };" + SEP +
"  if (t.includes('adhesivo') || t.includes('pega piso') || t.includes('pegamento') || t.includes('porcelanico') || t.includes('ceramica'))" + SEP +
"    return { marca: null, categoria: 'adhesivos' };" + SEP +
"  if (t.includes('mortero') || t.includes('concreto') || t.includes('aplanado'))" + SEP +
"    return { marca: null, categoria: 'morteros' };" + SEP +
"  if (t.includes('sellador') || t.includes('sello') || t.includes('grieta') || t.includes('fisura'))" + SEP +
"    return { marca: null, categoria: 'selladores' };" + SEP +
"  if (t.includes('piso') || t.includes('marmol') || t.includes('loseta'))" + SEP +
"    return { marca: null, categoria: 'pisos' };" + SEP +
"  if (t.includes('aditivo') || t.includes('acelerante') || t.includes('retardante'))" + SEP +
"    return { marca: null, categoria: 'aditivos' };" + SEP +
"  if (t.includes('anclaje') || t.includes('ancla') || t.includes('varilla'))" + SEP +
"    return { marca: null, categoria: 'anclajes' };" + SEP +
"  return { marca: null, categoria: null };" + SEP +
'}' + SEP + SEP;

const ancla1 = 'function buildCatalogText(cat, nivelInfo)';
const idx1 = result.indexOf(ancla1);
console.log('PATCH 1 ancla indexOf:', idx1);
if (idx1 < 0) { console.error('ABORT PATCH 1'); process.exit(1); }

result = result.substring(0, idx1) + DETECT_FN + result.substring(idx1);
console.log('PATCH 1 (detectFiltro): OK');

// ─────────────────────────────────────────────────
// PATCH 2: Modificar buildCatalogText para aceptar filtro
// Cambiar firma: (cat, nivelInfo) → (cat, nivelInfo, filtro)
// y filtrar restProds por marca/categoria
// ─────────────────────────────────────────────────
result = result.replace(
  'function buildCatalogText(cat, nivelInfo) {',
  function() {
    return 'function buildCatalogText(cat, nivelInfo, filtro) {';
  }
);

// Reemplazar la linea que construye restProds para agregar filtrado
const OLD_REST = "  const restProds = (cat.productos || []).filter(p => p.activo !== false && !priorityCodigos.has(p.codigo || p.id))" + SEP +
"    .map(p => formatLine(p))" + SEP +
'    .join("\\n- ");';

const NEW_REST =
'  // Filtrar por marca o categoria si se detectó en el mensaje' + SEP +
'  var _prods = (cat.productos || []).filter(function(p) { return p.activo !== false && !priorityCodigos.has(p.codigo || p.id); });' + SEP +
'  if (filtro && filtro.marca) {' + SEP +
"    var _fm = filtro.marca.toLowerCase();" + SEP +
'    _prods = _prods.filter(function(p) { return p.marca && String(p.marca).toLowerCase() === _fm; });' + SEP +
'  } else if (filtro && filtro.categoria) {' + SEP +
"    var _fc = filtro.categoria.toLowerCase();" + SEP +
'    _prods = _prods.filter(function(p) { return p.categoria && String(p.categoria).toLowerCase().includes(_fc); });' + SEP +
'  } else {' + SEP +
'    // Sin filtro — limitar a 80 productos para reducir tokens' + SEP +
'    _prods = _prods.slice(0, 80);' + SEP +
'  }' + SEP +
'  var restProds = _prods.map(function(p) { return formatLine(p); }).join("\\n- ");';

const idx2 = result.indexOf(OLD_REST);
console.log('PATCH 2 ancla indexOf:', idx2);
if (idx2 < 0) {
  console.error('ABORT — PATCH 2 ancla no encontrada. Mostrando contexto restProds:');
  const i2 = result.indexOf('restProds');
  console.log(JSON.stringify(result.substring(i2-20, i2+200)));
  process.exit(1);
}
result = result.substring(0, idx2) + NEW_REST + result.substring(idx2 + OLD_REST.length);
console.log('PATCH 2 (buildCatalogText filtro): OK');

// ─────────────────────────────────────────────────
// PATCH 3: Modificar buildSystemPrompt para aceptar msgText
// Firma: (clientName, channel, nivelInfo) → (clientName, channel, nivelInfo, msgText)
// ─────────────────────────────────────────────────
result = result.replace(
  'function buildSystemPrompt(clientName, channel, nivelInfo) {',
  function() { return 'function buildSystemPrompt(clientName, channel, nivelInfo, msgText) {'; }
);

// Cambiar la linea: const catalogTxt = nivelInfo ? buildCatalogText(CATALOG, nivelInfo) : CATALOG_TXT;
const OLD_CATTXT = 'const catalogTxt = nivelInfo ? buildCatalogText(CATALOG, nivelInfo) : CATALOG_TXT;';
const NEW_CATTXT = 'var _filtro = detectFiltro(msgText);' + SEP +
'  const catalogTxt = buildCatalogText(CATALOG, nivelInfo || null, _filtro);';

const idx3 = result.indexOf(OLD_CATTXT);
console.log('PATCH 3 ancla indexOf:', idx3);
if (idx3 < 0) { console.error('ABORT PATCH 3'); process.exit(1); }
result = result.substring(0, idx3) + NEW_CATTXT + result.substring(idx3 + OLD_CATTXT.length);
console.log('PATCH 3 (buildSystemPrompt msgText): OK');

// ─────────────────────────────────────────────────
// PATCH 4: En getAIResponse, pasar userMessage a buildSystemPrompt
// ─────────────────────────────────────────────────
const OLD_SYSTEM = 'system:     buildSystemPrompt(clientName, channel, nivelInfo),';
const NEW_SYSTEM = 'system:     buildSystemPrompt(clientName, channel, nivelInfo, userMessage),';

const idx4 = result.indexOf(OLD_SYSTEM);
console.log('PATCH 4 ancla indexOf:', idx4);
if (idx4 < 0) { console.error('ABORT PATCH 4'); process.exit(1); }
result = result.substring(0, idx4) + NEW_SYSTEM + result.substring(idx4 + OLD_SYSTEM.length);
console.log('PATCH 4 (getAIResponse msgText): OK');

// ─────────────────────────────────────────────────
// Verificar sintaxis
// ─────────────────────────────────────────────────
fs.writeFileSync(TEMP, result, { encoding: 'utf8' });
try {
  execSync('node --check "' + TEMP + '"', { stdio: 'pipe' });
  console.log('node --check TEMP: OK');
} catch(e) {
  fs.unlinkSync(TEMP);
  console.error('ABORT — node --check fallo:');
  console.error(e.stderr ? e.stderr.toString() : e.message);
  process.exit(1);
}

fs.unlinkSync(TEMP);
fs.writeFileSync(FILE, result, { encoding: 'utf8' });
console.log('');
console.log('OK — server.js filtro catálogo aplicado');
console.log('Resultado esperado:');
console.log('  - Mensaje con "sika"    → ~280 SKUs (~1,800 tokens)');
console.log('  - Mensaje con "fester"  → ~215 SKUs (~1,400 tokens)');
console.log('  - Mensaje generico      → prioritarios + 80 productos (~500 tokens)');
console.log('Siguiente: node --check server.js');
