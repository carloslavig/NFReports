require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const colaboradoresRoutes = require('./routes/colaboradores');
const servicosRoutes = require('./routes/servicos');
const dashboardRoutes = require('./routes/dashboard');
const relatoriosRoutes = require('./routes/relatorios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API
app.use('/api/colaboradores', colaboradoresRoutes);
app.use('/api/servicos', servicosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/relatorios', relatoriosRoutes);

// Healthcheck
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Frontend estático — usado apenas em desenvolvimento local (node server.js).
// Na Vercel, os arquivos de /public são servidos direto pelo CDN, sem passar por aqui.
app.use(express.static(path.join(__dirname, 'public')));

// Tratamento de erro genérico
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// Export necessário para a Vercel reconhecer a aplicação Express como Função
module.exports = app;
