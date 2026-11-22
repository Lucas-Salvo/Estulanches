// TESTES DE INTEGRAÇÃO: sobem o app Express e usam o BANCO DE VERDADE (precisa do DATABASE_URL)
require('dotenv').config({ quiet: true });
const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../../src/app');
const prisma = require('../../src/lib/prisma');

const sufixo = Date.now();
const adminEmail = `admin_teste_${sufixo}@teste.com`;
const clienteEmail = `cliente_teste_${sufixo}@teste.com`;
let admin, cliente, produtoId;

beforeAll(async () => {
  await prisma.usuario.create({
    data: { nome: 'Admin Teste', email: adminEmail, senha: await bcrypt.hash('123456', 10), role: 'ADMIN' },
  });
  admin = request.agent(app);   // agent guarda o cookie entre requisições
  cliente = request.agent(app);
});

afterAll(async () => {
  // limpa tudo que o teste criou
  const usuarios = await prisma.usuario.findMany({ where: { email: { in: [adminEmail, clienteEmail] } } });
  const ids = usuarios.map((u) => u.id);
  await prisma.pedido.deleteMany({ where: { usuarioId: { in: ids } } });
  if (produtoId) await prisma.produto.deleteMany({ where: { id: produtoId } });
  await prisma.usuario.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

test('GET /api/health -> banco conectado', async () => {
  const res = await request(app).get('/api/health');
  expect(res.status).toBe(200);
  expect(res.body.banco).toBe('conectado');
});

test('cadastro de cliente devolve cookie e não devolve a senha', async () => {
  const res = await cliente.post('/api/auth/register').send({ nome: 'Cliente', email: clienteEmail, senha: '123456' });
  expect(res.status).toBe(201);
  expect(res.headers['set-cookie'][0]).toMatch(/token=/);
  expect(res.body.senha).toBeUndefined();
  expect(res.body.token).toBeDefined();
});

test('token no cabeçalho Authorization funciona sem cookie', async () => {
  const login = await request(app).post('/api/auth/login').send({ email: clienteEmail, senha: '123456' });
  const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`);
  expect(res.status).toBe(200);
  expect(res.body.email).toBe(clienteEmail);
});

test('cadastro com email repetido -> 409', async () => {
  const res = await request(app).post('/api/auth/register').send({ nome: 'X', email: clienteEmail, senha: '123456' });
  expect(res.status).toBe(409);
});

test('login com senha errada -> 401', async () => {
  const res = await request(app).post('/api/auth/login').send({ email: adminEmail, senha: 'errada' });
  expect(res.status).toBe(401);
});

test('cliente NÃO pode criar produto -> 403', async () => {
  const res = await cliente.post('/api/produtos').send({ nome: 'Hack', preco: 1 });
  expect(res.status).toBe(403);
});

test('admin faz login e cria produto', async () => {
  expect((await admin.post('/api/auth/login').send({ email: adminEmail, senha: '123456' })).status).toBe(200);
  const res = await admin.post('/api/produtos').send({ nome: 'Pastel Teste', preco: 8.5, categoria: 'Salgado' });
  expect(res.status).toBe(201);
  produtoId = res.body.id;
});

test('produto aparece no cardápio público', async () => {
  const res = await request(app).get('/api/produtos');
  expect(res.body.some((p) => p.id === produtoId)).toBe(true);
});

test('cliente faz pedido e o total é calculado pelo servidor', async () => {
  const res = await cliente.post('/api/pedidos').send({ itens: [{ produtoId, quantidade: 2 }] });
  expect(res.status).toBe(201);
  expect(Number(res.body.total)).toBe(17);
  expect(res.body.status).toBe('PENDENTE');
});

test('pedido sem login -> 401', async () => {
  const res = await request(app).post('/api/pedidos').send({ itens: [{ produtoId, quantidade: 1 }] });
  expect(res.status).toBe(401);
});

test('admin muda status do pedido para PRONTO', async () => {
  const [pedido] = (await cliente.get('/api/pedidos')).body;
  const res = await admin.patch(`/api/pedidos/${pedido.id}/status`).send({ status: 'PRONTO' });
  expect(res.status).toBe(200);
  expect(res.body.status).toBe('PRONTO');
});
