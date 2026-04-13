# MaterialesPro GDL — Contexto Nuevo Chat
## Bot WhatsApp Enterprise v14 · Estado: BETA LIVE
## Fecha: 2026-04-12_v7 (Schema Reset Completo + Import 818 productos)

---

## COMMITS SESION 2026-04-12

| Commit | Descripcion |
|---|---|
| `734b924` | refactor: db.js nuevo schema unificado + Supabase client + WMS RPCs |
| `279e051` | fix: agregar @supabase/supabase-js a dependencias |
| `6bc6351` | fix: inventario.js actualizado a nuevo schema catalogo_id + stock_physical |
| `9aaf2e9` | fix: import catalogo 818 productos schema nuevo + inventario sincronizado |
| `1f1d2a6` | fix: inventario.js precio_unitario -> precio_venta |

---

## ESTADO ACTUAL — 2026-04-12_v7

### Schema DB — RESET COMPLETO ejecutado
- 12 tablas con schema unificado BIGINT IDENTITY
- 3 funciones WMS atomicas (wms_reserve, wms_fulfill, wms_release)
- 4 ENUMs tipados (order_status, movement_type, cliente_estado, canal_origen)
- RLS habilitado en todas las tablas
- Ledger inventario_movimientos append-only con trigger

### Catalogo
- 818 productos importados (CREST:56, FESTER:215, PEGADURO:169, PERDURA:98, SIKA:280)
- catalogo.json regenerado 1522 KB version V4-SCHEMA-NUEVO
- 818 filas inventario sincronizadas (stock_physical=0)

### Columnas especiales agregadas post-reset
- catalogo_productos: presentacion, cantidad, cantidad_minima, precio_2/3/4,
  iva, costo_neto, descuento_maximo, rendimiento_m2_por_unidad, rendimiento_nota,
  unidades_pallet, moneda, fecha_precio, version_precio (VARCHAR50), unidad_medida,
  destacado, en_oferta, precio_oferta, oferta_hasta, mas_vendido, orden_display,
  unidad (alias de unidad_medida), actualizado_en, creado_en
- inventario: stock (alias stock_physical), producto_id (alias catalogo_id),
  unidad, nombre, marca, categoria, presentacion, precio_venta, actualizado_en,
  actualizado_por
- pedidos: folio, tipo, metodo_pago, zona, confirmado_en, estado, creado_en, actualizado_en
- clientes: primer_contacto, ultimo_contacto, total_compras, num_pedidos,
  nivel_precio, no_campana, zona, notas, credito_limite
- cotizaciones: creado_en, folio, estado, canal, items_json, expira_en
- mensajes: creado_en, canal
- campanas: segmento, total_envios, enviados, errores, programada_en,
  completada_en, creado_por, creado_en
- usuarios: zona, whatsapp, ultimo_login, creado_en

### REGLA CRITICA PRECIOS
Todos los precios son NETO siempre.
precio_venta = Precio 1 NETO, precio_lista = Precio lista NETO
precio_2/3/4 = tiers NETO. NUNCA agregar IVA automaticamente.

---

## PENDIENTES PROXIMA SESION

### PRIORIDAD ALTA
1. Auditar dashboard/api.js completo — muchas queries usan nombres schema viejo
   - creado_en vs created_at
   - estado vs status (ENUM)
   - stock vs stock_physical
   - producto_id vs catalogo_id via JOIN
   - folio, tipo, metodo_pago, zona en pedidos
2. Cargar stock real en inventario (stock_physical = 0 actualmente)
3. Prueba pedido real WhatsApp con SIKA
4. Verificar Claude API activa (creditos recargados $25 ayer)

### PENDIENTE MENOR
5. Laurent aceptar invitacion Evaluador Meta Developers
6. Solicitar App Review Meta (pages_messaging, instagram_manage_messages)
7. Seguimientos: cotizacion_id no existe en schema nuevo

---

## ARQUITECTURA WMS — DECISIONES FINALES

### State Machine
```
PLACED    -> RESERVE  (stock_reserved += qty)
CONFIRMED -> AUDIT ONLY (no stock change)
FULFILLED -> FULFILL  (stock_physical -= qty, stock_reserved -= qty)
CANCELLED -> RELEASE  (stock_reserved -= qty)
EXPIRED   -> RELEASE  (auto 2hrs sin vendor confirm)
RETURNED  -> RESTOCK  (stock_physical += qty)
```

### Funciones SQL disponibles
- wms_reserve(p_pedido_id BIGINT, p_items JSONB)
- wms_fulfill(p_pedido_id BIGINT) -- acepta CONFIRMED, IN_TRANSIT, DELIVERY_EXCEPTION
- wms_release(p_pedido_id BIGINT, p_reason TEXT)

### Llamada desde Node.js
```javascript
const { data, error } = await supabase.rpc('wms_reserve', {
  p_pedido_id: pedidoId,
  p_items: items  // [{catalogo_id: N, qty: N}]
});
```

---

## REGLAS DE TRABAJO CRITICAS

- #5: NUNCA && en PowerShell
- #13: NUNCA node -e multilinea
- #14: SIEMPRE rutas absolutas completas
- #21: NUNCA escribir archivos con > o Set-Content PowerShell
- #38: DRY-RUN obligatorio antes de cualquier replace
- #40: ROLLBACK inmediato si node --check falla
- GLOBAL: Un comando a la vez, esperar resultado
- PRECIOS: Todos NETO siempre, nunca renombrar sin autorizacion

---

## STACK TECNICO
```
Runtime:     Node.js 24.14.0
Backend:     Express.js
DB:          PostgreSQL (Supabase — fgwqrobyhwlmrelxecrc)
IA:          Claude Haiku (claude-haiku-4-5-20251001)
Mensajeria:  Meta Cloud API WhatsApp Business v22.0
Archivos:    Cloudinary (PDFs cotizaciones)
Deploy:      Render.com (Free tier)
Repo:        github.com/todoia09-ctrl/materialespro-gdl-bot
OS Dev:      Windows 11 / PowerShell + Claude Code CLI
```

---

## SERVICIOS
| Servicio | URL / Dato | Estado |
|---|---|---|
| Bot Render | https://materialespro-gdl-bot.onrender.com | LIVE |
| Dashboard | https://materialespro-gdl-bot.onrender.com/dashboard | LIVE |
| GitHub | https://github.com/todoia09-ctrl/materialespro-gdl-bot.git | OK |
| Supabase | fgwqrobyhwlmrelxecrc | OK |
| Anthropic API | Creditos recargados $25 | OK |
| UptimeRobot | Ping cada 5 min | OK |

---

## CREDENCIALES DASHBOARD
- Email: admin@materialespro.com
- Password: Admin2026!
