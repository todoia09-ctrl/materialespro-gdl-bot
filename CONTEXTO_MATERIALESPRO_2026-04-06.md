# MaterialesPro GDL — Contexto Nuevo Chat
## Bot WhatsApp Enterprise v14 · Estado: PRODUCCIÓN ✅ LIVE
## Fecha: 2026-04-06

---

## 🎭 ROL
Eres mi **Senior CTO y Principal Engineer** para MaterialesPro GDL — bot de ventas WhatsApp con IA para negocio de materiales de construcción en Guadalajara, México. Eres Product Architect, Mobile Systems Expert, Real-Time Operations Specialist, Technical Documentation Lead y Web/UI Design Expert. Eres un expert AI systems architect, full-stack developer, and growth automation strategist.

---

## 📋 REGLAS DE TRABAJO
1. Solo trabajar en lo solicitado — no saltar pasos
2. Output listo para implementar — código production-ready
3. Siempre rutas completas en PowerShell
4. Un comando a la vez — esperar resultado
5. NUNCA usar `&&` en PowerShell
6. **PREFERIR REESCRITURA COMPLETA** de archivos sobre patches parciales
7. Para reemplazos en archivos JS: SIEMPRE usar scripts .js descargables, nunca node -e con caracteres especiales
8. Verificar siempre con `node --check` antes de hacer deploy
9. SIEMPRE usar regex para reemplazos en archivos con CRLF (server.js, pedido.js tienen CRLF)
10. NUNCA pegar múltiples comandos en un solo mensaje — uno por uno
11. **ANTES DE CUALQUIER COMMIT:** correr verificación de módulos
12. **ANTES DE PARCHEAR:** hacer dump con JSON.stringify del bloque exacto
13. **REGLA #13 — ANTES DE CADA PATCH:** verificar qué otros archivos usan la función modificada

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
IA:          Claude Haiku (claude-haiku-4-5-20251001) — Anthropic SDK
             IMPORTANTE: system es parámetro TOP-LEVEL, NUNCA como role:'system' en messages array
Mensajería:  Meta Cloud API WhatsApp Business v22.0 (ACTIVO)
             Twilio: ELIMINADO — reemplazado por Meta WA
Archivos:    Cloudinary (PDFs cotizaciones)
Deploy:      Render.com (Free tier — auto-deploy desde master)
Repo:        GitHub → https://github.com/todoia09-ctrl/materialespro-gdl-bot.git
OS Dev:      Windows 11 / PowerShell + Claude Code CLI v2.1.92 (instalado hoy)
Keep-alive:  UptimeRobot → ping /ping cada 5 min
```

---

## 📁 RUTA LOCAL DEL PROYECTO
```
C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl
```

### Archivos principales:
```
server.js         ← Core + webhook + buildSystemPrompt + getAIResponse + buildCatalogText
meta.js           ← WhatsApp Cloud API + sendMetaWAMessage + processMetaWebhook
pedido.js         ← State machine pedidos + activeOrders + vendorTokens
cotizacion.js     ← PDF + Cloudinary + isPDFRequest
crm.js            ← CRM + pricing 4 niveles + ZONAS + TARIFAS_ENVIO + calcularEnvio
tecnico.js        ← Preguntas técnicas
scheduler.js      ← Reportes automáticos
campanas.js       ← Campañas masivas Meta WA
inventario.js     ← Sync catálogo → DB + verificarStock + reducirStock
db.js             ← PostgreSQL (Supabase) + active_orders CRUD
catalogo.json     ← 273 productos SIKA + negocio + tarifas_envio
CLAUDE.md         ← Reglas para Claude Code CLI (creado hoy)
dashboard/
  api.js          ← API REST dashboard
  index.html      ← Dashboard web completo (9 secciones)
```

---

## 🆕 CLAUDE CODE CLI — CONFIGURADO HOY

Claude Code v2.1.92 instalado y configurado en el proyecto:

```powershell
npm install -g @anthropic-ai/claude-code
cd "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl"
claude
```

**CLAUDE.md creado** con todas las reglas críticas del proyecto:
- No && en PowerShell
- CRLF en server.js y pedido.js
- Nunca require('./meta') top-level en pedido.js
- Emoji con \uXXXX
- node --check antes de commit
- Anthropic API: system es parámetro top-level

**Ventaja clave:** Claude Code lee el código real directamente — no trabaja a ciegas como ChatGPT/Gemini.

---

## 🗂️ EXPORTS POR MÓDULO
```javascript
db.js:         { initSchema, upsertCliente, getCliente, logMensaje,
                 saveActiveOrder, deleteActiveOrder, loadActiveOrders, query, getPool }
crm.js:        { registrarContacto, actualizarZona, guardarCotizacion,
                 guardarPedido, actualizarEstadoPedido, programarSeguimiento,
                 logConversacion, getNivelPrecio, calcularPrecio, etiquetaNivel,
                 setNivelPrecio, calcularEnvio, detectarZona }
pedido.js:     { processOrderFlow, processVendorReply, isVendorNumber,
                 saveLastQuote, getLastQuote, recentlyConfirmed, initActiveOrders }
cotizacion.js: { generateAndSendQuote, isPDFRequest }
tecnico.js:    { isTechnicalQuestion, getTechnicalInfo }
meta.js:       { processMetaWebhook, sendMetaWAMessage }
```

---

## 🌐 SERVICIOS EN PRODUCCIÓN

| Servicio | URL / Dato | Estado |
|---|---|---|
| Bot Render | https://materialespro-gdl-bot.onrender.com | ✅ Live |
| Dashboard | https://materialespro-gdl-bot.onrender.com/dashboard | ✅ |
| Webhook Meta | https://materialespro-gdl-bot.onrender.com/webhook/meta | ✅ |
| GitHub | https://github.com/todoia09-ctrl/materialespro-gdl-bot.git | ✅ |
| Supabase | Session pooler configurado | ✅ |
| Cloudinary | PDFs cotizaciones | ✅ |
| UptimeRobot | Ping cada 5 min a /ping | ✅ |

---

## 🔑 META WHATSAPP BUSINESS API

| Dato | Valor |
|---|---|
| App Name | SIKA Santa Anita Bot |
| App ID | 929049326656512 |
| WABA ID | 3307053289456512 |
| Phone Number ID | 1042177225646433 |
| Número WA Bot | +52 1 33 3177 3189 |
| Token | Permanente — en Render env |
| META_VERIFY_TOKEN | sika_verify_2026 |
| App Status | PUBLICADA ✅ |
| VENDOR_WHATSAPP | +523313469831 (en .env) |

---

## 🔄 FLUJO DE MENSAJES

```
Cliente WA → /webhook/meta → processMetaWebhook()
  → normalizarNumero(from)
  → registrarContacto(fromNorm)
  → isVendorNumber(from) → processVendorReply() (SI/NO token)
  → processOrderFlow() → state machine
  → getTechnicalInfo() → preguntas técnicas
  → getAIResponse() → Claude Haiku con buildSystemPrompt()
```

### History de conversación (FUNCIONA):
- `saveHistory(key, messages)` / `getHistory(key)` — Map in-memory, max 8 mensajes
- Twilio path: key = `wa:{phone}`
- Meta WA path: key = `meta-wa:{phone}`
- Messenger/Instagram: key = `meta:{senderId}`
- FB Comments: key = `fb-comment:{userId}`

---

## 💰 PRICING 4 NIVELES

| Nivel | Trigger | Descuento |
|---|---|---|
| 1 | Default | 0% |
| 2 | Compras > $10,000 | 5% |
| 3 | Compras > $30,000 | 10% |
| 4 | Manual | descuento_maximo del producto |

---

## 🚚 TARIFAS ENVÍO POR ZONA

| Zona | Municipios clave | Tarifa |
|---|---|---|
| norte | Zapopan, Colinas, Ciudad Granja | $150 |
| gdl | Guadalajara centro, Americana | $150 |
| sur | Tlaquepaque, Santa Anita | $180 |
| este | Tonalá, El Salto, Juanacatlán | $200 |
| sur_lejano | Tlajomulco, Cajititlán | $250 |
| default | ZMG / Otros | $250 |

---

## 📊 CATÁLOGO — ESTADO ACTUAL

```
Total productos:     273 (todos activos)
Categorías:          35
Con descripción:     271/273
Tokens system prompt: ~5,794 (con categoría incluida desde hoy)
```

### buildCatalogText() — formato actual (server.js línea 90-91):
```javascript
var _c = p.categoria ? ' (' + p.categoria + ')' : '';
return _n + " $" + precioNivel(p) + "/" + _u + _c;
// Resultado: "Acril Techo 3 Pro Rojo $1730/pza (Impermeabilizantes acrílicos)"
```

### Categorías principales (35 total):
```
Sellado de juntas y adhesivos elásticos     (41 productos)
Morteros para reparación de concreto        (29 productos)
Impermeabilizantes acrílicos                (20 productos)
Productos complementarios para concreto     (17 productos)
Impermeabilizantes asfálticos               (12 productos)
Aditivos para cemento y mortero             (11 productos)
Adhesivos epóxicos                          (10 productos)
Sika Mantos PRO                             (10 productos)
... 27 categorías más
```

---

## 🐛 BUGS RESUELTOS HOY (2026-04-06)

### ✅ Bug #1 — Teléfono vendedor hardcodeado
- **Archivo:** `catalogo.json` → bloque `negocio`
- **Fix:** Cambió `"+52 33 XXXX XXXX"` → `"+52 33 1346 9831"` (ambos campos: `telefono` y `whatsapp`)
- **Root cause real:** No era código hardcodeado — era un placeholder en catalogo.json
- **Commit:** `2ec3223`
- **Validado:** ✅ Bot responde número real en WhatsApp

### ✅ Bug #4 — nivelPrecio no pasado en Meta WA (NUEVO — descubierto hoy)
- **Archivo:** `meta.js` líneas 193-201
- **Problema:** Clientes Meta WA siempre recibían precios Tier 1, ignorando historial de compras
- **Fix:** Agregado `getNivelPrecio(fromNorm)` antes de `getAIResponse()` en path Meta WA
- **También agregado:** `getNivelPrecio` al import de crm.js en meta.js
- **Commit:** `2ec3223`

### ✅ Bug #5 — saveLastQuote truncaba a 400 chars en Meta WA (NUEVO — descubierto hoy)
- **Archivo:** `meta.js` línea 197
- **Problema:** Cotizaciones multi-producto se guardaban incompletas en Meta WA (400 chars vs 1200 en Twilio)
- **Fix:** Cambiado `substring(0, 400)` → `substring(0, 1200)` en path Meta WA únicamente
- **Commit:** `2ec3223`

### ✅ Mejora — Categoría en catalog text del system prompt
- **Archivo:** `server.js` línea 90-91
- **Fix:** Agregada categoría entre paréntesis a cada producto en buildCatalogText()
- **Impacto tokens:** 3,054 → 5,794 tokens (aceptable, mejora recomendaciones de Claude)
- **Commit:** `5ea76b9`

---

## ⚠️ BUGS CONOCIDOS — PENDIENTES

### 🔴 Bug #3 — Order total parser devuelve $0
- **Archivo:** `pedido.js` → extracción de total al final del estado COLLECTING
- **Root cause:** Total extraído via regex/AI desde texto. Falla en edge cases
- **Fix correcto:** Calcular desde `activeOrders.products` usando `calcularPrecio()` + `calcularEnvio()`
- **Pendiente:** Ver código real de pedido.js con Claude Code

### 🔴 Risk C — Dashboard sin autenticación
- **Problema:** `/dashboard` posiblemente público — cualquiera puede acceder
- **Fix pendiente:** Basic Auth middleware en Express con DASHBOARD_USER/DASHBOARD_PASS en .env

### 🟡 Risk D — Startup race condition
- **Problema:** Express acepta webhooks antes de que `initActiveOrders()` termine
- **Fix pendiente:** Async `startServer()` que bloquea `app.listen` hasta que init complete

### 🟡 Risk E — Sin deduplicación de webhooks Meta
- **Problema:** Meta puede re-entregar el mismo webhook — sin idempotency check por message ID
- **Fix pendiente:** Set en memoria con TTL de 1 hora en meta.js

---

## 🧪 PRUEBAS WHATSAPP REALIZADAS HOY

### Prueba 1 — Entrega a domicilio (número Fester)
- Cliente pidió "5 cubetas Sikalastic 621 a domicilio Zapopan"
- Bot correctamente dijo que no existe y ofreció 4 alternativas reales con precios
- Preguntó teléfono del vendedor → **Respondió +52 33 1346 9831 ✅** (Bug #1 validado)
- Zona norte detectada → tarifa $150 mostrada ✅
- History funcionando (recordó alternativas del mensaje anterior) ✅

### Prueba 2 — Recolección en tienda (número ASIF)
- Flujo completo en 8 pasos / ~8 minutos
- Saludo con nombre ✅ → Catálogo por categoría ✅ → Cantidad ✅
- Opción recoger vs entrega con precios por zona ✅
- Día/hora recolección ✅ → Método de pago (3 opciones) ✅ → Factura ✅
- Resumen completo antes de confirmar ✅ → Pedido confirmado ✅
- Dirección + link Maps + horario en mensaje de confirmación ✅
- **Observación:** "¿Hacemos el pedido?" aparece dentro del resumen — cosmético

### Hallazgo en pruebas:
El bot no ofrecía productos tipo "Acril Techo" para losa de techo de concreto (los ofrecía solo para terraza). Root cause: sin categoría en catalog text, Claude no tenía contexto para distinguir aplicaciones. **Fix aplicado hoy con commit 5ea76b9.**

---

## 🧠 LECCIONES TÉCNICAS — SESIÓN 2026-04-06

### Sobre el código real vs audits externos
- ChatGPT y Gemini asumieron que `buildSystemPrompt` era síncrona y hardcodeada — es síncrona pero usa `CATALOG.negocio.telefono` del JSON, no un string literal
- Bug #1 no era en el código JS — era en el valor del JSON
- History de conversación YA estaba implementado — el "bug" era solo en Meta WA path (sin nivelPrecio)
- **Lección:** Claude Code con acceso al código real es imprescindible para diagnósticos precisos

### Sobre tokens y catálogo
- 273 productos sin descripción = 3,054 tokens (poco contexto para Claude)
- 273 productos + descripción 60chars = 7,432 tokens (demasiado caro)
- 273 productos + categoría = 5,794 tokens (balance correcto para ahora)
- A 1,000 productos el sistema actual NO escala — necesita RAG o filtro por categoría

### Sobre Claude Code
- Usar `claude` desde el directorio del proyecto (no desde home)
- CLAUDE.md persiste las reglas entre sesiones automáticamente
- Permite sessions sin preguntar permiso con opción "don't ask again"
- Tests locales con webhook simulado funcionan pero requieren `node -r dotenv/config server.js`

### Sobre Meta API
- `getNivelPrecio` estaba importado en crm.js pero NO en el import de meta.js — fácil de perder
- Los 3 paths de meta.js (WA, Messenger, Instagram) tienen lógica ligeramente diferente — siempre verificar los 3 al hacer cambios

---

## 🚀 FEATURE PLANIFICADA — PRODUCTOS DESTACADOS

### Contexto
Con 1,000+ productos el sistema actual no escala. Se necesita un sistema de priorización.

### Campos a agregar en `catalogo_productos` (DB):
```sql
ALTER TABLE catalogo_productos
ADD COLUMN destacado BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN en_oferta BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN precio_oferta NUMERIC(10, 2) NULL,
ADD COLUMN oferta_hasta TIMESTAMPTZ NULL,
ADD COLUMN mas_vendido BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN orden_display INTEGER NOT NULL DEFAULT 999;

CREATE INDEX idx_cat_oferta ON catalogo_productos(en_oferta, oferta_hasta);
CREATE INDEX idx_cat_destacado ON catalogo_productos(destacado);
CREATE INDEX idx_cat_mas_vendido ON catalogo_productos(mas_vendido);
```

### Lógica de prioridad en buildCatalogText():
```
1° Productos EN OFERTA activa (máx 5) — verificar oferta_hasta >= NOW()
2° Productos DESTACADOS por admin (máx 10)
3° Productos MÁS VENDIDOS auto-calculados (máx 10)
4° Resto filtrado por categoría relevante al mensaje del cliente
Límite total: ~15,000 chars / ~4,000 tokens
```

### Decisiones de diseño (análisis Gemini + correcciones propias):
- Campos comerciales SOLO en DB — catalogo.json solo datos duros
- Sync `inventario.js` debe usar `ON CONFLICT DO UPDATE` excluyendo columnas comerciales
- Límite de 15 destacados máximo — validar en endpoint PATCH
- `oferta_hasta` debe usar TIMESTAMPTZ (timezone México CST = UTC-6)
- `mas_vendido` calculado via pg_cron en Supabase (no scheduler.js — Render duerme)
- System prompt: instrucciones de comportamiento PRIMERO, catálogo AL FINAL
- Mapa de sinónimos necesario: "humedad/gotera/techo" → categorías impermeabilizantes

### Mapa de sinónimos a implementar:
```javascript
const SINONIMOS = {
  'impermeabilizante': ['Impermeabilizantes acrílicos', 'Impermeabilizantes asfálticos'],
  'humedad':    ['Impermeabilizantes acrílicos', 'Aditivos para cemento y mortero'],
  'gotera':     ['Impermeabilizantes acrílicos', 'Sellado de juntas y adhesivos elásticos'],
  'techo':      ['Impermeabilizantes acrílicos', 'Sika Mantos PRO'],
  'losa':       ['Impermeabilizantes acrílicos', 'Productos complementarios para concreto'],
  'azotea':     ['Impermeabilizantes acrílicos', 'Sika Mantos PRO'],
  'grieta':     ['Morteros para reparación y protección de concreto', 'Adhesivos epóxicos'],
  'pegar':      ['Adhesivos epóxicos', 'Sellado de juntas y adhesivos elásticos'],
  'piso':       ['Endurecedores superficiales para pisos'],
  'concreto':   ['Aditivos para cemento y mortero', 'Productos complementarios para concreto']
}
```

### Orden de implementación:
1. ALTER TABLE en Supabase SQL Editor (cero impacto en producción)
2. Modificar `inventario.js` — proteger campos comerciales en sync
3. Nueva `buildCatalogText()` con prioridades y caché en memoria
4. Endpoints PATCH en `dashboard/api.js` + validación límite 15
5. UI dashboard — toggles + badges + precio oferta
6. pg_cron `mas_vendido` en Supabase

---

## 🗺️ ROADMAP PRÓXIMAS SESIONES

| # | Prioridad | Tarea |
|---|---|---|
| 1 | 🔴 | Hand-off a vendedor humano (bot detecta señal → notifica vendedor con contexto) |
| 2 | 🔴 | Bug #3 — Order total parser $0 (ver pedido.js real con Claude Code) |
| 3 | 🔴 | Risk C — Dashboard auth (Basic Auth middleware) |
| 4 | 🟡 | Risk D — Startup race condition (async startServer) |
| 5 | 🟡 | Risk E — Deduplicación webhooks Meta |
| 6 | 🟡 | Productos destacados + ofertas (DB + Dashboard + Bot) |
| 7 | 🟡 | Mapa de sinónimos para búsqueda (losa, azotea, gotera → categorías) |
| 8 | 🟢 | pgvector RAG en Supabase (cuando catálogo > 500 productos) |
| 9 | 🟢 | Instagram + Facebook Messenger activar |
| 10 | 🟢 | Campaña masiva outbound (template materialespro_promo aprobada) |

---

## 📦 DASHBOARD — SECCIONES

| Sección | Funcionalidad |
|---|---|
| Dashboard | KPIs hoy · auto-refresh 30s · timezone MX |
| Pedidos | Lista + detalle + confirmar/cancelar + envía WA |
| Clientes | CRM 360° + historial + nivel precio |
| Inventario | Sync catálogo + stock |
| Campañas | Masivos WA Meta templates |
| Catálogo | Upload XLSX + preview |
| Vendedores | CRUD vendedores + empresa/tel/rol/zona |
| Configuración | Tarifas envío por zona editables |
| Reportes | Ventas por período/zona/producto |

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

### Commits de hoy:
```
5ea76b9 fix: agregar categoria en catalog text del system prompt
2ec3223 fix: Bug#1 telefono real, Bug#4 nivelPrecio Meta WA, Bug#5 saveLastQuote 1200 chars
```

---

## 💬 CÓMO EMPEZAR EL NUEVO CHAT

Pega este mensaje al inicio:

> "Eres mi Senior CTO y principal engineer para MaterialesPro GDL — bot de ventas WhatsApp con IA para negocio de materiales de construcción en Guadalajara, México. Adjunto CONTEXTO_MATERIALESPRO_2026-04-06.md con estado completo. Lee y confirma antes de continuar."
