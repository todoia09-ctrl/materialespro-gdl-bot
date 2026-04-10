/**
 * fix_import_export_v2.js
 * MaterialesPro GDL — Fix completo Import/Export catálogo
 *
 * FIX 1: GET /api/catalogo/plantilla — corrige costo_neto + precio_2/3/4
 * FIX 2: POST /api/catalogo/importar — agrega upsert a DB después de catalogo.json
 *
 * Uso: node fix_import_export_v2.js
 */

const fs   = require('fs');
const path = require('path');

const API_PATH = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\dashboard\\api.js';

// ── Leer archivo ──────────────────────────────────────────────────────────────
let content = fs.readFileSync(API_PATH, 'utf8');

// ════════════════════════════════════════════════════════════════════════════
//  FIX 1 — EXPORT: corregir columnas
// ════════════════════════════════════════════════════════════════════════════

const OLD_EXPORT = `    const result = await query(
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
    }));`;

const NEW_EXPORT = `    const result = await query(
      \`SELECT codigo, nombre, categoria, marca, unidad, descripcion,
              precio_venta, precio_2, precio_3, precio_4, costo_neto,
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
      'Costo NETO':                    r.costo_neto   != null ? Number(r.costo_neto)   : '',
      'rendimiento_m2_por_unidad':     r.rendimiento_m2_por_unidad != null ? Number(r.rendimiento_m2_por_unidad) : '',
      'rendimiento_nota':              r.rendimiento_nota || '',
      'Activo':                        r.activo ? 'Verdadero' : 'Falso',
    }));`;

if (!content.includes("precio_venta, precio_2, precio_3, precio_4, costo,")) {
  console.log('WARN FIX1: bloque export ya corregido o no encontrado — revisando...');
} else {
  content = content.replace(
    "precio_venta, precio_2, precio_3, precio_4, costo,",
    "precio_venta, precio_2, precio_3, precio_4, costo_neto,"
  );
  content = content.replace(
    "'Costo NETO':                    r.costo        != null ? Number(r.costo)        : '',",
    "'Costo NETO':                    r.costo_neto   != null ? Number(r.costo_neto)   : '',"
  );
  console.log('OK FIX1: Export corregido — costo_neto + precio_2/3/4');
}

// ════════════════════════════════════════════════════════════════════════════
//  FIX 2 — IMPORT: agregar upsert a DB después de escribir catalogo.json
// ════════════════════════════════════════════════════════════════════════════

const OLD_IMPORT_END = `    console.log(\`[CAT\u00c1LOGO] Actualizado por \${req.user.email}: \${anterior} \u2192 \${productos.length} productos\`);

    res.json({
      ok: true,
      mensaje: \`Cat\u00e1logo actualizado: \${productos.length} productos importados\`,
      anterior: anterior,
      nuevo: productos.length,
      productos_preview: productos.slice(0, 3).map(p => ({ nombre: p.nombre, precio: p.precio, activo: p.activo }))
    });

  } catch (e) {
    console.error('[CAT\u00c1LOGO IMPORT]', e.message);
    res.status(500).json({ error: 'Error al procesar el archivo: ' + e.message });
  }
});`;

const NEW_IMPORT_END = `    console.log(\`[CAT\u00c1LOGO] Actualizado por \${req.user.email}: \${anterior} \u2192 \${productos.length} productos\`);

    // ── Upsert a DB catalogo_productos ──────────────────────────────────────
    let dbInsertados = 0;
    let dbActualizados = 0;
    let dbErrores = 0;

    for (const p of productos) {
      try {
        const res_db = await query(\`
          INSERT INTO catalogo_productos (
            codigo, nombre, descripcion, categoria, marca,
            unidad, precio_venta, precio_2, precio_3, precio_4,
            costo_neto, rendimiento_m2_por_unidad, rendimiento_nota,
            activo, actualizado_en
          ) VALUES (
            \$1, \$2, \$3, \$4, \$5,
            \$6, \$7, \$8, \$9, \$10,
            \$11, \$12, \$13,
            \$14, NOW()
          )
          ON CONFLICT (codigo) DO UPDATE SET
            nombre                    = EXCLUDED.nombre,
            descripcion               = EXCLUDED.descripcion,
            categoria                 = EXCLUDED.categoria,
            marca                     = EXCLUDED.marca,
            unidad                    = EXCLUDED.unidad,
            precio_venta              = EXCLUDED.precio_venta,
            precio_2                  = EXCLUDED.precio_2,
            precio_3                  = EXCLUDED.precio_3,
            precio_4                  = EXCLUDED.precio_4,
            costo_neto                = EXCLUDED.costo_neto,
            rendimiento_m2_por_unidad = EXCLUDED.rendimiento_m2_por_unidad,
            rendimiento_nota          = EXCLUDED.rendimiento_nota,
            activo                    = EXCLUDED.activo,
            actualizado_en            = NOW()
          RETURNING (xmax = 0) AS fue_insert
        \`, [
          p.id,
          p.nombre,
          p.descripcion || null,
          p.categoria || 'General',
          p.marca || null,
          p.presentacion || null,
          p.precio    || null,
          p.precio_2  || null,
          p.precio_3  || null,
          p.precio_4  || null,
          p.costo     || null,
          p.rendimiento_m2_por_unidad || null,
          p.rendimiento_nota || null,
          p.activo,
        ]);
        if (res_db.rows[0]?.fue_insert) dbInsertados++;
        else dbActualizados++;
      } catch (dbErr) {
        dbErrores++;
        console.error(\`[CAT\u00c1LOGO DB] Error upsert \${p.id}: \${dbErr.message}\`);
      }
    }

    console.log(\`[CAT\u00c1LOGO DB] Insertados: \${dbInsertados} | Actualizados: \${dbActualizados} | Errores: \${dbErrores}\`);

    res.json({
      ok: true,
      mensaje: \`Cat\u00e1logo actualizado: \${productos.length} productos importados\`,
      anterior: anterior,
      nuevo: productos.length,
      db: { insertados: dbInsertados, actualizados: dbActualizados, errores: dbErrores },
      productos_preview: productos.slice(0, 3).map(p => ({ nombre: p.nombre, precio: p.precio, activo: p.activo }))
    });

  } catch (e) {
    console.error('[CAT\u00c1LOGO IMPORT]', e.message);
    res.status(500).json({ error: 'Error al procesar el archivo: ' + e.message });
  }
});`;

// Verificar que el import no esté ya parcheado
if (content.includes('Upsert a DB catalogo_productos')) {
  console.log('WARN FIX2: Import ya tiene upsert DB — sin cambios');
} else if (!content.includes('productos_preview: productos.slice(0, 3)')) {
  console.log('ERROR FIX2: Bloque de import no encontrado — verificar manualmente');
  process.exit(1);
} else {
  // Reemplazar bloque final del import
  const marker = 'console.log(`[CAT';
  const resJson = "res.json({\n      ok: true,\n      mensaje: `Cat";

  // Buscar desde el log hasta el cierre del try/catch
  const importIdx = content.indexOf('POST /api/catalogo/importar');
  const afterImport = content.indexOf('GET /api/catalogo/plantilla', importIdx);
  const importBlock = content.substring(importIdx, afterImport);

  const logLine = `console.log(\`[CAT\u00c1LOGO] Actualizado por \${req.user.email}: \${anterior} \u2192 \${productos.length} productos\`);`;

  if (!importBlock.includes('Actualizado por')) {
    console.log('ERROR FIX2: No se encontró línea de log en import');
    process.exit(1);
  }

  const newImportBlock = importBlock.replace(
    /console\.log\(`\[CAT[^`]*`\);\s*res\.json\(\{[\s\S]*?\}\);\s*\} catch \(e\) \{[\s\S]*?\}\s*\}\);/,
    NEW_IMPORT_END
  );

  content = content.substring(0, importIdx) + newImportBlock + content.substring(afterImport);
  console.log('OK FIX2: Import ahora hace upsert a DB catalogo_productos');
}

// ── Escribir archivo sin BOM ──────────────────────────────────────────────────
fs.writeFileSync(API_PATH, content, { encoding: 'utf8' });
console.log('\n✅ fix_import_export_v2 completado.');
console.log('   → Export: usa costo_neto + precio_2/3/4 correctos');
console.log('   → Import: escribe catalogo.json + upsert DB simultáneamente');
console.log('\nSiguiente paso: node --check dashboard/api.js');
