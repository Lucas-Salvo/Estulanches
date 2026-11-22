# 🍔 EstuLanches

Sistema de cardápio e pedidos da cantina escolar.
**Stack:** Node.js + Express · Prisma 7.8.0 + @prisma/adapter-pg (PostgreSQL) · JWT em cookie (jsonwebtoken + cookie-parser) · bcryptjs · cors · nodemon · Jest + Supertest · Docker.


## 🎥 Vídeo de apresentação
[Assistir ao vídeo](https://drive.google.com/file/d/1MiCZ5Y0LH5cpEzbxQdOWTwcxSG1pzv9L/view?usp=sharing)
---

## 📁 Estrutura

```
estulanches/
├── Dockerfile              # receita da IMAGEM da aplicação
├── docker-compose.yml      # sobe app + banco juntos
├── .dockerignore           # o que NÃO vai para dentro da imagem
├── .env.example            # modelo de variáveis para rodar sem Docker
├── prisma.config.js        # config do Prisma 7 (URL do banco, migrations, seed)
├── prisma/
│   ├── schema.prisma       # tabelas: Usuario, Produto, Pedido, ItemPedido
│   ├── migrations/         # SQL gerado pelo Prisma (cria as tabelas)
│   └── seed.js             # cria admin + produtos iniciais
├── src/
│   ├── server.js           # liga o servidor (app.listen)
│   ├── app.js              # configura o Express (middlewares + rotas)
│   ├── lib/prisma.js       # conexão com o banco
│   ├── middlewares/auth.js # autenticar (JWT) e somenteAdmin
│   ├── utils/              # token.js (JWT) e pedido.js (regras de negócio)
│   ├── controllers/        # lógica de cada rota
│   └── routes/             # define as URLs da API
├── frontend/               # HTML/CSS/JS simples (abre pelo Express, Live Server ou direto no arquivo)
├── tests/
│   ├── unit/               # testes unitários (sem banco)
│   └── integration/        # testes de integração (API + banco real)
└── docs/RDM.md             # Ficha de Registro de Mudança
```

## 🔌 Rotas da API

| Método | Rota | Acesso |
|---|---|---|
| GET | `/api/health` | público (status da app e do banco) |
| POST | `/api/auth/register` · `/login` · `/logout` | público |
| GET | `/api/auth/me` | logado |
| GET | `/api/produtos` | público |
| POST/PUT/DELETE | `/api/produtos[/:id]` | admin |
| POST / GET | `/api/pedidos` | logado (cliente vê só os seus, admin vê todos) |
| PATCH | `/api/pedidos/:id/status` | admin |

Login admin padrão: **admin@estulanches.com / admin123** (criado pelo seed).

---

## 💻 1) Rodar SEM Docker (desenvolvimento, usando seu Postgres local)

```bash
npm install
cp .env.example .env        # edite a senha do seu Postgres no DATABASE_URL
npx prisma migrate dev      # cria o banco e as tabelas
npm run seed                # cria admin e produtos
npm run dev                 # nodemon: reinicia sozinho ao salvar arquivo
```
Acesse http://localhost:3000

## 🧪 2) Testes

```bash
npm run test:unit           # unitários: funções isoladas, não usam banco
npm run test:integration    # integração: sobem a API e usam o banco do .env
npm test                    # todos
```
- **Unitário** = testa uma peça sozinha (ex.: `calcularTotal`, middleware de auth com req/res falsos).
- **Integração** = testa as peças juntas (requisição HTTP → rota → controller → Prisma → Postgres).

---

## 🐳 3) Rodar COM Docker (produção)

### Conceitos rápidos
| Termo | O que é |
|---|---|
| **Imagem** | "Foto" pronta com SO + Node + seu código. Criada pelo `Dockerfile`. |
| **Container** | Uma imagem *rodando*. Pode ter vários da mesma imagem. |
| **Dockerfile** | Receita passo a passo para montar a imagem. |
| **docker-compose** | Arquivo que descreve vários containers (app + banco) e sobe tudo com 1 comando. |
| **Volume** | Pasta persistente: os dados do Postgres não somem quando o container é apagado. |
| **Porta `3000:3000`** | `porta do seu PC : porta dentro do container`. |
| **Rede do compose** | Os containers se enxergam pelo **nome do serviço**. Por isso o `DATABASE_URL` usa `@db:5432` e não `localhost`. |

> O banco do Docker fica exposto na porta **5433** do seu PC para não brigar com o Postgres que você já tem na 5432.

### Passo a passo da implantação

```bash
docker compose up -d --build     # 1. cria a imagem e sobe os containers em segundo plano
docker compose ps                # 2. verifica estado dos serviços e portas (deve aparecer "healthy")
docker compose logs app          # 3. auditoria de logs da aplicação
docker compose logs db           # 4. auditoria de logs do banco
curl http://localhost:3000/api/health   # 5. validação: {"status":"ok","banco":"conectado"}
```

O que o container da aplicação faz ao iniciar (`CMD` do Dockerfile):
1. `prisma migrate deploy` → cria/atualiza as tabelas
2. `node prisma/seed.js` → cria admin e produtos (se ainda não existirem)
3. `node src/server.js` → sobe a API

**Logs esperados (sem erros críticos):**
- db: `database system is ready to accept connections`
- app: `All migrations have been successfully applied.` e `[EstuLanches] Servidor rodando na porta 3000 (production)`

Procurar erros rapidamente:
```bash
docker compose logs | grep -iE "error|fatal"
```

### Rodar os testes de integração contra o banco do Docker
```bash
DATABASE_URL="postgresql://estulanches:estulanches123@localhost:5433/estulanches" npm test
```
(no Windows PowerShell: `$env:DATABASE_URL="..."; npm test`)

### Outros comandos úteis
```bash
docker compose logs -f app       # acompanhar logs em tempo real
docker compose restart app       # reiniciar só a aplicação
docker compose exec db psql -U estulanches -d estulanches   # entrar no banco
docker compose down              # parar e remover containers (dados ficam no volume)
docker compose down -v           # parar e APAGAR os dados do banco
docker images                    # ver imagens (estulanches:1.0.0)
```
