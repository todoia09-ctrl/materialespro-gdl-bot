# 🚀 Guía de Deploy — MaterialesPro GDL WhatsApp Bot
## De cero a producción en ~30 minutos

---

## PASO 1 — Crear cuenta Twilio (gratis, 5 min)

1. Ve a https://www.twilio.com/try-twilio
2. Regístrate con tu email
3. En el dashboard busca: **Messaging → Try it out → Send a WhatsApp message**
4. Aparecerá el **Sandbox de WhatsApp**:
   - Anota tu `Account SID` y `Auth Token` (los necesitas para el .env)
   - El número del sandbox siempre es: `+1 415 523 8886`
5. Para activar tu número personal en el sandbox:
   - Manda un WhatsApp al `+1 415 523 8886` con el código que te muestra Twilio
   - Ej: `join silver-eagle` (el tuyo será diferente)
   - ✅ Ya puedes recibir mensajes del bot en tu WhatsApp

---

## PASO 2 — Crear cuenta Railway (gratis, 3 min)

1. Ve a https://railway.app
2. Entra con tu cuenta de GitHub
3. Click en **New Project → Deploy from GitHub repo**
4. Sube este código a un repo de GitHub primero (siguiente paso)

---

## PASO 3 — Subir código a GitHub (5 min)

```bash
# En tu computadora, entra a la carpeta del proyecto
cd whatsapp-bot-gdl

# Inicia git
git init
git add .
git commit -m "MaterialesPro Bot v1"

# Crea un repo en github.com y conecta:
git remote add origin https://github.com/TU_USUARIO/materialespro-bot.git
git push -u origin main
```

---

## PASO 4 — Deploy en Railway (5 min)

1. En Railway → **New Project → Deploy from GitHub repo**
2. Selecciona tu repo `materialespro-bot`
3. Railway detecta automáticamente que es Node.js
4. Ve a **Variables** y agrega estas 4 variables:

```
ANTHROPIC_API_KEY    = sk-ant-XXXX (de console.anthropic.com)
TWILIO_ACCOUNT_SID   = ACxxxx (de console.twilio.com)
TWILIO_AUTH_TOKEN    = xxxx (de console.twilio.com)
TWILIO_WHATSAPP_FROM = whatsapp:+14155238886
```

5. Railway hace deploy automático en ~2 minutos
6. Copia la URL que te da Railway, ej: `https://materialespro-bot.up.railway.app`

---

## PASO 5 — Conectar Twilio con Railway (2 min)

1. En Twilio → **Messaging → Sandbox for WhatsApp**
2. En el campo **"When a message comes in"** pega:
   ```
   https://materialespro-bot.up.railway.app/webhook
   ```
3. Método: **HTTP POST**
4. Guarda

---

## PASO 6 — Prueba el bot ✅

Manda un WhatsApp al `+1 415 523 8886` y escribe:
- `Hola` → debe responder en <1 segundo
- `Quiero cotizar adhesivo para 50m²` → cotización automática
- `¿Tienen texturizado para fachada?` → descripción + precio

---

## COSTOS MENSUALES ESTIMADOS

| Servicio       | Costo          | Notas                          |
|----------------|----------------|--------------------------------|
| Railway        | ~$250 MXN      | Plan Hobby $5 USD/mes          |
| Twilio         | ~$0–150 MXN    | $0.005 USD por mensaje enviado |
| Anthropic API  | ~$100–400 MXN  | Haiku ~$0.0001 por mensaje     |
| **TOTAL**      | **~$350–800 MXN/mes** | vs $12,497 MXN de Kosmo |

---

## PARA PRODUCCIÓN (cuando tengas más clientes)

Cambiar de Twilio Sandbox a número real:
1. En Twilio compra un número con WhatsApp habilitado (~$15 USD/mes)
2. O aplica a Meta Business API directamente (gratis, 1-2 semanas aprobación)
3. Actualiza `TWILIO_WHATSAPP_FROM` en Railway con el nuevo número

---

## PERSONALIZAR EL BOT

Para cambiar precios, agregar productos o modificar respuestas:
1. Edita el `SYSTEM_PROMPT` en `server.js` (línea ~30)
2. Agrega entradas al `CACHE` para más respuestas instantáneas (línea ~70)
3. Haz commit y push → Railway hace redeploy automático en 2 min

---

## SOPORTE

Si algo falla, revisa los logs en Railway → tu proyecto → **Deployments → View Logs**
