# MaterialesPro GDL — Contexto Nuevo Chat
## Bot WhatsApp Enterprise v14 · Estado: PRODUCCIÓN ✅ LIVE
## Fecha: 2026-04-07 (sesión completa)

---

## 🎭 ROL
Eres mi **Senior CTO y Principal Engineer** para MaterialesPro GDL — bot de ventas WhatsApp con IA para negocio de materiales de construcción en Guadalajara, México. Eres Product Architect, Mobile Systems Expert, Real-Time Operations Specialist, Technical Documentation Lead y Web/UI Design Expert.

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
                    + Intercept campaña "Sí, me interesa" (Twilio path - línea ~526)
meta.js           ← WhatsApp Cloud API + sendMetaWAMessage + processMetaWebhook
                    + deduplicación de mensajes (_processedMsgIds Map con TTL 1hr)
                    + handoff check en processWhatsAppMessage
                    + _campaignCatMap — estado selección categoría campaña
                    + _campaignProdMap — estado selección producto campaña
                    + Intercept "Sí, me interesa" (Meta path — línea ~192)
                    + Intercept categoría numérica (2a — línea ~219)
                    + Intercept cantidad producto (2-pre — línea ~194)
                    + button/interactive message handling
pedido.js         ← State machine pedidos + activeOrders + vendorTokens
                    + parseItemsFromQuote() — parsea items desde rawQuote de Claude
                    + parseHoraMsg() — extrae hora de texto del cliente
                    + validación horarios: Dom cerrado, Sáb 8am-2pm, LV 8am-6pm
                    + guard doble confirmación en startVendorTimer (recentlyConfirmed check)
                    + Fecha dinámica: hoy/mañana/día-semana → fecha real México City TZ
                    + Confirmación si fecha es próxima semana
cotizacion.js     ← PDF + Cloudinary + isPDFRequest
crm.js            ← CRM + pricing 4 niveles + ZONAS + TARIFAS_ENVIO + calcularEnvio
tecnico.js        ← Preguntas técnicas
scheduler.js      ← Reportes automáticos
campanas.js       ← Campañas masivas Meta WA
                    + TEMPLATES: materialespro_promo (APROBADO ✅)
                    + Usa META_WHATSAPP_TOKEN (NO META_WA_TOKEN)
inventario.js     ← Sync catálogo → DB + verificarStock + reducirStock
db.js             ← PostgreSQL (Supabase) + active_orders CRUD
                    + active_orders tabla creada en initSchema()
catalogo.json     ← 273 productos SIKA + negocio + tarifas_envio
importar-catalogo.js ← Upsert productos → catalogo_productos (protege campos comerciales)
dashboard/
  api.js          ← API REST dashboard
                    + PATCH /api/catalogo/:codigo/comercial (destacado/oferta)
                    + GET /api/catalogo/comercial
                    + POST /api/campanas + POST /api/campanas/:id/enviar (2 pasos)
                    + template_name en POST /api/campanas
  index.html      ← Dashboard web completo (9 secciones)
                    + Inventario con filtros avanzados + filtro Comercial (Destacado/Oferta/Más Vendido)
                    + Catálogo con tabs ancla: [📋 Precios] [⭐ Destacados y Ofertas]
                    + Campañas: selector plantilla aprobada + Preview funcional (POST)
                    + Botón 💾 por fila en sección Destacados/Ofertas
```

---

## 🆕 CLAUDE CODE CLI — CONFIGURADO
Claude Code v2.1.92 instalado. Usar para fixes quirúrgicos.

**CRÍTICO:** Claude Code puede hacer git add + commit automáticamente. Siempre verificar con `git log --oneline -3` después de usarlo.

**Regla:** fixes en server.js, pedido.js, meta.js → Claude Code directo.

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
      → [2-pre] _campaignProdMap → cotiza cantidad
      → [2a] _campaignCatMap → muestra productos de categoría
      → [2b] "Sí, me interesa" → muestra ofertas por categoría
      → processOrderFlow() → state machine
      → getTechnicalInfo() → preguntas técnicas
      → getAIResponse() → Claude Haiku con buildSystemPrompt()
```

---

## 🎯 FLUJO CAMPAÑA COMPLETO

```
1. Admin → Dashboard → Campañas → selecciona template materialespro_promo
2. Bot envía: "Hola {nombre}, tenemos promoción especial..."
3. Cliente toca "Sí, me interesa"
4. Bot muestra: categorías con productos en oferta numeradas
5. Cliente responde número (ej: "2")
6. Bot muestra: productos de esa categoría con precio oferta vs regular
7. Cliente responde cantidad (ej: "6")
8. Bot cotiza: "¡Perfecto! 6 x SikaTop-121 a $1,500 = $9,000 ¿Hacemos el pedido?"
   + saveLastQuote() guarda la cotización
9. Cliente dice "Sí"
10. Bot entra al flujo normal: entrega/recoger → fecha → pago → factura → confirmación
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
| Sin hora | Pregunta: "¿A qué hora planeas pasar?" |

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
- Texto correcto: "Lun–Vie 8am–6pm · Sáb 8am–2pm"

---

## 📊 CATÁLOGO — ESTADO ACTUAL

```
Total productos:     273 (todos activos)
Categorías:          35
En oferta activa:    5 productos
Tokens system prompt: ~5,794
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
| materialespro_promo | ✅ Activa calidad pendiente | Marketing | {{1}} = nombre |
| hello_world | ✅ Activa | Utilidad | — |

**Texto materialespro_promo:**
"Hola {nombre}, tenemos una promoción especial en materiales de construcción esta semana. ¿Te interesa recibir más información? Somos tu distribuidora de confianza en Guadalajara. [emoji construcción] Responde STOP para no recibir más mensajes"

**CRÍTICO:** Meta requiere método de pago activo para entregar templates de Marketing. ✅ Mastercard configurada.

---

## 🤝 HAND-OFF A ASESOR HUMANO
- **18 triggers:** "necesito un asesor", "hablar con humano", "gerente", etc.
- **Acción:** Bot pausa 30 min + notifica VENDOR_WHATSAPP con resumen
- **Resume:** Automático después de 30 min

---

## 🧠 LECCIONES TÉCNICAS CRÍTICAS

### Meta Cloud API
- **Page Access Token ≠ token para WhatsApp Cloud API** — pero funciona para mensajes normales. Para templates de Marketing, Meta requiere método de pago activo, no necesariamente System User Token.
- **message_status: "accepted"** NO garantiza entrega — es solo confirmación de recepción. La entrega real es asíncrona.
- **Templates de Marketing** requieren método de pago en WABA para ser entregados, aunque API devuelva 200 OK.
- **Button replies** (tipo "button") e **interactive** llegan con tipos especiales — deben agregarse al array de tipos permitidos en meta.js.
- **Webhooks Messenger** requieren suscripción via POST /v22.0/{WABA_ID}/subscribed_apps — NO configurable via UI.

### PowerShell
- **NUNCA** usar `node -e` con strings multi-línea, caracteres especiales (acentos, emojis) o comillas anidadas — siempre crear script .js descargable.
- **NUNCA** usar `&&` para encadenar comandos.
- **SIEMPRE** un comando por línea.

### Claude Code CLI
- Puede hacer git add + commit automáticamente — siempre verificar con `git log --oneline -3`
- Es la herramienta correcta para todos los fixes en archivos con CRLF
- Acepta "Yes, allow all edits during this session" para no confirmar cada cambio

### Dashboard
- **Campañas:** POST /api/campanas solo CREA — POST /api/campanas/:id/enviar ENVÍA. Son 2 endpoints separados.
- **template_name** debe fluir: HTML form → api.js req.body → campanas.crearCampana() 5to argumento
- **Preview campañas** usa POST /api/campanas/preview (no GET)
- Scripts standalone al final del HTML pueden sobreescribir funciones — buscar duplicados antes de agregar

### Flujo campaña
- Intercept "Sí, me interesa" DEBE estar en meta.js (Meta path), NO solo en server.js (Twilio path)
- _campaignCatMap y _campaignProdMap son Maps module-level — se pierden en restart de Render (Free tier)
- saveLastQuote() DEBE llamarse después de cotizar en flujo campaña para que processOrderFlow() reciba los productos

### DB / Supabase
- active_orders tabla DEBE existir en initSchema() — si no, saveActiveOrder() falla silenciosamente
- registrarContacto() .catch(() => null) silencioso era root cause de pedidos sin guardar
- Siempre agregar logging antes de corregir errores silenciosos

---

## 🐛 BUGS PENDIENTES — PRÓXIMA SESIÓN

| # | Severidad | Bug | Archivo |
|---|---|---|---|
| 1 | 🔴 | Historial campañas en dashboard no muestra campañas enviadas | dashboard/index.html + api.js |
| 2 | 🟡 | Emoji 🔥 en dropdown template muestra como \uD83D\uDD25 | dashboard/index.html |
| 3 | 🟡 | Resumen pedido desde campaña: "Cotización del chat" en lugar de productos reales | pedido.js |
| 4 | 🟡 | _campaignCatMap/_campaignProdMap se pierden en restart Render (Free tier) | meta.js |

---

## 🗺️ ROADMAP PRÓXIMAS SESIONES

| # | Prioridad | Tarea |
|---|---|---|
| 1 | 🔴 | Fix historial campañas en dashboard |
| 2 | 🔴 | Fix resumen pedido desde campaña (productos reales) |
| 3 | 🟡 | Instagram — vincular cuenta nueva (esperar 24h desde creación) |
| 4 | 🟡 | Crear template específico con producto en oferta (ej: Acril Techo promo) |
| 5 | 🟡 | Perfil cliente: botones Editar / Deshabilitar / Eliminar / No campaña |
| 6 | 🟡 | Campaña: opt-out STOP handler — marcar cliente como "no_campana" en DB |
| 7 | 🟡 | Mapa de sinónimos: expandir con términos del cliente real |
| 8 | 🟢 | pgvector RAG (cuando catálogo > 500 productos) |
| 9 | 🟢 | Multi-tenant — preparar plataforma para 5 negocios |
| 10 | 🟢 | Uber Direct API — Scenario 4 entrega express |

---

## ✅ COMMITS SESIÓN 2026-04-06 al 2026-04-07

| Commit | Fix/Feature |
|---|---|
| `c6fccf0` `97dab34` | Bug #1: precio_oferta se guarda con botón 💾 por fila |
| `3244dc7` | Bot cotiza precio_oferta cuando hay oferta activa |
| `3ac14a2` | Bug #2: tabs ancla scroll suave en Catálogo |
| `49860c7` | Bug #3: filtros Destacado/Oferta/Más Vendido en Inventario |
| `9458943` | Mapa 18 sinónimos en buildSystemPrompt |
| `980df35` | Fix DB: active_orders schema + silent catches + auto-confirm |
| `2d76c65` | Fix horario recoger: pedir hora si dice solo "hoy" |
| `0bc77ab` `b0b1860` | Campañas: template selector + fix previewCamp + /enviar |
| `d5be4d8` | Fix campanas: META_WA_TOKEN → META_WHATSAPP_TOKEN |
| `b0030af` | Debug logging Meta API campañas |
| `54aff4f` | Fix: bot responde button/interactive reply de template |
| `1309c41` `f77bd93` | Feature: "Sí, me interesa" muestra ofertas por categoría |
| `f405417` | Feature: selección categoría → productos en oferta |
| `bd1fee3` `b5ba9c2` | Feature: cantidad → cotización + saveLastQuote |
| `6506d84` | Fix Bug#3: horario correcto en todos los mensajes |
| `89760da` | Fix Bug#5: fecha dinámica México City TZ |

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
