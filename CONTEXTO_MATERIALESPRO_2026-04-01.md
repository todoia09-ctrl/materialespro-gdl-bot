# MaterialesPro GDL — Contexto Nuevo Chat
## Bot WhatsApp Enterprise v13 · Estado: PRODUCCIÓN ✅ LIVE TEST
## Fecha: 2026-04-01

---

## 🎭 ROL
Eres mi **Senior CTO y Principal Engineer** para MaterialesPro GDL — bot de ventas WhatsApp con IA para negocio de materiales de construcción en Zapopan/Guadalajara, México.

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
             Twilio Sandbox (legado — solo vendedor reply)
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
server.js         ← Core + webhook WhatsApp + buildSystemPrompt + getAIResponse
meta.js           ← v13: WhatsApp Cloud API + Messenger + Instagram + FB Comments
pedido.js         ← Flujo pedidos + guardarPedido + auto-confirm 2min
cotizacion.js     ← PDF + Cloudinary + isPDFRequest
crm.js            ← CRM + pricing 4 niveles + registrarContacto
tecnico.js        ← Preguntas técnicas
scheduler.js      ← Reportes automáticos
campanas.js       ← Campañas masivas
inventario.js     ← Sync catálogo → DB
db.js             ← Conexión PostgreSQL (Supabase) + logMensaje
catalogo.json     ← 273 productos SIKA (516 KB) — formato V2
plantilla_catalogo_v2.xlsx ← Template para agregar productos
dashboard/
  api.js          ← API REST dashboard
  index.html      ← Dashboard web
```

---

## 🗂️ EXPORTS POR MÓDULO (crítico para imports)
```javascript
db.js:         { initSchema, upsertCliente, getCliente, logMensaje }
crm.js:        { registrarContacto, actualizarZona, guardarCotizacion,
                 guardarPedido, actualizarEstadoPedido, programarSeguimiento,
                 logConversacion, getNivelPrecio, calcularPrecio, etiquetaNivel,
                 setNivelPrecio }
pedido.js:     { processOrderFlow, processVendorReply, isVendorNumber,
                 saveLastQuote, getLastQuote }
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
| Privacy | https://materialespro-gdl-bot.onrender.com/privacy | ✅ |
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
| App Status | **PUBLICADA** ✅ |
| WABA Suscrita | ✅ (POST subscribed_apps ejecutado) |

---

## 🔄 FLUJO DE MENSAJES WhatsApp Cloud API

```
Cliente WA → /webhook/meta → processMetaWebhook()
  → object === 'whatsapp_business_account'
  → entry.changes[].field === 'messages'
  → processWhatsAppMessage()
      → normalizarNumero(from)  // '5213...' → 'whatsapp:+5213...'
      → registrarContacto(fromNorm)  // crm.js
      → processOrderFlow(fromNorm, ...)  // pedido.js
      → guardarPedido(from, order, 'whatsapp')  // crm.js
      → auto-confirm 2min si no hay respuesta vendedor
```

---

## 💰 PRICING 4 NIVELES

| Nivel | Trigger | Descuento |
|---|---|---|
| 1 | Default | 0% |
| 2 | Compras > $10,000 | 5% |
| 3 | Compras > $30,000 | 10% |
| 4 | Manual | descuento_maximo del producto |

**System prompt incluye precios del nivel del cliente** ✅

---

## ⚠️ PROBLEMAS CONOCIDOS (para próxima sesión)

### CRÍTICO
- **`activeOrders` en memoria** — se pierde con cada restart de Render. Pedidos activos se pierden si hay deploy durante una conversación. **FIX:** Persistir en Supabase o Redis.

### MENOR
- **Total $0 en algunos pedidos** — cuando la cotización la hace Claude IA (no processOrderFlow), el total puede no extraerse bien del rawQuote
- **Dirección en un solo campo** — colonia, calle, refs van juntos en `street` en vez de campos separados
- **Fecha entrega sin parsear** — llega como texto libre

---

## 🗺️ ROADMAP POST LIVE-TEST

1. **Dashboard auto-refresh** (setInterval cada 30s)
2. **Persistir activeOrders en Supabase** — crítico para estabilidad
3. **Método de pago en Meta** — para superar 1,000 msgs/mes gratis
4. **Plantilla aprobada outbound** — para iniciar conversaciones
5. **Uber Direct API** — Escenario 4: envíos automáticos productos ligeros
6. **Cargar inventario real** — check de stock antes de confirmar
7. **Notificación vendedor en dashboard** — cuando sin stock
8. **Multi-tenant** — mismo servidor para 5 negocios
9. **Parser dirección/colonia separados**

---

## 🧠 LECCIONES TÉCNICAS CRÍTICAS

### Imports en Node.js
- SIEMPRE verificar `Object.keys(require('./modulo'))` antes de importar
- NUNCA asumir dónde está una función — verificar con grep o Select-String
- Verificación completa antes de commit (ver arriba)

### Patches en archivos con CRLF
- `server.js` y `pedido.js` tienen CRLF — patches con LF siempre fallan
- Preferir reescritura completa del archivo
- Si hay que parchear: dump con `JSON.stringify` del bloque exacto primero
- Regex `/funcion[\s\S]*?^}/m` NO funciona para cerrar funciones — usar indexOf + marcador único

### Regex en patches
- NUNCA usar regex literales `/pattern/` en strings de patches — se corrompen
- Usar `new RegExp('pattern', 'flags')` con strings correctamente escapadas

### Meta Cloud API
- Número llega como `5213313469831` → normalizar a `whatsapp:+5213313469831` para CRM
- `activeOrders` Map se borra con restart — no hacer deploys con pedidos activos
- WABA suscripción via API es OBLIGATORIA: `POST /v22.0/{WABA_ID}/subscribed_apps`

### Deploy
- Verificar módulos ANTES del commit
- `node --check archivo.js` SIEMPRE
- Si `node --check` falla después de commit: `git checkout COMMIT -- archivo.js` inmediatamente

---

## 📊 ESTADO BASE DE DATOS

| Tabla | Registros |
|---|---|
| pedidos | 3+ (PED-1775025764022 CONFIRMADO) |
| clientes | 1 (Laurent Plusquellec) |
| mensajes | 100+ |
| inventario | 283 (273 SIKA + 10 legacy) — stock = 0 |
| catalogo_productos | 273 |

---

## 🚀 DEPLOY — FLUJO GIT

```powershell
cd "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl"
node -e "require('dotenv').config(); require('./meta'); require('./pedido'); require('./crm'); require('./cotizacion'); require('./tecnico'); require('./db'); console.log('✅ OK');"
node --check server.js
node --check meta.js
git add .
git commit -m "descripcion"
git push origin master
```

---

## 💬 CÓMO EMPEZAR EL NUEVO CHAT

Pega este mensaje al inicio:

> "Eres mi Senior CTO y principal engineer para MaterialesPro GDL — bot de ventas WhatsApp con IA. Adjunto CONTEXTO_MATERIALESPRO_2026-04-01.md con estado completo. Lee y confirma antes de continuar."
