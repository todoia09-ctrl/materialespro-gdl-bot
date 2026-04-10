# MaterialesPro GDL — Análisis de Bug: Stock no se guarda en Dashboard

## Contexto del sistema
- **Bot WhatsApp con IA** para distribuidora de materiales de construcción en Guadalajara
- **Stack:** Node.js 24, Express.js, PostgreSQL (Supabase), Render.com Free tier
- **Deploy:** Auto-deploy desde GitHub master → Render.com Free tier
- **catalogo.json:** 1.5 MB, 804 productos, cargado en memoria al arrancar

---

## Problema principal
El stock en el dashboard de inventario **no se guarda**. Al escribir un número y hacer click en 💾, el valor vuelve a 0 después de refresh.

---

## Evidencia en Chrome DevTools Console
PUT https://materialespro-gdl-bot.onrender.com/api/inventario/PER-VAR-013 404 (Not Found)
PUT https://materialespro-gdl-bot.onrender.com/api/inventario/PER-2040-16AP-SA20 404 (Not Found)
GET https://materialespro-gdl-bot.onrender.com/api/inventario 502 (Bad Gateway)
GET https://materialespro-gdl-bot.onrender.com/api/catalogo 502 (Bad Gateway)
Uncaught (in promise) SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON

---

## Código relevante
### Frontend — dashboard/index.html línea 1179
// CÓDIGO ACTUAL EN ARCHIVO (ya corregido a PATCH):
const r = await api('/inventario/' + id, { method: 'PATCH', body: { stock: val } });
// PERO CHROME DEVTOOLS SIGUE MOSTRANDO PUT

### Backend — dashboard/api.js línea 330
router.patch('/inventario/:id', authMiddleware(['admin','bodega']), async (req, res) => {
  const { stock } = req.body;
  if (stock === undefined) return res.status(400).json({ error: 'stock requerido' });
  try {
    await actualizarStock(req.params.id, parseInt(stock), req.user.email);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

---

## Comportamiento de Render Free Tier
- Render Free tarda **2 minutos** en arrancar (catalogo.json 1.5MB)
- Durante arranque: api/inventario y api/catalogo dan **502**
