# MaterialesPro GDL — Contexto Nuevo Chat
## Bot WhatsApp Enterprise v14 · Estado: PRODUCCIÓN ✅ LIVE
## Fecha: 2026-04-08 (sesión completa v2)

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
                    + GET /clientes — SIN filtro activo=TRUE — muestra TODOS
                    + Soporta ?activo=true|false para filtrar opcionalmente
                    + PATCH /clientes/:id/nocampana — authMiddleware() sin rol
                    + PATCH /clientes/:id/deshabilitar — authMiddleware() sin rol
                    + DELETE /clientes/:id — authMiddleware() sin rol
                    + PATCH /clientes/:id — acepta nombre, rfc, email, credito_limite, zona, notas
                    + Todos usan ID numérico (no whatsapp string en URL)
  index.html      ← Dashboard web completo
                    + Clientes inactivos: opacity:.45 + fondo rojo tenue en tabla
                    + Botón "Habilitar" verde / "Deshabilitar" rojo — dinámico
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
| App Name | SIKA Santa Anita Bot |
| WABA ID | 3307053289456512 |
| Phone Number ID | 1042177225646433 |
| Número WA Bot | +52 1 33 3177 3189 |
| META_VERIFY_TOKEN | sika_verify_2026 |
| META_IG_USER_ID | 26833068533022552 ← ACTUALIZADO 2026-04-08 |
| VENDOR_WHATSAPP | +523313469831 |

---

## 📱 MAPA COMPLETO CUENTAS SOCIALES SIKA SANTA ANITA

### PAGE 1 — "Sika Santa Anita" (personal/creator)
| Dato | Valor |
|---|---|
| URL | facebook.com/sika.santa.anita.2025 |
| Tipo | Personal/Creator |
| Seguidores | 733 |
| Page ID | PENDIENTE OBTENER |
| Instagram vinculado | @sika_santa_anita (IG ID: 26833068533022552) |
| Messenger | ✅ Activo |
| Bot conectado | ✅ (META_PAGE_ACCESS_TOKEN rotado 2026-04-08) |

### PAGE 2 — "Sika Santa Anita Impermeabilizantes"
| Dato | Valor |
|---|---|
| URL | facebook.com/61579512339303 |
| Page ID | 61579512339303 |
| Tipo | Negocio formal |
| Seguidores | 37 |
| Dirección | Av. López Mateos Sur 6506-C, Los Gavilanes, Tlajomulco |
| Teléfono | 33 2655 2945 |
| Instagram vinculado | ❌ No tiene aún |
| Messenger | ✅ Activo (sin bot) |
| Bot conectado | ❌ Pendiente conectar |

### Instagram @sika_santa_anita
| Dato | Valor |
|---|---|
| Username | sika_santa_anita |
| IG User ID | 26833068533022552 |
| Posts | 30 |
| Seguidores | 31 |
| Bot autorizado | ✅ desde 7/4/2026 |
| Funcional en producción | ❌ Pendiente App Review |

---

## 📱 CANALES BOT — ESTADO ACTUAL

| Canal | Estado | Notas |
|---|---|---|
| WhatsApp | ✅ Producción | +52 1 33 3177 3189 |
| Messenger Page 1 | ⏳ App Review | pages_messaging pendiente |
| Messenger Page 2 | ❌ No conectado | Requiere token propio |
| Instagram DMs | ⏳ App Review | instagram_manage_messages pendiente |
| Instagram Comments | ⏳ App Review | instagram_manage_comments pendiente |

### App Review pendiente — permisos a solicitar:
- `pages_messaging`
- `instagram_manage_messages`
- `instagram_manage_comments`

### Testers registrados en app:
- Laurent Plusquellec — Evaluador (pendiente aceptar invitación)
- sika_santa_anita — Evaluador de Instagram
- ikanabeach — Evaluador de Instagram (pendiente)

---

## 🔒 SEGURIDAD SUPABASE — RESUELTO 2026-04-08
RLS habilitado en 11 tablas. Bot usa service_role key → bypassa RLS automáticamente.

---

## ✅ FIXES APLICADOS SESIÓN 2026-04-08

### Fix 1: Credenciales rotadas
- META_APP_SECRET → nuevo valor en Render ✅
- META_WHATSAPP_TOKEN → rotado desde WA Dev Console ✅
- META_IG_USER_ID → actualizado a `26833068533022552` ✅

### Fix 2: isQuoteResponse() más estricta (commit 2aa3dae)
Requiere precio + unidad + total simultáneos. Evita capturar respuestas conversacionales.

### Fix 3: Bug A — Clientes inactivos visibles (commit e09260e)
- `GET /api/clientes` ahora muestra TODOS (activos + inactivos)
- Clientes inactivos: opacity:.45 + fondo rojo tenue
- Botón dinámico: "Habilitar" verde / "Deshabilitar" rojo
- Bug B y C también resueltos como consecuencia

---

## 📊 COMMITS SESIÓN 2026-04-08

| Commit | Fix/Feature |
|---|---|
| `2aa3dae` | Fix: isQuoteResponse más estricta |
| `e09260e` | Fix Bug A/B/C: clientes inactivos visibles + indicadores visuales |

---

## 🗺️ ROADMAP PRÓXIMAS SESIONES

| # | Prioridad | Tarea |
|---|---|---|
| 1 | 🔴 | Obtener Page ID de Página 1 "Sika Santa Anita" |
| 2 | 🔴 | Solicitar App Review Meta (pages_messaging, instagram_manage_messages, instagram_manage_comments) |
| 3 | 🔴 | Laurent aceptar invitación de Evaluador en Meta Developers |
| 4 | 🟡 | Conectar Page 2 "Impermeabilizantes" al bot (token propio + meta.js multi-página) |
| 5 | 🟡 | Crear Instagram Business para Page 2 y vincularla |
| 6 | 🟡 | Implementar Hybrid Learning Architecture (learning.js) |
| 7 | 🟡 | Opt-out STOP handler en campañas |
| 8 | 🟡 | Cargar stock real en inventario |
| 9 | 🟡 | Token permanente (System User) para Meta API |
| 10 | 🟢 | Multi-tenant — 5 negocios en un servidor |
| 11 | 🟢 | MTQ Rutas — planificación entregas |
| 12 | 🟢 | Pricing 4 niveles en bot conversacional |

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

> "Eres mi Senior CTO y principal engineer para MaterialesPro GDL — bot de ventas WhatsApp con IA para negocio de materiales de construcción en Guadalajara, México. Adjunto CONTEXTO_MATERIALESPRO_2026-04-08_v2.md con estado completo. Lee y confirma antes de continuar."

Luego adjunta este archivo MD.
