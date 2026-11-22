// Monta o app Express (separado do server.js para os testes poderem importar sem abrir porta)
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const prisma = require('./lib/prisma');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Health check: usado pelo Docker para saber se a aplicação e o banco estão ok
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', banco: 'conectado', versao: process.env.APP_VERSION || '1.0.0' });
  } catch {
    res.status(503).json({ status: 'erro', banco: 'desconectado' });
  }
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/produtos', require('./routes/produtoRoutes'));
app.use('/api/pedidos', require('./routes/pedidoRoutes'));

// Tratamento de erros não previstos (ex.: JSON mal formado)
app.use((err, req, res, next) => {
  console.error('[erro]', err.message);
  res.status(err.status || 500).json({ erro: err.status ? err.message : 'Erro interno do servidor' });
});

module.exports = app;
