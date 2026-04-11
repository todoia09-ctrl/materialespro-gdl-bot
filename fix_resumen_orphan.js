// fix_resumen_orphan.js
// Elimina el '}\n});' huérfano que quedó después del endpoint /resumen
// Ejecutar: node fix_resumen_orphan.js

var fs   = require('fs');
var path = require('path');

var API_PATH = path.join(
  'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl',
  'dashboard', 'api.js'
);

var content = fs.readFileSync(API_PATH, 'utf8');

// El bloque huérfano: justo después del cierre del endpoint resumen
// aparece:  }\n});\n  seguido del separador de PEDIDOS
var OLD1 = '  } catch (e) { res.status(500).json({ error: e.message }); }\n});\n }\n});\n';
var NEW1 = '  } catch (e) { res.status(500).json({ error: e.message }); }\n});\n';

var OLD2 = '  } catch (e) { res.status(500).json({ error: e.message }); }\r\n});\r\n }\r\n});\r\n';
var NEW2 = '  } catch (e) { res.status(500).json({ error: e.message }); }\r\n});\r\n';

if (content.includes(OLD1)) {
  content = content.replace(OLD1, NEW1);
  fs.writeFileSync(API_PATH, content, { encoding: 'utf8' });
  console.log('✅ Bloque huérfano LF eliminado');
} else if (content.includes(OLD2)) {
  content = content.replace(OLD2, NEW2);
  fs.writeFileSync(API_PATH, content, { encoding: 'utf8' });
  console.log('✅ Bloque huérfano CRLF eliminado');
} else {
  // Fallback: buscar y eliminar la secuencia exacta por posición
  // Buscar '}' solitario seguido de '});' justo después del primer cierre del resumen
  var marker = '} catch (e) { res.status(500).json({ error: e.message }); }\n});';
  var idx = content.indexOf(marker);
  if (idx === -1) {
    marker = '} catch (e) { res.status(500).json({ error: e.message }); }\r\n});';
    idx = content.indexOf(marker);
  }
  if (idx !== -1) {
    var after = content.substring(idx + marker.length);
    // Eliminar ' }\n});\n' o ' }\r\n});\r\n' al inicio de 'after'
    after = after.replace(/^\s*\}\s*\r?\n\}\);\s*\r?\n/, '\n');
    content = content.substring(0, idx + marker.length) + after;
    fs.writeFileSync(API_PATH, content, { encoding: 'utf8' });
    console.log('✅ Bloque huérfano eliminado via fallback');
  } else {
    console.error('❌ No se encontró el bloque huérfano — edita manualmente líneas 117-118:');
    console.error('   Elimina las dos líneas:  }');
    console.error('                            });');
    console.error('   que aparecen DESPUÉS del primer });  del endpoint /resumen');
  }
}

console.log('Verifica: node --check dashboard/api.js');
