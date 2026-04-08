# MaterialesPro — Contexto Nuevo Chat
## Plataforma Multi-Tenant WhatsApp IA · v10 → v11
## Fecha: 2026-04-06

---

## ROL
Eres mi **Senior CTO y Principal Engineer** para una plataforma SaaS de bots de ventas WhatsApp con IA, diseñada para múltiples negocios de materiales de construcción en Guadalajara, México.

---

## REGLAS DE TRABAJO
1. Solo trabajar en lo solicitado — no saltar adelante
2. Output listo para implementar — código production-ready
3. Un comando a la vez — esperar resultado antes del siguiente
4. Preferir reescritura completa de archivos sobre inyección parcial
5. Respetar el ritmo del usuario — paso a paso
6. Siempre correr `node --check` y verificación de módulos antes de commit

---

## STACK TECNICO
```
Runtime:     Node.js 24
Backend:     Express.js (single server.js)
DB:          PostgreSQL (Supabase) — SSL habilitado
IA:          Claude Haiku (claude-haiku-4-5-20251001, Anthropic)
Mensajería:  Meta Cloud API (WhatsApp Business) — migración desde Twilio completada
Archivos:    Cloudinary (PDFs cotizaciones)
Deploy:      Render.com (Free tier, auto-deploy desde master)
Repo:        GitHub → https://github.com/todoia09-ctrl/materialespro-gdl-bot.git
OS Dev:      Windows 11 (Claude Code CLI + bash)
Keep-alive:  UptimeRobot → ping cada 5 min
```

---

## RUTA LOCAL DEL PROYECTO
```
C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl
```

---

## SERVICIOS EN PRODUCCION

| Servicio | URL | Estado |
|---|---|---|
| Bot Render | https://materialespro-gdl-bot.onrender.com | Live |
| Dashboard | https://materialespro-gdl-bot.onrender.com/dashboard | Live |
| Ping keep-alive | https://materialespro-gdl-bot.onrender.com/ping | OK |
| UptimeRobot | Ping cada 5 min | OK |
| Supabase DB | SSL habilitado | OK |
| Meta Cloud API | WhatsApp Business API | OK |

---

## CREDENCIALES

| Servicio | Usuario | Password |
|---|---|---|
| Dashboard | admin@materialespro.com | Admin2024! |
| GitHub | todoia09-ctrl | — |

---

## LOS 5 NEGOCIOS

| # | Negocio |
|---|---|
| 1 | MaterialesPro GDL |
| 2 | SIKA Santa Anita |
| 3 | FESTER Santa Anita |
| 4 | IMPAC Santa Anita |
| 5 | Adhesivos y Texturizados Perdura |

---

## ESTRUCTURA DE PRECIOS

4 niveles de precio por producto en `catalogo.json`:
- **Nivel 1** = Público general (precio base)
- **Nivel 2** = Cliente frecuente (5% descuento, configurable `descuento_p2`)
- **Nivel 3** = Contratista / Constructor (10% descuento, configurable `descuento_p3`)
- **Nivel 4** = Mayoreo / Distribuidor (20% descuento, `descuento_maximo`)

Descuentos automáticos por volumen: umbral $5,000 MXN.

---

## CATALOGO — ESTADO ACTUAL

```
Productos totales:    273
Productos activos:    273  (ninguno marcado activo=false)
Categorías únicas:    35
Con descripción:      271/273
Con código:           273/273
Tamaño catalogo.json: ~530 KB
```

El catálogo se carga en memoria al boot y se recarga cada hora desde disco (`loadCatalog()` en server.js).

**Problema conocido:** `catalogo.json` es volátil en Render Free — se resetea con cada deploy. Pendiente mover a Supabase.

---

## CAMBIOS REALIZADOS HOY (2026-04-06)

### Commit: `5ea76b9` — fix: agregar categoria en catalog text del system prompt

**Problema:** `buildCatalogText()` generaba el catálogo para el system prompt de Claude solo con `nombre $precio/unidad`. Sin categoría ni descripción, Claude no podía recomendar productos por uso (ej: "necesito algo para el techo" no matcheaba con "Acril Techo" porque no había contexto de categoría).

**Solución aplicada:** Se agregó el campo `categoria` entre paréntesis al final de cada línea del catálogo en el prompt:
```
ANTES:  Acril Techo 3 Pro Rojo Cubeta (18 L) $1730/pza
AHORA:  Acril Techo 3 Pro Rojo Cubeta (18 L) $1730/pza (Impermeabilizantes acrílicos)
```

**Cambio en server.js línea 90-91:**
```js
// ANTES:
return _n + " $" + precioNivel(p) + "/" + _u;

// AHORA:
var _c = p.categoria ? ' (' + p.categoria + ')' : '';
return _n + " $" + precioNivel(p) + "/" + _u + _c;
```

**Impacto en tokens del system prompt:**

| Versión | Chars | ~Tokens |
|---|---|---|
| Original (solo nombre+precio) | 12,217 | 3,054 |
| **Actual (+ categoría)** | **23,177** | **5,794** |
| Descartada (+ descripción 60 chars) | 29,728 | 7,432 |

Se descartó incluir `descripcion` (truncada a 60 chars) porque agregaba ~7,400 tokens por mensaje — demasiado costo. La categoría da contexto suficiente para recomendaciones con solo ~2,740 tokens extra.

### Análisis de catálogo realizado

Se auditaron todos los productos relacionados a "techo/losa/azotea/concreto":
- **15 productos** Acril Techo (impermeabilizantes acrílicos, $1,730 - $29,105)
- **3 productos** Sikaflex gris concreto (selladores)
- **3 productos** SikaShield techo verde (mantos Roof Garden)
- **~35 productos** con "concreto" en descripción (aditivos, curadores, endurecedores, epóxicos)
- **0 productos** con "losa" o "azotea" en nombre o descripción

---

## BUGS DESCUBIERTOS / PENDIENTES

| # | Bug | Prioridad | Estado |
|---|---|---|---|
| 1 | `catalogo.json` volátil en Render Free — se pierde en redeploy | CRITICA | Pendiente — mover a Supabase |
| 2 | 273 productos (no 1,448) — catálogo actual reducido vs importación original | MEDIA | Investigar si se perdieron productos en un redeploy |
| 3 | 2 productos sin descripción de 273 | BAJA | Identificar y completar |
| 4 | No hay productos con "losa" ni "azotea" — gap en catálogo para búsquedas comunes | MEDIA | Agregar sinónimos o mapeo de términos |
| 5 | Categorías repetidas con 1 solo producto (ej: "Morteros adhesivos y emboquilladores") | BAJA | Considerar consolidación |
| 6 | Render Free cold start — upgrade a $7/mes | MEDIA | Pendiente decisión |

---

## IDEA PENDIENTE: FILTRADO INTELIGENTE POR CATEGORIA

En lugar de inyectar los 273 productos en cada system prompt (~5,800 tokens), implementar filtrado por categoría según el tema de la conversación:

- Detectar categorías relevantes del mensaje del cliente (ej: "impermeabilizar mi techo" → Impermeabilizantes acrílicos + Mantos)
- Inyectar solo los 20-50 productos relevantes (~500-1,400 tokens)
- Ahorro: ~4,000-5,000 tokens por mensaje
- Requiere: función `detectCategory(messageText)` + mapeo keywords→categorías

**Las 35 categorías existentes:**
- Sellado de juntas y adhesivos elásticos (41)
- Morteros para reparación y protección de concreto (29)
- Impermeabilizantes acrílicos (20)
- Productos complementarios para concreto (17)
- Impermeabilizantes asfálticos (12)
- Aditivos para cemento y mortero (11)
- Adhesivos epóxicos (10), Sika Mantos PRO (10), Protección concreto (10)
- Productos complementarios sellado (9)
- Y 26 categorías más con 1-8 productos cada una

---

## LOGROS ACUMULADOS

1. Encoding UTF-8 corregido
2. SSL Supabase — DB guardando datos
3. Endpoint /ping + UptimeRobot
4. express.json límite 10mb
5. Sección Catálogo en dashboard
6. Importador Excel con formato CRM propio
7. Migración Twilio → Meta Cloud API completada
8. Dashboard: editar vendedor, auto-refresh 30s
9. Sistema 4 niveles de precio implementado
10. Campañas bulk via Meta WA API templates
11. Inventario: stock real, sync, reducción en pedido
12. Active orders persistidos en DB (sobreviven restart)
13. **System prompt con categorías de producto** (hoy)

---

## AGENDA PROXIMA SESION (prioridades)

1. **Mover catálogo a Supabase DB** — evitar pérdida en redeploy (CRITICO)
2. **Investigar discrepancia 273 vs 1,448 productos** — posible pérdida por redeploy
3. **Completar 2 productos sin descripción**
4. **Evaluar filtrado inteligente por categoría** — reducir tokens del system prompt
5. **Agregar sinónimos de búsqueda** — "losa", "azotea" → mapear a categorías existentes
6. **Arquitectura multi-tenant** — 5 negocios en 1 servidor

---

## DEPLOY

```bash
cd "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl"
git add <archivos>
git commit -m "descripcion"
git push origin master
# Auto-deploy en Render desde master
```

**Verificación pre-commit:**
```bash
node --check server.js
node -e "require('dotenv').config(); require('./meta'); require('./pedido'); require('./crm'); require('./cotizacion'); require('./tecnico'); require('./db'); require('./inventario'); require('./scheduler'); console.log('ALL OK');"
```

---

## INICIO DEL NUEVO CHAT

> "Eres mi Senior CTO y principal engineer para una plataforma multi-tenant de bots de ventas WhatsApp con IA para 5 negocios de construcción en GDL. Adjunto CONTEXTO_MATERIALESPRO_2026-04-06.md con estado completo. Lee y confirma antes de continuar."
