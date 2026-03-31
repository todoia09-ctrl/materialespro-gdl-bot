// ══════════════════════════════════════════════════════════════
//  dashboard/api.js — API REST del Dashboard
//  Auth JWT · Multi-usuario (admin/vendedor/bodega)
//  Endpoints: auth, pedidos, clientes, inventario, campañas, reportes, catálogo
// ══════════════════════════════════════════════════════════════

const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const fs       = require('fs');
const path     = require('path');
const XLSX     = require('xlsx');
const { query } = require('../db');
const { getInventarioCompleto, actualizarStock } = require('../inventario');
const { crearCampana, enviarCampana, previewSegmento, SEGMENTOS } = require('../campanas');

const router = express.Router();
const JWT_SECRET   = process.env.JWT_SECRET || 'materialespro-secret-change-me';
const CATALOG_PATH = path.join(__dirname, '..', 'catalogo.json');

// ─────────────────────────────────────────────────
//  MIDDLEWARE AUTH
// ─────────────────────────────────────────────────
function authMiddleware(roles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token  = header.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (roles.length && !roles.includes(decoded.rol))
        return res.status(403).json({ error: 'Sin permiso' });
      req.user = decoded;
      next();
    } catch (_) { res.status(401).json({ error: 'Token inválido' }); }
  };
}

// ─────────────────────────────────────────────────
//  AUTH — Login
// ─────────────────────────────────────────────────
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

  try {
    const r = await query('SELECT * FROM usuarios WHERE email=$1 AND activo=TRUE', [email]);
    if (!r.rows.length) return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = r.rows[0];
    const ok   = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    await query('UPDATE usuarios SET ultimo_login=NOW() WHERE id=$1', [user.id]);

    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, zona: user.zona },
      JWT_SECRET, { expiresIn: '8h' }
    );

    res.json({ token, user: { id: user.id, nombre: user.nombre, rol: user.rol, zona: user.zona } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────
//  RESUMEN DEL DÍA
// ─────────────────────────────────────────────────
router.get('/resumen', authMiddleware(), async (req, res) => {
  try {
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const [peds, cots, cls, ing, pend, alertas] = await Promise.all([
      query('SELECT COUNT(*) FROM pedidos      WHERE creado_en>=$1', [hoy]),
      query('SELECT COUNT(*) FROM cotizaciones WHERE creado_en>=$1', [hoy]),
      query('SELECT COUNT(*) FROM clientes     WHERE primer_contacto>=$1', [hoy]),
      query("SELECT COALESCE(SUM(total),0) as t FROM pedidos WHERE estado='confirmado' AND creado_en>=$1", [hoy]),
      query("SELECT COUNT(*) FROM pedidos WHERE estado='pendiente'", []),
      query('SELECT COUNT(*) FROM inventario WHERE stock<=stock_minimo', []),
    ]);
    res.json({
      pedidos_hoy:        parseInt(peds.rows[0].count),
      cotizaciones_hoy:   parseInt(cots.rows[0].count),
      clientes_nuevos:    parseInt(cls.rows[0].count),
      ingresos_hoy:       parseFloat(ing.rows[0].t),
      pedidos_pendientes: parseInt(pend.rows[0].count),
      alertas_stock:      parseInt(alertas.rows[0].count),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────
//  PEDIDOS
// ─────────────────────────────────────────────────
router.get('/pedidos', authMiddleware(), async (req, res) => {
  try {
    const { estado, zona, limit = 50, offset = 0 } = req.query;
    let sql = `SELECT p.*, c.nombre as cliente_nombre, c.whatsapp
               FROM pedidos p LEFT JOIN clientes c ON c.id=p.cliente_id
               WHERE 1=1`;
    const params = [];
    if (estado) { params.push(estado); sql += ` AND p.estado=$${params.length}`; }
    if (zona)   { params.push(zona);   sql += ` AND p.zona=$${params.length}`; }
    if (req.user.rol === 'vendedor' && req.user.zona) {
      params.push(req.user.zona); sql += ` AND p.zona=$${params.length}`;
    }
    params.push(parseInt(limit));  sql += ` ORDER BY p.creado_en DESC LIMIT $${params.length}`;
    params.push(parseInt(offset)); sql += ` OFFSET $${params.length}`;
    const r = await query(sql, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /pedidos/:id — detalle completo
router.get('/pedidos/:id', authMiddleware(), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const sql = 'SELECT p.*, c.nombre as cliente_nombre, c.whatsapp FROM pedidos p LEFT JOIN clientes c ON c.id=p.cliente_id WHERE p.id=$1';
    const ped = await query(sql, [id]);
    if (!ped.rows.length) return res.status(404).json({ error: 'Pedido no encontrado' });
    const clienteId = ped.rows[0].cliente_id;
    const cli = clienteId ? await query('SELECT * FROM clientes WHERE id=$1', [clienteId]) : { rows: [{}] };
    res.json({ pedido: ped.rows[0], cliente: cli.rows[0] || {} });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/pedidos/:id/estado', authMiddleware(), async (req, res) => {
  const { estado } = req.body;
  const estados    = ['pendiente','confirmado','en_camino','entregado','cancelado'];
  if (!estados.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });
  try {
    const extra = estado === 'confirmado' ? ', confirmado_en=NOW()' : '';
    await query('UPDATE pedidos SET estado=$1, actualizado_en=NOW()' + extra + ' WHERE id=$2',
      [estado, req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────
//  CLIENTES
// ─────────────────────────────────────────────────
router.get('/clientes', authMiddleware(), async (req, res) => {
  try {
    const { q, zona, limit = 50, offset = 0 } = req.query;
    let sql = 'SELECT * FROM clientes WHERE activo=TRUE';
    const params = [];
    if (q)    { params.push('%' + q + '%'); sql += ` AND (nombre ILIKE $${params.length} OR whatsapp ILIKE $${params.length})`; }
    if (zona) { params.push(zona);          sql += ` AND zona=$${params.length}`; }
    params.push(parseInt(limit));  sql += ` ORDER BY ultimo_contacto DESC LIMIT $${params.length}`;
    params.push(parseInt(offset)); sql += ` OFFSET $${params.length}`;
    const r = await query(sql, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/clientes/:id/historial', authMiddleware(), async (req, res) => {
  try {
    const id = req.params.id;
    const [cliente, pedidos, cots, msgs] = await Promise.all([
      query('SELECT * FROM clientes WHERE id=$1', [id]),
      query('SELECT * FROM pedidos       WHERE cliente_id=$1 ORDER BY creado_en DESC LIMIT 20', [id]),
      query('SELECT * FROM cotizaciones  WHERE cliente_id=$1 ORDER BY creado_en DESC LIMIT 10', [id]),
      query('SELECT * FROM mensajes      WHERE cliente_id=$1 ORDER BY creado_en DESC LIMIT 30', [id]),
    ]);
    res.json({ cliente: cliente.rows[0], pedidos: pedidos.rows, cotizaciones: cots.rows, mensajes: msgs.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/clientes/:id', authMiddleware(), async (req, res) => {
  const { notas, credito_limite, zona } = req.body;
  try {
    await query(
      'UPDATE clientes SET notas=COALESCE($1,notas), credito_limite=COALESCE($2,credito_limite), zona=COALESCE($3,zona) WHERE id=$4',
      [notas, credito_limite, zona, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────
//  INVENTARIO
// ─────────────────────────────────────────────────
router.get('/inventario', authMiddleware(), async (req, res) => {
  try { res.json(await getInventarioCompleto()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/inventario/:id', authMiddleware(['admin','bodega']), async (req, res) => {
  const { stock } = req.body;
  if (stock === undefined) return res.status(400).json({ error: 'stock requerido' });
  try {
    await actualizarStock(req.params.id, parseInt(stock), req.user.email);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────
//  CAMPAÑAS
// ─────────────────────────────────────────────────
router.get('/campanas', authMiddleware(['admin']), async (req, res) => {
  try {
    const r = await query('SELECT * FROM campanas ORDER BY creado_en DESC LIMIT 50');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/campanas/segmentos', authMiddleware(['admin']), (req, res) => {
  res.json(Object.entries(SEGMENTOS).map(([k,v]) => ({ id:k, nombre:v })));
});

router.post('/campanas/preview', authMiddleware(['admin']), async (req, res) => {
  try { res.json(await previewSegmento(req.body.segmento)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/campanas', authMiddleware(['admin']), async (req, res) => {
  const { nombre, mensaje, segmento } = req.body;
  if (!nombre || !mensaje || !segmento) return res.status(400).json({ error: 'Faltan campos' });
  try {
    const id = await crearCampana(nombre, mensaje, segmento, req.user.email);
    res.json({ id, ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/campanas/:id/enviar', authMiddleware(['admin']), async (req, res) => {
  try {
    res.json({ ok: true, mensaje: 'Campaña iniciada en background' });
    enviarCampana(parseInt(req.params.id)).catch(e => console.error('[CAMPAÑA]', e.message));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────
//  USUARIOS (solo admin)
// ─────────────────────────────────────────────────
router.get('/usuarios', authMiddleware(['admin']), async (req, res) => {
  try {
    const r = await query('SELECT id,nombre,email,rol,zona,activo,ultimo_login FROM usuarios ORDER BY nombre');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/usuarios', authMiddleware(['admin']), async (req, res) => {
  const { nombre, email, password, rol, zona, whatsapp } = req.body;
  if (!nombre || !email || !password) return res.status(400).json({ error: 'Faltan campos' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const r    = await query(
      'INSERT INTO usuarios(nombre,email,password_hash,rol,zona,whatsapp) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',
      [nombre, email, hash, rol||'vendedor', zona||null, whatsapp||null]
    );
    res.json({ id: r.rows[0].id, ok: true });
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'Email ya registrado' });
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────────────
//  REPORTES
// ─────────────────────────────────────────────────
router.get('/reportes/ventas', authMiddleware(['admin']), async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    const r = await query(`
      SELECT DATE(creado_en) as fecha,
             COUNT(*) as pedidos,
             COALESCE(SUM(total),0) as total
      FROM pedidos
      WHERE estado IN ('confirmado','entregado')
        AND creado_en >= NOW() - ($1 || ' days')::INTERVAL
      GROUP BY DATE(creado_en)
      ORDER BY fecha ASC`, [parseInt(dias)]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/reportes/productos', authMiddleware(['admin']), async (req, res) => {
  try {
    const r = await query(`
      SELECT p.nombre, COUNT(*) as veces,
             SUM((item->>'cantidad')::int) as unidades
      FROM pedidos ped,
           jsonb_array_elements(ped.items_json) AS item
      JOIN LATERAL (SELECT item->>'nombre' as nombre) p ON TRUE
      WHERE ped.estado IN ('confirmado','entregado')
        AND ped.creado_en >= NOW() - INTERVAL '30 days'
      GROUP BY p.nombre
      ORDER BY unidades DESC
      LIMIT 10`
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═════════════════════════════════════════════════
//  CATÁLOGO — Ver y actualizar desde Excel
// ═════════════════════════════════════════════════

// GET /api/catalogo — productos actuales
router.get('/catalogo', authMiddleware(['admin']), (req, res) => {
  try {
    const cat = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    const raw = cat.productos || [];
    const productos = raw.map(p => ({
      id:           p.codigo || p.id || '',
      nombre:       p.nombre || '',
      descripcion:  p.descripcion || '',
      categoria:    p.categoria || '',
      marca:        p.marca || '',
      presentacion: p.unidad || p.presentacion || '',
      precio:       p.precio_venta || p.precio || 0,
      precio_lista: p.precio_lista || 0,
      costo:        p.costo_neto || p.costo || 0,
      activo:       p.activo !== false,
    }));
    res.json({ negocio: cat.negocio || cat.meta || {}, productos, total: productos.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/catalogo/importar — recibe Excel en base64, parsea y actualiza
router.post('/catalogo/importar', authMiddleware(['admin']), express.json({ limit: '10mb' }), (req, res) => {
  try {
    const { fileBase64 } = req.body;
    if (!fileBase64) return res.status(400).json({ error: 'fileBase64 requerido' });

    // Parsear Excel desde base64
    const buffer   = Buffer.from(fileBase64, 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet    = workbook.Sheets[workbook.SheetNames[0]];
    const rows     = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows.length) return res.status(400).json({ error: 'El archivo está vacío' });

    // Mapeo flexible — soporta tu formato CRM y formato estándar
    const headers = Object.keys(rows[0]);
    const esTuFormato = headers.includes('Código CRM') || headers.includes('Artículo');

    function getVal(r, ...keys) {
      for (const k of keys) { if (r[k] !== undefined && r[k] !== '') return r[k]; }
      return '';
    }

    function parsePrecio(v) {
      if (!v && v !== 0) return 0;
      return parseFloat(String(v).replace(/[^0-9.]/g, '')) || 0;
    }

    // Construir productos limpios — soporta ambos formatos
    const productos = rows.map((r, i) => {
      const nombre = String(getVal(r, 'Artículo', 'nombre') || '').trim();
      if (!nombre) return null;

      const precio1 = parsePrecio(getVal(r, 'Precio 1 NETO', 'precio'));
      const precio2 = parsePrecio(getVal(r, 'Precio 2 NETO', 'precio_2'));
      const precio3 = parsePrecio(getVal(r, 'Precio 3 NETO', 'precio_3'));
      const precio4 = parsePrecio(getVal(r, 'Precio 4 NETO', 'precio_4'));
      const costo   = parsePrecio(getVal(r, 'Costo NETO', 'costo'));

      const activoRaw = getVal(r, 'Activo', 'activo');
      const activo = activoRaw === 'Verdadero' || activoRaw === true ||
                     String(activoRaw).toLowerCase() === 'true' || activoRaw === 1;

      // Disponibilidad
      const entrega1dia   = getVal(r, 'ENTREGA 1 DIA') === 'X';
      const sobrePedido   = getVal(r, 'SOBRE PEDIDO') === 'X';
      const disponibilidad = entrega1dia ? 'entrega_1dia' : sobrePedido ? 'sobre_pedido' : 'stock';

      return {
        id:          String(getVal(r, 'Código CRM', 'id') || '').trim() || `PROD-${String(i+1).padStart(3,'0')}`,
        categoria:   String(getVal(r, 'Categoría', 'categoria') || 'General').trim(),
        nombre,
        descripcion: String(getVal(r, 'descripcion') || '').trim(),
        usos:        String(getVal(r, 'usos') || '').trim(),
        presentacion: String(getVal(r, 'Se vende por', 'presentacion') || 'Pieza').trim(),
        marca:       String(getVal(r, 'Marca', 'marca') || '').trim(),
        proveedor:   String(getVal(r, 'Proveedor', 'proveedor') || '').trim(),
        peso_kg:     parseFloat(getVal(r, 'peso_kg') || 0) || 0,
        precio:      precio1,
        precio_2:    precio2,
        precio_3:    precio3,
        precio_4:    precio4,
        costo:       costo,
        rendimiento_m2_por_unidad: parseFloat(getVal(r, 'rendimiento_m2_por_unidad') || 0) || 0,
        rendimiento_nota: String(getVal(r, 'rendimiento_nota') || '').trim(),
        colores:     getVal(r, 'colores') ? String(getVal(r, 'colores')).trim() : undefined,
        codigo_sat:  String(getVal(r, 'CODIGO SAT', 'codigo_sat') || '').trim(),
        impuestos:   String(getVal(r, 'impuestos') || 'IVA 16%').trim(),
        disponibilidad,
        stock:       parseInt(getVal(r, 'INVENTARIO', 'stock') || 0) || 0,
        activo,
      };
    }).filter(Boolean);

    if (!productos.length) return res.status(400).json({ error: 'No se encontraron productos válidos' });

    // Leer catálogo actual, actualizar solo productos, conservar negocio/envios/etc.
    const cat       = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    const anterior  = cat.productos.length;
    cat.productos   = productos;

    // Backup antes de sobrescribir
    const backupPath = CATALOG_PATH + '.bak';
    fs.writeFileSync(backupPath, JSON.stringify({ ...cat, productos: cat.productos }, null, 2), 'utf8');

    // Guardar nuevo catálogo
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(cat, null, 2), 'utf8');

    console.log(`[CATÁLOGO] Actualizado por ${req.user.email}: ${anterior} → ${productos.length} productos`);

    res.json({
      ok: true,
      mensaje: `Catálogo actualizado: ${productos.length} productos importados`,
      anterior: anterior,
      nuevo: productos.length,
      productos_preview: productos.slice(0, 3).map(p => ({ nombre: p.nombre, precio: p.precio, activo: p.activo }))
    });

  } catch (e) {
    console.error('[CATÁLOGO IMPORT]', e.message);
    res.status(500).json({ error: 'Error al procesar el archivo: ' + e.message });
  }
});

// GET /api/catalogo/plantilla — descarga plantilla Excel vacía con formato correcto
router.get('/catalogo/plantilla', authMiddleware(['admin']), (req, res) => {
  try {
    const plantilla = [
      {
        id: 'ADH-001',
        categoria: 'Adhesivos',
        nombre: 'Ejemplo: Adhesivo Cerámico Estándar',
        descripcion: 'Descripción del producto',
        usos: 'Para qué se usa',
        presentacion: 'Bolsa 25 kg',
        precio: 230,
        rendimiento_m2_por_unidad: 4.5,
        rendimiento_nota: '4 a 5 m² por bolsa',
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
});

module.exports = router;
