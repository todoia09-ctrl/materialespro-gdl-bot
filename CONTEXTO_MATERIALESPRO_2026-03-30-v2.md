# MaterialesPro — Contexto Nuevo Chat
## Plataforma Multi-Tenant WhatsApp IA · v10 → v11
## Fecha: 2026-03-30 (actualizado noche)

---

## 🎭 ROL
Eres mi **Senior CTO y Principal Engineer** para una plataforma SaaS de bots de ventas WhatsApp con IA, diseñada para múltiples negocios de materiales de construcción en Guadalajara, México.

---

## 📋 REGLAS DE TRABAJO
1. Solo trabajar en lo solicitado — no saltar adelante
2. Output listo para implementar — código production-ready
3. Siempre rutas completas en PowerShell
4. Un comando a la vez — esperar resultado antes del siguiente
5. NUNCA usar `&&` en PowerShell
6. Preferir reescritura completa de archivos sobre inyección parcial
7. Respetar el ritmo del usuario — paso a paso

---

## 🏗️ STACK TÉCNICO
```
Runtime:     Node.js 24
Backend:     Express.js
DB:          PostgreSQL (Supabase) — SSL habilitado ✅
IA:          Claude Haiku (Anthropic)
Mensajería:  Twilio Sandbox → MIGRAR a Meta Cloud API
Archivos:    Cloudinary (PDFs cotizaciones)
Deploy:      Render.com (Free tier)
Repo:        GitHub → https://github.com/todoia09-ctrl/materialespro-gdl-bot.git
OS Dev:      Windows (PowerShell)
Keep-alive:  UptimeRobot → ping cada 5 min ✅
```

---

## 📁 RUTA LOCAL DEL PROYECTO
```
C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl
```

---

## 🌐 SERVICIOS EN PRODUCCIÓN

| Servicio | URL | Estado |
|---|---|---|
| Bot Render | https://materialespro-gdl-bot.onrender.com | ✅ Live |
| Dashboard | https://materialespro-gdl-bot.onrender.com/dashboard | ✅ |
| Ping keep-alive | https://materialespro-gdl-bot.onrender.com/ping | ✅ |
| UptimeRobot | Ping cada 5 min | ✅ |
| Supabase DB | SSL habilitado | ✅ |
| Twilio Sandbox | Límite 5 msg/día — MIGRAR | ⚠️ |

---

## 🔑 CREDENCIALES

| Servicio | Usuario | Password |
|---|---|---|
| Dashboard | admin@materialespro.com | Admin2024! |
| GitHub | todoia09-ctrl | — |

---

## 🏢 LOS 5 NEGOCIOS

| # | Negocio |
|---|---|
| 1 | MaterialesPro GDL |
| 2 | SIKA Santa Anita |
| 3 | FESTER Santa Anita |
| 4 | IMPAC Santa Anita |
| 5 | Adhesivos y Texturizados Perdura |

---

## 📦 ESTRUCTURA DE PRECIOS (diseñada, pendiente implementar)

El Excel CRM tiene 4 precios por producto:
- Precio 1 = Público general
- Precio 2 = Cliente frecuente
- Precio 3 = Contratista / Constructor
- Precio 4 = Mayoreo / Distribuidor

Descuentos automáticos por volumen:
- Por monto total del pedido
- Por kg del mismo producto

---

## ✅ LOGROS ACUMULADOS

1. ✅ Encoding UTF-8 corregido
2. ✅ SSL Supabase — DB guardando datos
3. ✅ Endpoint /ping + UptimeRobot
4. ✅ express.json límite 10mb
5. ✅ Sección Catálogo en dashboard
6. ✅ Importador Excel con formato CRM propio
7. ✅ 1,448 productos reales importados

---

## ⚠️ BUGS PENDIENTES

| Problema | Prioridad |
|---|---|
| Twilio Sandbox — migrar a Meta Cloud API | 🔴 Alta |
| catalogo.json volátil en Render — mover a Supabase DB | 🔴 Alta |
| Render Free cold start — upgrade $7/mes | 🟡 Media |

> ⚠️ **CRÍTICO:** `catalogo.json` se resetea con cada deploy en Render Free. Los 1,448 productos se pierden. Hay que mover el catálogo a Supabase como primera tarea del día.

---

## ⏭️ AGENDA (en orden de prioridad)

1. **Mover catálogo a Supabase DB** — evitar pérdida de datos en redeploy
2. **Verificar encoding WhatsApp** — reset Twilio a las 12am UTC
3. **Migrar a Meta Cloud API** — número Telcel dedicado
4. **Sistema 4 precios por cliente** — DB + bot + dashboard
5. **Arquitectura multi-tenant** — 5 negocios en 1 servidor

---

## 🚀 DEPLOY

```powershell
cd "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl"
git add .
git commit -m "descripcion"
git push origin master
```

---

## 💬 INICIO DEL NUEVO CHAT

> "Eres mi Senior CTO y principal engineer para una plataforma multi-tenant de bots de ventas WhatsApp con IA para 5 negocios de construcción en GDL. Adjunto CONTEXTO_MATERIALESPRO_2026-03-30-v2.md con estado completo. Lee y confirma antes de continuar."
