# MaterialesPro GDL — Contexto Nuevo Chat
## Bot WhatsApp Enterprise v14 · Estado: BETA LIVE
## Fecha: 2026-04-12_v8 (Schema fixes + Stock cargado + Modal funcionando)

---

## COMMITS SESION 2026-04-12

| Commit | Descripcion |
|---|---|
| `734b924` | refactor: db.js nuevo schema unificado + Supabase client + WMS RPCs |
| `279e051` | fix: agregar @supabase/supabase-js a dependencias |
| `6bc6351` | fix: inventario.js actualizado a nuevo schema catalogo_id + stock_physical |
| `9aaf2e9` | fix: import catalogo 818 productos schema nuevo + inventario sincronizado |
| `1f1d2a6` | fix: inventario.js precio_unitario -> precio_venta |
| `17639db` | fix: stock sin decimales UI + export/import activo en inventario |
| `3d3a65e` | fix: syncFromCatalog en background — puerto abre en <10s en Render |
| `bb18aca` | fix: schema nuevo en seguimientos, crm, scheduler y api — elimina errores cada 10min |
| `7ea7803` | fix: modal PATCH stock usa codigo string no id numerico — elimina NaN bigint error |
| `7670115` | fix: catalogo PATCH stock->stock_physical en inventario update |

---

## ESTADO ACTUAL — 2026-04-12_v8

### Schema DB — RESET COMPLETO ejecutado
- 12 tablas con schema unificado BIGINT IDENTITY
- 3 funciones WMS atomicas (wms_reserve, wms_fulfill, wms_release)
- 4 ENUMs tipados (order_status, movement_type, cliente_estado, canal_origen)
- RLS habilitado en todas las tablas
- Ledger inventario_movimientos append-only con trigger

### Catalogo
- 818 productos importados (CREST:56, FESTER:215, PEGADURO:169, PERDURA:98, SIKA:280)
- catalogo.json regenerado 1522 KB version V4-SCHEMA-NUEVO
- 818 filas inventario sincronizadas con stock_physical=50, stock_minimo=5

### Stock
- stock_physical cargado via Import Stock dashboard (xlsx 2026-04-12)
- stock_minimo actualizado correctamente
- UI muestra enteros sin decimales (50 no 50.000)

### Fixes aplicados esta sesion
- Import xlsx: usa stock_physical + subquery por codigo (no producto_id viejo)
- Modal inline 💾: PATCH /inventario/:codigo → WHERE catalogo_id subquery
- Modal ✏️ editar: PATCH /catalogo/:codigo actualiza stock_physical (no stock)
- Export Excel: incluye columna activo (1=activo, 0=inactivo)
- Import Excel: lee columna activo → UPDATE catalogo_productos SET activo
- syncFromCatalog movido a background post-listen → deploy Render <15s
- scheduler.js: seguimientos usa programado_para, completado_at, sin cotizacion_id
- crm.js: programarSeguimiento INSERT usa schema nuevo (sin cotizacion_id, sin whatsapp)
- api.js: stock alerts JOIN usa catalogo_id correcto

### Columnas schema seguimientos (confirmado)
id, cliente_id, pedido_id, tipo, notas, estado, programado_para, completado_at, created_at, updated_at

### Columnas schema catalogo_productos (confirmado)
id, codigo, nombre, marca, categoria, descripcion, unidad_medida, precio_lista,
precio_venta, imagen_url, activo, created_at, updated_at, presentacion, cantidad,
cantidad_minima, precio_2, precio_3, precio_4, iva, costo_neto, descuento_maximo,
rendimiento_m2_por_unidad, rendimiento_nota, unidades_pallet, moneda, fecha_precio,
version_precio, destacado, en_oferta, precio_oferta, oferta_hasta, mas_vendido,
orden_display, actualizado_en, creado_en, unidad

---

## REGLA CRITICA PRECIOS
Todos los precios son NETO siempre.
precio_venta = Precio 1 NETO, precio_lista = Precio lista NETO
precio_2/3/4 = tiers NETO. NUNCA agregar IVA automaticamente.

---

## PENDIENTES PROXIMA SESION

### PRIORIDAD ALTA
1. Prueba pedido real WhatsApp con SIKA
2. Auditar dashboard/api.js completo — posibles queries con created_at/updated_at viejos
3. Verificar logs Render que error cotizacion_id desaparecio completamente

### PENDIENTE MENOR
4. Laurent aceptar invitacion Evaluador Meta Developers
5. Solicitar App Review Meta (pages_messaging, instagram_manage_messages)
6. Bug A: Clientes desactivados desaparecen del dashboard
7. Bug B: Historial pedidos clientes desactivados

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
- wms_fulfill(p_pedido_id BIGINT)
- wms_release(p_pedido_id BIGINT, p_reason TEXT)

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
- POWERSHELL: usar Get-Content con -Skip/-First para ver lineas exactas
- FIXES: siempre scripts .js descargables, nunca node -e con caracteres especiales
- SCHEMA: inventario usa catalogo_id (no producto_id), stock_physical (no stock)
- SEGUIMIENTOS: programado_para (no programado_en), completado_at (no enviado_en)

---

## STACK TECNICO
```
Runtime:     Node.js 24.14.0
Backend:     Express.js
DB:          PostgreSQL (Supabase — fgwqrobyhwlmrelxecrc) via DATABASE_URL pg directo
IA:          Claude Haiku (claude-haiku-4-5-20251001)
Mensajeria:  Meta Cloud API WhatsApp Business v22.0
Archivos:    Cloudinary (PDFs cotizaciones)
Deploy:      Render.com (Free tier) — deploy en <15s con syncFromCatalog background
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

---

## NOTAS TECNICAS IMPORTANTES
- DB usa DATABASE_URL (pg directo) NO SUPABASE_URL/SUPABASE_SERVICE_KEY
- scripts fix deben usar require('pg') Pool, no @supabase/supabase-js
- PowerShell no tiene grep — usar Select-String
- Select-String -Recurse no funciona con multiples paths — dos comandos separados
- Get-Content + Select-Object -Skip N -First M para ver lineas exactas
- $1 en PowerShell es variable — usar scripts .js para queries con parametros
- LF warnings en git add son normales — no afectan funcionamiento
