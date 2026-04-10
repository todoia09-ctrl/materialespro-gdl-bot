/**
 * fix_plantilla_v1.js
 * Reemplaza el endpoint GET /api/catalogo/plantilla en dashboard/api.js
 * FIX: columnas correctas + datos reales desde DB
 */

const fs   = require('fs');
const path = require('path');

const API_PATH = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\dashboard\\api.js';

const OLD = `// GET /api/catalogo/plantilla \u2013 descarga plantilla Excel vac\u00eda con formato correcto
router.get('/catalogo/plantilla', authMiddleware(['admin']), (req, res) => {
  try {
    const plantilla = [
      {
        id: 'ADH-001',
        categoria: 'Adhesivos',
        nombre: 'Ejemplo: Adhesivo Cer\u00e1mico Est\u00e1ndar',
        descripcion: 'Descripci\u00f3n del producto',
        usos: 'Para qu\u00e9 se usa',
        presentacion: 'Bolsa 25 kg',
        precio: 230,
        rendimiento_m2_por_unidad: 4.5,
        rendimiento_nota: '4 a 5 m\u00b2 por bolsa',
        colores: '',
        activo: true
      }
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(plantilla);
    // Ancho de columnas
    ws['!cols'] = [
      { wch: 12 }, { wch: 15 }, { wch: 35 }, { wch: 40 },
      { wch: 35 }, { wch: 15 }, { wch: 10 }, { wch: 15 },
      { wch: 25 }, { wch: 20 }, { wch: 8 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="plantilla_catalogo.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (e) { res.status(500).json({ error: e.message }); }
});`;

const NEW = `// GET /api/catalogo/plantilla \u2013 exporta productos reales desde DB con columnas correctas para reimport
router.get('/catalogo/plantilla', authMiddleware(['admin']), async (req, res) => {
  try {
    const result = await query(
      \`SELECT codigo, nombre, categoria, marca, unidad, descripcion,
              precio_venta, precio_2, precio_3, precio_4, costo,
              rendimiento_m2_por_unidad, rendimiento_nota, activo
       FROM catalogo_productos
       ORDER BY categoria, nombre\`
    );

    const rows = (result.rows || []).map(r => ({
      'C\u00f3digo CRM':               r.codigo   || '',
      'Art\u00edculo':                  r.nombre   || '',
      'Categor\u00eda':                 r.categoria || '',
      'Marca':                         r.marca    || '',
      'Se vende por':                  r.unidad   || '',
      'descripcion':                   r.descripcion || '',
      'Precio 1 NETO':                 r.precio_venta != null ? Number(r.precio_venta) : '',
      'Precio 2 NETO':                 r.precio_2     != null ? Number(r.precio_2)     : '',
      'Precio 3 NETO':                 r.precio_3     != null ? Number(r.precio_3)     : '',
      'Precio 4 NETO':                 r.precio_4     != null ? Number(r.precio_4)     : '',
      'Costo NETO':                    r.costo        != null ? Number(r.costo)        : '',
      'rendimiento_m2_por_unidad':     r.rendimiento_m2_por_unidad != null ? Number(r.rendimiento_m2_por_unidad) : '',
      'rendimiento_nota':              r.rendimiento_nota || '',
      'Activo':                        r.activo ? 'Verdadero' : 'Falso',
    }));

    // Si no hay productos en DB, agregar fila de ejemplo para guiar al usuario
    if (!rows.length) {
      rows.push({
        'C\u00f3digo CRM': 'SIKA-001',
        'Art\u00edculo': 'Ejemplo: Adhesivo Cer\u00e1mico',
        'Categor\u00eda': 'Adhesivos',
        'Marca': 'SIKA',
        'Se vende por': 'Bolsa 25 kg',
        'descripcion': 'Descripci\u00f3n del producto',
        'Precio 1 NETO': 230,
        'Precio 2 NETO': 218,
        'Precio 3 NETO': 207,
        'Precio 4 NETO': 184,
        'Costo NETO': 150,
        'rendimiento_m2_por_unidad': 4.5,
        'rendimiento_nota': '4 a 5 m\u00b2 por bolsa',
        'Activo': 'Verdadero',
      });
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 14 }, { wch: 38 }, { wch: 18 }, { wch: 14 },
      { wch: 16 }, { wch: 40 }, { wch: 13 }, { wch: 13 },
      { wch: 13 }, { wch: 13 }, { wch: 12 }, { wch: 22 },
      { wch: 25 }, { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="catalogo_export.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (e) { res.status(500).json({ error: e.message }); }
});`;

// ── Leer archivo ──────────────────────────────────────────────────────────────
let content = fs.readFileSync(API_PATH, 'utf8');

if (!content.includes('GET /api/catalogo/plantilla')) {
  console.error('ERROR: No se encontr\u00f3 el bloque a reemplazar. Verificar manualmente.');
  process.exit(1);
}

if (content.includes('exporta productos reales desde DB')) {
  console.log('INFO: Fix ya aplicado anteriormente. Sin cambios.');
  process.exit(0);
}

// ── Reemplazar usando split para evitar problemas con CRLF ────────────────────
const marker_old = 'GET /api/catalogo/plantilla';
const idx = content.indexOf(marker_old);
if (idx === -1) { console.error('ERROR: marker no encontrado'); process.exit(1); }

// Buscar desde el comentario hasta el cierre del router.get
const blockStart = content.lastIndexOf('//', idx);
const blockEnd   = content.indexOf('\nmodule.exports', blockStart);

const before = content.substring(0, blockStart);
const after  = content.substring(blockEnd);

const newContent = before + NEW + '\n' + after;

// ── Escribir sin BOM ──────────────────────────────────────────────────────────
fs.writeFileSync(API_PATH, newContent, { encoding: 'utf8' });
console.log('OK: fix_plantilla_v1 aplicado correctamente.');
console.log('Productos en export: desde catalogo_productos DB');
console.log('Columnas: C\u00f3digo CRM | Art\u00edculo | Categor\u00eda | Marca | Se vende por | Precio 1-4 NETO | Costo NETO | ...');
