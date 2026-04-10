const fs = require('fs');
const API_PATH = 'C:\\Projects\\materialespro-enterprise-v10\\materialespro-enterprise-v10\\whatsapp-bot-gdl\\dashboard\\api.js';
let c = fs.readFileSync(API_PATH, 'utf8');
const OLD = "router.post('/catalogo/importar', authMiddleware(['admin']), express.json({ limit: '10mb' }), (req, res) => {";
const NEW = "router.post('/catalogo/importar', authMiddleware(['admin']), express.json({ limit: '10mb' }), async (req, res) => {";
if (!c.includes(OLD)) { console.log('ERROR: bloque no encontrado'); process.exit(1); }
c = c.replace(OLD, NEW);
fs.writeFileSync(API_PATH, c, { encoding: 'utf8' });
console.log('OK: async agregado al route /catalogo/importar');
