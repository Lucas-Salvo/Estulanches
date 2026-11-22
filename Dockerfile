# ============ Dockerfile: receita para criar a IMAGEM da aplicação ============

# 1) Imagem base: Linux Debian enxuto (slim) já com Node 22 instalado
FROM node:22-slim

# 2) O Prisma precisa do OpenSSL para conectar no Postgres
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 3) Pasta de trabalho dentro do container
WORKDIR /app

# 4) Copia SÓ o package.json primeiro -> o Docker reaproveita o cache do npm
#    se você só mudou código e não dependências (build fica bem mais rápido)
COPY package*.json ./
# --ignore-scripts: pula o "postinstall" aqui (o schema ainda não foi copiado; o generate roda no passo 5)
RUN npm ci --omit=dev --ignore-scripts

# 5) Copia o schema + prisma.config.js (Prisma 7) e gera o Prisma Client
COPY prisma ./prisma
COPY prisma.config.js ./
RUN npx prisma generate

# 6) Copia o resto do código
COPY src ./src
COPY frontend ./frontend

ENV NODE_ENV=production
ENV PORT=3000

# 7) Documenta a porta que a aplicação usa
EXPOSE 3000

# 8) Ao iniciar o container: aplica migrations, roda o seed e sobe o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/server.js"]
