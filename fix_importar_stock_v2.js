// fix_importar_stock_v2.js
// Extrae router.post('/inventario/importar-stock') del interior del PATCH /:id
// y lo reinserta correctamente antes de module.exports = router

const fs = require('fs');
const path = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\dashboard\\api.js';

let api = fs.readFileSync(path, 'utf8');

// 1. Encontrar el índice exacto donde inicia el bloque importar-stock
const importarStart = api.indexOf('\n// POST /api/inventario/importar-stock');
if (importarStart === -1) {
  console.error('❌ No se encontró el bloque importar-stock');
  process.exit(1);
}

// 2. Encontrar el fin del bloque importar-stock
// El bloque termina con }); seguido de un salto de línea y luego algo distinto
// Buscamos 'module.exports = router' como límite seguro
const moduleExportsIdx = api.indexOf('\nmodule.exports = router');
if (moduleExportsIdx === -1) {
  console.error('❌ No se encontró module.exports = router');
  process.exit(1);
}

// 3. Extraer el bloque completo de importar-stock
const importarBlock = api.substring(importarStart, moduleExportsIdx);
console.log('📦 Bloque extraído (primeros 200 chars):', importarBlock.substring(0, 200));

// 4. Verificar que el bloque contiene lo esperado
if (!importarBlock.includes("router.post('/inventario/importar-stock'")) {
  console.error('❌ El bloque no contiene router.post importar-stock');
  process.exit(1);
}

// 5. Quitar el bloque importar-stock del lugar actual (dentro del PATCH callback)
// y cerrar correctamente el PATCH callback con });
api = api.substring(0, importarStart) + '\n});' + api.substring(moduleExportsIdx);

// 6. Verificar que module.exports sigue existiendo
const newModuleIdx = api.indexOf('\nmodule.exports = router');
if (newModuleIdx === -1) {
  console.error('❌ module.exports perdido después del patch');
  process.exit(1);
}

// 7. Insertar el bloque importar-stock ANTES de module.exports
api = api.substring(0, newModuleIdx) + '\n' + importarBlock + api.substring(newModuleIdx);

// 8. Escribir el archivo
fs.writeFileSync(path, api, { encoding: 'utf8' });
console.log('✅ fix_importar_stock_v2.js aplicado correctamente');

// 9. Verificación final
const final = fs.readFileSync(path, 'utf8');
const checkPatch = final.indexOf("router.post('/inventario/importar-stock'");
const checkModule = final.indexOf('module.exports = router');
console.log('🔍 importar-stock position:', checkPatch);
console.log('🔍 module.exports position:', checkModule);
console.log('✅ importar-stock BEFORE module.exports:', checkPatch < checkModule);
