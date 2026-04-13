# MaterialesPro GDL — Contexto Nuevo Chat
## Bot WhatsApp Enterprise v14 · Estado: PRODUCCIÓN ✅ LIVE
## Fecha: 2026-04-09 (sesión catálogo PEGADURO)

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
14. **REGLA #14:** SIEMPRE incluir path completo en todos los scripts y comandos PowerShell
15. **REGLA #15:** NUNCA usar `authMiddleware(['admin'])` en endpoints de acciones — usar `authMiddleware()` sin rol
16. **REGLA #16:** NUNCA agregar `express.json()` inline cuando ya existe global en server.js
17. **REGLA #17:** NUNCA pasar `whatsapp:+521...` en URL de PATCH/DELETE — usar ID numérico siempre
18. **REGLA #18:** Para toggles críticos en dashboard usar `fetch()` directo, no la función helper `api()`
19. **REGLA #19:** Instagram DMs requieren App Review de Meta para producción
20. **REGLA #20:** 400 Bad Request con HTML = verificar: express.json() duplicado, URL con chars especiales, rol JWT incorrecto
21. **REGLA #21 — NUEVA:** PowerShell operador `>` escribe con BOM (UTF-16) — SIEMPRE usar `[System.IO.File]::WriteAllLines(..., [System.Text.UTF8Encoding]::new($false))` para escribir JSON
22. **REGLA #22 — NUEVA:** El import de catálogo vía Excel SOBREESCRIBE `catalogo.json` en producción — NUNCA importar sin backup previo o verificar que SIKA sigue presente

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

---

## 📊 ESTADO ACTUAL CATÁLOGO Y DB — 2026-04-09

### catalogo.json (bot IA)
- **273 productos SIKA** — restaurado ✅ (commit bec14d8)
- PEGADURO **NO está** en catalogo.json — pendiente agregar

### DB catalogo_productos
- **273 SIKA** (con precios, destacados, ofertas) ✅
- **199 PEGADURO** (PROD-001→PROD-199, con precios correctos) ✅
- IDs PEGADURO en DB: `PROD-001` a `PROD-199`

### DB inventario
- **273 SIKA** con marca + categoría + precio ✅ (Sync catálogo corrido)
- **PEGADURO ausente** del inventario — pendiente fix

### Columnas que espera el import de Excel (POST /api/catalogo/importar):
```
Artículo          ← nombre del producto
Código CRM        ← ID único
Categoría         ← categoría
Marca             ← marca
Se vende por      ← unidad/presentación
Precio 1 NETO     ← precio público
Precio 2 NETO     ← nivel 2
Precio 3 NETO     ← nivel 3
Precio 4 NETO     ← nivel 4
Costo NETO        ← costo
descripcion       ← descripción
rendimiento_m2_por_unidad  ← número
rendimiento_nota  ← texto
Activo            ← "Verdadero" (no TRUE)
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
| META_IG_USER_ID | 26833068533022552 |
| VENDOR_WHATSAPP | +523313469831 |

---

## 📱 CANALES BOT — ESTADO ACTUAL

| Canal | Estado |
|---|---|
| WhatsApp | ✅ Producción |
| Messenger Page 1 | ⏳ App Review pendiente |
| Messenger Page 2 | ❌ No conectado |
| Instagram DMs | ⏳ App Review pendiente |

---

## ✅ COMMITS SESIÓN 2026-04-09

| Commit | Descripción |
|---|---|
| `af331ab` | restore: catalogo.json 273 productos SIKA (fallido — BOM) |
| `bec14d8` | fix: catalogo.json sin BOM — UTF8 limpio ✅ |

---

## 🐛 BUGS ENCONTRADOS Y RESUELTOS HOY

### Bug 1 — Import Excel sobreescribe catalogo.json ⚠️ CRÍTICO
- **Causa:** `POST /api/catalogo/importar` escribe en `catalogo.json` del servidor
- **Síntoma:** SIKA desapareció del bot, inventario mostró solo PEGADURO
- **Fix aplicado:** Restaurar desde git + `[System.IO.File]::WriteAllLines` sin BOM
- **Prevención futura:** Siempre verificar `total_productos` antes de importar

### Bug 2 — PowerShell `>` escribe BOM
- **Causa:** Operador `>` de PowerShell usa UTF-16 con BOM
- **Síntoma:** `SyntaxError: Unexpected token '﻿'` en Node.js
- **Fix:** Usar `[System.IO.File]::WriteAllLines(..., [UTF8Encoding]::new($false))`

### Bug 3 — Inventario sin marca/categoría/precio para productos DB
- **Causa:** `GET /api/catalogo` solo lee `catalogo.json`, no DB `catalogo_productos`
- **Síntoma:** PEGADURO y "Acril Techo" muestran `–` en inventario
- **Fix pendiente:** Modificar `/api/catalogo` para leer DB + JSON

---

## 🗺️ ROADMAP — PENDIENTES PRÓXIMA SESIÓN

| # | Prioridad | Tarea |
|---|---|---|
| 1 | 🔴 | Agregar PEGADURO a `catalogo.json` → bot los conoce por WhatsApp |
| 2 | 🔴 | Fix `/api/catalogo` para incluir productos de DB → PEGADURO visible en inventario |
| 3 | 🔴 | Laurent aceptar invitación Evaluador en Meta Developers |
| 4 | 🔴 | Solicitar App Review Meta (pages_messaging, instagram_manage_messages, instagram_manage_comments) |
| 5 | 🟡 | Conectar Page 2 "Impermeabilizantes" al bot |
| 6 | 🟡 | Sync PEGADURO al inventario (después del fix #2) |
| 7 | 🟡 | Token permanente (System User) para Meta API |
| 8 | 🟡 | Cargar stock real en inventario |
| 9 | 🟢 | Multi-tenant — 5 negocios en un servidor |

---

## 🧠 LECCIONES APRENDIDAS SESIÓN 2026-04-09

### Import de Excel → catalogo.json
- El sistema importa Excel a DOS lugares: `catalogo_productos` (DB) Y `catalogo.json` (archivo)
- Si el Excel solo tiene PEGADURO → `catalogo.json` queda con solo PEGADURO → bot pierde SIKA
- **Solución futura:** Separar el import: DB ← todos los productos, catalogo.json ← SIKA original protegido

### Columnas del sistema vs. columnas estándar
- El sistema espera `Artículo` no `nombre`, `Precio 1 NETO` no `precio_venta`, etc.
- Siempre verificar con `Select-String -Pattern "getVal"` en api.js antes de generar Excel

### Diagnóstico del inventario
- Inventario se enriquece en el **frontend** via `_invCatalog` que viene de `/api/catalogo`
- `/api/catalogo` solo lee `catalogo.json` — no la DB
- Por eso productos importados vía Excel (que van a DB) no muestran marca/precio en inventario

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

### ⚠️ Para escribir archivos JSON en PowerShell SIN BOM:
```powershell
$content = Get-Content "archivo.json" -Raw
[System.IO.File]::WriteAllText((Resolve-Path "archivo.json"), $content, [System.Text.UTF8Encoding]::new($false))
```

---

## 💬 CÓMO EMPEZAR EL NUEVO CHAT

> "Eres mi Senior CTO y principal engineer para MaterialesPro GDL. Adjunto CONTEXTO_MATERIALESPRO_2026-04-09.md con estado completo. Lee y confirma antes de continuar."
