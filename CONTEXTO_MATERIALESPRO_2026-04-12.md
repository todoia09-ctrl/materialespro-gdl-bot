# MaterialesPro GDL — Contexto Nuevo Chat
## Bot WhatsApp Enterprise v14 · Estado: BETA ✅ LIVE
## Fecha: 2026-04-12 (Schema Reset Decision + FASE 0 WMS verificada)

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
21. **REGLA #21:** PowerShell `>` y `Set-Content` escriben BOM — SIEMPRE usar Node.js `fs.writeFileSync(path, content, { encoding: 'utf8' })` para escribir archivos HTML/JS
22. **REGLA #22:** Import escribe catalogo.json Y DB — verificar ambos después de importar
23. **REGLA #23:** `initSchema()` en db.js es fuente única de verdad del schema
24. **REGLA #24:** Después de reset DB → git push del catalogo.json vacío para Render
25. **REGLA #25:** `syncFromCatalog()` al arrancar — JSON vacío = inventario vacío
26. **REGLA #26 — PROPAGACIÓN DE COLUMNAS:** Agregar columna en initSchema() → actualizar en cascada: buildCatalogText() → import Excel → export/plantilla → syncFromCatalog() → buildSystemPrompt()
27. **REGLA #27:** Cuando GET /api refactoriza campos retornados → actualizar TODAS las referencias en dashboard/index.html
28. **REGLA #28:** Import vía Dashboard en Render tiene timeout ~30s en Free tier — para catálogos >500 productos usar `import_local_directo.js`
29. **REGLA #29:** Token Meta WhatsApp expira — usar System User `sikabot` en Meta Business Suite
30. **REGLA #30:** VARCHAR(10) en `codigo` no soporta códigos SIKA (11 chars) — schema usa VARCHAR(50)
31. **REGLA #31:** Render Free hace múltiples redeploys → agota conexiones Supabase → usar `Clear build cache & deploy`
32. **REGLA #32:** dashboard/index.html cachea agresivamente → Express sirve con `Cache-Control: no-cache`
33. **REGLA #33:** SIEMPRE testear en prod después de cada feature — nunca acumular features sin verificar
34. **REGLA #34:** Patches a index.html via scripts Node.js — NUNCA Get-Content+Set-Content PowerShell
35. **REGLA #35:** PATCH /api/catalogo/:codigo debe actualizar AMBAS tablas: catalogo_productos Y inventario
36. **REGLA #36:** Al insertar endpoints en api.js — insertar ANTES de `module.exports = router`
37. **REGLA #37:** SIEMPRE esperar autorización explícita antes de aplicar cualquier cambio
38. **REGLA #38:** Scripts de fix: DRY-RUN obligatorio — verificar patrón OLD aparece exactamente 1 vez
39. **REGLA #39 — Brainstorming multi-IA:** Para fixes complejos/arquitectura mayor: 3-4 rondas con ChatGPT + Gemini + Perplexity antes de implementar. Claude actúa como chef d'orchestre.
40. **REGLA #40 — ROLLBACK INMEDIATO:** Si node --check falla: 1) git checkout [archivo] 2) verificar node --check limpio 3) reportar error exacto 4) NUNCA fixear el fix inline 5) esperar nuevo script
41. **REGLA GLOBAL:** Primera línea de cada sesión Claude Code: "Lee CLAUDE.md y confirma las reglas antes de empezar." Claude verifica reglas antes de cada acción sin que el usuario las repita.

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
DB:          PostgreSQL (Supabase — session pooler puerto 5432)
             Project ID: fgwqrobyhwlmrelxecrc
IA:          Claude Haiku (claude-haiku-4-5-20251001)
Mensajería:  Meta Cloud API WhatsApp Business v22.0
Archivos:    Cloudinary (PDFs cotizaciones)
Deploy:      Render.com (Free tier — auto-deploy desde master)
Repo:        GitHub → https://github.com/todoia09-ctrl/materialespro-gdl-bot.git
OS Dev:      Windows 11 / PowerShell + Claude Code CLI v2.1.101 (Opus 4.6)
Keep-alive:  UptimeRobot → ping /ping cada 5 min
```

---

## 📁 RUTA LOCAL DEL PROYECTO
```
C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl
```

---

## 📊 ESTADO ACTUAL — 2026-04-12

### Sistema en BETA (no live con clientes reales)
- Tests con clientes/pedidos fake en oficina
- **Decisión tomada:** Reset completo de DB + schema unificado antes de go-live
- Claude Code en PAUSA esperando nuevo schema

### Catálogo ✅
- **804 productos** — CREST(56) + FESTER(215) + PEGADURO(171) + PERDURA(82) + SIKA(280)
- Importado desde Excel via `import_local_directo.js`

### Inventario ✅
- 804 productos sincronizados
- Stock = 50 en todos (test inicial)

### Dashboard ✅ FUNCIONANDO COMPLETO
- Login/Auth JWT, Catálogo, Inventario, CRM, Campañas

### Meta WhatsApp Token ✅
- System User `sikabot` (ID: 61574234962222) — token permanente

---

## ✅ COMMITS SESIÓN 2026-04-12

| Commit | Descripción |
|---|---|
| `260e9eb` | fix: marcas dinámicas en system prompt — PERDURA != PEGADURO |
| `83a8bfe` | fix: horario correcto Lun-Vie 8am-6pm · Sáb 8am-2pm |
| `c045674` | fix: strip qty duplicada en nombre producto — parseItemsFromQuote |
| `aab2cb7` | FASE 0: enriquecer items_json con codigo+producto_id anti-circular |
| `8300b2f` | FASE 0 fix: match normalizado startsWith + regla nombres exactos en prompt |

---

## 🐛 PROBLEMA CRÍTICO IDENTIFICADO — Schema DB inconsistente

### El problema
```
catalogo_productos → PK = codigo VARCHAR(50)  ← no convención estándar
inventario         → producto_id VARCHAR(20)  ← diferente nombre Y tipo
pedidos.items_json → producto_id string JSON  ← sin FK real
```

Esta inconsistencia genera bugs en cascada en cada JOIN, RPC y query de stock.

### Decisión tomada
**Reset completo de DB + schema unificado** con convención estándar:
```sql
-- REGLA: todas las tablas tienen id SERIAL PRIMARY KEY
-- REGLA: todas las FKs usan [tabla]_id INTEGER REFERENCES [tabla](id)
-- REGLA: codigo sigue existiendo como campo UNIQUE NOT NULL, no PK

catalogo_productos: id SERIAL PRIMARY KEY, codigo VARCHAR(50) UNIQUE NOT NULL
inventario:         id SERIAL PRIMARY KEY, catalogo_id INTEGER REFERENCES catalogo_productos(id)
pedidos:            id SERIAL PRIMARY KEY (ya existe)
clientes:           id SERIAL PRIMARY KEY (ya existe)
```

### Por qué ahora y no después
- Sistema en BETA — no hay clientes reales, no hay datos que proteger
- Costo de hacer reset ahora = 0
- Costo de hacerlo después con clientes reales = muy alto
- Cada bug futuro por naming inconsistente = tiempo perdido

---

## 🗺️ ROADMAP — PRÓXIMA SESIÓN

### PRIORIDAD ABSOLUTA: Brainstorming schema reset

**Proceso:**
1. Generar prompt brainstorming para ChatGPT + Gemini + Perplexity
2. 3-4 rondas de análisis del nuevo schema
3. Claude evalúa y sintetiza decisiones finales
4. Nuevo prompt God Level v5 para Claude Code
5. Claude Code ejecuta reset + schema nuevo + re-import catálogo

**Preguntas a resolver en brainstorming:**
- ¿Qué tablas mantener, cuáles rediseñar, cuáles son nuevas?
- ¿Cómo migrar datos existentes (catálogo Excel)?
- ¿Qué columnas necesita cada tabla para WMS completo?
- ¿Cómo manejar la relación catalogo_productos → inventario con id SERIAL?
- ¿El campo `codigo` del Excel sigue siendo el identifier externo?
- ¿Qué datos de prueba limpiar (pedidos, clientes fake)?

### WMS FASES 1A-1E (bloqueadas hasta schema nuevo)
- FASE 1A: 5 tablas WMS + ALTER en db.js
- FASE 1B: RPC confirmar_pedido_atomico
- FASE 1C: Outbox worker en scheduler.js
- FASE 1D: Reconciliación + purga
- FASE 1E: buildCatalogText() con stock_disponible

### Otras tareas pendientes (post-schema)
- Cargar stock real (reemplazar stock=50 de prueba)
- Prueba pedido real WhatsApp con SIKA
- Laurent aceptar invitación Evaluador Meta Developers
- Solicitar App Review Meta (pages_messaging, instagram_manage_messages)
- Migración Railway o Render Starter — post-testing
- ⚠️ Recarga créditos Anthropic — bot caído sin créditos API

---

## ⚠️ LECCIONES CRÍTICAS SESIÓN 2026-04-12

### Claude Code y las reglas
- Claude Code viola REGLA #5 (&&) y REGLA #13 (node -e multilinea) frecuentemente
- Requiere supervisión activa del chef d'orchestre
- Solución: primera línea siempre "Lee CLAUDE.md y confirma las reglas"
- Cuando viola una regla → intervenir inmediatamente con corrección específica
- Claude Code aprende rápido cuando se le corrige con la regla exacta

### FASE 0 — Items_json enriquecimiento
- `guardarPedido()` está en `crm.js`, no en `pedido.js`
- Anti-circular: `catalogRef` pasa como parámetro, no como import
- Match exacto falla porque Claude Haiku abrevia nombres ("19 L" vs "19 Lits")
- Fix: match normalizado con `startsWith` bidireccional + regla en prompt
- **VERIFICADO EN PRODUCCIÓN:** `codigo=PER-VAR-010`, `producto_id=PER-VAR-010` ✅

### Schema inconsistente — causa raíz de bugs
- `catalogo_productos.codigo` es PK VARCHAR en vez de `id SERIAL`
- Todos los joins y RPCs requieren adaptación — genera bugs en cascada
- Decisión correcta: reset completo antes del go-live con clientes reales

---

## 📋 TABLA PROPAGACIÓN — Estado post-sesión 2026-04-12

```
COLUMNA              | DB | IMPORT | EXPORT | GET/cat | INVENTARIO | BOT-TEXT | MODAL-EDIT
---------------------|----+--------+--------+---------+------------+----------+-----------
codigo               | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅ (readonly)
nombre               | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅ editable
marca                | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅ editable
categoria            | ✅ | ✅     | ✅     | ✅      | ✅         | ✅       | ✅ select
stock                | -  | -      | ✅     | -       | ✅         | ⚠️ NO    | ✅ editable
producto_id          | ⚠️ VARCHAR | - | -  | -       | ⚠️ VARCHAR | ✅*      | -
```
*`producto_id` en `items_json` ahora se guarda correctamente (FASE 0 ✅)

---

## 🌐 SERVICIOS EN PRODUCCIÓN

| Servicio | URL / Dato | Estado |
|---|---|---|
| Bot Render | https://materialespro-gdl-bot.onrender.com | ✅ Live |
| Dashboard | https://materialespro-gdl-bot.onrender.com/dashboard | ✅ |
| Webhook Meta | https://materialespro-gdl-bot.onrender.com/webhook/meta | ✅ |
| GitHub | https://github.com/todoia09-ctrl/materialespro-gdl-bot.git | ✅ |
| Supabase | Session pooler — fgwqrobyhwlmrelxecrc | ✅ RLS habilitado |
| Anthropic API | ⚠️ Créditos agotados — recargar urgente | ❌ |
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
| VENDOR_WHATSAPP | +523313469831 |
| System User | `sikabot` (ID: 61574234962222) — token permanente |

---

## 🛠️ SCRIPTS UTILITARIOS DISPONIBLES

| Script | Descripción |
|---|---|
| `import_local_directo.js` | Import Excel → DB + regenera catalogo.json |
| `fix_fase0_items_enrich_v1.js` | FASE 0: enriquecimiento items_json |
| `fix_fase0_match_v2.js` | FASE 0: match normalizado startsWith |
| `fix_fase0_prompt_rule_v1.js` | FASE 0: regla nombres exactos en prompt |
| `tools/deploy_rpc.js` | Deploy función RPC a Supabase (pendiente) |
| `dry_run_fase0_v1.js` | Dry-run verificación patrones FASE 0 |
| `verify_modules_fase0.js` | Verificación completa módulos |
| `check_duplicados.js` | Verifica duplicados en catalogo_productos |
| `regenerar_catalogo_json.js` | Regenera catalogo.json desde DB |

---

## 💬 CÓMO EMPEZAR EL NUEVO CHAT

```
"Eres mi Senior CTO y principal engineer para MaterialesPro GDL. 
Adjunto CONTEXTO_MATERIALESPRO_2026-04-12.md con estado completo. 
Lee y confirma antes de continuar.

PRIORIDAD HOY: Brainstorming schema reset DB con convención 
id SERIAL PRIMARY KEY unificada en todas las tablas."
```
