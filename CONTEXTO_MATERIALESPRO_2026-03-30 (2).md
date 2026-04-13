# MaterialesPro GDL — Contexto Nuevo Chat
## Bot WhatsApp Enterprise v10 · Estado: PRODUCCIÓN ✅
## Fecha: 2026-03-30

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
6. Preferir reescritura completa de archivos sobre inyección parcial
7. Para reemplazos en archivos JS: SIEMPRE usar scripts .js descargables, nunca node -e con caracteres especiales
8. Verificar siempre con `node --check` antes de hacer deploy

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
catalogo.json   ← 273 productos SIKA (516 KB) ← ACTUALIZADO HOY
importar-catalogo.js ← Script importador Excel → JSON + Supabase
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

## ✅ LOGROS HOY (2026-03-30)

1. ✅ Template Excel TEMPLATE_IA.xlsx analizado (284 filas, 273 productos activos SIKA)
2. ✅ Script importar-catalogo.js creado y ejecutado
3. ✅ 273 productos SIKA importados a Supabase (tabla catalogo_productos)
4. ✅ catalogo.json regenerado (516 KB) con estructura nueva: meta/productos/por_categoria/indice
5. ✅ dashboard/api.js — endpoint GET /api/catalogo normalizado para nuevo formato
6. ✅ server.js — buildCatalogText compatible con nuevo formato (precio_venta, unidad)
7. ✅ server.js — loadCatalog con shim negocio/envios para compatibilidad
8. ✅ server.js — shim gdl_zapopan/zmg/gratis_desde completo
9. ✅ inventario.js — syncFromCatalog usa p.codigo || p.id
10. ✅ Dashboard catálogo muestra 273 productos SIKA
11. ✅ Inventario sincronizado en DB (273 productos, stock=0)
12. ✅ Bot WhatsApp respondiendo correctamente
13. ✅ Flujo de pedido activo (bot pregunta entrega/domicilio)

---

## ⚠️ ESTRUCTURA NUEVA DEL catalogo.json

El catálogo ahora usa esta estructura (diferente al formato legacy):
```json
{
  "meta": {
    "total_productos": 273,
    "categorias": 35,
    "marcas": ["SIKA"],
    "moneda": "MXN",
    "generado": "...",
    "version": "V2"
  },
  "productos": [...],
  "por_categoria": {...},
  "indice": {...}
}
```

Campos de cada producto:
- `codigo` (no `id`) — SKU
- `precio_venta` (no `precio`) — Precio Ajustado con IVA redondeado
- `unidad` (no `presentacion`) — kg o lt
- `costo_neto` (no `costo`)
- `descuento_maximo` (no `descuento`)

**Shim en loadCatalog de server.js** — agrega `negocio`, `envios`, `descuentos_volumen` si no existen para compatibilidad con código legacy.

---

## 🐛 BUGS CONOCIDOS / PENDIENTES

| Problema | Causa | Fix pendiente |
|---|---|---|
| Cold start 50s | Render Free duerme tras 15min | Keep-alive ping / Upgrade $7/mes |
| Dashboard pedidos sin datos | Mensajes no se guardan en DB | Revisar logs [DB ERR] |
| Dashboard inventario vacío en UI | Bug en frontend al leer endpoint | Pendiente revisar |
| Twilio Sandbox | Límite ~5 msgs/día, caducidad 72h | Necesita número WhatsApp Business real |
| Productos legacy ADH/TEX/MOR/IMP en inventario | Del catálogo demo anterior | Limpiar tabla inventario o ignorar |

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

## 🔧 LECCIONES TÉCNICAS APRENDIDAS HOY

1. **PowerShell y caracteres especiales** — `!` en node -e falla en PowerShell. Siempre usar archivos .js descargables para reemplazos complejos
2. **LF vs CRLF** — server.js usa CRLF en Render pero LF localmente. Los reemplazos con `\r\n` son necesarios a veces
3. **catalogo.json formato nuevo** — estructura completamente diferente al legacy. El shim en loadCatalog es la solución elegante
4. **Render Free filesystem** — catalogo.json persiste en deploy SOLO si está en el repo GitHub. La DB es la fuente permanente
5. **node --check** — siempre verificar sintaxis antes de hacer push
6. **Scripts fix-serverN.js** — cuando un reemplazo falla, crear script .js descargable es más confiable que node -e
7. **Twilio Sandbox** — límite de mensajes, usar API directamente para verificar funcionalidad

---

## ⏭️ PRÓXIMOS PASOS (en orden de prioridad)

1. **Verificar flujo pedido completo** — mandar mensaje y confirmar que pedido se guarda en DB/dashboard
2. **Keep-alive ping** — configurar UptimeRobot o cron para evitar cold start
3. **Dashboard pedidos** — investigar por qué no aparecen datos
4. **WhatsApp Business real** — salir del sandbox Twilio
5. **Pricing 4 niveles** — implementar Precio 1-4 por tipo de cliente
6. **Multi-tenant** — preparar para 5 negocios en un servidor

---

## 💬 CÓMO EMPEZAR EL NUEVO CHAT

Pega este mensaje al inicio:

> "Eres mi Senior CTO y principal engineer para MaterialesPro GDL — bot de ventas WhatsApp con IA para negocio de materiales de construcción. Adjunto CONTEXTO_MATERIALESPRO_2026-03-30.md con estado completo del sistema. Lee y confirma antes de continuar."

Luego adjunta este archivo MD.
