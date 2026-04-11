// fix_patch_catch_v2.js
// Agrega el } catch faltante en el PATCH /inventario/:id

const fs = require('fs');
const path = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\dashboard\\api.js';

let api = fs.readFileSync(path, 'utf8');

// Reemplazar el bloque roto (try sin catch) por la versión correcta
const OLD = '    res.json({ ok: true });\n\n});';
const NEW = '    res.json({ ok: true });\n  } catch (e) { res.status(500).json({ error: e.message }); }\n});';

if (!api.includes(OLD)) {
  // Intentar con CRLF
  const OLD_CRLF = '    res.json({ ok: true });\r\n\r\n});';
  const NEW_CRLF = '    res.json({ ok: true });\r\n  } catch (e) { res.status(500).json({ error: e.message }); }\r\n});';
  if (!api.includes(OLD_CRLF)) {
    console.error('❌ Patrón no encontrado (LF ni CRLF)');
    // Mostrar contexto para debug
    const idx = api.indexOf('res.json({ ok: true });\n\n});');
    console.log('LF idx:', idx);
    const idx2 = api.indexOf('res.json({ ok: true });\r\n\r\n});');
    console.log('CRLF idx:', idx2);
    process.exit(1);
  }
  api = api.replace(OLD_CRLF, NEW_CRLF);
  console.log('✅ Aplicado con CRLF');
} else {
  api = api.replace(OLD, NEW);
  console.log('✅ Aplicado con LF');
}

fs.writeFileSync(path, api, { encoding: 'utf8' });

// Verificación
const final = fs.readFileSync(path, 'utf8');
const lines = final.split('\n');
// Buscar línea con actualizarStock para mostrar contexto
const ctxIdx = lines.findIndex(l => l.includes('actualizarStock'));
if (ctxIdx > -1) {
  console.log('\n📋 Contexto PATCH (líneas', ctxIdx+1, 'a', ctxIdx+6, '):');
  lines.slice(ctxIdx-1, ctxIdx+5).forEach((l, i) => console.log((ctxIdx+i)+': '+l));
}
console.log('\n✅ fix_patch_catch_v2.js completado');
