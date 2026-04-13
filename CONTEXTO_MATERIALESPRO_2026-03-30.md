# MaterialesPro — Contexto Nuevo Chat
## Plataforma Multi-Tenant WhatsApp IA · v10 → v11
## Fecha: 2026-03-30

---

## 🎭 ROL
Eres mi **Senior CTO y Principal Engineer** para una plataforma SaaS de bots de ventas WhatsApp con IA, diseñada para múltiples negocios de materiales de construcción en Guadalajara, México.

---

## 📋 REGLAS DE TRABAJO
1. Solo trabajar en lo solicitado
2. Output listo para implementar — código production-ready
3. Siempre rutas completas en PowerShell
4. Un comando a la vez — esperar resultado
5. NUNCA usar `&&` en PowerShell
6. Preferir reescritura completa de archivos sobre inyección parcial

---

## 🏗️ STACK TÉCNICO
```
Runtime:     Node.js 24
Backend:     Express.js
DB:          PostgreSQL (Supabase)
IA:          Claude Haiku (Anthropic)
Mensajería:  Meta Cloud API (migración desde Twilio — pendiente)
Archivos:    Cloudinary (PDFs cotizaciones)
Deploy:      Render.com (Starter $7 USD/mes — upgrade pendiente)
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
server.js       ← Core del bot + webhook WhatsApp
pedido.js       ← Flujo de pedidos y confirmación vendor
cotizacion.js   ← Generación PDF + Cloudinary
crm.js          ← Registro contactos, seguimientos
tecnico.js      ← Preguntas técnicas de productos
scheduler.js    ← Reportes automáticos, alertas stock
campanas.js     ← Campañas masivas WhatsApp
inventario.js   ← Sync catálogo → DB
db.js           ← Conexión PostgreSQL (Supabase)
catalogo.json   ← Catálogo de productos (10 productos demo)
dashboard/
  api.js        ← API REST del dashboard
  index.html    ← Dashboard web
```

---

## 🌐 SERVICIOS EN PRODUCCIÓN

| Servicio | URL / Dato | Estado |
|---|---|---|
| Bot Render | https://materialespro-gdl-bot.onrender.com | ✅ Live |
| Dashboard | https://materialespro-gdl-bot.onrender.com/dashboard | ✅ |
| Webhook | https://materialespro-gdl-bot.onrender.com/webhook/whatsapp | ✅ |
| GitHub repo | https://github.com/todoia09-ctrl/materialespro-gdl-bot.git | ✅ |
| Supabase DB | Session pooler configurado | ✅ |
| Cloudinary | PDFs cotizaciones | ✅ |
| Twilio Sandbox | Límite 5 msg/día — MIGRAR a Meta Cloud API | ⚠️ |

---

## ✅ LOGROS 2026-03-29

1. ✅ Encoding UTF-8 corregido — archivos restaurados desde ZIP original v10
2. ✅ Deploy limpio en Render confirmado (200 OK en / y /webhook/whatsapp)
3. ✅ Diagnóstico: bot silencioso por límite Twilio Sandbox (5 msg/día agotados)
4. ✅ Definición arquitectura multi-tenant para 5 negocios
5. ✅ Decisión: migrar de Twilio a Meta Cloud API directo

---

## 🏢 LOS 5 NEGOCIOS (MULTI-TENANT)

| # | Negocio | Giro | Número WhatsApp |
|---|---|---|---|
| 1 | MaterialesPro GDL | Materiales construcción general | Por confirmar |
| 2 | SIKA Santa Anita | Adhesivos, impermeabilizantes SIKA | Por confirmar |
| 3 | FESTER Santa Anita | Impermeabilizantes, selladores FESTER | Por confirmar |
| 4 | IMPAC Santa Anita | Impermeabilizantes IMPAC | Por confirmar |
| 5 | Adhesivos y Texturizados Perdura | Adhesivos, texturizados | Por confirmar |

> **Nota:** En el futuro serán más de 5 negocios — arquitectura diseñada para escalar a N sin límite.

---

## 🏗️ ARQUITECTURA MULTI-TENANT (v11 — por construir)

```
┌─────────────────────────────────────────┐
│         UN SOLO SERVIDOR Render         │
│              $7 USD/mes                 │
├──────────────┬──────────────────────────┤
│  Bot 1       │  MaterialesPro GDL       │
│  Bot 2       │  SIKA Santa Anita        │
│  Bot 3       │  FESTER Santa Anita      │
│  Bot 4       │  IMPAC Santa Anita       │
│  Bot 5       │  Adhesivos y Tex Perdura │
└──────────────┴──────────────────────────┘
  Cada bot: número WhatsApp propio +
  catálogo propio + IA propia + dashboard
```

**Costo total estimado:**
- Render Starter: $7 USD/mes
- Meta Cloud API x5: ~$0 (1,000 conversaciones gratis/número/mes)
- Supabase: $0 (Free tier)
- **Total: ~$7 USD/mes para los 5 negocios**

---

## ⏭️ AGENDA MAÑANA (en orden de prioridad)

### 1. Migrar Twilio → Meta Cloud API (Negocio 1: MaterialesPro GDL)
- Verificar número Telcel dedicado (¿sigue activo?)
- Crear app en Meta for Developers
- Configurar WhatsApp Business API
- Actualizar `.env` con nuevas credenciales
- Actualizar webhook en server.js
- Test end-to-end con encoding correcto

### 2. Diseñar arquitectura multi-tenant v11
- Un server.js que enrute por número de destino
- Un catálogo JSON por negocio
- Un tenant config por negocio (nombre, tono IA, productos)
- Dashboard multi-tenant con selector de negocio

### 3. Definir catálogos reales
- Productos reales de cada negocio
- Precios actuales
- Fichas técnicas

---

## ⚠️ BUGS PENDIENTES

| Problema | Causa | Fix pendiente |
|---|---|---|
| Dashboard sin datos | Mensajes no se guardan en DB (error silencioso) | Revisar logs [DB ERR] en Render |
| Cold start 50s | Render Free duerme tras 15min | Upgrade a Starter $7/mes |
| Catálogo demo | Solo 10 productos de ejemplo | Actualizar con productos reales |
| Twilio Sandbox | Límite 5 msg/día | Migrar a Meta Cloud API |

---

## 🚀 DEPLOY — FLUJO GIT

```powershell
cd "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl"
git add .
git commit -m "descripcion del cambio"
git push origin master
# Render hace deploy automático en ~2 minutos
```

---

## 💬 CÓMO EMPEZAR EL NUEVO CHAT

Pega este mensaje al inicio:

> "Eres mi Senior CTO y principal engineer para una plataforma multi-tenant de bots de ventas WhatsApp con IA para 5 negocios de construcción en GDL. Adjunto CONTEXTO_MATERIALESPRO_2026-03-30.md con estado completo. Lee y confirma antes de continuar."

Luego adjunta este archivo MD.

---

## 📚 LECCIONES TÉCNICAS DEL DÍA

1. **Encoding UTF-8** — NO editar archivos JS en Windows sin configurar VS Code a UTF-8 explícito. Configurar: `"files.encoding": "utf8"` en settings.json de VS Code
2. **Twilio Sandbox** — límite de 5 mensajes salientes por día, no apto para producción
3. **ZIP como backup limpio** — el ZIP original del proyecto es la fuente de verdad para restaurar encoding
4. **7-Zip** — usar siempre 7-Zip para extraer ZIPs con UTF-8 en Windows, nunca el explorador nativo
5. **Meta Cloud API** — opción más económica para producción: 1,000 conversaciones gratis/mes por número
6. **Multi-tenant desde el inicio** — diseñar para N negocios desde el principio evita refactoring costoso
