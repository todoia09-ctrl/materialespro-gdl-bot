# MaterialesPro GDL — Contexto Nuevo Chat
## Bot WhatsApp Enterprise v14 · Estado: PRODUCCIÓN ✅ LIVE
## Fecha: 2026-04-08 (sesión completa)

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
7. Para fixes en archivos JS: SIEMPRE usar scripts .js descargables
8. Verificar siempre con `node --check` antes de hacer deploy
9. SIEMPRE usar regex para reemplazos en archivos con CRLF
10. NUNCA pegar múltiples comandos en un solo mensaje
11. **ANTES DE CUALQUIER COMMIT:** verificar módulos con node -e require
12. **REGLA #12:** verificar `git log --oneline -3` después de Claude Code
13. **REGLA #13:** NUNCA usar `node -e` con strings multi-línea en PowerShell
14. **REGLA #14:** Claude Code es herramienta preferida para fixes en archivos CRLF
15. **REGLA #15:** NUNCA usar `authMiddleware(['admin'])` en endpoints de acciones — usar `authMiddleware()` sin rol
16. **REGLA #16:** NUNCA agregar `express.json()` inline cuando ya existe global en server.js
17. **REGLA #17:** NUNCA pasar `whatsapp:+521...` en URL de PATCH/DELETE — usar ID numérico siempre
18. **REGLA #18:** Para toggles críticos en dashboard usar `fetch()` directo, no la función helper `api()`
19. **REGLA #19:** Instagram DMs requieren App Review de Meta para producción
20. **REGLA #20:** 400 Bad Request con HTML = verificar: express.json() duplicado, URL con chars especiales, rol JWT incorrecto

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

### Archivos principales:
```
server.js         ← Core + webhook + buildSystemPrompt + getAIResponse
                    + isQuoteResponse() — v14: más estricta (requiere $+unidad+total)
                    + NUNCA captura respuestas conversacionales como cotización
meta.js           ← WhatsApp Cloud API + Instagram/Messenger DMs
                    + sendDM usa pageToken + META_IG_USER_ID endpoint
pedido.js         ← State machine pedidos
                    + REGLA 1: Pickup → existing.state (NO data.state)
                    + REGLA 2: Entrega horario → dashboard
                    + REGLA 3: Fuera horario → WA vendor
cotizacion.js     ← PDF + Cloudinary
crm.js            ← CRM + pricing 4 niveles + zonas + tarifas
tecnico.js        ← Preguntas técnicas
scheduler.js      ← Reportes automáticos
campanas.js       ← Campañas masivas Meta WA
                    + getClientesSegmento filtra no_campana=FALSE en todos los queries
inventario.js     ← Sync catálogo → DB
db.js             ← PostgreSQL + campaign_sessions
dashboard/
  api.js          ← API REST dashboard
                    + PATCH /clientes/:id/nocampana — authMiddleware() sin rol
                    + PATCH /clientes/:id/deshabilitar — authMiddleware() sin rol
                    + DELETE /clientes/:id — authMiddleware() sin rol
                    + PATCH /clientes/:id — acepta nombre, rfc, email, credito_limite, zona, notas
                    + Todos usan ID numérico (no whatsapp string en URL)
  index.html      ← Dashboard web completo
                    + toggleNoCampana() — fetch directo (NO api() helper)
                    + toggleActivo() — fetch directo (NO api() helper)
                    + guardarEdicionCliente() — form inline completo
                    + window._clienteId almacenado en verCliente()
                    + Iconos ✅/🚫 en tabla CRM
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
| META_IG_USER_ID | 17841453216925916 |
| VENDOR_WHATSAPP | +523313469831 |

---

## ⚠️ CREDENCIALES COMPROMETIDAS — ROTAR URGENTE

| Credencial | Acción |
|---|---|
| App Secret Meta (929049326656512) | Rotar en Meta Developers → Configuración → Básica |
| META_PAGE_ACCESS_TOKEN | Rotar en Render → Environment |
| META_IG_ACCESS_TOKEN | Rotar en Render → Environment |

---

## 📱 CANALES ACTIVOS

| Canal | Estado | Notas |
|---|---|---|
| WhatsApp | ✅ Producción | +52 1 33 3177 3189 |
| Messenger | ✅ Configurado | pageToken funciona |
| Instagram | ⏳ App Review pendiente | instagram_manage_messages requiere revisión Meta |

---

## 🗂️ TABLA clientes — ESTRUCTURA DB

```sql
id, whatsapp, nombre, canal, zona, rfc, email,
credito_limite, notas, primer_contacto, ultimo_contacto,
total_compras, num_pedidos, activo, nivel_precio,
descuento_p2, descuento_p3, no_campana (BOOLEAN, DEFAULT FALSE)
```

---

## 🔒 SEGURIDAD SUPABASE — RESUELTO HOY 2026-04-08

**Problema:** Supabase detectó 12 errores críticos de seguridad — todas las tablas sin RLS.
**Fix aplicado:** RLS habilitado en las 11 tablas via SQL Editor.

```sql
-- Aplicado exitosamente:
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seguimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_orders ENABLE ROW LEVEL SECURITY;
```

**IMPORTANTE:** El bot usa `service_role` key → bypassa RLS automáticamente → bot funciona sin cambios.

---

## ✅ FIXES APLICADOS HOY 2026-04-08

### Fix: isQuoteResponse() más estricta (commit 2aa3dae)
**Problema:** Bot capturaba respuestas conversacionales como cotización.
Ej: "¿Es para una cotización, consulta o pedido?" → se guardaba como lastQuote → resumen de pedido mostraba texto de saludo en lugar del producto.

**Fix:** `isQuoteResponse()` ahora requiere las 3 condiciones simultáneas:
1. `tienePrecio` — regex `\$[\d,]+` presente
2. `tieneUnidad` — bolsa/cubeta/rollo/litro/pieza/pza/costal/ml/kg/u presente
3. `tieneTotal` — "total", "subtotal", " = $" o "x $" presente
4. `esPregunta` — excluye frases "es para una cotización", "necesitas una cotización"

**Resultado:** Flujo de pedido con cliente ASIF funcionó perfectamente post-fix.
- Producto correcto: `5x SikaTop-122 (A+B) Unidad (30 Kg) — $1,692/u`
- Fecha correcta: `Miércoles 8 de abril a las 2PM`
- Confirmación limpia ✅

---

## 🔴 BUGS CRÍTICOS PENDIENTES

### Bug A — Cliente deshabilitado desaparece de la lista (ALTA PRIORIDAD)
**Problema:** `GET /api/clientes` filtra `WHERE activo=TRUE` → cliente deshabilitado no aparece → no se puede reactivar desde dashboard.
**Fix necesario:**
- Modificar query para incluir todos los clientes con indicador visual activo/inactivo
- O agregar filtro en dashboard para mostrar inactivos
- Botón "Habilitar" debe ser accesible siempre

### Bug B — Historial pedidos al deshabilitar cliente
**Problema:** Pedidos del cliente deshabilitado pueden mostrar $0 o desaparecer.
**Fix:** Verificar que query de pedidos no hace JOIN con `clientes WHERE activo=TRUE`

### Bug C — No campaña sin indicador visual en tiempo real
**Problema:** Ícono 🚫 aparece pero no siempre se actualiza visualmente al hacer toggle.

### Credenciales comprometidas (URGENTE)
App Secret Meta + META_PAGE_ACCESS_TOKEN + META_IG_ACCESS_TOKEN → rotar antes del próximo deploy

---

## ✅ FUNCIONALIDADES OPERATIVAS

| Feature | Estado |
|---|---|
| Bot WhatsApp ventas | ✅ |
| isQuoteResponse estricta | ✅ Fix v14 2026-04-08 |
| Pickup auto-confirm (REGLA 1) | ✅ Fix: existing.state no data.state |
| Entrega dashboard (REGLA 2) | ✅ |
| Fuera horario vendor WA (REGLA 3) | ✅ |
| Campañas masivas con filtro no_campana | ✅ |
| Dashboard — No Campaña toggle | ✅ |
| Dashboard — Deshabilitar cliente | ✅ (Bug A: desaparece de lista) |
| Dashboard — Editar datos inline | ✅ |
| Dashboard — Iconos estado en CRM | ✅ |
| Dashboard — Eliminar cliente | ✅ |
| campaign_sessions en DB | ✅ |
| Supabase RLS | ✅ Habilitado 2026-04-08 |

---

## ⚙️ LÓGICA CONFIRMACIÓN PEDIDOS (3 REGLAS)

```
REGLA 1 — Pickup:
  → existing.state = S.CONFIRMED (NO data.state — BUG CRÍTICO RESUELTO)
  → Auto-confirma + reduce stock + envía confirmación cliente

REGLA 2 — Entrega en horario:
  → Guarda como pendiente → vendedor confirma desde dashboard

REGLA 3 — Fuera de horario:
  → WA al vendedor con token SI/NO
```

---

## 🧠 PRÓXIMA INICIATIVA — HYBRID LEARNING ARCHITECTURE

**Contexto:** Se generó documento `MATERIALESPRO_ARCHITECTURE_ANALYSIS.md` con análisis completo del sistema para diseñar una arquitectura de aprendizaje híbrido.

**Objetivo:** Hacer que el bot mejore con cada conversación sin reentrenamiento.

**Gaps identificados para resolver:**
1. Sin memoria entre sesiones (history es in-memory Map)
2. Prompt estático — mismo catalog dump cada mensaje
3. Sin personalización por cliente en el tiempo
4. `isBuyIntent()` binario — sin confidence score
5. Sin feedback loop de ventas exitosas/fallidas
6. Sin biblioteca de objeciones estructurada
7. `parseItemsFromQuote()` basado en regex — frágil

**Propuesta arquitectura a implementar:**
- `learning.js` — nuevo módulo de aprendizaje
- `buildSystemPrompt()` dinámico con RAG-style catalog retrieval
- Per-client preference persistence en DB
- Conversion tracking signal en CONFIRMED/CANCELLED states
- Intent confidence scoring

**Status:** Documento enviado a AI para análisis → pendiente recibir diseño → implementar en próxima sesión.

---

## 📊 COMMITS SESIÓN 2026-04-08

| Commit | Fix/Feature |
|---|---|
| `2aa3dae` | Fix: isQuoteResponse más estricta — evita capturar respuestas conversacionales |

---

## 🗺️ ROADMAP PRÓXIMAS SESIONES

| # | Prioridad | Tarea |
|---|---|---|
| 1 | 🔴 | Rotar credenciales comprometidas (App Secret, tokens Meta) |
| 2 | 🔴 | Fix Bug A: cliente deshabilitado reactivable desde dashboard |
| 3 | 🔴 | Fix Bug B: historial pedidos cliente deshabilitado |
| 4 | 🟡 | Implementar Hybrid Learning Architecture (learning.js) |
| 5 | 🟡 | Instagram App Review — solicitar acceso avanzado |
| 6 | 🟡 | Opt-out STOP handler en campañas |
| 7 | 🟡 | Cargar stock real en inventario |
| 8 | 🟡 | UX mejora: toggle switches para no_campana y activo |
| 9 | 🟢 | Multi-tenant — 5 negocios en un servidor |
| 10 | 🟢 | MTQ Rutas — planificación entregas |
| 11 | 🟢 | Pricing 4 niveles en bot conversacional |

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

> "Eres mi Senior CTO y principal engineer para MaterialesPro GDL — bot de ventas WhatsApp con IA para negocio de materiales de construcción en Guadalajara, México. Adjunto CONTEXTO_MATERIALESPRO_2026-04-08.md con estado completo. Lee y confirma antes de continuar."

Luego adjunta este archivo MD.
