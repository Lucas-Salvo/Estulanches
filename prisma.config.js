// Configuração do Prisma 7 (substitui o "url" que ficava no schema.prisma)
// O Prisma 7 NÃO carrega o .env sozinho, por isso o dotenv aqui.
require('dotenv').config({ quiet: true });
const { defineConfig } = require('prisma/config');

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
  datasource: {
    // process.env (e não env()) para o "prisma generate" funcionar no build do Docker, onde ainda não há banco
    url: process.env.DATABASE_URL,
  },
});
