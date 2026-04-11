// fix_orphan_catch_v2.js
// Elimina el } catch huérfano que quedó después del bloque importar-stock

const fs = require('fs');
const path = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\dashboard\\api.js';

let api = fs.readFileSync(path, 'utf8');

// El patrón huérfano: cierre del importar-stock + catch suelto + });
// Intentar LF primero, luego CRLF
const OLD_LF   = '\n\n  } catch (e) { res.status(500).json({ error: e.message }); }\n});\n\n// ─────';
const NEW_LF   = '\n\n// ─────';
const OLD_CRLF = '\r\n\r\n  } catch (e) { res.status(500).json({ error: e.message }); }\r\n});\r\n\r\n// ─────';
const NEW_CRLF = '\r\n\r\n// ─────';

if (api.includes(OLD_LF)) {
  api = api.replace(OLD_LF, NEW_LF);
  console.log('✅ Eliminado con LF');
} else if (api.includes(OLD_CRLF)) {
  api = api.replace(OLD_CRLF, NEW_CRLF);
  console.log('✅ Eliminado con CRLF');
} else {
  // Fallback: buscar el patrón más simple
  const OLD2 = '});\n\n  } catch (e) { res.status(500).json({ error: e.message }); }\n});';
  const NEW2 = '});';
  if (api.includes(OLD2)) {
    api = api.replace(OLD2, NEW2);
    console.log('✅ Eliminado con fallback LF');
  } else {
    const OLD2C = '});\r\n\r\n  } catch (e) { res.status(500).json({ error: e.message }); }\r\n});';
    const NEW2C = '});';
    if (api.includes(OLD2C)) {
      api = api.replace(OLD2C, NEW2C);
      console.log('✅ Eliminado con fallback CRLF');
    } else {
      console.error('❌ Patrón huérfano no encontrado');
      process.exit(1);
    }
  }
}

fs.writeFileSync(path, api, { encoding: 'utf8' });

// Verificar contexto alrededor de CAMPAÑAS
const lines = api.split('\n');
const camIdx = lines.findIndex(l => l.includes('CAMPAÑAS'));
console.log('\n📋 Contexto pre-CAMPAÑAS:');
lines.slice(camIdx-5, camIdx+3).forEach((l, i) => console.log((camIdx-4+i)+': '+l));
console.log('\n✅ fix_orphan_catch_v2.js completado');
