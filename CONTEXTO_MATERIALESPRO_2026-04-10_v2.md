# MaterialesPro GDL — Contexto Nuevo Chat
## Bot WhatsApp Enterprise v14 · Estado: PRODUCCIÓN ✅ LIVE
## Fecha: 2026-04-10 v2 (dashboard fixes + 804 productos importados)

---

## 🎭 ROL
Eres mi **Senior CTO y Principal Engineer** para MaterialesPro GDL — bot de ventas WhatsApp con IA para negocio de materiales de construcción en Guadalajara, México. Eres Product Architect, Mobile Systems Expert, Real-Time Operations Specialist, Technical Documentation Lead y Web/UI Design Expert. You are an expert AI systems architect, full-stack developer, and growth automation strategist.

---

## 📋 REGLAS DE TRABAJO
1. Solo trabajar en lo solicitado — no saltar pasos
2. Output listo para implementar — código production-ready
3. **SIEMPRE rutas completas** en PowerShell — NUNCA rutas relativas
4. Un comando a la vez — esperar resultado
5. NUNCA usar `&&` en PowerShell
6. **PREFERIR REESCRITURA COMPLETA** de archivos sobre patches parciales
7. Para fixes en archivos JS/HTML: SIEMPRE usar Claude Code CLI
8. Verificar siempre con `node --check` antes de hacer deploy
9. SIEMPRE usar regex para reemplazos en archivos con CRLF
10. NUNCA pegar múltiples comandos en un solo mensaje
11. **ANTES DE CUALQUIER COMMIT:** verificar módulos con node -e require
12. **REGLA #12:** verificar `git log --oneline -3` después de Claude Code
13. **REGLA #13:** NUNCA usar `node -e` con strings multi-línea en PowerShell
14. **REGLA #14:** SIEMPRE incluir path completo en todos los scripts y comandos PowerShell
15. **REGLA #15:** NUNCA usar `authMiddleware(['admin'])` en endpoints de acciones
16. **REGLA #16:** NUNCA agregar `express.json()` inline cuando ya existe global en server.js
17. **REGLA #17:** NUNCA pasar `whatsapp:+521...` en URL de PATCH/DELETE — usar ID numérico
18. **REGLA #18:** Para toggles críticos en dashboard usar `fetch()` directo, no helper `api()`
19. **REGLA #19:** Instagram DMs requieren App Review de Meta para producción
20. **REGLA #20:** 400 Bad Request con HTML = verificar: express.json() duplicado, URL chars especiales, rol JWT
21. **REGLA #21:** PowerShell `>` escribe BOM — SIEMPRE usar `WriteAllText` con `UTF8Encoding($false)`
22. **REGLA #22:** Import escribe catalogo.json Y DB — verificar ambos después de importar
23. **REGLA #23:** `initSchema()` en db.js es fuente única de verdad del schema
24. **REGLA #24:** Después de reset DB → git push del catalogo.json vacío para Render
25. **REGLA #25:** `syncFromCatalog()` al arrancar — JSON vacío = inventario vacío
26. **REGLA #26 — PROPAGACIÓN DE COLUMNAS:** Agregar columna en initSchema() → actualizar en cascada: buildCatalogText() → import Excel → export/plantilla → syncFromCatalog() → buildSystemPrompt()
27. **REGLA #27 — NUEVA:** Cuando GET /api refactoriza campos retornados → actualizar TODAS las referencias en dashboard/index.html (loadCatalogo, loadInventario, filterInventario, etc.)

---

## 🔍 VERIFICACIÓN OBLIGATORIA ANTES DE COMMIT
```powershell
node -e "require('dotenv').config(); require('./meta'); require('./pedido'); require('./crm'); require('./cotizacion'); require('./tecnico'); require('./db'); require('./inventario'); require('./scheduler'); console.log('ALL OK');"
```

---

## 🏗️ STACK TÉCNICO
```
Runtime:     Node.js 24.14.0
Backend:     Express.js
DB:          PostgreSQL (Supabase — session pooler)
             Project ID: fgwqrobyhwlmrelxecrc
IA:          Claude Haiku (claude-haiku-4-5-20251001)
Mensajería:  Meta Cloud API WhatsApp Business v22.0
Archivos:    Cloudinary (PDFs cotizaciones)
Deploy:      Render.com (Free tier — auto-deploy desde master)
Repo:        GitHub → https://github.com/todoia09-ctrl/materialespro-gdl-bot.git
OS Dev:      Windows 11 / PowerShell + Claude Code CLI v2.1.92
Keep-alive:  UptimeRobot → ping /ping cada 5 min
```

---

## 📁 RUTA LOCAL DEL PROYECTO
```
C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl
```

---

## 📊 ESTADO ACTUAL — 2026-04-10 v2

### catalogo_productos ✅
- **804 productos** importados — MASTER 2026 v2 (CREST + SIKA + otras marcas)
- Import sin errores — commit `fb45a47`
- ⚠️ Códigos CREST formato `1010-XXXX-SA20` — pendiente renombrar a `CREST-XXXX` en Excel y re-importar

### inventario ⚠️
- VACÍO — sync pendiente desde dashboard
- Hacer: Dashboard → Inventario → "Sincronizar desde catálogo"

### catalogo.json ✅
- Refleja los 804 productos del import

### Dashboard ✅ FUNCIONANDO
- Catálogo/Precios → muestra 804 productos ✅
- Destacados y Ofertas → funciona ✅
- Inventario → fix aplicado, verificar post-sync

### DB usuarios ✅
- `admin@materialespro.com` (rol: admin)
- `todoia09@gmail.com` (rol: vendedor)

---

## ✅ COMMITS SESIÓN 2026-04-10

| Commit | Descripción |
|---|---|
| `fb45a47` | fix: import filtra filas template — skip → y VERDE |
| (pendiente push) | fix: catalogo dashboard — p.id→p.codigo, p.precio→p.precio_venta |
| (pendiente push) | fix: inventario dashboard — p.id→p.producto_id, cat.precio→cat.precio_venta, presentacion added |

---

## 🐛 BUGS RESUELTOS HOY

| Bug | Causa raíz | Fix |
|---|---|---|
| Import error `$14 inconsistent types` | Filas template del Excel (`→ precio_4`) leídas como datos | Filtro `nombre.startsWith('→')` en import |
| Dashboard catálogo "Cargando..." infinito | `p.precio.toLocaleString()` sobre undefined lanzaba excepción | `p.precio_venta`, `p.codigo` |
| `_invCatalog` indexado en `undefined` | `_invCatalog[p.id]` donde p.id no existe → todas colisionaban | Solo indexar por `p.codigo` |
| Inventario sin categoria/marca/presentacion | `loadInventario()` no los incluía en objeto enriquecido | Agregados con fallback dual `item.X \|\| cat.X` |

---

## 🗺️ ROADMAP — PRÓXIMA SESIÓN

| # | Prioridad | Tarea |
|---|---|---|
| 1 | 🔴 | **Sync inventario** — Dashboard → Inventario → Sincronizar desde catálogo |
| 2 | 🔴 | **Verificar inventario** muestra datos correctos post-sync (precio, marca, categoria) |
| 3 | 🔴 | **Fix bot ciego** — buildCatalogText() agregar: marca, cantidad, rendimiento_m2, rendimiento_nota + instrucción cálculo m² en buildSystemPrompt() |
| 4 | 🔴 | **Import PERDURA** — `Catalogo_Perdura_Fase2_v2.xlsx` (82 productos listos) |
| 5 | 🟡 | **Renombrar códigos CREST** — `1010-XXXX-SA20` → `CREST-XXXX` en Excel, re-importar |
| 6 | 🟡 | **Prueba pedido real WhatsApp** — cotización con precios correctos por nivel |
| 7 | 🟡 | **Verificar flujo precio nivel** 1/2/3/4 con datos reales post-import |
| 8 | 🟡 | **filterInventario()** — agregar columna Presentación al render (dato ya disponible en _invData) |
| 9 | 🟡 | Laurent aceptar invitación Evaluador Meta Developers |
| 10 | 🟡 | Solicitar App Review Meta (pages_messaging, instagram_manage_messages) |

---

## 🤖 PENDIENTE CRÍTICO — BOT CIEGO

Estos campos existen en DB/catalogo.json pero `buildCatalogText()` NO los usa:

| Campo | Impacto si falta |
|---|---|
| `marca` | Bot no filtra "quiero solo SIKA" |
| `cantidad` | Bot no calcula cubetas/bolsas para X m² |
| `rendimiento_m2_por_unidad` | Bot no puede cotizar por área |
| `rendimiento_nota` | Bot no explica rendimiento |
| `precio_2/3/4` | Bot no diferencia precios por nivel cliente |
| `stock` | Bot no sabe disponibilidad |

**Comando Claude Code listo para autorizar:**
```
claude "Fix buildCatalogText() en server.js:
Agregar al texto de cada producto: marca, cantidad, rendimiento_m2_por_unidad, rendimiento_nota.
Formato: 'NombreProducto · MARCA · $precio/Presentacion [categoria] | Rinde Xm² | mín: Y unidades'
Agregar a buildSystemPrompt() instrucciones:
1. Filtrar por marca si cliente la menciona
2. Calcular unidades: area_cliente / rendimiento_m2 = unidades necesarias
3. Usar precio del nivel del cliente (1=precio_venta, 2=precio_2, 3=precio_3, 4=precio_4)
NO tocar lógica de pedidos ni CRM."
```

---

## 📋 TABLA COMPARATIVA — Estado final post-fixes

```
COLUMNA              | DB | IMPORT | EXPORT | GET/cat | INVENTARIO | BOT-TEXT | BOT-PRIORITY
---------------------|----+--------+--------+---------+------------+----------+-------------
codigo               | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅
nombre               | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅
descripcion          | ✅ | ✅     | ✅     | ✅      | -          | ❌       | -
categoria            | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅
marca                | ✅ | ✅     | ✅     | ✅      | ✅         | ❌       | -
presentacion         | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅
unidad               | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅
cantidad             | ✅ | ✅     | ✅     | ✅      | -          | ❌       | -
cantidad_minima      | ✅ | ✅     | ✅     | ✅      | -          | -        | -
precio_venta         | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅
precio_lista         | ✅ | ✅     | ✅     | ✅      | -          | -        | -
precio_2/3/4         | ✅ | ✅     | ✅     | ✅      | -          | ❌       | -
iva                  | ✅ | ✅     | ✅     | ✅      | -          | -        | -
costo_neto           | ✅ | ✅     | ✅     | ✅      | -          | -        | -
descuento_maximo     | ✅ | ✅     | ✅     | ✅      | -          | ✅       | ✅
rendimiento_m2       | ✅ | ✅     | ✅     | ✅      | -          | ❌       | -
rendimiento_nota     | ✅ | ✅     | ✅     | ✅      | -          | ❌       | -
stock                | -  | -      | -      | -       | ✅         | ❌       | -
stock_minimo         | -  | -      | -      | -       | ✅         | -        | -
activo               | ✅ | ✅     | ✅     | ✅      | (filtro)   | ✅       | ✅
comerciales*         | ✅ | PATCH  | PATCH  | ✅      | -          | (query)  | ✅
```
*comerciales = destacado, en_oferta, precio_oferta, oferta_hasta, mas_vendido, orden_display

---

## 📋 REGLAS DE PRECIOS

```
Precio 1 NETO  = precio con IVA de lista PDF
Precio lista   = REDONDEAR.MAS(P1/10, 0) × 10
Precio 2 NETO  = Precio lista × 0.95   (−5%)
Precio 3 NETO  = Precio lista × 0.90   (−10%)
Precio 4 NETO  = Precio lista           (sin descuento)
IVA            = Precio 1 × (16/116)
Costo NETO     = con IVA incluido, del PDF
Descuento máx  = en decimal: 0.2 = 20%
```

---

## 🌐 SERVICIOS EN PRODUCCIÓN

| Servicio | URL / Dato | Estado |
|---|---|---|
| Bot Render | https://materialespro-gdl-bot.onrender.com | ✅ Live |
| Dashboard | https://materialespro-gdl-bot.onrender.com/dashboard | ✅ |
| Webhook Meta | https://materialespro-gdl-bot.onrender.com/webhook/meta | ✅ |
| GitHub | https://github.com/todoia09-ctrl/materialespro-gdl-bot.git | ✅ |
| Supabase | Session pooler configurado | ✅ RLS habilitado |
| UptimeRobot | Ping cada 5 min a /ping | ✅ |

---

## 🔑 META WHATSAPP BUSINESS API

| Dato | Valor |
|---|---|
| App ID | 929049326656512 |
| WABA ID | 3307053289456512 |
| Phone Number ID | 1042177225646433 |
| Número WA Bot | +52 1 33 3177 3189 |
| META_VERIFY_TOKEN | sika_verify_2026 |
| META_IG_USER_ID | 26833068533022552 |
| VENDOR_WHATSAPP | +523313469831 |

---

## 📱 CANALES BOT

| Canal | Estado |
|---|---|
| WhatsApp | ✅ Producción |
| Messenger Page 1 | ⏳ App Review pendiente |
| Messenger Page 2 | ❌ No conectado |
| Instagram DMs | ⏳ App Review pendiente |

---

## 📜 ARCHIVOS DISPONIBLES

| Archivo | Estado |
|---|---|
| `plantilla_catalogo_v5.xlsx` | ✅ Plantilla limpia — datos desde fila 2 |
| `Catalogo_Perdura_Fase2_v2.xlsx` | ✅ 82 productos PERDURA listos para import |
| `catalogo_MASTER_2026_v2.xlsx` | ✅ 804 productos (ya importado) |

---

## 🚀 DEPLOY — FLUJO GIT

```powershell
cd "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl"
node --check server.js
node --check meta.js
node -e "require('dotenv').config(); require('./meta'); require('./pedido'); require('./crm'); require('./cotizacion'); require('./tecnico'); require('./db'); require('./inventario'); require('./scheduler'); console.log('ALL OK');"
git add .
git commit -m "descripcion"
git push origin master
```

---

## 💬 CÓMO EMPEZAR EL NUEVO CHAT

> "Eres mi Senior CTO y principal engineer para MaterialesPro GDL. Adjunto CONTEXTO_MATERIALESPRO_2026-04-10_v2.md con estado completo. Lee y confirma antes de continuar."
