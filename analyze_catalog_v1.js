// analyze_catalog_v1.js — SOLO LECTURA, no modifica nada
// Analisis del Excel antes de importar a catalogo_productos

const XLSX = require('xlsx');
const path = require('path');

const FILE = path.join(
  'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl',
  'plantilla_catalogo_v2 (1).xlsx'
);

console.log('==========================================');
console.log(' ANALISIS CATALOGO EXCEL — solo lectura');
console.log(' Archivo:', FILE);
console.log('==========================================\n');

const wb = XLSX.readFile(FILE, { cellDates: true, raw: false });

// ─── 1. ESTRUCTURA ──────────────────────────────────────────
console.log('── 1. ESTRUCTURA DEL EXCEL ──');
console.log('Hojas:', wb.SheetNames.length, '→', wb.SheetNames);

const sheetName = wb.SheetNames[0];
const ws = wb.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: false });
console.log('Hoja analizada:', sheetName);
console.log('Filas de datos (sin header):', rows.length);

if (rows.length === 0) {
  console.log('ARCHIVO VACIO — ABORTANDO');
  process.exit(1);
}

const columns = Object.keys(rows[0]);
console.log('Columnas (' + columns.length + '):');
columns.forEach((c, i) => console.log('  [' + i + '] ' + JSON.stringify(c)));
console.log();

// ─── Helper ─────────────────────────────────────────────────
function stats(field, opts = {}) {
  const vals = rows.map(r => r[field]);
  const nulos = vals.filter(v => v === null || v === undefined || String(v).trim() === '').length;
  const noNulos = vals.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
  const strs = noNulos.map(v => String(v));
  const lens = strs.map(s => s.length);
  const maxLen = lens.length ? Math.max(...lens) : 0;
  const topLong = strs
    .map((s, i) => ({ s, i, len: s.length }))
    .sort((a, b) => b.len - a.len)
    .slice(0, 5);
  return { vals, nulos, noNulos, strs, maxLen, topLong };
}

function findCol(patterns) {
  for (const p of patterns) {
    const hit = columns.find(c => c.toLowerCase().includes(p.toLowerCase()));
    if (hit) return hit;
  }
  return null;
}

// ─── 2. CODIGO ──────────────────────────────────────────────
console.log('── 2. CAMPO: codigo ──');
const colCodigo = findCol(['codigo', 'código', 'sku', 'clave']);
console.log('Columna detectada:', colCodigo);
if (colCodigo) {
  const s = stats(colCodigo);
  console.log('Longitud maxima:', s.maxLen, '(schema: VARCHAR(50))');
  console.log('VARCHAR(50) alcanza?:', s.maxLen <= 50 ? 'SI' : 'NO — NECESITA AMPLIAR');
  console.log('Top 5 mas largos:');
  s.topLong.forEach(x => console.log('  [' + x.len + '] ' + JSON.stringify(x.s)));
  console.log('Vacios/nulos:', s.nulos);

  // duplicados
  const counts = {};
  s.strs.forEach(v => counts[v] = (counts[v] || 0) + 1);
  const dups = Object.entries(counts).filter(([, n]) => n > 1);
  console.log('Duplicados:', dups.length);
  if (dups.length) {
    console.log('  Ejemplos (hasta 10):');
    dups.slice(0, 10).forEach(([v, n]) => console.log('   ' + JSON.stringify(v) + ' x' + n));
  }

  // caracteres especiales
  const especiales = s.strs.filter(v => /[^A-Za-z0-9\-_.\/]/.test(v));
  console.log('Con caracteres no estandar (fuera de [A-Za-z0-9-_./]):', especiales.length);
  if (especiales.length) {
    console.log('  Ejemplos:', especiales.slice(0, 5).map(x => JSON.stringify(x)).join(', '));
  }
}
console.log();

// ─── 3. NOMBRE ──────────────────────────────────────────────
console.log('── 3. CAMPO: nombre ──');
const colNombre = findCol(['nombre', 'producto', 'descripcion_corta', 'descripcion corta']);
console.log('Columna detectada:', colNombre);
if (colNombre) {
  const s = stats(colNombre);
  console.log('Longitud maxima:', s.maxLen, '(schema: TEXT)');
  console.log('Top 5 mas largos:');
  s.topLong.forEach(x => console.log('  [' + x.len + '] ' + JSON.stringify(x.s.substring(0, 120))));
  console.log('Vacios/nulos:', s.nulos);

  const counts = {};
  s.strs.forEach(v => counts[v] = (counts[v] || 0) + 1);
  const dups = Object.entries(counts).filter(([, n]) => n > 1);
  console.log('Duplicados:', dups.length);
  if (dups.length) dups.slice(0, 5).forEach(([v, n]) => console.log('   ' + JSON.stringify(v.substring(0, 80)) + ' x' + n));

  const conAcentos  = s.strs.filter(v => /[áéíóúÁÉÍÓÚñÑ]/.test(v)).length;
  const conSimbolos = s.strs.filter(v => /[^\w\sáéíóúÁÉÍÓÚñÑ.,\-]/.test(v));
  console.log('Con acentos/enie:', conAcentos);
  console.log('Con simbolos fuera [A-Z a-z 0-9 . , - espacio acentos]:', conSimbolos.length);
  if (conSimbolos.length) {
    console.log('  Ejemplos:');
    conSimbolos.slice(0, 5).forEach(x => console.log('   ' + JSON.stringify(x.substring(0, 100))));
  }
}
console.log();

// ─── 4. MARCA ───────────────────────────────────────────────
console.log('── 4. CAMPO: marca ──');
const colMarca = findCol(['marca']);
console.log('Columna detectada:', colMarca);
if (colMarca) {
  const s = stats(colMarca);
  console.log('Longitud maxima:', s.maxLen, '(schema: VARCHAR(100))');
  console.log('VARCHAR(100) alcanza?:', s.maxLen <= 100 ? 'SI' : 'NO');
  console.log('Vacios/nulos:', s.nulos);

  const counts = {};
  s.strs.forEach(v => counts[v] = (counts[v] || 0) + 1);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  console.log('Marcas unicas:', sorted.length);
  console.log('Conteo por marca:');
  sorted.forEach(([m, n]) => console.log('   ' + JSON.stringify(m) + ': ' + n));

  // variaciones (mismo lowercase)
  const byLower = {};
  sorted.forEach(([m]) => {
    const k = m.toLowerCase().trim();
    byLower[k] = byLower[k] || [];
    byLower[k].push(m);
  });
  const variaciones = Object.entries(byLower).filter(([, arr]) => arr.length > 1);
  console.log('Variaciones de capitalizacion/espacios:', variaciones.length);
  variaciones.forEach(([k, arr]) => console.log('   "' + k + '" →', arr));
}
console.log();

// ─── 5. CATEGORIA ───────────────────────────────────────────
console.log('── 5. CAMPO: categoria ──');
const colCat = findCol(['categoria', 'categoría']);
console.log('Columna detectada:', colCat);
if (colCat) {
  const s = stats(colCat);
  console.log('Longitud maxima:', s.maxLen, '(schema: VARCHAR(120))');
  console.log('VARCHAR(120) alcanza?:', s.maxLen <= 120 ? 'SI' : 'NO');
  console.log('Vacios/nulos:', s.nulos);

  const counts = {};
  s.strs.forEach(v => counts[v] = (counts[v] || 0) + 1);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  console.log('Categorias unicas:', sorted.length);
  sorted.forEach(([m, n]) => console.log('   ' + JSON.stringify(m) + ': ' + n));

  const byLower = {};
  sorted.forEach(([m]) => {
    const k = m.toLowerCase().trim();
    byLower[k] = byLower[k] || [];
    byLower[k].push(m);
  });
  const variaciones = Object.entries(byLower).filter(([, arr]) => arr.length > 1);
  console.log('Variaciones capitalizacion:', variaciones.length);
  variaciones.forEach(([k, arr]) => console.log('   "' + k + '" →', arr));
}
console.log();

// ─── 6. PRECIO ──────────────────────────────────────────────
console.log('── 6. CAMPO: precio ──');
const priceCols = columns.filter(c => /precio|costo|importe|iva/i.test(c));
console.log('Columnas relacionadas a precio:', priceCols);
priceCols.forEach(col => {
  console.log('\n  Columna: ' + JSON.stringify(col));
  const raw = rows.map(r => r[col]);
  const nulos = raw.filter(v => v === null || v === undefined || String(v).trim() === '').length;
  const parsed = raw
    .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
    .map(v => {
      const s = String(v).trim();
      const clean = s.replace(/[$,\s]/g, '');
      const n = parseFloat(clean);
      return { raw: v, clean, n, formato: s };
    });
  const validos = parsed.filter(p => !isNaN(p.n));
  const invalidos = parsed.filter(p => isNaN(p.n));
  const ceros = validos.filter(p => p.n === 0).length;
  const negativos = validos.filter(p => p.n < 0);
  const nums = validos.map(p => p.n);
  console.log('   Vacios:', nulos);
  console.log('   No-numericos:', invalidos.length);
  if (invalidos.length) console.log('     Ejemplos:', invalidos.slice(0, 3).map(x => JSON.stringify(x.raw)));
  if (nums.length) {
    console.log('   Min:', Math.min(...nums));
    console.log('   Max:', Math.max(...nums));
  }
  console.log('   Ceros:', ceros);
  console.log('   Negativos:', negativos.length);
  // formato
  const tieneDolar = raw.filter(v => typeof v === 'string' && v.includes('$')).length;
  const tieneComa  = raw.filter(v => typeof v === 'string' && v.includes(',')).length;
  const tienePunto = raw.filter(v => typeof v === 'string' && v.includes('.')).length;
  console.log('   Con "$":', tieneDolar, ' | con ",":', tieneComa, ' | con ".":', tienePunto);
  console.log('   Ejemplos raw (3):', raw.slice(0, 3).map(v => JSON.stringify(v)).join(', '));
});
console.log();

// ─── 7. UNIDAD MEDIDA ───────────────────────────────────────
console.log('── 7. CAMPO: unidad_medida ──');
const colUni = findCol(['unidad', 'medida', 'presentacion', 'presentación']);
console.log('Columna detectada:', colUni);
if (colUni) {
  const s = stats(colUni);
  console.log('Longitud maxima:', s.maxLen, '(schema: VARCHAR(30))');
  console.log('VARCHAR(30) alcanza?:', s.maxLen <= 30 ? 'SI' : 'NO');
  console.log('Vacios/nulos:', s.nulos);
  const counts = {};
  s.strs.forEach(v => counts[v] = (counts[v] || 0) + 1);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  console.log('Unidades unicas:', sorted.length);
  sorted.forEach(([m, n]) => console.log('   ' + JSON.stringify(m) + ': ' + n));
  const byLower = {};
  sorted.forEach(([m]) => {
    const k = m.toLowerCase().trim();
    byLower[k] = byLower[k] || [];
    byLower[k].push(m);
  });
  const variaciones = Object.entries(byLower).filter(([, arr]) => arr.length > 1);
  console.log('Variaciones:', variaciones.length);
  variaciones.forEach(([k, arr]) => console.log('   "' + k + '" →', arr));
}
console.log();

// ─── 8. OPCIONALES ──────────────────────────────────────────
console.log('── 8. CAMPOS OPCIONALES ──');
const colDesc   = findCol(['descripcion', 'descripción', 'desc ']);
const colImg    = findCol(['imagen', 'image', 'url', 'foto']);
const colActivo = findCol(['activo', 'estatus', 'status', 'estado']);
console.log('descripcion → columna:', colDesc);
if (colDesc) {
  const s = stats(colDesc);
  console.log('   Longitud maxima:', s.maxLen, ' | vacios:', s.nulos);
}
console.log('imagen_url  → columna:', colImg);
if (colImg) {
  const s = stats(colImg);
  console.log('   Longitud maxima:', s.maxLen, ' | vacios:', s.nulos);
  console.log('   Ejemplos:', s.strs.slice(0, 3).map(x => JSON.stringify(x.substring(0, 80))));
}
console.log('activo      → columna:', colActivo);
if (colActivo) {
  const s = stats(colActivo);
  const counts = {};
  s.strs.forEach(v => counts[v] = (counts[v] || 0) + 1);
  console.log('   Valores:', counts);
}

// columnas NO mapeadas
const mapeadas = [colCodigo, colNombre, colMarca, colCat, colUni, colDesc, colImg, colActivo]
  .concat(priceCols)
  .filter(Boolean);
const noMapeadas = columns.filter(c => !mapeadas.includes(c));
console.log('Columnas en Excel NO mapeadas al schema:', noMapeadas);
console.log();

// ─── 9. ENCODING ────────────────────────────────────────────
console.log('── 9. ENCODING ──');
let raros = 0;
const ejemplos = [];
rows.forEach((r, i) => {
  for (const k of columns) {
    const v = r[k];
    if (typeof v !== 'string') continue;
    // caracteres de replacement / controles no imprimibles
    if (/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(v)) {
      raros++;
      if (ejemplos.length < 5) ejemplos.push({ fila: i + 2, col: k, val: v });
    }
  }
});
console.log('Caracteres raros/no-UTF8 detectados:', raros);
if (ejemplos.length) ejemplos.forEach(e => console.log('   fila ' + e.fila + ' col ' + e.col + ': ' + JSON.stringify(e.val)));
// sanity check acentos comunes
const muestraAcentos = rows
  .map(r => r[colNombre])
  .filter(v => typeof v === 'string' && /[áéíóúñÁÉÍÓÚÑ]/.test(v))
  .slice(0, 3);
console.log('Muestra acentos OK:', muestraAcentos.map(v => JSON.stringify(v.substring(0, 60))));
console.log();

// ─── 10. RESUMEN ────────────────────────────────────────────
console.log('── 10. RESUMEN FINAL ──');
console.log('Columnas detectadas → DB:');
console.log('   ' + JSON.stringify(colCodigo)  + ' → codigo');
console.log('   ' + JSON.stringify(colNombre)  + ' → nombre');
console.log('   ' + JSON.stringify(colMarca)   + ' → marca');
console.log('   ' + JSON.stringify(colCat)     + ' → categoria');
console.log('   ' + JSON.stringify(colUni)     + ' → unidad_medida');
console.log('   priceCols: ' + JSON.stringify(priceCols) + ' → precio_unitario / precio_sin_iva');
console.log('   ' + JSON.stringify(colDesc)    + ' → descripcion');
console.log('   ' + JSON.stringify(colImg)     + ' → imagen_url');
console.log('   ' + JSON.stringify(colActivo)  + ' → activo');
console.log('\nFIN ANALISIS');
