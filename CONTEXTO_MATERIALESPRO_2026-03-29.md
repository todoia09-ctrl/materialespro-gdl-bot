# MaterialesPro GDL — Contexto Nuevo Chat
## Bot WhatsApp Enterprise v10 · Estado: PRODUCCIÓN ✅
## Fecha: 2026-03-29

---

## 🎭 ROL
Eres mi **Senior CTO y Principal Engineer** para MaterialesPro GDL — bot de ventas WhatsApp con IA para negocio de materiales de construcción en Zapopan/Guadalajara, México.

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
Mensajería:  Twilio WhatsApp Sandbox
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
| Webhook Twilio | https://materialespro-gdl-bot.onrender.com/webhook/whatsapp | ✅ |
| GitHub repo | https://github.com/todoia09-ctrl/materialespro-gdl-bot.git | ✅ |
| Supabase DB | Session pooler configurado | ✅ |
| Cloudinary | PDFs cotizaciones | ✅ |
| Twilio Sandbox | +1 415 523 8886 / join community-organization | ✅ |

---

## 🔑 CREDENCIALES

| Servicio | Usuario | Password |
|---|---|---|
| Dashboard | admin@materialespro.com | Admin2024! |
| Supabase | (ver .env) | — |
| Render | cuenta con email/pwd | — |
| GitHub | todoia09-ctrl | — |
| ngrok | cuenta registrada | authtoken configurado |

---

## ✅ LOGROS DE HOY (2026-03-29)

1. ✅ Bot respondiendo en WhatsApp correctamente
2. ✅ Cotizaciones calculadas por IA (130m² azulejo → 39 bolsas, $9,150 con envío)
3. ✅ Audio transcripción funcionando (notas de voz)
4. ✅ Dashboard web con login JWT operativo
5. ✅ Usuario admin creado en Supabase (script crear-admin.js)
6. ✅ ngrok instalado y configurado (v3.37.3, authtoken guardado)
7. ✅ GitHub repo creado y código subido
8. ✅ Deploy en Render.com exitoso (Free tier)
9. ✅ Webhook Twilio apuntando a Render (permanente, sin ngrok)
10. ✅ Encoding UTF-8 parcialmente corregido (LANG/LC_ALL en Render env vars)

---

## ⚠️ BUGS CONOCIDOS / PENDIENTES

| Problema | Causa | Fix pendiente |
|---|---|---|
| Cold start 50s | Render Free duerme tras 15min inactividad | Upgrade Starter $7/mes o keep-alive ping |
| Dashboard sin datos | Mensajes no se guardan en DB (error silencioso) | Revisar logs [DB ERR] en Render |
| Encoding parcial | Algunos mensajes aún muestran caracteres rotos | Variables LANG/LC_ALL agregadas, pendiente verificar |
| Catálogo demo | Solo tiene 10 productos de ejemplo | Actualizar catalogo.json con productos reales |
| Twilio Sandbox | Caducidad 72h, solo números registrados | Necesita número WhatsApp Business real |

---

## 🚀 DEPLOY — FLUJO GIT

```powershell
# Hacer cambios locales, luego:
cd "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl"
git add .
git commit -m "descripcion del cambio"
git push origin master
# Render hace deploy automático en ~2 minutos
```

---

## ⏭️ PRÓXIMOS PASOS (en orden de prioridad)

1. **Verificar encoding** — mandar mensaje y confirmar emojis/acentos correctos
2. **Arreglar dashboard sin datos** — revisar logs DB en Render cuando llegan mensajes
3. **Actualizar catalogo.json** — agregar productos reales con precios de MaterialesPro
4. **Keep-alive ping** — evitar cold start en Render Free (cron job externo)
5. **WhatsApp Business real** — salir del sandbox Twilio para clientes reales
6. **Meta/Facebook/Instagram** — integración diferida (semana 2)

---

## 💬 CÓMO EMPEZAR EL NUEVO CHAT

Pega este mensaje al inicio:

> "Eres mi Senior CTO y principal engineer para MaterialesPro GDL — bot de ventas WhatsApp con IA para negocio de materiales de construcción. Adjunto CONTEXTO_MATERIALESPRO_2026-03-29.md con estado completo del sistema. Lee y confirma antes de continuar."

Luego adjunta este archivo MD.

---

## 📚 SELF-LEARNING DEL DÍA

### Lecciones técnicas aprendidas:
1. **Webhook Twilio** — ruta correcta es `/webhook/whatsapp` no `/whatsapp`
2. **ngrok v3.3.1** obsoleto — requiere cuenta y actualización a v3.37.3+
3. **PowerShell** — no soporta `node -e` con comillas anidadas complejas → usar archivo .js
4. **Render Free** — duerme tras 15min, primer mensaje puede perderse (cold start ~50s)
5. **Encoding UTF-8** — `process.env.LANG` en código no es suficiente en Render → configurar en Environment Variables del dashboard
6. **Railway Free** — límite de proyectos, requiere upgrade para nuevos proyectos
7. **Git en PowerShell** — autenticación via Git Credential Manager con browser OAuth funciona bien
8. **Supabase Session Pooler** — usar puerto 5543 con SSL, no puerto 5432 directo
9. **Render vs Railway** — Render Free acepta nuevos servicios sin límite de proyectos
10. **catalogo.json** — es el "cerebro" del bot, debe actualizarse con productos reales
