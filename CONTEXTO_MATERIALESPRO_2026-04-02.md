# MaterialesPro GDL — Contexto Nuevo Chat
## Bot WhatsApp Enterprise v13 · Estado: PRODUCCIÓN ✅ LIVE
## Fecha: 2026-04-02

---

## 🎭 ROL
Eres mi **Senior CTO y Principal Engineer** para MaterialesPro GDL — bot de ventas WhatsApp con IA para negocio de materiales de construcción en Guadalajara, México.
"Eres mi Senior CTO y principal engineer para MaterialesPro GDL — bot de ventas WhatsApp con IA para negocio de materiales de construcc ión, Product Architect, Mobile Systems Expert, Real-Time Operations Specialist, Technical Documentation Lead y Web/UI Design Expert. you are an expert AI systems architect, full-stack developer, and growth automation strategist.
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
11. **ANTES DE CUALQUIER COMMIT:** correr verificación de módulos (ver abajo)
12. **ANTES DE PARCHEAR:** hacer dump con JSON.stringify del bloque exacto
13. **REGLA #13 — ANTES DE CADA PATCH:** verificar qué otros archivos usan la función modificada

---

## 🔍 VERIFICACIÓN OBLIGATORIA ANTES DE COMMIT
```powershell
node -e "require('dotenv').config(); require('./meta'); require('./pedido'); require('./crm'); require('./cotizacion'); require('./tecnico'); require('./db'); require('./inventario'); require('./scheduler'); console.log('✅ TODOS LOS MODULOS OK');"
```

---

## 🏗️ STACK TÉCNICO
```
Runtime:     Node.js 24
Backend:     Express.js
DB:          PostgreSQL (Supabase)
IA:          Claude Haiku (claude-haiku-4-5-20251001)
Mensajería:  Meta Cloud API WhatsApp Business v22.0 (ACTIVO)
             Twilio: ELIMINADO — reemplazado por Meta WA
Archivos:    Cloudinary (PDFs cotizaciones)
Deploy:      Render.com (Free tier)
Repo:        GitHub → https://github.com/todoia09-ctrl/materialespro-gdl-bot.git
OS Dev:      Windows (PowerShell)
```

---

## 📁 RUTA LOCAL DEL PROYECTO
```
C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl
```

### Archivos principales:
```
server.js         ← Core + webhook + buildSystemPrompt + getAIResponse
meta.js           ← WhatsApp Cloud API + sendMetaWAMessage
pedido.js         ← State machine pedidos + activeOrders + vendorTokens
cotizacion.js     ← PDF + Cloudinary + isPDFRequest
crm.js            ← CRM + pricing 4 niveles + ZONAS + TARIFAS_ENVIO + calcularEnvio
tecnico.js        ← Preguntas técnicas
scheduler.js      ← Reportes automáticos
campanas.js       ← Campañas masivas
inventario.js     ← Sync catálogo → DB
db.js             ← PostgreSQL (Supabase) + active_orders CRUD
catalogo.json     ← 273 productos SIKA + negocio + tarifas_envio + envios
plantilla_catalogo_v2.xlsx ← Template para agregar productos
dashboard/
  api.js          ← API REST dashboard + GET/PUT /tarifas + WA al confirmar
  index.html      ← Dashboard web completo
```

---

## 🗂️ EXPORTS POR MÓDULO (crítico — verificar antes de importar)
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
| System User | sikabot (Admin) |
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
  → getAIResponse() → Claude Haiku general
```

---

## 💰 PRICING 4 NIVELES

| Nivel | Trigger | Descuento |
|---|---|---|
| 1 | Default | 0% |
| 2 | Compras > $10,000 | 5% |
| 3 | Compras > $30,000 | 10% |
| 4 | Manual | descuento_maximo del producto |

---

## 🚚 TARIFAS ENVÍO POR ZONA (editables en dashboard → Configuración)

| Zona | Municipios clave | Tarifa |
|---|---|---|
| norte | Zapopan, Colinas, Ciudad Granja | $150 |
| gdl | Guadalajara centro, Americana | $150 |
| sur | Tlaquepaque, Santa Anita | $180 |
| este | Tonalá, El Salto, Juanacatlán | $200 |
| sur_lejano | Tlajomulco, Cajititlán | $250 |
| default | ZMG / Otros | $250 |

Tarifas guardadas en `catalogo.json` → editables via dashboard → aplican inmediatamente.

---

## 📊 ESTADO BASE DE DATOS

| Tabla | Registros / Estado |
|---|---|
| pedidos | 15+ confirmados |
| clientes | 4+ (Laurent, Sika, Fester, ASIF) |
| mensajes | 200+ |
| inventario | 283 productos — stock = 0 (pendiente cargar real) |
| catalogo_productos | 273 SIKA |
| active_orders | ✅ Creada — persiste pedidos en progreso |
| usuarios | admin + Brandon Chavez (vendedor) |

---

## 🧠 LECCIONES TÉCNICAS CRÍTICAS (sesión 2026-04-01)

### Patches
- SIEMPRE hacer dump exacto con `JSON.stringify` antes de parchear
- crm.js tiene LF, server.js y pedido.js tienen CRLF — verificar siempre
- Patches de emojis Unicode: usar `\uXXXX` nunca pegar emoji directo
- Regla #13: verificar dependencias cruzadas antes de cada patch

### Meta Cloud API — Números México
- CRÍTICO: Meta envía números celular como `5213313469831` (+521...)
- VENDOR_WHATSAPP en .env tiene `+523313469831` (+52...)
- `isVendorNumber()` normaliza: `.replace('+521','+52')` — SIEMPRE necesario
- Webhook recibe `from` como `5213...` sin `whatsapp:+`

### activeOrders / vendorTokens
- `activeOrders` Map y `vendorTokens` Map se borran con cada restart de Render
- SOLUCIÓN: tabla `active_orders` en Supabase — persiste estado y tokens
- `initActiveOrders()` restaura ambos Maps al arrancar el servidor
- CRÍTICO: verificar que `initActiveOrders` está tanto EXPORTADO en pedido.js como IMPORTADO en server.js

### Deploy timing
- Si Render hace deploy mientras un pedido está en WAITING_VENDOR → token se pierde
- CON el fix: `initActiveOrders()` restaura el token desde DB en el nuevo proceso
- El vendedor puede responder SI/NO incluso después de un restart

### Dashboard confirmar → WA cliente
- PATCH /api/pedidos/:id/estado ahora envía WA al cliente al confirmar/cancelar
- Usa `getSendMeta()` lazy import para evitar dependencia circular con meta.js

### Dependencias circulares
- pedido.js → meta.js: usar lazy require DENTRO de la función, no en top-level
- api.js → meta.js: usar `getSendMeta()` lazy function

### CRLF en patches
- server.js y pedido.js tienen CRLF (`\r\n`)
- crm.js, db.js, dashboard/api.js tienen LF (`\n`)
- Siempre hacer dump con `JSON.stringify` para ver el formato exacto

---

## ⚠️ PROBLEMAS CONOCIDOS / PENDIENTES

### CRÍTICO
- **Stock real = 0** — todos los productos en inventario tienen stock=0
  FIX pendiente: cargar inventario real + check antes de confirmar

### MEDIO
- **Tiempo estimado entrega** no aparece en mensaje confirmación al cliente
- **Instagram / Facebook Messenger** — meta.js tiene base pero canales no activados
- **Campaña masiva outbound** — campanas.js existe, falta plantilla aprobada Meta

### MONETIZACIÓN
- **Método de pago Meta** — tier gratuito = 1,000 msgs/mes, agregar tarjeta
- **Plantilla outbound aprobada** — para iniciar conversaciones proactivas

### FUTURO (Fase 2)
- Uber Direct API — envíos automáticos productos ligeros
- Multi-tenant — 5 negocios en un servidor
- Cálculo envío por distancia GPS real
- App móvil vendedor

---

## 🗺️ ROADMAP PRIORIZADO

| # | Prioridad | Tarea |
|---|---|---|
| 1 | 🔴 | Stock real — cargar inventario + check antes de confirmar |
| 2 | 🔴 | Método de pago Meta (>1,000 msgs/mes) |
| 3 | 🔴 | Plantilla outbound aprobada Meta |
| 4 | 🟡 | Tiempo estimado entrega en confirmación |
| 5 | 🟡 | Notificación vendedor dashboard cuando sin stock |
| 6 | 🟡 | Instagram + Facebook Messenger activar |
| 7 | 🟡 | Campaña masiva outbound |
| 8 | 🟢 | Uber Direct API |
| 9 | 🟢 | Multi-tenant 5 negocios |
| 10 | 🟢 | Distancia GPS para tarifas |

---

## 📦 DASHBOARD — SECCIONES

| Sección | URL | Funcionalidad |
|---|---|---|
| Dashboard | /dashboard | KPIs hoy · auto-refresh 30s · timezone MX |
| Pedidos | /dashboard → Pedidos | Lista + detalle + confirmar/cancelar + envía WA |
| Clientes | /dashboard → Clientes | CRM 360° + historial + nivel precio |
| Inventario | /dashboard → Inventario | Sync catálogo + stock |
| Campañas | /dashboard → Campañas | Masivos WA |
| Catálogo | /dashboard → Catálogo | Upload XLSX + preview |
| Vendedores | /dashboard → Vendedores | CRUD vendedores + empresa/tel/rol/zona |
| Configuración | /dashboard → Configuración | Tarifas envío por zona editables |
| Reportes | /dashboard → Reportes | Ventas por período/zona/producto |

---

## 🚀 DEPLOY — FLUJO GIT

```powershell
cd "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl"
node -e "require('dotenv').config(); require('./meta'); require('./pedido'); require('./crm'); require('./cotizacion'); require('./tecnico'); require('./db'); require('./inventario'); require('./scheduler'); console.log('✅ TODOS LOS MODULOS OK');"
node --check server.js
node --check meta.js
git add .
git commit -m "descripcion"
git push origin master
```

---

## 💬 CÓMO EMPEZAR EL NUEVO CHAT

Pega este mensaje al inicio:

> "Eres mi Senior CTO y principal engineer para MaterialesPro GDL — bot de ventas WhatsApp con IA para negocio de materiales de construcc ión, Product Architect, Mobile Systems Expert, Real-Time Operations Specialist, Technical Documentation Lead y Web/UI Design Expert. you are an expert AI systems architect, full-stack developer, and growth automation strategist.— bot de ventas WhatsApp con IA. Adjunto CONTEXTO_MATERIALESPRO_2026-04-02.md con estado completo. Lee y confirma antes de continuar."
