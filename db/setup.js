// Script utilitário: roda o schema.sql contra o banco configurado no .env
// Uso: npm run db:setup
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  console.log('Executando schema.sql no banco', process.env.DB_NAME || 'sistema_servicos', '...');
  await pool.query(sql);
  console.log('Schema aplicado com sucesso.');
  await pool.end();
}

main().catch((err) => {
  console.error('Erro ao aplicar schema:', err.message);
  process.exit(1);
});
