// ============================================================
// Conexão com o banco de dados (PostgreSQL)
//
// Em ambientes serverless (Vercel), cada execução pode abrir uma nova
// conexão — por isso aqui usamos:
//   - DATABASE_URL (recomendado): connection string de um Postgres
//     "serverless-friendly" como Neon ou Supabase, com pooling (pgbouncer)
//   - OU as variáveis DB_* separadas, para Postgres tradicional (uso local)
// ============================================================
const { Pool } = require('pg');
require('dotenv').config();

const ehServerless = !!process.env.VERCEL;

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // necessário para Neon/Supabase
      max: ehServerless ? 1 : 10, // poucas conexões simultâneas em serverless
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'sistema_servicos',
    });

pool.on('error', (err) => {
  console.error('Erro inesperado no pool do banco de dados:', err);
});

module.exports = pool;
