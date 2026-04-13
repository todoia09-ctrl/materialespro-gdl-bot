# MaterialesPro GDL — Contexto Nuevo Chat
## Bot WhatsApp Enterprise v14 · Estado: PRODUCCIÓN ✅ LIVE
## Fecha: 2026-04-10 v3 (804 productos todas las marcas + bot ciego fix + stock dashboard)

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
7. Para fixes en archivos JS/HTML: SIEMPRE usar Claude Code CLI
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
21. **REGLA #21:** PowerShell `>` escribe BOM — SIEMPRE usar `WriteAllText` con `UTF8Encoding($false)`
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
             ⚠️ Planificado: migrar a Railway o Render Starter post-testing
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

## 📊 ESTADO ACTUAL — 2026-04-10 v3

### catalogo_productos ✅
- **804 productos** — CREST(56) + FESTER(215) + PEGADURO(171) + PERDURA(82) + SIKA(280)
- Import via `import_local_directo.js` — bypass Render timeout
- VARCHAR(50) en `codigo` — soporta códigos SIKA largos (SIKA-XXXXXX)

### catalogo.json ✅
- **804 productos** · 1.5 MB · regenerado desde DB
- Estructura: `{ meta, productos[], por_categoria{}, indice{} }`
- Commit: `7bee094`

### inventario ✅
- **804 productos sincronizados** desde catálogo
- Stock en 0 por defecto — cargar stock real desde Dashboard → Inventario → 💾
- Guardado de stock funciona (PATCH correcto, no-cache headers)

### buildCatalogText() ✅ ACTUALIZADO
- Formato nuevo: `Nombre · MARCA $precio/Presentacion [categoria] | Rinde Xm² (nota) | mín: Y unidades`
- `precioNivel()` usa precio_2/3/4 reales del producto (no solo cálculo por %)
- `buildSystemPrompt()` incluye: filtro por marca, cálculo m², mapeo nivel→precio

### Dashboard ✅ FUNCIONANDO
- Catálogo/Precios → 804 productos ✅
- Inventario → stock se guarda correctamente (PATCH) ✅
- no-cache headers en index.html → browser siempre carga JS fresco ✅
- ⚠️ `api/resumen` da 502 intermitente en cold start — no crítico

### Meta WhatsApp Token ✅
- System User `sikabot` (ID: 61574234962222) — token permanente (nunca expira)
- Permisos: `whatsapp_business_management` + `whatsapp_business_messaging`
- Token renovado: 2026-04-10

### DB usuarios ✅
- `admin@materialespro.com` (rol: admin)
- `todoia09@gmail.com` (rol: vendedor)

---

## ✅ COMMITS SESIÓN 2026-04-10

| Commit | Descripción |
|---|---|
| `9bd7b60` | fix: catalogo dashboard — p.id→p.codigo, p.precio→p.precio_venta |
| `9e7543d` | fix: inventario dashboard — p.id→p.producto_id, cat.precio→cat.precio_venta |
| `fb45a47` | fix: import filtra filas template — skip → y VERDE |
| `7bee094` | fix: import MASTER 802 productos + ampliar VARCHAR codigo a 50 |
| `acd0080` | fix: initSchema codigo VARCHAR(20) → VARCHAR(50) + ALTERs inventario |
| `9350985` | fix: buildCatalogText marca+rendimiento+precios nivel, buildSystemPrompt calculos m2 |
| `75ce846` | fix: saveStock PUT → PATCH en inventario dashboard |
| `275c7fd` | fix: no-cache headers para dashboard index.html — fuerza reload JS |

---

## 🐛 BUGS RESUELTOS SESIÓN 2026-04-10

| Bug | Causa raíz | Fix |
|---|---|---|
| SIKA no aparecía en DB | Import vía Dashboard timeout en Render Free (502) | `import_local_directo.js` local directo a Supabase |
| SIKA falla con `value too long VARCHAR(10)` | Códigos SIKA tienen 11 chars (`SIKA-XXXXXX`) | `fix_varchar_codigo.js` + initSchema VARCHAR(50) |
| Bot no filtraba por marca | `buildCatalogText()` no incluía `marca` en texto | Fix commit `9350985` |
| Bot no calculaba m² | `buildSystemPrompt()` sin instrucción de rendimiento | Fix commit `9350985` |
| Precios nivel 2/3/4 incorrectos | `precioNivel()` calculaba por % en vez de usar precio_X directo | Fix commit `9350985` |
| Stock no se guardaba en dashboard | Frontend usaba `PUT` pero endpoint era `PATCH` | Fix commit `75ce846` |
| Browser cacheaba JS viejo (PUT persistía) | Express sin `Cache-Control: no-cache` en index.html | Fix commit `275c7fd` |
| Token Meta expirado (401) | Token temporal de usuario personal expira cada 24h | System User `sikabot` token permanente |
| Meta webhook 403/400 | Suscripción `messages` eliminada accidentalmente | Re-suscribir en Meta Developers |

---

## 🗺️ ROADMAP — PRÓXIMA SESIÓN

| # | Prioridad | Tarea |
|---|---|---|
| 1 | 🔴 | **Modal edición producto** desde Inventario — campos: descripcion, precio_venta/lista/2/3/4, stock, categoria, cantidad_minima, descuento_maximo, rendimiento_m2, rendimiento_nota, activo |
| 2 | 🔴 | **Cargar stock real** en inventario desde Dashboard |
| 3 | 🔴 | **Prueba pedido real WhatsApp** con SIKA — verificar cálculo m², filtro marca, precio por nivel |
| 4 | 🟡 | **Fix `api/resumen` 502** — endpoint muy pesado en cold start, optimizar query |
| 5 | 🟡 | **Verificar flujo precio nivel** 1/2/3/4 con datos reales |
| 6 | 🟡 | **Columna Presentación** en tabla Inventario (dato disponible en `_invData`) |
| 7 | 🟡 | Laurent aceptar invitación Evaluador Meta Developers |
| 8 | 🟡 | Solicitar App Review Meta (pages_messaging, instagram_manage_messages) |
| 9 | 🟢 | **Migración Railway o Render Starter** — post-testing (elimina timeouts y cold starts) |

---

## 📋 TABLA COMPARATIVA — Estado post-sesión v3

```
COLUMNA              | DB | IMPORT | EXPORT | GET/cat | INVENTARIO | BOT-TEXT | BOT-PRIORITY
---------------------|----+--------+--------+---------+------------+----------+-------------
codigo               | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅
nombre               | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅
descripcion          | ✅ | ✅     | ✅     | ✅      | -          | ❌       | -
categoria            | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅
marca                | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅
presentacion         | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅
unidad               | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅
cantidad             | ✅ | ✅     | ✅     | ✅      | -          | ✅       | ✅
cantidad_minima      | ✅ | ✅     | ✅     | ✅      | -          | ✅       | ✅
precio_venta         | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅
precio_lista         | ✅ | ✅     | ✅     | ✅      | -          | -        | -
precio_2/3/4         | ✅ | ✅     | ✅     | ✅      | -          | ✅       | ✅
iva                  | ✅ | ✅     | ✅     | ✅      | -          | -        | -
costo_neto           | ✅ | ✅     | ✅     | ✅      | -          | -        | -
descuento_maximo     | ✅ | ✅     | ✅     | ✅      | -          | ✅       | ✅
rendimiento_m2       | ✅ | ✅     | ✅     | ✅      | -          | ✅       | ✅
rendimiento_nota     | ✅ | ✅     | ✅     | ✅      | -          | ✅       | ✅
stock                | -  | -      | -      | -       | ✅         | ❌       | -
stock_minimo         | -  | -      | -      | -       | ✅         | -        | -
activo               | ✅ | ✅     | ✅     | ✅      | (filtro)   | ✅       | ✅
comerciales*         | ✅ | PATCH  | PATCH  | ✅      | -          | (query)  | ✅
```
*comerciales = destacado, en_oferta, precio_oferta, oferta_hasta, mas_vendido, orden_display

---

## 📋 REGLAS DE PRECIOS

```
Precio 1 NETO  = precio con IVA de lista PDF
Precio lista   = REDONDEAR.MAS(P1/10, 0) × 10
Precio 2 NETO  = Precio lista × 0.95   (−5%) — o precio_2 directo si existe
Precio 3 NETO  = Precio lista × 0.90   (−10%) — o precio_3 directo si existe
Precio 4 NETO  = Precio lista           (sin descuento) — o precio_4 directo
IVA            = Precio 1 × (16/116)
Costo NETO     = con IVA incluido, del PDF
Descuento máx  = en decimal: 0.2 = 20%
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
| Instagram Page 2 | ✅ Conectada a `@sika_santa_anita` (2026-04-10) |

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

## 📜 ARCHIVOS DISPONIBLES

| Archivo | Estado |
|---|---|
| `TEMPLATE_IA.xlsx` | ✅ En proyecto — copia del MASTER para import local |
| `catalogo_MASTER_2026_v2 (3).xlsx` | ✅ 802 productos — 5 marcas (en Downloads) |
| `plantilla_catalogo_v5.xlsx` | ✅ Plantilla limpia |

---

## ⚠️ COMPORTAMIENTO RENDER FREE — CONOCIDO

- **Cold start:** 2 min entre `[DB] Esquema listo` y `live` (por catalogo.json 1.5MB)
- **502 intermitente:** `api/resumen` y `api/inventario` durante cold start — normal
- **Múltiples redeploys:** agotan conexiones Supabase → usar `Clear build cache & deploy`
- **Solución futura:** migrar a Railway o Render Starter ($7/mes) post-testing

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

> "Eres mi Senior CTO y principal engineer para MaterialesPro GDL. Adjunto CONTEXTO_MATERIALESPRO_2026-04-10_v3.md con estado completo. Lee y confirma antes de continuar."
