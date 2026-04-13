# MaterialesPro GDL — Contexto Nuevo Chat
## Bot WhatsApp Enterprise v14 · Estado: PRODUCCIÓN ✅ LIVE
## Fecha: 2026-04-09 v2 (sesión import/export completo + schema refactor)

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
7. Para fixes en archivos JS: SIEMPRE usar Claude Code CLI
8. Verificar siempre con `node --check` antes de hacer deploy
9. SIEMPRE usar regex para reemplazos en archivos con CRLF
10. NUNCA pegar múltiples comandos en un solo mensaje
11. **ANTES DE CUALQUIER COMMIT:** verificar módulos con node -e require
12. **REGLA #12:** verificar `git log --oneline -3` después de Claude Code
13. **REGLA #13:** NUNCA usar `node -e` con strings multi-línea en PowerShell
14. **REGLA #14:** SIEMPRE incluir path completo en todos los scripts y comandos PowerShell
15. **REGLA #15:** NUNCA usar `authMiddleware(['admin'])` en endpoints de acciones — usar `authMiddleware()` sin rol
16. **REGLA #16:** NUNCA agregar `express.json()` inline cuando ya existe global en server.js
17. **REGLA #17:** NUNCA pasar `whatsapp:+521...` en URL de PATCH/DELETE — usar ID numérico siempre
18. **REGLA #18:** Para toggles críticos en dashboard usar `fetch()` directo, no la función helper `api()`
19. **REGLA #19:** Instagram DMs requieren App Review de Meta para producción
20. **REGLA #20:** 400 Bad Request con HTML = verificar: express.json() duplicado, URL con chars especiales, rol JWT incorrecto
21. **REGLA #21:** PowerShell operador `>` escribe con BOM (UTF-16) — SIEMPRE usar `[System.IO.File]::WriteAllText(..., [UTF8Encoding]::new($false))`
22. **REGLA #22:** El import de catálogo vía Excel escribe catalogo.json Y DB — verificar ambos después de importar
23. **REGLA #23 — NUEVA:** `initSchema()` en `db.js` es la fuente única de verdad del schema — NUNCA crear tablas en scripts externos
24. **REGLA #24 — NUEVA:** Después de reset de DB, siempre hacer `git push` del `catalogo.json` vacío para que Render lo tome
25. **REGLA #25 — NUEVA:** `syncFromCatalog()` se ejecuta al arrancar el servidor — si `catalogo.json` tiene productos, inventario se repopula automáticamente

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
             IMPORTANTE: system es parámetro TOP-LEVEL
Mensajería:  Meta Cloud API WhatsApp Business v22.0
             Twilio: ELIMINADO COMPLETAMENTE
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

## 📊 ESTADO ACTUAL DB — 2026-04-09 v2

### DB catalogo_productos — VACÍA (reset completo hoy)
- **0 productos** — pendiente import SIKA + PEGADURO
- Schema completo en `initSchema()` ✅

### DB inventario — VACÍA
- Se repoblará automáticamente cuando se importe el catálogo

### catalogo.json — VACÍO
- `productos: []` — commitado en `52a6c43`
- Se actualizará cuando se haga el import desde dashboard

### DB usuarios — PROTEGIDOS ✅
- `admin@materialespro.com` (rol: admin)
- `todoia09@gmail.com` (rol: vendedor)

---

## 🗄️ SCHEMA COMPLETO — catalogo_productos

```sql
codigo                    VARCHAR(20)   PRIMARY KEY
nombre                    TEXT          NOT NULL
descripcion               TEXT
categoria                 TEXT
marca                     TEXT
presentacion              VARCHAR(80)   ← "Cubeta 18L" (lo que ve el cliente)
unidad                    VARCHAR(30)   ← "lt", "kg", "pza" (medida interna)
cantidad                  NUMERIC(10,3) ← 18, 19, 25 (contenido por unidad)
cantidad_minima           NUMERIC(10,3)
precio_venta              NUMERIC(12,2) ← Precio 1 (público)
precio_lista              NUMERIC(12,2)
precio_2                  NUMERIC(12,2) ← Precio 2 (frecuente)
precio_3                  NUMERIC(12,2) ← Precio 3 (distribuidor)
precio_4                  NUMERIC(12,2) ← Precio 4 (VIP)
iva                       NUMERIC(12,2)
costo_neto                NUMERIC(12,2)
descuento_maximo          NUMERIC(5,2)
rendimiento_m2_por_unidad NUMERIC(10,3)
rendimiento_nota          TEXT
destacado                 BOOLEAN       DEFAULT FALSE
en_oferta                 BOOLEAN       DEFAULT FALSE
precio_oferta             NUMERIC(12,2)
oferta_hasta              TIMESTAMPTZ
mas_vendido               BOOLEAN       DEFAULT FALSE
orden_display             INTEGER       DEFAULT 0
unidades_pallet           INTEGER
moneda                    VARCHAR(5)    DEFAULT 'MXN'
fecha_precio              DATE
version                   VARCHAR(10)
activo                    BOOLEAN       DEFAULT TRUE
creado_en                 TIMESTAMPTZ   DEFAULT NOW()
actualizado_en            TIMESTAMPTZ   DEFAULT NOW()
```

### Columnas importantes en otras tablas
```sql
clientes.nivel_precio     INTEGER  DEFAULT 1   ← 1=público, 2=frecuente, 3=dist, 4=VIP
clientes.no_campana       BOOLEAN  DEFAULT FALSE
```

---

## 📋 EXCEL IMPORT/EXPORT — Columnas definitivas

```
Código CRM               → codigo (PK)
Artículo                 → nombre
Categoría                → categoria
Marca                    → marca
Presentación             → presentacion  ← "Cubeta 18L" (cliente ve esto)
Unidad medida            → unidad        ← "lt", "kg", "pza"
Contenido                → cantidad      ← 18, 19, 25 (número)
descripcion              → descripcion
Precio 1 NETO            → precio_venta
Precio 2 NETO            → precio_2
Precio 3 NETO            → precio_3
Precio 4 NETO            → precio_4
Costo NETO               → costo_neto
rendimiento_m2_por_unidad → número
rendimiento_nota         → texto
Activo                   → "Verdadero" (no TRUE, no 1)
```

---

## 🔄 FLUJO IMPORT/EXPORT — 100% Sincronizado

```
Excel → POST /api/catalogo/importar
  ├── Escribe catalogo.json (bot IA lo usa en memoria)
  └── Upsert a catalogo_productos DB (dashboard, inventario, precios)

GET /api/catalogo/plantilla → Excel con datos reales de DB
  └── SELECT todas las columnas incluyendo presentacion, unidad, cantidad
```

### ⚠️ Regla crítica del import
- El import escribe DOS lugares: `catalogo.json` + `catalogo_productos` DB
- Si solo hay SIKA en el Excel → solo SIKA en ambos lugares
- **SIEMPRE incluir SIKA + PEGADURO en el mismo Excel**

---

## 🤖 LÓGICA DEL BOT — Cómo usa los campos

```javascript
// buildCatalogText() en server.js
_u = p.presentacion || p.unidad || 'pza';
// → "Acril Techo 3 Pro $1,745/Cubeta 18L"  ✅

// Nivel de precios
nivel 1 → precio_venta  (público general)
nivel 2 → precio_2      (frecuente, configurable %)
nivel 3 → precio_3      (distribuidor, configurable %)
nivel 4 → precio_4      (VIP, usa descuento_maximo)
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

## 📱 CANALES BOT — ESTADO ACTUAL

| Canal | Estado |
|---|---|
| WhatsApp | ✅ Producción |
| Messenger Page 1 | ⏳ App Review pendiente |
| Messenger Page 2 | ❌ No conectado |
| Instagram DMs | ⏳ App Review pendiente |

---

## ✅ COMMITS SESIÓN 2026-04-09

| Commit | Descripción |
|---|---|
| `af331ab` | restore: catalogo.json 273 SIKA (fallido — BOM) |
| `bec14d8` | fix: catalogo.json sin BOM — UTF8 limpio ✅ |
| `341e450` | fix: export datos reales DB + columnas correctas |
| `f762ba2` | fix: import/export sync — costo_neto, upsert DB, async |
| `4b21a45` | fix: initSchema() schema completo — fuente única verdad |
| `52a6c43` | reset: catalogo.json vacío para test import/export |
| `266c33e` | feat: presentacion+unidad+cantidad en toda la arquitectura |

---

## 🐛 BUGS RESUELTOS HOY

| Bug | Fix |
|---|---|
| Export con columnas incorrectas (`id/nombre/precio`) | Columnas correctas con nombres exactos del import |
| Export hardcodeado (1 fila ejemplo) | Lee datos reales de `catalogo_productos` DB |
| Import no escribía a DB | Upsert a `catalogo_productos` después de `catalogo.json` |
| `catalogo_productos` no en `initSchema()` | Agregado al CREATE TABLE completo |
| Columnas comerciales nunca creadas en DB fresca | Incluidas en CREATE TABLE |
| `nivel_precio`/`no_campana` faltaban en clientes | ALTER TABLE en initSchema() |
| ALTER TABLE usuarios duplicados | Eliminados |
| `costo` vs `costo_neto` mismatch | Corregido a `costo_neto` en todo |
| `presentacion` no existía como campo separado | Nueva columna + flujo completo |
| Bot mostraba `lt` en vez de `Cubeta 18L` al cliente | `buildCatalogText` usa `presentacion` primero |
| PowerShell `>` escribe BOM | Usar `WriteAllText` con `UTF8Encoding($false)` |
| Import Excel sobreescribe catalogo.json sin backup | Backup automático en import |
| Inventario se repobla al arrancar con JSON viejo | Siempre commitear JSON vacío para reset |

---

## 🗺️ ROADMAP — PRÓXIMA SESIÓN

| # | Prioridad | Tarea |
|---|---|---|
| 1 | 🔴 | **Importar SIKA + PEGADURO** desde dashboard con nuevo Excel |
| 2 | 🔴 | **Claude Code scan post-import** — cross-reference y consistencia de cálculos del bot con nuevas tablas |
| 3 | 🔴 | **verificar_import_v1.js** — correr script de verificación completa |
| 4 | 🔴 | **Prueba pedido real por WhatsApp** — validar cotización con precios correctos |
| 5 | 🔴 | **Sync inventario** desde dashboard después del import |
| 6 | 🔴 | Laurent aceptar invitación Evaluador en Meta Developers |
| 7 | 🔴 | Solicitar App Review Meta (pages_messaging, instagram_manage_messages) |
| 8 | 🟡 | Fix `/api/catalogo` para incluir productos DB → inventario muestra marca/precio |
| 9 | 🟡 | Conectar Page 2 "Impermeabilizantes" al bot |
| 10 | 🟡 | Token permanente (System User) para Meta API |

---

## 🤖 CLAUDE CODE — SCAN POST-IMPORT

Una vez importados los datos, ejecutar en Claude Code CLI:

```
claude "Post-import scan: 1) Verifica cross-reference completo entre catalogo.json y catalogo_productos DB — todos los campos deben coincidir. 2) Verifica que buildCatalogText() genera líneas correctas con presentacion (ej: 'Cubeta 18L' no 'lt'). 3) Verifica cálculo de precios nivel 1/2/3/4 con datos reales de precio_venta/precio_2/precio_3/precio_4. 4) Verifica que upsert del import no rompe campos comerciales (destacado, en_oferta, mas_vendido) de productos existentes. 5) Busca cualquier otro inconsistencia. Reporta sin hacer cambios."
```

---

## 📜 SCRIPTS DISPONIBLES EN EL PROYECTO

| Script | Función |
|---|---|
| `reset_db_v1.js` | Reset completo DB (conserva usuarios) |
| `verificar_import_v1.js` | Verificación post-import completa |
| `migrar_columnas_v1.js` | Migración columnas precio_2/3/4 etc. |
| `fix_plantilla_v1.js` | Fix export plantilla (ya aplicado) |
| `fix_import_export_v2.js` | Fix import/export sync (ya aplicado) |
| `fix_async_import_v1.js` | Fix async route import (ya aplicado) |
| `fix_schema_v1.js` | Fix initSchema (ya aplicado) |
| `fix_presentacion_v1.js` | Fix campo presentacion (ya aplicado) |

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

### ⚠️ Para escribir archivos JSON en PowerShell SIN BOM:
```powershell
$content = Get-Content "archivo.json" -Raw
[System.IO.File]::WriteAllText((Resolve-Path "archivo.json"), $content, [System.Text.UTF8Encoding]::new($false))
```

---

## 💬 CÓMO EMPEZAR EL NUEVO CHAT

> "Eres mi Senior CTO y principal engineer para MaterialesPro GDL. Adjunto CONTEXTO_MATERIALESPRO_2026-04-09_v2.md con estado completo. Lee y confirma antes de continuar."
