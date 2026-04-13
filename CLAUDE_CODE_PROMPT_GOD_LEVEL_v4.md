# MATERIALESPRO GDL — STOCK MANAGEMENT SYSTEM
# Prompt GOD LEVEL v4 — Reglas #5 #6 #7 #9 #12 #13 #26 #38 #40 + Recordatorio Activo
# Validado por 4 IAs en 4 rondas + auditoría de reglas del proyecto
# Fecha: 2026-04-11

---

## 🎭 ROL Y MENTALIDAD

Eres el ingeniero principal ejecutando un diseño arquitectónico pre-validado
por Claude (chef d'orchestre), ChatGPT, Gemini y Perplexity en 4 rondas.
CADA decisión fue deliberada y validada. Tu trabajo es implementar con
precisión quirúrgica — no improvisar, no asumir, no saltar pasos.

---

## 🔁 RECORDATORIO ACTIVO — VERIFICAR ANTES DE CADA ACCIÓN

Antes de ejecutar CUALQUIER comando o escribir CUALQUIER archivo,
verificar mentalmente esta lista completa:

```
□ ¿Uso && en PowerShell?          → PROHIBIDO (REGLA #5) — un comando a la vez
□ ¿Uso node -e con multilinea?    → PROHIBIDO (REGLA #13) — crear script .js
□ ¿Hice dry-run primero?          → OBLIGATORIO (REGLA #38) — verificar patrón = 1
□ ¿Patrón aparece exactamente 1x? → Si != 1: ABORT, reportar, no escribir
□ ¿node --check pasó?             → Si falla: git checkout [archivo] (REGLA #40)
□ ¿Usé fs.writeFileSync utf8?     → OBLIGATORIO (REGLA #21) — nunca PowerShell
□ ¿Verifiqué CRLF post-escritura? → OBLIGATORIO en pedido.js y server.js (REGLA #9)
□ ¿Hice git log --oneline -3?     → OBLIGATORIO post-commit (REGLA #12)
□ ¿Verifiqué propagación cascada? → OBLIGATORIO antes de agregar columnas (REGLA #26)
```

Si CUALQUIER verificación falla → PARAR inmediatamente y reportar.
NO intentar fixear inline. NO continuar a siguiente paso.
Esperar instrucción del chef d'orchestre.

Esta verificación aplica SIN EXCEPCIÓN en cada acción — no solo al inicio.

---

## ⚠️ RESTRICCIONES ABSOLUTAS — NUNCA VIOLAR

### PowerShell / Windows 11
- NUNCA usar `&&` en PowerShell
- NUNCA usar `node -e` con strings multilinea
- NUNCA usar `Get-Content | Set-Content` (corrompe UTF-8)
- NUNCA usar `>` o `Set-Content` para escribir archivos de código
- SIEMPRE usar `fs.writeFileSync(path, content, { encoding: 'utf8' })`
- Un comando PowerShell a la vez — esperar resultado antes de continuar

### REGLA #6 — Reescritura completa obligatoria
- NUNCA hacer patches parciales insertando bloques de código directamente
- SIEMPRE usar scripts Node.js descargables que reescriben el archivo completo
- O usar scripts de reemplazo controlado con dry-run

### REGLA #7 + #38 — Scripts descargables con dry-run
- TODA modificación a archivos JS se hace via script Node.js descargable
- Estructura obligatoria de cada script:
  1. Leer archivo completo con fs.readFileSync
  2. Verificar patrón OLD existe exactamente 1 vez
  3. Si content.split(OLD).length - 1 !== 1 → ABORT, no escribir
  4. Imprimir preview del cambio en consola (dry-run)
  5. Escribir con fs.writeFileSync encoding utf8
  6. Confirmar escritura exitosa
- NUNCA modificar archivos directamente sin este proceso

### REGLA #9 — CRLF obligatorio
- `pedido.js` y `server.js` tienen CRLF line endings
- TODOS los scripts de fix para estos archivos deben:
  1. Leer con fs.readFileSync sin especificar encoding → Buffer raw
  2. Convertir a string con .toString('utf8')
  3. Usar regex con flag /\r\n|\n/g para splits si necesario
  4. Verificar CRLF después de escribir:
     ```javascript
     const written = fs.readFileSync(FILE);
     console.log('CRLF preserved:', written.indexOf(13) > -1);
     ```

### REGLA #12 — Verificación post-commit
- Después de CADA git push, ejecutar:
  ```powershell
  git log --oneline -3
  ```
- Verificar que el commit aparece con el mensaje correcto
- Solo continuar a siguiente fase si el commit es visible

### REGLA #26 — Propagación de columnas en cascada
- Antes de agregar cualquier columna nueva a DB:
  Verificar impacto en TODOS estos componentes:
  [ ] initSchema() en db.js
  [ ] buildCatalogText() en server.js
  [ ] import Excel en dashboard/api.js
  [ ] export Excel en dashboard/api.js
  [ ] syncFromCatalog() en inventario.js
  [ ] buildSystemPrompt() en server.js
  [ ] Modal edición en dashboard/index.html
  [ ] GET /api/catalogo en dashboard/api.js

### Base de datos
- Supabase: SIEMPRE usar service_role key (bypassa RLS)
- Pool conexiones Node: `max: 5` (Supabase Free = 60 conexiones límite)
- SOLO puerto 5432 (Session Pooler) — NUNCA mezclar con 6543
- Operaciones de stock: SIEMPRE atómicas
- NUNCA hacer queries N+1 — siempre batch queries con MAP

### REGLA #40 — ROLLBACK INMEDIATO (sin excepciones)
Si `node --check` falla después de escribir cualquier archivo:
```powershell
git checkout [archivo-modificado]
node --check [archivo-modificado]
```
- Verificar que `node --check` pasa limpio post-rollback
- Reportar el error EXACTO al chef d'orchestre
- NUNCA intentar fixear el fix inline
- NUNCA continuar a siguiente paso con código roto
- Esperar nuevo script corregido antes de proceder

Esta regla aplica SIN EXCEPCIÓN — aunque el fix parezca obvio.

### Modularidad
- NUNCA crear imports circulares entre archivos
- NUNCA importar server.js desde pedido.js
- NUNCA importar pedido.js desde server.js directamente

---

## 🏗️ STACK TÉCNICO

```
Runtime:     Node.js 24.14.0
Backend:     Express.js
DB:          PostgreSQL — Supabase (Session Pooler puerto 5432)
             Project: fgwqrobyhwlmrelxecrc
IA:          Claude Haiku (claude-haiku-4-5-20251001)
Mensajería:  Meta WhatsApp Cloud API v22.0
Deploy:      Render.com Free tier
Repo:        GitHub → todoia09-ctrl/materialespro-gdl-bot
OS Dev:      Windows 11 / PowerShell
```

## 📁 RUTA BASE DEL PROYECTO
```
C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\
```
(En adelante: [BASE]\archivo.js)

## 📁 ARCHIVOS CLAVE
```
server.js        → buildCatalogText(), buildSystemPrompt(), getAIResponse(), getCatalog()
pedido.js        → máquina de estados, parseItemsFromQuote(), guardarPedido()
meta.js          → webhook Meta, enrutamiento canales
db.js            → initSchema() — FUENTE ÚNICA DE VERDAD del schema
inventario.js    → syncFromCatalog(), endpoints inventario
scheduler.js     → jobs automáticos
dashboard/api.js → endpoints REST panel de control
```

---

## 📋 ANTES DE TOCAR CUALQUIER ARCHIVO

```powershell
cd "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl"
git diff --staged
```
Resultado esperado: vacío. Si hay cambios staged → PARAR y reportar.

---

## 🚀 FASES DE IMPLEMENTACIÓN

---

### ═══════════════════════════════════════════════════
### FASE 0 — BLOCKER: enriquecer items_json
### ═══════════════════════════════════════════════════

**PROBLEMA:**
items_json guarda `[{nombre, qty, precio, unidad}]` SIN `codigo` NI `producto_id`.
Sin estos campos el cálculo de stock_apartado es imposible → overselling garantizado.

**PASO 0.1 — Leer estado actual de guardarPedido():**
```powershell
Select-String -Path "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\pedido.js" -Pattern "guardarPedido|getCatalog|module.exports" -Context 0,0 | Select-Object LineNumber, Line | Format-Table -AutoSize
```
```powershell
Select-String -Path "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\meta.js" -Pattern "guardarPedido" -Context 0,0 | Select-Object LineNumber, Line | Format-Table -AutoSize
```
```powershell
Select-String -Path "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\server.js" -Pattern "guardarPedido" -Context 0,0 | Select-Object LineNumber, Line | Format-Table -AutoSize
```

**PASO 0.2 — Verificar CRLF en pedido.js:**
```powershell
node -e "var c=require('fs').readFileSync('pedido.js');console.log('CRLF:',c.indexOf(13)>-1,'BOM:',c[0]===0xEF)"
```

**PASO 0.3 — Crear script de fix (REGLA #6 #7 #38):**

Crear archivo `fix_fase0_items_enrich_v1.js` en la raíz del proyecto:

```javascript
// fix_fase0_items_enrich_v1.js
// FASE 0: Agregar codigo+producto_id a items_json en guardarPedido()
// REGLA #7 #38: dry-run obligatorio
// REGLA #9: preservar CRLF en pedido.js

const fs = require('fs');
const path = require('path');
const BASE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\';

// ── MODIFICACIÓN 1: pedido.js — firma de guardarPedido() ──────────────
// Leer como Buffer para preservar CRLF (REGLA #9)
const pedidoPath = BASE + 'pedido.js';
const pedidoRaw  = fs.readFileSync(pedidoPath);
const pedido     = pedidoRaw.toString('utf8');

// El patrón OLD debe encontrarse exactamente 1 vez
// NOTA: Ajustar OLD según la línea exacta vista en PASO 0.1
const P1_OLD = 'async function guardarPedido(from, order, canal) {';
const P1_NEW = 'async function guardarPedido(from, order, canal, catalogRef) {';

const p1_count = pedido.split(P1_OLD).length - 1;
console.log('\n=== DRY-RUN PEDIDO.JS — Firma guardarPedido ===');
console.log('Patrón OLD encontrado:', p1_count, 'vez/veces');
console.log('OLD:', JSON.stringify(P1_OLD));

if (p1_count !== 1) {
  console.error('❌ ABORT — patrón firma no encontrado exactamente 1 vez.');
  console.log('Líneas con "guardarPedido":');
  pedido.split('\n').forEach((l,i) => {
    if (l.includes('guardarPedido')) console.log(' L'+(i+1)+':', JSON.stringify(l));
  });
  process.exit(1);
}

// ── MODIFICACIÓN 2: pedido.js — enriquecimiento items ─────────────────
// Buscar línea justo ANTES del INSERT a DB para insertar el enriquecimiento
// AJUSTAR P2_OLD según la línea exacta vista en PASO 0.1
const P2_OLD = '// ── Guardar pedido en DB';
const P2_NEW = `// ── ENRIQUECIMIENTO items_json con codigo + producto_id ──────────
  // REGLA: MATCH EXACTO únicamente — nunca includes() (falso positivo)
  // REGLA: Anti-circular — catalogRef llega como parámetro, no import
  if (catalogRef && catalogRef.productos && order.items && order.items.length > 0) {
    order.items = order.items.map(function(item) {
      var match = catalogRef.productos.find(function(p) {
        return p.nombre && item.nombre &&
               p.nombre.toLowerCase().trim() === item.nombre.toLowerCase().trim();
      });
      if (!match && item.codigo) {
        match = catalogRef.productos.find(function(p) {
          return p.codigo && p.codigo === item.codigo;
        });
      }
      if (match) {
        item.codigo      = match.codigo || null;
        item.producto_id = match.id     || null;
      } else {
        item.codigo      = item.codigo      || null;
        item.producto_id = item.producto_id || null;
        console.warn('[ENRICH] Sin match en catálogo:', item.nombre);
      }
      return item;
    });
  }
  // ────────────────────────────────────────────────────────────────────
  // ── Guardar pedido en DB`;

const p2_count = pedido.split(P2_OLD).length - 1;
console.log('\n=== DRY-RUN PEDIDO.JS — Insertar enriquecimiento ===');
console.log('Patrón OLD encontrado:', p2_count, 'vez/veces');

if (p2_count !== 1) {
  console.error('❌ ABORT — patrón inserción no encontrado exactamente 1 vez.');
  process.exit(1);
}

// Preview
let pedidoResult = pedido.replace(P1_OLD, P1_NEW).replace(P2_OLD, P2_NEW);
const previewIdx = pedidoResult.indexOf('ENRIQUECIMIENTO');
console.log('\nPreview enriquecimiento:');
console.log('...' + pedidoResult.substring(previewIdx - 10, previewIdx + 100) + '...');
console.log('\n✅ pedido.js — ambos patrones OK. Escribiendo...');
fs.writeFileSync(pedidoPath, pedidoResult, { encoding: 'utf8' });

// Verificar CRLF preservado (REGLA #9)
const written = fs.readFileSync(pedidoPath);
console.log('CRLF preserved:', written.indexOf(13) > -1);

// ── MODIFICACIÓN 3: meta.js — pasar getCatalog() a guardarPedido() ────
const metaPath = BASE + 'meta.js';
const meta     = fs.readFileSync(metaPath, 'utf8');

// Buscar todas las llamadas a guardarPedido en meta.js
const metaLines = meta.split('\n');
console.log('\n=== DRY-RUN META.JS — llamadas a guardarPedido ===');
metaLines.forEach((l,i) => {
  if (l.includes('guardarPedido')) console.log(' L'+(i+1)+':', l.trim());
});

// AJUSTAR según líneas exactas vistas en PASO 0.1
// Ejemplo genérico — ajustar el patrón exacto:
const M1_OLD = "guardarPedido(from, order, 'whatsapp')";
const M1_NEW = "guardarPedido(from, order, 'whatsapp', getCatalog())";

const m1_count = meta.split(M1_OLD).length - 1;
console.log('\nPatrón meta.js encontrado:', m1_count, 'vez/veces');
console.log('OLD:', JSON.stringify(M1_OLD));

if (m1_count === 0) {
  console.error('❌ ABORT — patrón meta.js no encontrado.');
  console.error('Ajustar M1_OLD con la línea exacta del PASO 0.1');
  process.exit(1);
}

const metaResult = meta.split(M1_OLD).join(M1_NEW);
console.log('Reemplazos en meta.js:', m1_count);
fs.writeFileSync(metaPath, metaResult, { encoding: 'utf8' });
console.log('✅ meta.js actualizado');

// ── MODIFICACIÓN 4: server.js — pasar getCatalog() a guardarPedido() ──
const serverPath = BASE + 'server.js';
const serverRaw  = fs.readFileSync(serverPath);
const server     = serverRaw.toString('utf8');

const serverLines = server.split('\n');
console.log('\n=== DRY-RUN SERVER.JS — llamadas a guardarPedido ===');
serverLines.forEach((l,i) => {
  if (l.includes('guardarPedido')) console.log(' L'+(i+1)+':', l.trim());
});

// AJUSTAR según líneas exactas vistas en PASO 0.1
const S1_OLD = "guardarPedido(from, order, canal)";
const S1_NEW = "guardarPedido(from, order, canal, getCatalog())";

const s1_count = server.split(S1_OLD).length - 1;
console.log('\nPatrón server.js encontrado:', s1_count, 'vez/veces');

if (s1_count === 0) {
  console.warn('⚠️ Patrón server.js no encontrado — puede no existir llamada aquí');
}

let serverResult = server;
if (s1_count > 0) {
  serverResult = server.split(S1_OLD).join(S1_NEW);
  fs.writeFileSync(serverPath, serverResult, { encoding: 'utf8' });
  const writtenS = fs.readFileSync(serverPath);
  console.log('CRLF preserved server.js:', writtenS.indexOf(13) > -1);
  console.log('✅ server.js actualizado');
} else {
  console.log('ℹ️ server.js no modificado (sin llamadas a guardarPedido)');
}

console.log('\n✅ FASE 0 completa.');
console.log('⚡ Siguiente: node --check pedido.js');
```

**PASO 0.4 — Ejecutar script:**
```powershell
node "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\fix_fase0_items_enrich_v1.js"
```

**PASO 0.5 — Verificar sintaxis:**
```powershell
node --check "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\pedido.js"
node --check "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\meta.js"
node --check "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\server.js"
```

**PASO 0.6 — Verificar módulos:**
```powershell
node -e "require('dotenv').config(); require('./meta'); require('./pedido'); require('./crm'); require('./cotizacion'); require('./tecnico'); require('./db'); require('./inventario'); require('./scheduler'); console.log('ALL OK');"
```

**PASO 0.7 — REGLA #26: Verificar propagación:**
Columnas `codigo` y `producto_id` se agregan a items_json (JSONB).
Verificar que estos cambios NO rompen:
```powershell
Select-String -Path "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\dashboard\api.js" -Pattern "items_json|items\.map|items\.forEach" -Context 0,0 | Select-Object LineNumber, Line | Format-Table -AutoSize
```
Si dashboard/api.js usa items_json → verificar que los campos adicionales no rompen su lógica.

**PASO 0.8 — Commit y verificación REGLA #12:**
```powershell
git add pedido.js meta.js server.js fix_fase0_items_enrich_v1.js
git commit -m "FASE 0: enriquecer items_json con codigo+producto_id anti-circular"
git push origin master
git log --oneline -3
```
Resultado esperado: commit "FASE 0:" visible en primera línea.

**PASO 0.9 — Verificar en Supabase post-deploy (hacer pedido de prueba primero):**
```sql
SELECT
  items_json->0->>'nombre'      as nombre,
  items_json->0->>'codigo'      as codigo,
  items_json->0->>'producto_id' as producto_id,
  creado_en
FROM pedidos
ORDER BY creado_en DESC
LIMIT 5;
```
Resultado esperado en pedidos nuevos: `codigo` y `producto_id` no nulos.

⛔ **STOP — Verificar en producción. Reportar resultado antes de FASE 1A.**

---

### ═══════════════════════════════════════════════════
### FASE 1A — 5 TABLAS NUEVAS + ALTER en db.js
### ═══════════════════════════════════════════════════

**REGLA #26 — Verificar propagación ANTES de modificar:**
```powershell
Select-String -Path "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\db.js" -Pattern "initSchema|CREATE TABLE|module.exports" -Context 0,0 | Select-Object LineNumber, Line | Format-Table -AutoSize
```
```powershell
Select-String -Path "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\inventario.js" -Pattern "syncFromCatalog|followup|estado_stock|costo_promedio" -Context 0,0 | Select-Object LineNumber, Line | Format-Table -AutoSize
```

Las columnas nuevas en `pedidos` (`followup_1_enviado`, `fecha_expiracion`, etc.)
y en `inventario` (`costo_promedio_actual`) son internas al sistema WMS.
No afectan buildCatalogText(), syncFromCatalog(), ni el dashboard de catálogo.
Confirmar visualmente antes de proceder.

**PASO 1A.1 — Crear script fix_fase1a_schema_v1.js:**

```javascript
// fix_fase1a_schema_v1.js
// FASE 1A: Agregar 5 tablas WMS + ALTER TABLE en db.js
// REGLA #7 #38: dry-run obligatorio
// REGLA #6: modificación via script controlado

const fs = require('fs');
const BASE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\';
const FILE = BASE + 'db.js';

const content = fs.readFileSync(FILE, 'utf8');

// Insertar ANTES de module.exports (REGLA: posición segura garantizada)
const OLD = 'module.exports = {';
const count = content.split(OLD).length - 1;

console.log('\n=== DRY-RUN DB.JS ===');
console.log('Patrón module.exports encontrado:', count, 'vez/veces');

if (count !== 1) {
  console.error('❌ ABORT — module.exports no encontrado exactamente 1 vez');
  process.exit(1);
}

const NEW_TABLES = `
// ─────────────────────────────────────────────────────────────────
//  TABLAS WMS — Stock Management System (FASE 1A)
// ─────────────────────────────────────────────────────────────────
async function initWMSSchema() {
  const queries = [
    // ① MENSAJES PROCESADOS — idempotencia inbound
    \`CREATE TABLE IF NOT EXISTS mensajes_procesados (
      id              SERIAL PRIMARY KEY,
      message_id_meta VARCHAR(100) UNIQUE NOT NULL,
      procesado_en    TIMESTAMPTZ DEFAULT NOW()
    )\`,
    \`CREATE INDEX IF NOT EXISTS idx_msg_proc_meta
      ON mensajes_procesados(message_id_meta)\`,

    // ② OUTBOX WHATSAPP — mensajes salientes
    \`CREATE TABLE IF NOT EXISTS outbox_whatsapp (
      id                  SERIAL PRIMARY KEY,
      pedido_id           INTEGER REFERENCES pedidos(id),
      tipo                VARCHAR(30) NOT NULL,
      destinatario_wa     VARCHAR(30) NOT NULL,
      mensaje             TEXT NOT NULL,
      estado              VARCHAR(20) DEFAULT 'pending',
      intentos            INTEGER DEFAULT 0,
      max_intentos        INTEGER DEFAULT 5,
      ultimo_error_codigo VARCHAR(20),
      ultimo_error_msg    TEXT,
      next_attempt_at     TIMESTAMPTZ DEFAULT NOW(),
      enviado_en          TIMESTAMPTZ,
      idempotency_key     VARCHAR(100) UNIQUE NOT NULL,
      creado_en           TIMESTAMPTZ DEFAULT NOW()
    )\`,
    \`CREATE INDEX IF NOT EXISTS idx_outbox_estado
      ON outbox_whatsapp(estado, next_attempt_at)
      WHERE estado IN ('pending','failed')\`,
    \`CREATE INDEX IF NOT EXISTS idx_outbox_destinatario
      ON outbox_whatsapp(destinatario_wa, enviado_en DESC)\`,

    // ③ STOCK MOVIMIENTOS — Kárdex
    \`CREATE TABLE IF NOT EXISTS stock_movimientos (
      id                      SERIAL PRIMARY KEY,
      producto_id             INTEGER REFERENCES catalogo_productos(id),
      pedido_id               INTEGER REFERENCES pedidos(id),
      tipo_movimiento         VARCHAR(30) NOT NULL,
      cantidad                INTEGER NOT NULL,
      unidad                  VARCHAR(20),
      stock_antes             INTEGER NOT NULL,
      stock_despues           INTEGER NOT NULL,
      costo_unitario_snapshot NUMERIC(12,2),
      metodo_valuacion        VARCHAR(20) DEFAULT 'costo_promedio',
      referencia_tipo         VARCHAR(30),
      referencia_id           VARCHAR(50),
      motivo                  TEXT,
      origen                  VARCHAR(20),
      creado_en               TIMESTAMPTZ DEFAULT NOW(),
      creado_por              VARCHAR(50)
    )\`,
    \`CREATE INDEX IF NOT EXISTS idx_stock_mov_producto
      ON stock_movimientos(producto_id, creado_en DESC)\`,
    \`CREATE INDEX IF NOT EXISTS idx_stock_mov_pedido
      ON stock_movimientos(pedido_id)\`,

    // ④ CALENDARIO OPERATIVO — días hábiles México
    \`CREATE TABLE IF NOT EXISTS calendario_operativo (
      fecha    DATE PRIMARY KEY,
      es_habil BOOLEAN NOT NULL DEFAULT true,
      motivo   TEXT,
      fuente   VARCHAR(50)
    )\`,

    // ⑤ AUDITORÍA CRON JOBS
    \`CREATE TABLE IF NOT EXISTS auditoria_cron_jobs (
      id                   SERIAL PRIMARY KEY,
      job_nombre           VARCHAR(50) NOT NULL,
      programado_en        TIMESTAMPTZ,
      ejecutado_en         TIMESTAMPTZ DEFAULT NOW(),
      estado               VARCHAR(20) DEFAULT 'ok',
      registros_procesados INTEGER DEFAULT 0,
      error_msg            TEXT,
      duracion_ms          INTEGER
    )\`,
    \`CREATE INDEX IF NOT EXISTS idx_cron_audit_job
      ON auditoria_cron_jobs(job_nombre, ejecutado_en DESC)\`,

    // ⑥ ALTER pedidos — columnas seguimiento WMS
    \`ALTER TABLE pedidos
      ADD COLUMN IF NOT EXISTS followup_1_enviado BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS followup_2_enviado BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS fecha_expiracion   TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS estado_stock       VARCHAR(20) DEFAULT 'apartado',
      ADD COLUMN IF NOT EXISTS en_ruta_desde      TIMESTAMPTZ\`,

    // ⑦ ALTER inventario — costo promedio
    \`ALTER TABLE inventario
      ADD COLUMN IF NOT EXISTS costo_promedio_actual NUMERIC(12,2)\`,

    // ⑧ ÍNDICES adicionales en pedidos para stock_apartado query
    \`CREATE INDEX IF NOT EXISTS idx_pedidos_estado_stock
      ON pedidos(estado, estado_stock)
      WHERE estado IN ('pendiente','confirmado','en_ruta')\`,
    \`CREATE INDEX IF NOT EXISTS idx_pedidos_expiracion
      ON pedidos(fecha_expiracion)
      WHERE estado NOT IN ('entregado','cancelado','expirado')\`
  ];

  for (const q of queries) {
    await pool.query(q);
  }
  console.log('[DB] WMS schema inicializado — 5 tablas + ALTERs OK');
}

module.exports = {`;

const result = content.replace(OLD, NEW_TABLES);

// Preview
const previewIdx = result.indexOf('TABLAS WMS');
console.log('\nPreview inserción:');
console.log('...' + result.substring(previewIdx - 5, previewIdx + 80) + '...');
console.log('\n✅ Patrón único confirmado. Escribiendo...');

fs.writeFileSync(FILE, result, { encoding: 'utf8' });
console.log('✅ db.js actualizado con 5 tablas WMS');
console.log('⚡ Siguiente: node --check db.js');
```

**PASO 1A.2 — Ejecutar script:**
```powershell
node "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\fix_fase1a_schema_v1.js"
```

**PASO 1A.3 — Verificar sintaxis:**
```powershell
node --check "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\db.js"
```

**PASO 1A.4 — Verificar módulos:**
```powershell
node -e "require('dotenv').config(); require('./meta'); require('./pedido'); require('./crm'); require('./cotizacion'); require('./tecnico'); require('./db'); require('./inventario'); require('./scheduler'); console.log('ALL OK');"
```

**PASO 1A.5 — Verificar que initWMSSchema() se llama en el arranque:**
```powershell
Select-String -Path "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\db.js" -Pattern "initSchema|initWMSSchema" -Context 0,0 | Select-Object LineNumber, Line | Format-Table -AutoSize
```
Si `initWMSSchema()` no se llama desde `initSchema()` → agregar llamada dentro de initSchema():
```javascript
// Al final de initSchema(), antes del return:
await initWMSSchema();
```

**PASO 1A.6 — Commit REGLA #12:**
```powershell
git add db.js fix_fase1a_schema_v1.js
git commit -m "FASE 1A: 5 tablas WMS + ALTER pedidos + ALTER inventario en initSchema"
git push origin master
git log --oneline -3
```

**VERIFICACIÓN POST-DEPLOY en Supabase:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'outbox_whatsapp','stock_movimientos',
  'mensajes_procesados','calendario_operativo','auditoria_cron_jobs'
);
-- Esperado: 5 filas

SELECT column_name FROM information_schema.columns
WHERE table_name = 'pedidos'
AND column_name IN (
  'followup_1_enviado','followup_2_enviado',
  'fecha_expiracion','estado_stock','en_ruta_desde'
);
-- Esperado: 5 filas
```

---

### ═══════════════════════════════════════════════════
### FASE 1B — FUNCIÓN RPC VIA SCRIPT NODE.JS
### ═══════════════════════════════════════════════════

Claude Code CLI no tiene acceso al SQL Editor de Supabase.
La RPC se despliega via script Node.js.

**PASO 1B.1 — Crear carpeta tools:**
```powershell
$toolsPath = "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\tools"
if (-not (Test-Path $toolsPath)) { New-Item -ItemType Directory -Path $toolsPath }
```

**PASO 1B.2 — Crear tools/deploy_rpc.js:**

Crear con Node.js (REGLA #21 — nunca PowerShell para archivos de código):
```javascript
// Crear via Node.js para evitar BOM/encoding issues
const fs = require('fs');
const content = `// tools/deploy_rpc.js
// Despliega función RPC confirmar_pedido_atomico en Supabase
// Ejecutar: node tools/deploy_rpc.js

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
  ssl: { rejectUnauthorized: false }
});

const SQL_RPC = \\\`
CREATE OR REPLACE FUNCTION confirmar_pedido_atomico(
  p_pedido_id INTEGER,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS \\$\\$
DECLARE
  v_item             JSONB;
  v_producto_id      INTEGER;
  v_cantidad         INTEGER;
  v_precio_unit      NUMERIC(12,2);
  v_stock_actual     INTEGER;
  v_stock_disponible INTEGER;
  v_stock_apartado   INTEGER;
  v_ids              INTEGER[];
  v_tipo_pedido      VARCHAR(20);
BEGIN
  -- Extraer y ordenar producto_ids ASCENDENTE (previene deadlock)
  SELECT ARRAY_AGG(DISTINCT (item->>'producto_id')::INTEGER
         ORDER BY (item->>'producto_id')::INTEGER)
  INTO v_ids
  FROM JSONB_ARRAY_ELEMENTS(p_items) AS item
  WHERE (item->>'producto_id') IS NOT NULL;

  IF v_ids IS NULL OR ARRAY_LENGTH(v_ids, 1) = 0 THEN
    RETURN JSONB_BUILD_OBJECT(
      'success', false,
      'error', 'NO_PRODUCTO_IDS'
    );
  END IF;

  -- Lock en orden ASC (elimina race condition)
  PERFORM id FROM inventario
  WHERE producto_id = ANY(v_ids)
  ORDER BY producto_id ASC
  FOR UPDATE;

  SELECT tipo INTO v_tipo_pedido FROM pedidos WHERE id = p_pedido_id;

  -- Validar stock por cada item
  FOR v_item IN SELECT * FROM JSONB_ARRAY_ELEMENTS(p_items)
  LOOP
    v_producto_id := (v_item->>'producto_id')::INTEGER;
    v_cantidad    := (v_item->>'qty')::INTEGER;
    IF v_producto_id IS NULL THEN CONTINUE; END IF;

    SELECT stock INTO v_stock_actual
    FROM inventario WHERE producto_id = v_producto_id;

    SELECT COALESCE(SUM((item->>'qty')::INTEGER), 0)
    INTO v_stock_apartado
    FROM pedidos, JSONB_ARRAY_ELEMENTS(items_json) AS item
    WHERE estado IN ('pendiente','confirmado','en_ruta')
      AND id != p_pedido_id
      AND (item->>'producto_id')::INTEGER = v_producto_id;

    v_stock_disponible := COALESCE(v_stock_actual,0) - v_stock_apartado;

    IF v_stock_disponible < v_cantidad THEN
      RETURN JSONB_BUILD_OBJECT(
        'success', false,
        'error', 'STOCK_INSUFICIENTE',
        'producto_id', v_producto_id,
        'stock_disponible', v_stock_disponible,
        'cantidad_solicitada', v_cantidad
      );
    END IF;
  END LOOP;

  -- Confirmar pedido
  UPDATE pedidos SET
    estado        = 'confirmado',
    confirmado_en = NOW(),
    estado_stock  = 'apartado',
    fecha_expiracion = CASE
      WHEN v_tipo_pedido = 'recoger'   THEN NOW() + INTERVAL '3 days'
      WHEN v_tipo_pedido = 'domicilio' THEN NOW() + INTERVAL '1 day'
      ELSE NOW() + INTERVAL '3 days'
    END,
    actualizado_en = NOW()
  WHERE id = p_pedido_id;

  -- Registrar en Kárdex
  FOR v_item IN SELECT * FROM JSONB_ARRAY_ELEMENTS(p_items)
  LOOP
    v_producto_id := (v_item->>'producto_id')::INTEGER;
    v_cantidad    := (v_item->>'qty')::INTEGER;
    v_precio_unit := (v_item->>'precio')::NUMERIC;
    IF v_producto_id IS NULL THEN CONTINUE; END IF;
    SELECT stock INTO v_stock_actual FROM inventario WHERE producto_id = v_producto_id;
    INSERT INTO stock_movimientos (
      producto_id, pedido_id, tipo_movimiento, cantidad, unidad,
      stock_antes, stock_despues, costo_unitario_snapshot,
      referencia_tipo, referencia_id, origen, creado_por
    ) VALUES (
      v_producto_id, p_pedido_id, 'apartado', v_cantidad,
      COALESCE(v_item->>'unidad','pza'),
      v_stock_actual, v_stock_actual, v_precio_unit,
      'pedido', p_pedido_id::TEXT, 'bot', 'sistema'
    );
  END LOOP;

  RETURN JSONB_BUILD_OBJECT('success', true, 'pedido_id', p_pedido_id);

EXCEPTION WHEN OTHERS THEN
  RETURN JSONB_BUILD_OBJECT('success', false, 'error', SQLERRM);
END;
\\$\\$;
\\\`;

async function deployRPC() {
  const client = await pool.connect();
  try {
    console.log('Desplegando RPC confirmar_pedido_atomico...');
    await client.query(SQL_RPC);
    const check = await client.query(\\\`
      SELECT routine_name FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name = 'confirmar_pedido_atomico'
    \\\`);
    if (check.rows.length > 0) {
      console.log('RPC desplegada OK:', check.rows[0].routine_name);
    } else {
      console.error('ERROR: RPC no encontrada post-deploy');
      process.exit(1);
    }
  } catch(err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

deployRPC();
`;
fs.writeFileSync(
  'C:\\\\Projects\\\\materialespro-enterprise-v10\\\\materialespro-enterprise-v10\\\\whatsapp-bot-gdl\\\\tools\\\\deploy_rpc.js',
  content,
  { encoding: 'utf8' }
);
console.log('tools/deploy_rpc.js creado OK');
```

**PASO 1B.3 — Ejecutar deploy:**
```powershell
node "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\tools\deploy_rpc.js"
```

**PASO 1B.4 — Commit REGLA #12:**
```powershell
git add tools/deploy_rpc.js
git commit -m "FASE 1B: RPC confirmar_pedido_atomico con FOR UPDATE anti-deadlock"
git push origin master
git log --oneline -3
```

---

### ═══════════════════════════════════════════════════
### FASE 1C — OUTBOX WORKER en scheduler.js
### ═══════════════════════════════════════════════════

**PASO 1C.1 — Verificar estado actual de scheduler.js:**
```powershell
Select-String -Path "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\scheduler.js" -Pattern "module.exports|processOutbox|bottleneck|setInterval" -Context 0,0 | Select-Object LineNumber, Line | Format-Table -AutoSize
```

**PASO 1C.2 — Verificar bottleneck instalado:**
```powershell
node -e "require('bottleneck'); console.log('bottleneck OK')"
```
Si falla:
```powershell
npm install bottleneck
```

**PASO 1C.3 — Crear fix_fase1c_outbox_v1.js:**

```javascript
// fix_fase1c_outbox_v1.js
// FASE 1C: Agregar processOutbox() a scheduler.js
// REGLA #7 #38: dry-run, patrón único
// REGLA #6: script controlado

const fs = require('fs');
const BASE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\';
const FILE = BASE + 'scheduler.js';

const content = fs.readFileSync(FILE, 'utf8');

// Insertar ANTES de module.exports (posición segura REGLA #36)
const OLD = 'module.exports = {';
const count = content.split(OLD).length - 1;
console.log('\n=== DRY-RUN SCHEDULER.JS — FASE 1C ===');
console.log('module.exports encontrado:', count, 'vez/veces');

if (count !== 1) {
  console.error('❌ ABORT');
  process.exit(1);
}

const OUTBOX_CODE = `
// ─────────────────────────────────────────────────────────────────
//  OUTBOX WORKER — Mensajes WhatsApp salientes
//  Rate limits Meta: 80 mps global, 1 msg/6s por destinatario
//  SKIP LOCKED: evita procesamiento doble en restart Render
// ─────────────────────────────────────────────────────────────────
const Bottleneck = require('bottleneck');
const _outboxLimiter = new Bottleneck({ minTime: 1000 }); // 1 msg/seg global

async function processOutbox() {
  const { pool }            = require('./db');
  const { sendMetaWAMessage } = require('./meta');
  let client;

  try {
    client = await pool.connect();

    // Reclamar 1 mensaje FIFO — SKIP LOCKED evita doble procesamiento
    const res = await client.query(\`
      SELECT * FROM outbox_whatsapp
      WHERE estado = 'pending'
        AND next_attempt_at <= NOW()
      ORDER BY creado_en ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    \`);

    if (res.rows.length === 0) { client.release(); return; }

    const msg = res.rows[0];

    // Marcar processing ANTES de enviar — liberar lock rápido
    await client.query(\`
      UPDATE outbox_whatsapp
      SET estado = 'processing', intentos = intentos + 1
      WHERE id = $1
    \`, [msg.id]);

    // COMMIT aquí — lock liberado ANTES de llamar Meta API
    client.release();
    client = null;

    // ── Throttling por destinatario (pair rate limit Meta error 131056)
    const lastRes = await pool.query(\`
      SELECT MAX(enviado_en) as last
      FROM outbox_whatsapp
      WHERE destinatario_wa = $1 AND estado = 'sent'
    \`, [msg.destinatario_wa]);

    const last = lastRes.rows[0]?.last;
    if (last) {
      const secsAgo = (Date.now() - new Date(last).getTime()) / 1000;
      if (secsAgo < 6) {
        // Demasiado pronto — reprogramar SIN incrementar intentos
        await pool.query(\`
          UPDATE outbox_whatsapp
          SET estado = 'pending',
              intentos = intentos - 1,
              next_attempt_at = NOW() + INTERVAL '6 seconds'
          WHERE id = $1
        \`, [msg.id]);
        return;
      }
    }

    // ── Enviar via Meta API con throttling global Bottleneck
    try {
      await _outboxLimiter.schedule(async () => {
        const numero = msg.destinatario_wa.replace('+','').replace(/\\s/g,'');
        await sendMetaWAMessage(numero, msg.mensaje);
      });

      // Éxito
      await pool.query(\`
        UPDATE outbox_whatsapp
        SET estado = 'sent', enviado_en = NOW(),
            ultimo_error_codigo = NULL, ultimo_error_msg = NULL
        WHERE id = $1
      \`, [msg.id]);
      console.log('[OUTBOX] Enviado OK:', msg.tipo, msg.destinatario_wa);

    } catch (metaErr) {
      const errCode = metaErr.response?.data?.error?.code?.toString() || 'UNKNOWN';
      const errMsg  = metaErr.message || 'Error desconocido';

      // Backoff exponencial con jitter
      const baseDelay  = Math.pow(2, msg.intentos) * 60;
      const jitter     = Math.floor(Math.random() * 30);
      const nextDelay  = Math.min(baseDelay + jitter, 3600);
      const maxAlcanzado = msg.intentos >= msg.max_intentos;

      await pool.query(\`
        UPDATE outbox_whatsapp
        SET estado = $1,
            ultimo_error_codigo = $2, ultimo_error_msg = $3,
            next_attempt_at = NOW() + ($4 || ' seconds')::INTERVAL
        WHERE id = $5
      \`, [
        maxAlcanzado ? 'dead_letter' : 'failed',
        errCode, errMsg, nextDelay.toString(), msg.id
      ]);

      if (maxAlcanzado) {
        console.error('[OUTBOX] DEAD LETTER — max intentos:', msg.id, errCode);
      } else {
        console.warn('[OUTBOX] Fallo intento', msg.intentos, '— retry en', nextDelay+'s:', errCode);
      }
    }

  } catch (err) {
    if (client) client.release();
    console.error('[OUTBOX] Error inesperado:', err.message);
  }
}

// Job outbox: cada 30 segundos
setInterval(processOutbox, 30 * 1000);

module.exports = {`;

const result = content.replace(OLD, OUTBOX_CODE);
const previewIdx = result.indexOf('OUTBOX WORKER');
console.log('\nPreview:');
console.log('...' + result.substring(previewIdx - 5, previewIdx + 60) + '...');
console.log('\n✅ Escribiendo scheduler.js...');
fs.writeFileSync(FILE, result, { encoding: 'utf8' });
console.log('✅ scheduler.js actualizado con outbox worker');
console.log('⚡ Siguiente: node --check scheduler.js');
```

**PASO 1C.4 — Ejecutar:**
```powershell
node "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\fix_fase1c_outbox_v1.js"
```

**PASO 1C.5 — Verificar:**
```powershell
node --check "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\scheduler.js"
```

**PASO 1C.6 — Commit REGLA #12:**
```powershell
git add scheduler.js package.json package-lock.json fix_fase1c_outbox_v1.js
git commit -m "FASE 1C: outbox worker SKIP LOCKED + throttling Meta API + dead letter"
git push origin master
git log --oneline -3
```

---

### ═══════════════════════════════════════════════════
### FASE 1D — RECONCILIACIÓN + PURGA en scheduler.js
### ═══════════════════════════════════════════════════

**PASO 1D.1 — Crear fix_fase1d_reconcil_v1.js:**

```javascript
// fix_fase1d_reconcil_v1.js
// FASE 1D: reconciliarPedidosVencidos() + purgaMensajesProcesados()
// REGLA #7 #38: dry-run

const fs = require('fs');
const BASE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\';
const FILE = BASE + 'scheduler.js';

const content = fs.readFileSync(FILE, 'utf8');

const OLD = 'module.exports = {';
const count = content.split(OLD).length - 1;
console.log('\n=== DRY-RUN SCHEDULER.JS — FASE 1D ===');
console.log('module.exports encontrado:', count, 'vez/veces');
if (count !== 1) { console.error('❌ ABORT'); process.exit(1); }

const RECONCIL_CODE = `
// ─────────────────────────────────────────────────────────────────
//  RECONCILIACIÓN — Libera stock apartado de pedidos expirados
//  Corre cada 15 min — eventualmente consistente
//  No depende de timing exacto: fecha_expiracion < NOW()
// ─────────────────────────────────────────────────────────────────
async function reconciliarPedidosVencidos() {
  const inicio = Date.now();
  const { pool } = require('./db');
  let procesados = 0;

  try {
    // Verificar día hábil (no enviar mensajes en feriados)
    const diaRes = await pool.query(\`
      SELECT COALESCE(
        (SELECT es_habil FROM calendario_operativo WHERE fecha = CURRENT_DATE),
        EXTRACT(DOW FROM NOW() AT TIME ZONE 'America/Mexico_City') NOT IN (0)
      ) as es_habil
    \`);
    const esHabil = diaRes.rows[0]?.es_habil !== false;

    // Pedidos con fecha_expiracion vencida y stock aún apartado
    const vencidos = await pool.query(\`
      SELECT p.id, p.folio, p.tipo,
             c.whatsapp as cliente_wa, c.nombre as cliente_nombre
      FROM pedidos p
      LEFT JOIN clientes c ON c.id = p.cliente_id
      WHERE p.fecha_expiracion < NOW()
        AND p.estado IN ('pendiente','confirmado')
        AND p.estado_stock = 'apartado'
      LIMIT 50
    \`);

    for (const pedido of vencidos.rows) {
      try {
        await pool.query(\`
          UPDATE pedidos SET
            estado = 'expirado', estado_stock = 'liberado',
            actualizado_en = NOW()
          WHERE id = $1
        \`, [pedido.id]);

        if (esHabil && pedido.cliente_wa) {
          await pool.query(\`
            INSERT INTO outbox_whatsapp
              (pedido_id, tipo, destinatario_wa, mensaje, idempotency_key)
            VALUES ($1, 'expiracion', $2, $3, $4)
            ON CONFLICT (idempotency_key) DO NOTHING
          \`, [
            pedido.id,
            pedido.cliente_wa,
            'Hola ' + (pedido.cliente_nombre||'') + '! Tu pedido ' + pedido.folio +
            ' fue liberado por inactividad. Si aún necesitas el material, con gusto verificamos existencias. \uD83D\uDE0A',
            'exp-' + pedido.id + '-cliente'
          ]);
        }

        procesados++;
        console.log('[RECONCIL] Liberado:', pedido.folio);
      } catch (itemErr) {
        console.error('[RECONCIL] Error en pedido', pedido.folio, itemErr.message);
      }
    }

    await pool.query(\`
      INSERT INTO auditoria_cron_jobs
        (job_nombre, estado, registros_procesados, duracion_ms)
      VALUES ('reconciliar_vencidos', 'ok', $1, $2)
    \`, [procesados, Date.now() - inicio]);

    if (procesados > 0) console.log('[RECONCIL]', procesados, 'pedidos liberados');

  } catch (err) {
    console.error('[RECONCIL] Error:', err.message);
    try {
      const { pool } = require('./db');
      await pool.query(\`
        INSERT INTO auditoria_cron_jobs (job_nombre, estado, error_msg, duracion_ms)
        VALUES ('reconciliar_vencidos', 'failed', $1, $2)
      \`, [err.message, Date.now() - inicio]);
    } catch(_){}
  }
}

// Reconciliación: cada 15 minutos
setInterval(reconciliarPedidosVencidos, 15 * 60 * 1000);

// ─────────────────────────────────────────────────────────────────
//  PURGA — Evitar crecimiento infinito de mensajes_procesados
// ─────────────────────────────────────────────────────────────────
async function purgaMensajesProcesados() {
  try {
    const { pool } = require('./db');
    const res = await pool.query(\`
      DELETE FROM mensajes_procesados
      WHERE procesado_en < NOW() - INTERVAL '7 days'
    \`);
    if (res.rowCount > 0) console.log('[PURGA]', res.rowCount, 'mensajes eliminados');
  } catch (err) {
    console.error('[PURGA] Error:', err.message);
  }
}

// Purga: cada 24 horas
setInterval(purgaMensajesProcesados, 24 * 60 * 60 * 1000);

module.exports = {`;

const result = content.replace(OLD, RECONCIL_CODE);
const previewIdx = result.indexOf('RECONCILIACIÓN');
console.log('\nPreview:');
console.log('...' + result.substring(previewIdx - 5, previewIdx + 60) + '...');
console.log('\n✅ Escribiendo...');
fs.writeFileSync(FILE, result, { encoding: 'utf8' });
console.log('✅ scheduler.js actualizado con reconciliación + purga');
console.log('⚡ Siguiente: node --check scheduler.js');
```

**PASO 1D.2 — Ejecutar:**
```powershell
node "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\fix_fase1d_reconcil_v1.js"
```

**PASO 1D.3 — Verificar:**
```powershell
node --check "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\scheduler.js"
```

**PASO 1D.4 — Commit REGLA #12:**
```powershell
git add scheduler.js fix_fase1d_reconcil_v1.js
git commit -m "FASE 1D: reconciliacion vencidos + purga mensajes cada 15min"
git push origin master
git log --oneline -3
```

---

### ═══════════════════════════════════════════════════
### FASE 1E — buildCatalogText() con stock_disponible
### ═══════════════════════════════════════════════════

**REGLA #26 — Verificar propagación ANTES:**
```powershell
Select-String -Path "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\server.js" -Pattern "buildCatalogText|buildSystemPrompt|getAIResponse|CATALOG_TXT|getCatalog" -Context 0,0 | Select-Object LineNumber, Line | Format-Table -AutoSize
```

**CRÍTICO — ANTI N+1:**
NUNCA query por producto dentro de buildCatalogText().
800 productos = 800 queries por mensaje = colapso Supabase Free.
SOLUCIÓN: 1 query batch → Map en memoria → buildCatalogText() sigue SINCRÓNICA.

**PASO 1E.1 — Leer buildCatalogText() actual completo:**
```powershell
Get-Content "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\server.js" | Select-Object -Index (120..180)
```

**PASO 1E.2 — Crear fix_fase1e_stock_catalog_v1.js:**

```javascript
// fix_fase1e_stock_catalog_v1.js
// FASE 1E: getStockMap() batch + stock en buildCatalogText()
// REGLA #7 #38: dry-run obligatorio
// REGLA #9: preservar CRLF en server.js
// CRÍTICO: buildCatalogText() SIGUE siendo sincrónica

const fs = require('fs');
const BASE = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\';
const FILE = BASE + 'server.js';

// Leer como Buffer para preservar CRLF (REGLA #9)
const raw     = fs.readFileSync(FILE);
const content = raw.toString('utf8');

console.log('\n=== DRY-RUN SERVER.JS — FASE 1E ===');
console.log('CRLF en server.js:', raw.indexOf(13) > -1);

// ── INSERCIÓN 1: getStockMap() antes de buildSystemPrompt ─────────────
// Buscar la línea de buildSystemPrompt para insertar antes
const OLD1 = 'function buildSystemPrompt(';
const c1   = content.split(OLD1).length - 1;
console.log('\nPatrón buildSystemPrompt encontrado:', c1, 'vez/veces');
if (c1 !== 1) { console.error('❌ ABORT'); process.exit(1); }

const STOCK_MAP_CODE = `// ─────────────────────────────────────────────────────────────────
//  STOCK MAP — Batch query única para todos los productos
//  Retorna Map<producto_id, stock_disponible>
//  stock_disponible = stock_real - stock_apartado (pedidos activos)
//  Cacheado 60 segundos para no impactar latencia del bot
// ─────────────────────────────────────────────────────────────────
var _stockMapCache = null;
var _stockMapCachedAt = 0;
var STOCK_MAP_TTL = 60 * 1000; // 60 segundos

async function getStockMap() {
  var now = Date.now();
  if (_stockMapCache && (now - _stockMapCachedAt) < STOCK_MAP_TTL) {
    return _stockMapCache;
  }
  try {
    var { pool } = require('./db');
    var res = await pool.query(\`
      SELECT
        inv.producto_id,
        inv.stock as stock_real,
        COALESCE(ap.total_apartado, 0) as stock_apartado,
        inv.stock - COALESCE(ap.total_apartado, 0) as stock_disponible
      FROM inventario inv
      LEFT JOIN (
        SELECT
          (item->>'producto_id')::INTEGER as producto_id,
          SUM((item->>'qty')::INTEGER) as total_apartado
        FROM pedidos,
             JSONB_ARRAY_ELEMENTS(items_json) AS item
        WHERE estado IN ('pendiente','confirmado','en_ruta')
          AND (item->>'producto_id') IS NOT NULL
          AND creado_en > NOW() - INTERVAL '30 days'
        GROUP BY (item->>'producto_id')::INTEGER
      ) ap ON ap.producto_id = inv.producto_id
    \`);
    var map = new Map();
    for (var i = 0; i < res.rows.length; i++) {
      var row = res.rows[i];
      map.set(row.producto_id, Math.max(0, parseInt(row.stock_disponible) || 0));
    }
    _stockMapCache    = map;
    _stockMapCachedAt = now;
    return map;
  } catch (err) {
    console.error('[STOCK MAP] Error:', err.message);
    return _stockMapCache || new Map();
  }
}

function buildSystemPrompt(`;

const result1 = content.replace(OLD1, STOCK_MAP_CODE);
console.log('\nPreview getStockMap():');
const pi1 = result1.indexOf('STOCK MAP');
console.log('...' + result1.substring(pi1 - 5, pi1 + 60) + '...');

// ── INSERCIÓN 2: parámetro stockMap en buildCatalogText ───────────────
// AJUSTAR según la firma exacta vista en PASO 1E.1
const OLD2 = 'function buildCatalogText(cat, nivelInfo) {';
const c2   = result1.split(OLD2).length - 1;
console.log('\nPatrón buildCatalogText encontrado:', c2, 'vez/veces');
if (c2 !== 1) {
  console.error('❌ ABORT — buildCatalogText no encontrado exactamente 1 vez');
  console.error('Ajustar OLD2 con la firma exacta del archivo');
  process.exit(1);
}
const NEW2 = 'function buildCatalogText(cat, nivelInfo, stockMap) {';
const result2 = result1.replace(OLD2, NEW2);

// ── INSERCIÓN 3: usar stockMap en getAIResponse ───────────────────────
// Buscar donde se llama buildSystemPrompt en getAIResponse
// AJUSTAR OLD3 según línea exacta vista con Select-String
const OLD3 = 'system: buildSystemPrompt(clientName, channel, nivelInfo),';
const c3   = result2.split(OLD3).length - 1;
console.log('\nPatrón buildSystemPrompt call encontrado:', c3, 'vez/veces');
if (c3 < 1) {
  console.warn('⚠️ Patrón buildSystemPrompt call no encontrado — revisar manualmente');
  console.warn('Buscar dónde se llama buildSystemPrompt y agregar stockMap manualmente');
}

let result3 = result2;
if (c3 >= 1) {
  const NEW3 = `stockMap = await getStockMap(),
      system: buildSystemPrompt(clientName, channel, nivelInfo, stockMap),`;
  result3 = result2.replace(OLD3, NEW3);
}

// Verificar CRLF preservado
console.log('\nEscribiendo server.js...');
fs.writeFileSync(FILE, result3, { encoding: 'utf8' });
const written = fs.readFileSync(FILE);
console.log('CRLF preserved:', written.indexOf(13) > -1);
console.log('✅ server.js actualizado con getStockMap() batch');
console.log('⚡ Siguiente: node --check server.js');
```

**PASO 1E.3 — Ejecutar:**
```powershell
node "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\fix_fase1e_stock_catalog_v1.js"
```

**PASO 1E.4 — Verificar:**
```powershell
node --check "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\server.js"
```

**PASO 1E.5 — REGLA #26: verificar que buildCatalogText() usa stockMap correctamente:**
```powershell
Get-Content "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\server.js" | Select-Object -Index (120..180)
```
Confirmar visualmente que:
- `getStockMap()` existe antes de `buildSystemPrompt()`
- `buildCatalogText()` recibe `stockMap` como tercer parámetro
- `CATALOG_TXT` (caché global) sigue funcionando para casos sin nivelInfo

**PASO 1E.6 — Commit REGLA #12:**
```powershell
git add server.js fix_fase1e_stock_catalog_v1.js
git commit -m "FASE 1E: stock disponible en catalogo — batch query anti N+1 cache 60s"
git push origin master
git log --oneline -3
```

---

## ✅ VERIFICACIÓN FINAL COMPLETA

**Módulos:**
```powershell
cd "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl"
node -e "require('dotenv').config(); require('./meta'); require('./pedido'); require('./crm'); require('./cotizacion'); require('./tecnico'); require('./db'); require('./inventario'); require('./scheduler'); console.log('ALL OK');"
```

**Sintaxis todos los archivos:**
```powershell
node --check "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\server.js"
node --check "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\pedido.js"
node --check "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\scheduler.js"
node --check "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl\db.js"
```

**Git log final REGLA #12:**
```powershell
git log --oneline -8
```
Resultado esperado: 6 commits FASE 0 → FASE 1E visibles.

**DB Supabase — verificación final:**
```sql
-- 5 tablas WMS:
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('outbox_whatsapp','stock_movimientos',
  'mensajes_procesados','calendario_operativo','auditoria_cron_jobs');

-- RPC desplegada:
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'confirmar_pedido_atomico';

-- items_json enriquecido (hacer pedido de prueba primero):
SELECT items_json->0->>'codigo', items_json->0->>'producto_id'
FROM pedidos ORDER BY creado_en DESC LIMIT 3;
```

---

## 🚨 PROTOCOLO SI ALGO FALLA — REGLA #40

**Si `node --check` falla después de escribir:**
```powershell
git checkout [archivo-modificado]
node --check [archivo-modificado]
```
Luego reportar:
1. Fase donde falló
2. Script ejecutado y su output completo
3. Archivo involucrado + línea del error
4. Mensaje de error completo
5. Resultado de `git log --oneline -3`

**Si un script de fix falla en dry-run (patrón != 1):**
- NO modificar el OLD pattern manualmente
- Reportar las líneas debug que imprimió el script
- Esperar nuevo script con patrón corregido

NO continuar a siguiente fase.
NO improvisar soluciones arquitectónicas.
NO fixear el fix inline — siempre rollback primero.
Esperar instrucciones del chef d'orchestre.

---

## 📋 RESUMEN DE COMMITS ESPERADOS

```
FASE 0:  "FASE 0: enriquecer items_json con codigo+producto_id anti-circular"
FASE 1A: "FASE 1A: 5 tablas WMS + ALTER pedidos + ALTER inventario en initSchema"
FASE 1B: "FASE 1B: RPC confirmar_pedido_atomico con FOR UPDATE anti-deadlock"
FASE 1C: "FASE 1C: outbox worker SKIP LOCKED + throttling Meta API + dead letter"
FASE 1D: "FASE 1D: reconciliacion vencidos + purga mensajes cada 15min"
FASE 1E: "FASE 1E: stock disponible en catalogo — batch query anti N+1 cache 60s"
```

6 commits atómicos — desplegables y reversibles independientemente.
