// Uma única instância do Prisma para toda a aplicação.
// No Prisma 7 a conexão é feita por um "driver adapter" (aqui: pg, o driver oficial do Postgres)
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
module.exports = new PrismaClient({ adapter });
