# MaterialesPro GDL — Contexto Nuevo Chat
## Bot WhatsApp Enterprise v14 · Estado: PRODUCCIÓN ✅ LIVE
## Fecha: 2026-04-06 (sesión completa)

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
14. **REGLA #14 — SIEMPRE** incluir path completo en todos los scripts y comandos PowerShell
15. **REGLA #15 — NUNCA** usar strings multi-línea literales en patches. Siempre `\uXXXX` para emoji y `\\n` para saltos de línea

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
OS Dev:      Windows 11 / PowerShell + Claude Code CLI v2.1.92
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
                    + HANDOFF a asesor humano (isHandoffTrigger, isInHandoff, activateHandoff)
                    + loadPriorityProducts() + query importado de db.js
meta.js           ← WhatsApp Cloud API + sendMetaWAMessage + processMetaWebhook
                    + deduplicación de mensajes (_processedMsgIds Map con TTL 1hr)
                    + handoff check en processWhatsAppMessage
pedido.js         ← State machine pedidos + activeOrders + vendorTokens
                    + parseItemsFromQuote() — parsea items desde rawQuote de Claude
                    + parseHoraMsg() — extrae hora de texto del cliente
                    + validación horarios: Dom cerrado, Sáb 8am-2pm, LV 8am-6pm
                    + guard doble confirmación en startVendorTimer (recentlyConfirmed check)
cotizacion.js     ← PDF + Cloudinary + isPDFRequest
crm.js            ← CRM + pricing 4 niveles + ZONAS + TARIFAS_ENVIO + calcularEnvio
tecnico.js        ← Preguntas técnicas
scheduler.js      ← Reportes automáticos
campanas.js       ← Campañas masivas Meta WA
inventario.js     ← Sync catálogo → DB + verificarStock + reducirStock
db.js             ← PostgreSQL (Supabase) + active_orders CRUD
catalogo.json     ← 273 productos SIKA + negocio + tarifas_envio
importar-catalogo.js ← Upsert productos → catalogo_productos (protege campos comerciales)
CLAUDE.md         ← Reglas para Claude Code CLI
dashboard/
  api.js          ← API REST dashboard
                    + PATCH /api/catalogo/:codigo/comercial (destacado/oferta)
                    + GET /api/catalogo/comercial
  index.html      ← Dashboard web completo (9 secciones)
                    + Inventario con filtros avanzados (búsqueda, categoría, marca, estado, stock)
                    + Tabla sorteable (Nombre, Precio, Stock)
                    + Sección Productos Destacados y Ofertas con toggles
```

---

## 🆕 CLAUDE CODE CLI — CONFIGURADO
Claude Code v2.1.92 instalado. Usar para fixes quirúrgicos — mucho más limpio que patches manuales para archivos con CRLF.

**Ventaja clave:** Lee el código real directamente — no trabaja a ciegas.

**Regla:** fixes en server.js y pedido.js → Claude Code directo. Patches manuales solo si Claude Code no está disponible.

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
server.js:     { getCatalog, getAIResponse, buildSystemPrompt }
               + exporta internamente: isInHandoff, isHandoffTrigger, activateHandoff (pasados como objeto a meta.js)
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

## 🔒 SEGURIDAD DASHBOARD
- **Capa 1:** Basic Auth del navegador (popup nativo) — DASHBOARD_USER / DASHBOARD_PASS en Render env
- **Capa 2:** JWT login del dashboard — email + password de tabla usuarios
- `/api` rutas protegidas SOLO por JWT (Basic Auth removido de /api para evitar conflicto con Bearer tokens)

---

## 🔄 FLUJO DE MENSAJES

```
Cliente WA → /webhook/meta → processMetaWebhook()
  → isDuplicate(msg.id) → skip si duplicado (dedup TTL 1hr)
  → normalizarNumero(from)
  → registrarContacto(fromNorm)
  → isVendorNumber(from) → processVendorReply() (SI/NO token)
  → isInHandoff(fromNorm) → skip si en handoff (30min)
  → isHandoffTrigger(text) → activateHandoff() + notifica vendedor
  → processOrderFlow() → state machine
  → getTechnicalInfo() → preguntas técnicas
  → getAIResponse() → Claude Haiku con buildSystemPrompt()
```

---

## 🤝 HAND-OFF A ASESOR HUMANO
- **18 triggers:** "necesito un asesor", "hablar con humano", "gerente", "no me entiendes", etc.
- **Acción:** Bot pausa 30 min para ese cliente + notifica VENDOR_WHATSAPP con resumen
- **Resume:** Automático después de 30 min
- **Implementado en:** server.js (_handoffMap, isHandoffTrigger, isInHandoff, activateHandoff) + meta.js

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

## ⏰ HORARIOS DE NEGOCIO
- **Lunes a Viernes:** 8am – 6pm
- **Sábado:** 8am – 2pm
- **Domingo:** CERRADO
- Validación implementada en pedido.js → ASKING_DATE con parseHoraMsg()

---

## 📊 CATÁLOGO — ESTADO ACTUAL

```
Total productos:     273 (todos activos)
Categorías:          35
Tokens system prompt: ~5,794
```

### buildCatalogText() — prioridades (server.js):
```
1° Productos EN OFERTA activa (máx 5) — label 🔥
2° Productos DESTACADOS (máx 10) — label ⭐
3° Productos MÁS VENDIDOS (máx 10)
4° Resto del catálogo
Cache: _priorityProducts actualizado en startup y cada hora
```

### Campos comerciales en DB (catalogo_productos):
```sql
destacado      BOOLEAN NOT NULL DEFAULT false
en_oferta      BOOLEAN NOT NULL DEFAULT false
precio_oferta  NUMERIC(10,2) NULL
oferta_hasta   TIMESTAMPTZ NULL
mas_vendido    BOOLEAN NOT NULL DEFAULT false
orden_display  INTEGER NOT NULL DEFAULT 999

Índices: idx_cat_oferta, idx_cat_destacado, idx_cat_mas_vendido
```

**IMPORTANTE:** importar-catalogo.js NO sobreescribe estos campos en sync (ON CONFLICT protegido).

---

## 📦 INVENTARIO — ESTADO ACTUAL
- 273 productos sincronizados desde catálogo
- Tabla con filtros: búsqueda por nombre, categoría, marca, estado, stock
- Sorteable por Nombre, Precio, Stock
- Edición de stock inline con botón guardar
- Enriquecido desde /api/catalogo por codigo Y id

---

## 🐛 BUGS PENDIENTES — PRÓXIMA SESIÓN

| # | Severidad | Bug | Archivo |
|---|---|---|---|
| 1 | 🔴 | Precio oferta no se guarda en sección Catálogo dashboard | dashboard/index.html |
| 2 | 🟡 | Catálogo UX: sección Destacados/Ofertas muy abajo — poner tabs o ancla | dashboard/index.html |
| 3 | 🟡 | Inventario: agregar filtros Destacado / En Oferta / Más Vendido | dashboard/index.html |

---

## ✅ COMMITS DE HOY (2026-04-06)

| Commit | Fix/Feature |
|---|---|
| `f763b9f` | WAITING_VENDOR acepta mensajes de producto + limpia tokens viejos |
| `a447e1f` | KPI dashboard timezone México + auto-refresh scope |
| `5b5c73c` | Horarios negocio: Dom cerrado, Sáb 8am-2pm, LV 8am-6pm |
| `232d969` | Despedida sin loop + guard doble confirmación timer |
| `685cbf3` | Risk C — Basic Auth dashboard |
| `2b416b4` | Bug #3 — parseItemsFromQuote + order.total + stock real |
| `a6a8e2e` | Risk D — async startServer (initActiveOrders antes de app.listen) |
| `4bacc3b` | Risk E — dedup webhooks Meta WA + FB + Instagram TTL 1hr |
| `72caabb` | Hand-off asesor humano — 18 triggers, pausa 30min |
| `ecbb1cd` | Productos destacados/ofertas — prioridad en catalog text |
| `586e4ef` | Dashboard gestión destacados/ofertas — toggles + validación max 15 |
| `421e91a` | Inventario con filtros avanzados + tabla sorteable |
| `b139464` | Fix unicode headers inventario + filtros default Todos |
| `ac06a7f` | Fix enriquecimiento inventario por codigo + filtros vacíos |
| `9c76d1c` | Fix standalone script sobreescribía funciones inventario |

---

## 🗺️ ROADMAP PRÓXIMAS SESIONES

| # | Prioridad | Tarea |
|---|---|---|
| 1 | 🔴 | Bug: precio oferta no se guarda en dashboard Catálogo |
| 2 | 🟡 | UX Catálogo: tabs o ancla para sección Destacados/Ofertas |
| 3 | 🟡 | Inventario: filtros Destacado / En Oferta / Más Vendido |
| 4 | 🟡 | Mapa de sinónimos (losa/azotea/gotera → categorías) |
| 5 | 🟢 | Instagram + Facebook Messenger activar |
| 6 | 🟢 | Campaña masiva outbound (template materialespro_promo aprobada) |
| 7 | 🟢 | pgvector RAG (cuando catálogo > 500 productos) |

---

## 🧠 LECCIONES TÉCNICAS — SESIÓN 2026-04-06

### Sobre patches vs Claude Code
- Claude Code es MUCHO más limpio para fixes quirúrgicos de 1-2 líneas
- Patches manuales tienen problemas con CRLF + emoji — usar state machine (patch_pedido_v4h.js) como herramienta de emergencia
- **Regla:** fixes en server.js/pedido.js → Claude Code directo

### Sobre strings en patches
- NUNCA poner strings multi-línea literales en scripts de patch
- Siempre usar `\uXXXX` para emoji y `\\n` para saltos
- El state machine de v4h.js es la herramienta definitiva para strings rotos

### Sobre el dashboard
- Scripts standalone al final del HTML pueden sobreescribir funciones del script principal — siempre buscar duplicados antes de agregar funciones
- Unicode escapes `\uXXXX` en HTML crudo (fuera de `<script>`) se muestran como texto literal — usar UTF-8 directo
- Basic Auth en /api rompía las llamadas AJAX con JWT Bearer — solo aplicar en /dashboard HTML

### Sobre pedido.js
- `order.items` NUNCA se poblaba → stock check y total siempre $0
- Fix: parseItemsFromQuote() parsea el rawQuote de Claude con regex
- WAITING_VENDOR: siempre verificar que los keywords de escape son suficientemente amplios
- Timer de 2 min: siempre verificar recentlyConfirmed antes de auto-confirmar

### Sobre inventario dashboard
- /api/catalogo devuelve `codigo` como key, no `id` — indexar por ambos al enriquecer
- syncInventario necesita JWT Bearer header — usar la función api() del dashboard, no fetch directo

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

> "Eres mi Senior CTO y principal engineer para MaterialesPro GDL — bot de ventas WhatsApp con IA para negocio de materiales de construcción en Guadalajara, México. Adjunto CONTEXTO_MATERIALESPRO_2026-04-06_v2.md con estado completo. Lee y confirma antes de continuar."
