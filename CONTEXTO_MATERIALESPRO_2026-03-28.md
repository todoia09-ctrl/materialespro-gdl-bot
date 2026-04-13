# MaterialesPro GDL — Contexto Sesión 2026-03-28

---

## 📁 RUTA DEL PROYECTO

```
C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl
```

---

## 📦 ARCHIVOS DEL BOT (10 archivos JS — todos validados ✅)

| Archivo | Tamaño | Rol |
|---|---|---|
| server.js | 20.4 KB | Core / entrada principal |
| pedido.js | 23.6 KB | Flujo de órdenes |
| cotizacion.js | 15.3 KB | Generación de cotizaciones |
| api.js | 13.9 KB | Integraciones externas |
| crm.js | 9.5 KB | CRM / clientes |
| tecnico.js | 10.7 KB | Atención técnica |
| scheduler.js | 7.8 KB | Tareas programadas |
| campanas.js | 8.2 KB | Campañas masivas |
| inventario.js | 6.0 KB | Control de stock |
| db.js | 7.5 KB | Capa de base de datos |

---

## ✅ LO QUE SE HIZO HOY

1. ✅ Ruta nueva confirmada: `C:\Projects\...\whatsapp-bot-gdl`
2. ✅ `npm install` — 232 paquetes instalados
3. ✅ Vulnerabilidades resueltas — `nodemailer` actualizado a 8.0.4
4. ✅ `node --check` — 10/10 archivos pasan sintaxis
5. ✅ `.env` creado desde `.env.example`
6. ✅ Anthropic API Key configurada (nueva)
7. ✅ Twilio SID + Auth Token configurados (token regenerado)
8. ✅ Supabase creado — DATABASE_URL configurada en `.env`
9. ⚠️ Bot arrancó parcialmente — falta matar proceso en puerto 3000

---

## ⚠️ PENDIENTE PARA MAÑANA

### 1. Primer arranque limpio (5 min)
```powershell
cd "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl"
netstat -ano | findstr ":3000"
taskkill /PID XXXX /F
node server.js
```

### 2. Verificar que arranque sin errores
El bot debería mostrar:
```
🚀 MaterialesPro GDL Enterprise v10 → puerto 3000
📦 Productos: 10
🗄️  Dashboard: /dashboard
✅ DB conectada
✅ Twilio OK
[SCHEDULER] Jobs activos ✅
```

### 3. Configurar variables faltantes en .env
| Variable | Estado |
|---|---|
| `ANTHROPIC_API_KEY` | ✅ Configurada |
| `TWILIO_ACCOUNT_SID` | ✅ Configurado |
| `TWILIO_AUTH_TOKEN` | ✅ Configurado |
| `DATABASE_URL` | ✅ Supabase |
| `OPENAI_API_KEY` | ❌ Pendiente |
| `META_PAGE_ACCESS_TOKEN` | ❌ Pendiente |
| `CLOUDINARY_*` | ❌ Pendiente |
| `EMAIL_HOST/USER/PASS` | ❌ Pendiente |
| `VENDOR_WHATSAPP` | ✅ Configurado |
| `BANK_*` | ❌ Pendiente |

### 4. Conectar Twilio Sandbox WhatsApp
- Ir a: https://console.twilio.com
- Messaging → Try it out → Send a WhatsApp message
- Conectar celular al sandbox
- Probar primer mensaje al bot

### 5. Crear tablas en Supabase
- El bot necesita inicializar el schema de DB
- Pendiente revisar si `db.js` tiene auto-migrate o requiere script

---

## 🔑 SERVICIOS Y LINKS

| Servicio | Link | Estado |
|---|---|---|
| Anthropic | https://console.anthropic.com/settings/keys | ✅ |
| Twilio | https://console.twilio.com | ✅ |
| Supabase | https://supabase.com/dashboard | ✅ |
| Cloudinary | https://cloudinary.com/users/register_free | ❌ Pendiente |
| OpenAI | https://platform.openai.com/api-keys | ❌ Pendiente |

---

## 🚀 COMANDOS DE INICIO (siempre desde esta ruta)

```powershell
cd "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl"
node server.js
```

---

## ⚠️ REGLAS DE SEGURIDAD

- **NUNCA pegar API keys, tokens o passwords en el chat**
- Solo decir "listo" después de guardar en `.env`
- El `.env` NUNCA debe subirse a GitHub

---

## 💬 CÓMO EMPEZAR EL NUEVO CHAT

Pega este mensaje:

> "Eres mi Senior CTO y engineer para MaterialesPro GDL, bot de ventas WhatsApp/Instagram/Facebook para negocio de materiales de construcción en Zapopan. Adjunto el archivo CONTEXTO_MATERIALESPRO_2026-03-28.md con el estado actual. Lee y confirma antes de continuar."

Luego adjunta este archivo y arranca con:

```powershell
cd "C:\Projects\materialespro-enterprise-v10\materialespro-enterprise-v10\whatsapp-bot-gdl"
netstat -ano | findstr ":3000"
```
