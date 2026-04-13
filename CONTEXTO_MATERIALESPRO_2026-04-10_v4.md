# MaterialesPro GDL — Contexto Nuevo Chat
## Bot WhatsApp Enterprise v14 · Estado: PRODUCCIÓN ✅ LIVE
## Fecha: 2026-04-10 v4 (Modal edición producto + Estado columna + fix BOM + sync inventario)

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
7. Para fixes en archivos JS/HTML: SIEMPRE usar scripts Node.js descargables
8. Verificar siempre con `node --check` antes de hacer deploy
9. SIEMPRE usar regex para reemplazos en archivos con CRLF
10. NUNCA pegar múltiples comandos en un solo mensaje
11. **ANTES DE CUALQUIER COMMIT:** verificar módulos con node -e require
12. **REGLA #12:** verificar `git log --oneline -3` después de Claude Code
13. **REGLA #13:** NUNCA usar `node -e` con strings multi-línea en PowerShell
14. **REGLA #14:** SIEMPRE incluir path completo en todos los scripts y comandos PowerShell
15. **REGLA #15:** NUNCA usar `authMiddleware(['admin'])` en endpoints de acciones
16. **REGLA #16:** NUNCA agregar `express.json()` inline cuando ya existe global en server.js
17. **REGLA #17:** NUNCA pasar `whatsapp:+521...` en URL de PATCH/DELETE — usar ID numérico
18. **REGLA #18:** Para toggles críticos en dashboard usar `fetch()` directo, no helper `api()`
19. **REGLA #19:** Instagram DMs requieren App Review de Meta para producción
20. **REGLA #20:** 400 Bad Request con HTML = verificar: express.json() duplicado, URL chars especiales, rol JWT
21. **REGLA #21:** PowerShell `>` y `Set-Content` escriben BOM — SIEMPRE usar Node.js `fs.writeFileSync(path, content, { encoding: 'utf8' })` para escribir archivos HTML/JS. NUNCA usar PowerShell para escribir archivos de código.
22. **REGLA #22:** Import escribe catalogo.json Y DB — verificar ambos después de importar
23. **REGLA #23:** `initSchema()` en db.js es fuente única de verdad del schema
24. **REGLA #24:** Después de reset DB → git push del catalogo.json vacío para Render
25. **REGLA #25:** `syncFromCatalog()` al arrancar — JSON vacío = inventario vacío
26. **REGLA #26 — PROPAGACIÓN DE COLUMNAS:** Agregar columna en initSchema() → actualizar en cascada: buildCatalogText() → import Excel → export/plantilla → syncFromCatalog() → buildSystemPrompt()
27. **REGLA #27:** Cuando GET /api refactoriza campos retornados → actualizar TODAS las referencias en dashboard/index.html
28. **REGLA #28:** Import vía Dashboard en Render tiene timeout ~30s en Free tier — para catálogos >500 productos usar `import_local_directo.js` que conecta directo a Supabase
29. **REGLA #29:** Token Meta WhatsApp expira — usar System User `sikabot` en Meta Business Suite para generar token. Token personal (EAANM9...) no tiene permisos de Phone Number ID
30. **REGLA #30:** VARCHAR(10) en `codigo` no soporta códigos SIKA (11 chars) — schema usa VARCHAR(50)
31. **REGLA #31:** Render Free hace múltiples redeploys en misma sesión → agota conexiones Supabase → usar `Clear build cache & deploy` si deploy falla con internal error
32. **REGLA #32:** dashboard/index.html es HTML inline (no JS separado) → browser cachea agresivamente → Express debe servir con `Cache-Control: no-cache` para forzar reload del JS
33. **REGLA #33:** SIEMPRE testear en prod después de cada feature antes de agregar la siguiente — nunca acumular features sin verificar
34. **REGLA #34:** Patches a index.html via scripts Node.js — NUNCA Get-Content+Set-Content PowerShell (corrompe UTF-8). Después de escribir: verificar BOM con `node -e "var c=require('fs').readFileSync('dashboard/index.html');console.log('BOM:',c[0]===0xEF)"`
35. **REGLA #35:** PATCH /api/catalogo/:codigo debe actualizar AMBAS tablas: catalogo_productos Y inventario (nombre, categoria, marca, presentacion, unidad) — para que la vista del inventario refleje cambios inmediatamente

---

## 🔍 VERIFICACIÓN OBLIGATORIA ANTES DE COMMIT
```powershell
cd "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl"
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
Mensajería:  Meta Cloud API WhatsApp Business v22.0
Archivos:    Cloudinary (PDFs cotizaciones)
Deploy:      Render.com (Free tier — auto-deploy desde master)
Repo:        GitHub → https://github.com/todoia09-ctrl/materialespro-gdl-bot.git
OS Dev:      Windows 11 / PowerShell + Claude Code CLI v2.1.92
Keep-alive:  UptimeRobot → ping /ping cada 5 min (99.649% uptime)
```

---

## 📁 RUTA LOCAL DEL PROYECTO
```
C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl
```

---

## 📊 ESTADO ACTUAL — 2026-04-10 v4

### catalogo_productos ✅
- **804 productos** — CREST(56) + FESTER(215) + PEGADURO(171) + PERDURA(82) + SIKA(280)
- VARCHAR(50) en `codigo` — soporta códigos SIKA largos

### inventario ✅
- **804 productos sincronizados**
- Stock editable desde Dashboard → Inventario
- PATCH actualiza catalogo_productos + inventario simultáneamente

### Dashboard ✅ FUNCIONANDO COMPLETO
- Login/Auth JWT ✅
- Catálogo/Precios → 804 productos ✅
- Inventario → stock + modal edición completo ✅
- Modal edición producto:
  - Campos: nombre, marca, descripción, categoría (select dropdown), presentación, unidad
  - Precios: P1 NETO, lista, P2, P3, P4, descuento máximo
  - Inventario: stock actual, stock mínimo, cantidad mínima venta
  - Rendimiento: m² por unidad + nota
  - Toggle activo/inactivo
  - Guarda en catalogo_productos Y inventario ✅
- Columna Estado (● verde=activo, ● rojo=inactivo) en tabla inventario ✅
- no-cache headers en index.html ✅
- api() hardening contra 502/HTML responses → toast "Servidor despertando" ✅
- /api/resumen resiliente con safeQuery → no da 502 en cold start ✅

### Meta WhatsApp Token ✅
- System User `sikabot` (ID: 61574234962222) — token permanente

### DB usuarios ✅
- `admin@materialespro.com` (rol: admin)
- `todoia09@gmail.com` (rol: vendedor)

---

## ✅ COMMITS SESIÓN 2026-04-10 v4

| Commit | Descripción |
|---|---|
| `74e3b2e` | feat: modal edición producto inventario + PATCH /api/catalogo/:codigo |
| `ba6f5d7` | fix: api/resumen resiliente + hardening api() contra 502 HTML |
| `ac057d4` | fix: sintaxis botón editar inventario — comillas correctas |
| `ca6a85f` | feat: columna estado activo inventario + select categoría modal |
| `a91c252` | fix: PATCH catalogo sincroniza nombre/categoria/marca en inventario |

---

## 🐛 BUGS RESUELTOS SESIÓN 2026-04-10 v4

| Bug | Causa raíz | Fix |
|---|---|---|
| Login roto (doLogin not defined) | SyntaxError en línea 1255 por comillas mixtas en botón ✏️ | fix_btn_final.js corrige cadena exacta |
| Jeroglíficos en dashboard | `Set-Content -Encoding UTF8` en PowerShell escribe BOM → corrompe UTF-8 | `git checkout ac057d4 -- dashboard/index.html` + re-aplicar vía Node.js |
| Estado column no aparecía | `Get-Content` + `Set-Content` corrompe codificación | Reescribir patch 100% Node.js |
| Nombre no se actualizaba en inventario | PATCH solo actualizaba `catalogo_productos`, no `inventario.nombre` | fix_patch_catalogo_inv.js — sync ambas tablas |
| api() SyntaxError con 502 | `res.json()` explota con HTML response de Render | Hardening api() con content-type check |
| /api/resumen 502 en cold start | `Promise.all` fallaba si una query fallaba | `safeQuery()` wrapper con valores default |

---

## 🗺️ ROADMAP — PRÓXIMA SESIÓN

| # | Prioridad | Tarea |
|---|---|---|
| 1 | 🔴 | **Cargar stock real** en inventario desde Dashboard |
| 2 | 🔴 | **Prueba pedido real WhatsApp** con SIKA — verificar cálculo m², filtro marca, precio por nivel |
| 3 | 🟡 | **Fix bug pedido** — `132x 132 × Perdura...` (qty duplicada en items_json) |
| 4 | 🟡 | **Verificar flujo precio nivel** 1/2/3/4 con datos reales |
| 5 | 🟡 | **Laurent aceptar invitación** Evaluador Meta Developers |
| 6 | 🟡 | **Solicitar App Review Meta** (pages_messaging, instagram_manage_messages) |
| 7 | 🟢 | **Migración Railway o Render Starter** — post-testing |

---

## ⚠️ LECCIONES CRÍTICAS SESIÓN v4

### NUNCA usar PowerShell para escribir archivos HTML/JS
- `Set-Content -Encoding UTF8` agrega BOM → corrompe UTF-8 → jeroglíficos en todo el dashboard
- `Get-Content` puede cambiar line endings
- **Solución:** SIEMPRE Node.js: `fs.writeFileSync(path, content, { encoding: 'utf8' })`
- Verificar BOM después: `node -e "var c=require('fs').readFileSync('file');console.log('BOM:',c[0]===0xEF)"`

### Patch scripts con strings complejos
- Usar `lines.push()` array approach — nunca concatenación inline con escaping
- Probar el patch script con `node --check patch.js` antes de ejecutar
- Verificar resultado con `Select-String` antes de commit

### Flujo correcto: code → check → test prod → siguiente feature
- NUNCA acumular features sin verificar la anterior en producción
- Después de cada push → Ctrl+Shift+R → verificar login → verificar feature

---

## 📋 TABLA PROPAGACIÓN — Estado post-sesión v4

```
COLUMNA              | DB | IMPORT | EXPORT | GET/cat | INVENTARIO | BOT-TEXT | MODAL-EDIT
---------------------|----+--------+--------+---------+------------+----------+-----------
codigo               | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅ (readonly)
nombre               | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅ editable
descripcion          | ✅ | ✅     | ✅     | ✅      | -          | ❌       | ✅ editable
categoria            | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅ select
marca                | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅ editable
presentacion         | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅ editable
unidad               | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅ editable
precio_venta/2/3/4   | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅ editable
descuento_maximo     | ✅ | ✅     | ✅     | ✅      | -          | ✅       | ✅ editable
rendimiento_m2       | ✅ | ✅     | ✅     | ✅      | -          | ✅       | ✅ editable
rendimiento_nota     | ✅ | ✅     | ✅     | ✅      | -          | ✅       | ✅ editable
stock                | -  | -      | -      | -       | ✅         | -        | ✅ editable
stock_minimo         | -  | -      | -      | -       | ✅         | -        | ✅ editable
cantidad_minima      | ✅ | ✅     | ✅     | ✅      | -          | ✅       | ✅ editable
activo               | ✅ | ✅     | ✅     | ✅      | (filtro)   | ✅       | ✅ toggle
```

---

## 🌐 SERVICIOS EN PRODUCCIÓN

| Servicio | URL / Dato | Estado |
|---|---|---|
| Bot Render | https://materialespro-gdl-bot.onrender.com | ✅ Live |
| Dashboard | https://materialespro-gdl-bot.onrender.com/dashboard | ✅ |
| Webhook Meta | https://materialespro-gdl-bot.onrender.com/webhook/meta | ✅ |
| GitHub | https://github.com/todoia09-ctrl/materialespro-gdl-bot.git | ✅ |
| Supabase | Session pooler — fgwqrobyhwlmrelxecrc | ✅ RLS habilitado |
| UptimeRobot | Ping cada 5 min a /ping | ✅ 99.649% uptime |

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
| System User | `sikabot` (ID: 61574234962222) — token permanente |

---

## 📱 CANALES BOT

| Canal | Estado |
|---|---|
| WhatsApp | ✅ Producción — token permanente activo |
| Messenger Page 1 | ⏳ App Review pendiente |
| Messenger Page 2 | ❌ No conectado |
| Instagram DMs | ⏳ App Review pendiente |
| Instagram Page 2 | ✅ Conectada a `@sika_santa_anita` |

---

## 🛠️ SCRIPTS UTILITARIOS DISPONIBLES

| Script | Descripción |
|---|---|
| `import_local_directo.js` | Import Excel → DB + regenera catalogo.json (bypass Render timeout) |
| `fix_varchar_codigo.js` | Amplía VARCHAR en columnas DB (ya ejecutado) |
| `check_duplicados.js` | Verifica duplicados en catalogo_productos |
| `check_sika.js` | Verifica SIKA en JSON y DB |
| `check_inv_ids.js` | Verifica IDs inventario vs catálogo |
| `regenerar_catalogo_json.js` | Regenera catalogo.json desde DB |

---

## 🚀 DEPLOY — FLUJO GIT

```powershell
cd "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl"
node --check server.js
node --check dashboard/api.js
node -e "require('dotenv').config(); require('./meta'); require('./pedido'); require('./crm'); require('./cotizacion'); require('./tecnico'); require('./db'); require('./inventario'); require('./scheduler'); console.log('ALL OK');"
git add .
git commit -m "descripcion"
git push origin master
```

---

## 💬 CÓMO EMPEZAR EL NUEVO CHAT

> "Eres mi Senior CTO y principal engineer para MaterialesPro GDL. Adjunto CONTEXTO_MATERIALESPRO_2026-04-10_v4.md con estado completo. Lee y confirma antes de continuar."
