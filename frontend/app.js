// Frontend simples: conversa com a API usando fetch. O cookie com o JWT vai automático.
let usuario = null;
let produtos = [];
let carrinho = []; // [{ produtoId, nome, preco, quantidade }]

// Endereço da API: se a página veio do próprio Express (porta 3000) usa o mesmo endereço;
// se foi aberta pelo Live Server ou direto do arquivo (file://), aponta para o servidor na 3000.
const API = location.port === '3000' ? '' : `http://${location.hostname || 'localhost'}:3000`;

// Token guardado no navegador (usado quando o cookie não funciona, ex.: file://)
const pegarToken = () => { try { return localStorage.getItem('token'); } catch { return null; } };
const salvarToken = (t) => { try { t ? localStorage.setItem('token', t) : localStorage.removeItem('token'); } catch {} };

async function api(url, opcoes = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (pegarToken()) headers.Authorization = `Bearer ${pegarToken()}`;
  let resp;
  try {
    resp = await fetch(API + url, { ...opcoes, headers, credentials: 'include' });
  } catch {
    throw new Error(`Não consegui falar com a API em ${API || location.origin}. O servidor (npm run dev) está rodando?`);
  }
  const texto = await resp.text();
  let dados = null;
  try { dados = texto ? JSON.parse(texto) : null; } catch { /* resposta não é JSON */ }
  if (!dados && !resp.ok) throw new Error(`Erro ${resp.status} em ${API + url} - a API respondeu sem JSON`);
  if (!resp.ok) throw new Error(dados?.erro || 'Erro na requisição');
  return dados;
}

const valor = (id) => document.getElementById(id).value;
const reais = (n) => Number(n).toFixed(2);

async function carregarUsuario() {
  try { usuario = await api('/api/auth/me'); } catch { usuario = null; }
  document.getElementById('secLogin').classList.toggle('oculto', !!usuario);
  document.getElementById('secCarrinho').classList.toggle('oculto', !usuario);
  document.getElementById('secPedidos').classList.toggle('oculto', !usuario);
  document.getElementById('usuarioInfo').innerHTML = usuario
    ? `Olá, ${usuario.nome} ${usuario.role === 'ADMIN' ? '| <a href="admin.html">Admin</a>' : ''} | <button class="sec" onclick="sair()">Sair</button>`
    : '';
  if (usuario) carregarPedidos();
}

async function entrar() {
  try {
    const u = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: valor('email'), senha: valor('senha') }) });
    salvarToken(u.token);
    carregarUsuario();
  } catch (e) { document.getElementById('msgLogin').textContent = e.message; }
}

async function cadastrar() {
  try {
    const u = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ nome: valor('nome'), email: valor('email'), senha: valor('senha') }) });
    salvarToken(u.token);
    carregarUsuario();
  } catch (e) { document.getElementById('msgLogin').textContent = e.message; }
}

async function sair() {
  await api('/api/auth/logout', { method: 'POST' });
  salvarToken(null);
  carrinho = [];
  carregarUsuario();
}

async function carregarCardapio() {
  try { produtos = await api('/api/produtos'); }
  catch (e) { document.getElementById('cardapio').innerHTML = `<p class="erro">${e.message}</p>`; return; }
  document.getElementById('cardapio').innerHTML = produtos.map((p) => `
    <div class="card">
      <b>${p.nome}</b> <small>(${p.categoria})</small>
      <p>${p.descricao || ''}</p>
      <p>R$ ${reais(p.preco)}</p>
      <button onclick="adicionar(${p.id})">Adicionar</button>
    </div>`).join('');
}

function adicionar(id) {
  if (!usuario) return alert('Faça login para pedir');
  const item = carrinho.find((i) => i.produtoId === id);
  if (item) item.quantidade++;
  else {
    const p = produtos.find((x) => x.id === id);
    carrinho.push({ produtoId: id, nome: p.nome, preco: Number(p.preco), quantidade: 1 });
  }
  renderCarrinho();
}

function remover(id) {
  carrinho = carrinho.filter((i) => i.produtoId !== id);
  renderCarrinho();
}

function renderCarrinho() {
  document.getElementById('carrinho').innerHTML = carrinho.map((i) =>
    `<li>${i.quantidade}x ${i.nome} — R$ ${reais(i.preco * i.quantidade)} <button class="sec" onclick="remover(${i.produtoId})">x</button></li>`).join('');
  document.getElementById('total').textContent = reais(carrinho.reduce((s, i) => s + i.preco * i.quantidade, 0));
}

async function finalizarPedido() {
  const msg = document.getElementById('msgPedido');
  try {
    const itens = carrinho.map(({ produtoId, quantidade }) => ({ produtoId, quantidade }));
    const pedido = await api('/api/pedidos', { method: 'POST', body: JSON.stringify({ itens }) });
    msg.textContent = `Pedido #${pedido.id} enviado!`;
    carrinho = [];
    renderCarrinho();
    carregarPedidos();
  } catch (e) { msg.textContent = e.message; }
}

async function carregarPedidos() {
  const pedidos = await api('/api/pedidos');
  document.getElementById('pedidos').innerHTML = pedidos.map((p) => `
    <div class="card">
      <b>Pedido #${p.id}</b> — ${p.status} — R$ ${reais(p.total)}
      <br><small>${p.itens.map((i) => `${i.quantidade}x ${i.produto.nome}`).join(', ')}</small>
    </div>`).join('') || '<p>Nenhum pedido ainda.</p>';
}

carregarCardapio();
carregarUsuario();
