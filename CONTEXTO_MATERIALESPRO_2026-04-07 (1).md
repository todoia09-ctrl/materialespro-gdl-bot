# MaterialesPro GDL — Contexto Nuevo Chat
## Bot WhatsApp Enterprise v14 · Estado: PRODUCCIÓN ✅ LIVE
## Fecha: 2026-04-07 (sesión completa)

---

## 🎭 ROL
Eres mi **Senior CTO y Principal Engineer** para MaterialesPro GDL — bot de ventas WhatsApp con IA para negocio de materiales de construcción en Guadalajara, México. Eres Product Architect, Mobile Systems Expert, Real-Time Operations Specialist, Technical Documentation Lead y Web/UI Design Expert. You are an expert AI systems architect, full-stack developer, and growth automation strategist.

---

## 📋 REGLAS DE TRABAJO
1. Solo trabajar en lo solicitado — no saltar pasos
2. Output listo para implementar — código production-ready
3. Siempre rutas completas en PowerShell
4. Un comando a la vez — esperar resultado
5. NUNCA usar `&&` en PowerShell
6. **PREFERIR REESCRITURA COMPLETA** de archivos sobre patches parciales
7. Para reemplazos en archivos JS: SIEMPRE usar Claude Code CLI para fixes quirúrgicos
8. Verificar siempre con `node --check` antes de hacer deploy
9. SIEMPRE usar regex para reemplazos en archivos con CRLF (server.js, pedido.js tienen CRLF)
10. NUNCA pegar múltiples comandos en un solo mensaje — uno por uno
11. **ANTES DE CUALQUIER COMMIT:** correr verificación de módulos
12. **REGLA #12 — SIEMPRE** verificar con `git log --oneline -3` después de Claude Code — puede hacer commits automáticamente
13. **REGLA #13 — NUNCA** usar `node -e` con strings multi-línea o caracteres especiales en PowerShell — siempre crear script .js descargable
14. **REGLA #14 — Claude Code** es la herramienta preferida para fixes en server.js, pedido.js, meta.js — evita problemas de CRLF y encoding

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

### Archivos principales:
```
server.js         ← Core + webhook + buildSystemPrompt + getAIResponse + buildCatalogText
                    + HANDOFF a asesor humano (isHandoffTrigger, isInHandoff, activateHandoff)
                    + loadPriorityProducts() + query importado de db.js
                    + SINONIMOS_TXT (18 categorías de sinónimos)
meta.js           ← WhatsApp Cloud API + sendMetaWAMessage + processMetaWebhook
                    + deduplicación de mensajes (_processedMsgIds Map con TTL 1hr)
                    + handoff check en processWhatsAppMessage
                    + _setCampCat/_getCampCat/_delCampCat — persistencia DB (campaign_sessions)
                    + _setCampProd/_getCampProd/_delCampProd — persistencia DB (campaign_sessions)
                    + Intercept "Sí, me interesa" (Meta path — línea ~280)
                    + Intercept categoría numérica (2a) — productos numerados
                    + Intercept selección producto (2-pre Array) → single → cantidad
                    + button/interactive message handling
pedido.js         ← State machine pedidos + activeOrders + vendorTokens
                    + isBusinessHours() — timezone America/Mexico_City
                    + REGLA 1: Pickup + stock OK → auto-confirma inmediatamente (sin WA vendor)
                    + REGLA 2: Entrega en horario → pendiente dashboard (sin auto-confirm)
                    + REGLA 3: Fuera de horario → WA vendor sin timer auto-confirm
                    + parseItemsFromQuote() — campo 'nombre' (NO 'producto')
                    + recentlyConfirmed guard en S.CONFIRMING (15s anti-duplicado)
                    + parseHoraMsg() — extrae hora de texto del cliente
                    + validación horarios: Dom cerrado, Sáb 8am-2pm, LV 8am-6pm
                    + Fecha dinámica: hoy/mañana/día-semana → fecha real México City TZ
cotizacion.js     ← PDF + Cloudinary + isPDFRequest
crm.js            ← CRM + pricing 4 niveles + ZONAS + TARIFAS_ENVIO + calcularEnvio
tecnico.js        ← Preguntas técnicas
scheduler.js      ← Reportes automáticos
campanas.js       ← Campañas masivas Meta WA
                    + TEMPLATES: materialespro_promo (APROBADO ✅)
                    + Usa META_WHATSAPP_TOKEN (NO META_WA_TOKEN)
inventario.js     ← Sync catálogo → DB + verificarStock + reducirStock
db.js             ← PostgreSQL (Supabase) + active_orders CRUD
                    + campaign_sessions tabla (phone PK, cat_data, prod_data)
                    + active_orders tabla creada en initSchema()
catalogo.json     ← 273 productos SIKA + negocio + tarifas_envio
importar-catalogo.js ← Upsert productos → catalogo_productos
dashboard/
  api.js          ← API REST dashboard
                    + PATCH /api/pedidos/:id/estado → envía WA con productos al confirmar
                    + PATCH /api/catalogo/:codigo/comercial (destacado/oferta)
                    + GET /api/catalogo/comercial
                    + POST /api/campanas + POST /api/campanas/:id/enviar (2 pasos)
  index.html      ← Dashboard web completo (9 secciones)
                    + Historial campañas funcional (data array directo)
                    + Emoji 🔥 como &#x1F525; en dropdown
                    + Inventario con filtros avanzados
                    + Catálogo con tabs ancla
```

---

## 🆕 CLAUDE CODE CLI — CONFIGURADO
Claude Code v2.1.92 instalado. Usar para fixes quirúrgicos en archivos con CRLF.

**CRÍTICO:** Claude Code puede hacer git add + commit automáticamente. Siempre verificar con `git log --oneline -3` después de usarlo.

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
campanas.js:   { SEGMENTOS, TEMPLATES, crearCampana, enviarCampana,
                 previewSegmento, getClientesSegmento, sendTemplate, sendTexto }
server.js:     { getCatalog, getAIResponse, buildSystemPrompt }
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
| Token WA | META_WHATSAPP_TOKEN (permanente en Render env) |
| Page Token | META_PAGE_ACCESS_TOKEN (para Messenger) |
| META_VERIFY_TOKEN | sika_verify_2026 |
| App Status | PUBLICADA ✅ |
| VENDOR_WHATSAPP | +523313469831 (en .env) |

---

## 💳 META PAGOS
- **Método de pago:** Mastercard terminación 3711 (vence 5/30) ✅
- **Divisa:** Peso mexicano MXN
- **WABA:** SIKA Santa Anita — cuenta aprobada ✅
- **Templates marketing:** REQUIEREN método de pago activo para entrega

---

## 📱 CANALES ACTIVOS

| Canal | Estado | Notas |
|---|---|---|
| WhatsApp | ✅ Producción | Número +52 1 33 3177 3189 |
| Messenger | ✅ Configurado | Webhook + página Sika Santa Anita Impermeabilizantes |
| Instagram | ⏳ Pendiente | Cuenta nueva creada — vincular después de 24h |
| Facebook Feed | ✅ Suscrito | feed webhook activo |

---

## 🔒 SEGURIDAD DASHBOARD
- **Capa 1:** Basic Auth del navegador — DASHBOARD_USER / DASHBOARD_PASS en Render env
- **Capa 2:** JWT login — email + password de tabla usuarios
- `/api` rutas protegidas SOLO por JWT

---

## 🔄 FLUJO DE MENSAJES META

```
Cliente WA → /webhook/meta → processMetaWebhook()
  → isDuplicate(msg.id) → skip si duplicado (dedup TTL 1hr)
  → normalizarNumero(from)
  → registrarContacto(fromNorm)
  → isVendorNumber(from) → processVendorReply() (SI/NO token)
  → isInHandoff(fromNorm) → skip si en handoff (30min)
  → isHandoffTrigger(text) → activateHandoff() + notifica vendedor
  → processWhatsAppMessage():
      → cache check
      → [2-pre Array] _getCampProd → selección producto por número
      → [2-pre Object] _getCampProd → cotiza cantidad
      → [2a] _getCampCat → muestra productos de categoría numerados
      → [2b] "Sí, me interesa" → muestra ofertas por categoría
      → processOrderFlow() → state machine
      → getTechnicalInfo() → preguntas técnicas
      → getAIResponse() → Claude Haiku con buildSystemPrompt()
```

---

## 🎯 FLUJO CAMPAÑA COMPLETO (3 pasos)

```
1. Admin → Dashboard → Campañas → selecciona template materialespro_promo
2. Bot envía: "Hola {nombre}, tenemos promoción especial..."
3. Cliente toca "Sí, me interesa"
4. Bot muestra: categorías con productos en oferta numeradas (1,2,3,4...)
5. Cliente responde número de categoría (ej: "1")
6. Bot muestra: productos de esa categoría NUMERADOS (1. Acril Techo Blanco, 2. Acril Techo Rojo)
7. Cliente responde número de producto (ej: "1") ← NUEVO PASO
8. Bot pregunta: "¿Cuántas unidades de Acril Techo Blanco necesitas?"
9. Cliente responde cantidad (ej: "3")
10. Bot cotiza: "¡Perfecto! 3 x Acril Techo... a $1,000 = $3,000 ¿Hacemos el pedido?"
    + saveLastQuote() guarda formato limpio parseable: "Nombre: 3 × $1,000 = $3,000"
11. Cliente dice "Sí" → flujo normal: entrega/recoger → fecha → pago → factura → confirmación
```

---

## ⚙️ LÓGICA CONFIRMACIÓN PEDIDOS (3 REGLAS)

```
REGLA 1 — Pickup + stock OK:
  → Auto-confirma inmediatamente
  → Reduce stock en DB
  → Actualiza estado a 'confirmado'
  → Envía confirmación al cliente CON lista de productos
  → NO notifica al vendedor por WA
  → NO inicia timer

REGLA 2 — Entrega en horario (Lun-Vie 8-18h, Sáb 8-14h):
  → Guarda pedido como 'pendiente'
  → Limpia orden activa en memoria
  → Cliente recibe "Tu pedido está registrado. Nuestro equipo lo confirmará en breve."
  → Vendedor gestiona desde Dashboard → Confirmar → envía WA al cliente CON productos

REGLA 3 — Fuera de horario (cualquier tipo):
  → Envía WA al vendedor con token SI-XXXXX / NO-XXXXX
  → Vendedor responde manualmente
  → SIN startVendorTimer — sin auto-confirm
```

---

## 📅 FECHA DINÁMICA (pedido.js ASKING_DATE)

| Cliente dice | Bot calcula |
|---|---|
| "hoy 10am" | Martes 7 de abril a las 10am |
| "mañana 9am" | Miércoles 8 de abril a las 9am |
| "viernes 11am" | Viernes 11 de abril a las 11am |
| "martes" (ya pasó) | "¿Confirmas que es el Martes 14 de abril? (próxima semana)" |
| "sábado 3pm" | Rechaza: cerramos a las 2pm |
| "domingo" | Rechaza: domingos cerrados |

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
- isBusinessHours() en pedido.js usa timezone America/Mexico_City

---

## 📊 CATÁLOGO — ESTADO ACTUAL

```
Total productos:     273 (todos activos)
Categorías:          35
En oferta activa:    5 productos
```

### Productos en oferta activa:
```
Impermeabilizantes acrílicos:
  - Acril Techo 3 Pro Blanco Cubeta (18L) → $1,000 (regular $1,745)
  - Acril Techo 3 Pro Rojo Cubeta (18L)   → $1,250 (regular $1,730)
Membranas prefabricadas:
  - SikaLam SP-8 ROLLO (2m x20m)          → $6,000 (regular $6,215)
Morteros reparación:
  - SikaTop-121 (A+B) Unidad (26Kg)       → $1,500 (regular $1,620)
Sellado de juntas:
  - Sikaflex-1A Purform gris cartucho      → $200 (regular $275)
```

---

## 🎭 TEMPLATE CAMPAÑAS

| Template | Estado | Categoría | Parámetro |
|---|---|---|---|
| materialespro_promo | ✅ Activa | Marketing | {{1}} = nombre |
| hello_world | ✅ Activa | Utilidad | — |

---

## 🤝 HAND-OFF A ASESOR HUMANO
- **18 triggers:** "necesito un asesor", "hablar con humano", "gerente", etc.
- **Acción:** Bot pausa 30 min + notifica VENDOR_WHATSAPP con resumen
- **Resume:** Automático después de 30 min

---

## 🧠 LECCIONES TÉCNICAS CRÍTICAS

### Meta Cloud API
- **Button replies** (tipo "button") e **interactive** llegan con tipos especiales
- **Templates de Marketing** requieren método de pago en WABA
- **message_status: "accepted"** NO garantiza entrega — es asíncrono
- **Webhooks duplicados** — Meta puede enviar el mismo webhook 2 veces → usar recentlyConfirmed (15s)

### campaign_sessions (DB persistencia)
- **_campaignCatMap/_campaignProdMap** → ahora en PostgreSQL tabla `campaign_sessions`
- Sobreviven reinicios de Render Free tier
- Funciones: `_setCampCat`, `_getCampCat`, `_delCampCat`, `_setCampProd`, `_getCampProd`, `_delCampProd`
- Upsert en `campaign_sessions(phone PK, cat_data TEXT, prod_data TEXT)`

### parseItemsFromQuote (pedido.js)
- Campo correcto: `nombre` (NO `producto`) — dashboard busca `i.nombre`
- saveLastQuote guarda formato limpio: `"Nombre: qty × $precio = $total"`
- Este formato es parseado correctamente por el regex de parseItemsFromQuote

### Flujo campaña 3 pasos
- Si _campProdData es **Array** → cliente elige producto por número
- Si _campProdData es **Object** → cliente indica cantidad → cotiza
- NUNCA intentar capturar cantidad cuando hay múltiples productos (regex captura número del nombre)

### PowerShell
- **NUNCA** usar `node -e` con strings multi-línea, caracteres especiales o emojis
- **NUNCA** usar `&&` para encadenar comandos
- **SIEMPRE** un comando por línea

### Claude Code CLI
- Puede hacer git add + commit automáticamente — verificar con `git log --oneline -3`
- Herramienta correcta para todos los fixes en archivos con CRLF
- Acepta "Yes, allow all edits during this session"

### Dashboard HTML
- Emoji en HTML: usar entidad `&#x1F525;` (no `\uXXXX` que es escape JS)
- API devuelve array directo — NO `data.campanas` sino `data`
- Funciones JS standalone al final del HTML pueden sobreescribir — buscar duplicados

---

## 🐛 BUGS PENDIENTES — PRÓXIMA SESIÓN

| # | Severidad | Bug | Archivo |
|---|---|---|---|
| 1 | 🔴 | Error técnico en pickup auto-confirm — investigar logs Render | meta.js / pedido.js |
| 2 | 🟡 | Instagram — vincular cuenta nueva (esperar 24h desde creación) | meta.js |

---

## 🗺️ ROADMAP PRÓXIMAS SESIONES

| # | Prioridad | Tarea |
|---|---|---|
| 1 | 🔴 | Fix error técnico pickup — revisar logs Render |
| 2 | 🟡 | Instagram — vincular cuenta nueva |
| 3 | 🟡 | Campaña: opt-out STOP handler — marcar cliente como "no_campana" en DB |
| 4 | 🟡 | Perfil cliente: botones Editar / Deshabilitar / No campaña |
| 5 | 🟡 | MTQ Rutas — integración API planificación ruta para entregas a domicilio |
| 6 | 🟡 | Crear template específico con producto en oferta (ej: Acril Techo promo) |
| 7 | 🟢 | pgvector RAG (cuando catálogo > 500 productos) |
| 8 | 🟢 | Multi-tenant — preparar plataforma para 5 negocios (GrupoJoca primer candidato) |
| 9 | 🟢 | Uber Direct API — Scenario 4 entrega express |

---

## ✅ COMMITS SESIÓN 2026-04-07

| Commit | Fix/Feature |
|---|---|
| `76fffcf` | Bug #1: historial campañas — `data.campanas` → `data` array |
| `1981c6a` | Bug #2: emoji 🔥 dropdown — JS escape → HTML entity `&#x1F525;` |
| `ecec5f8` | Bug #3: saveLastQuote formato limpio parseable para pedido campaña |
| `5a2ecb8` | Bug #4: campaign sessions persistidas en PostgreSQL — sobreviven restart |
| `13b4790` | Feature: flujo campaña 3 pasos — productos numerados, Array vs Object |
| `7eee98e` | Fix: guard doble pedido en CONFIRMING — recentlyConfirmed 15s |
| `1b80205` | Refactor: 3 reglas confirmación — Pickup auto, Entrega dashboard, Fuera horario WA |
| `77ee6b0` | Fix: productos en mensaje confirmación pickup + dashboard; item.nombre en parseItems |

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

> "Eres mi Senior CTO y principal engineer para MaterialesPro GDL — bot de ventas WhatsApp con IA para negocio de materiales de construcción en Guadalajara, México. Adjunto CONTEXTO_MATERIALESPRO_2026-04-07.md con estado completo. Lee y confirma antes de continuar."
