# Ficha Simplificada de Registro de Mudança (RDM)

| Campo | Informação |
|---|---|
| **Nº da RDM** | RDM-001 |
| **Sistema** | EstuLanches — Gestão de cardápio e pedidos da cantina |
| **Responsável (Técnico de Implantação)** | ______________________ |
| **Versão implantada** | 1.0.0 (imagem `estulanches:1.0.0`) |
| **Data / horário de início** | ___/___/______  às ___:___ |
| **Data / horário de término** | ___/___/______  às ___:___ |
| **Ambiente** | Produção — Docker Compose (containers `estulanches-app` e `estulanches-db`) |
| **Tipo de mudança** | Implantação inicial |

## 1. Descrição da mudança
Implantação do sistema EstuLanches em containers Docker: aplicação Node.js/Express (imagem própria via Dockerfile, base `node:22-slim`) e banco PostgreSQL 16 (`postgres:16-alpine`), orquestrados por `docker-compose.yml`, com migrations do Prisma aplicadas automaticamente na inicialização.

## 2. Parâmetros alterados / configurados
| Parâmetro | Valor |
|---|---|
| Porta da aplicação | `3000:3000` |
| Porta do banco (host:container) | `5433:5432` (evita conflito com Postgres local na 5432) |
| `DATABASE_URL` | `postgresql://estulanches:***@db:5432/estulanches` |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | definido via variável de ambiente (não versionado) |
| Volume de dados | `pgdata` → `/var/lib/postgresql/data` |
| Healthchecks | db: `pg_isready` · app: `GET /api/health` |
| Política de reinício | `restart: unless-stopped` |

## 3. Verificação dos serviços (`docker compose ps`)
| Serviço | Estado | Porta | OK? |
|---|---|---|---|
| estulanches-db | ____________ | 5433→5432 | ☐ |
| estulanches-app | ____________ | 3000→3000 | ☐ |

## 4. Auditoria de logs (`docker compose logs`)
| Verificação | Resultado |
|---|---|
| db: "database system is ready to accept connections" | ☐ Sim ☐ Não |
| app: "All migrations have been successfully applied" | ☐ Sim ☐ Não |
| app: "Servidor rodando na porta 3000 (production)" | ☐ Sim ☐ Não |
| Ausência de erros críticos (ERROR / FATAL) | ☐ Sim ☐ Não |

## 5. Resultado dos testes de validação
| Teste | Qtd | Resultado |
|---|---|---|
| Testes unitários (`npm run test:unit`) | 14 | ☐ Passou ☐ Falhou |
| Testes de integração (`npm run test:integration`) | 11 | ☐ Passou ☐ Falhou |
| Health check `GET /api/health` → `{"status":"ok","banco":"conectado"}` | 1 | ☐ Passou ☐ Falhou |
| Teste manual: login, cardápio, pedido e mudança de status no admin | 1 | ☐ Passou ☐ Falhou |

## 6. Plano de retorno (rollback)
`docker compose down` e subir a versão anterior da imagem. Dados preservados no volume `pgdata`.

## 7. Status final da implantação
☐ **Concluída com sucesso**  ☐ Concluída com ressalvas  ☐ Cancelada / revertida

Observações: _____________________________________________________________

Assinatura do responsável: ______________________  Data: ___/___/______
