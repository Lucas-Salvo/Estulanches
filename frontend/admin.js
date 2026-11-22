// Painel do administrador: CRUD de produtos e mudança de status dos pedidos
const STATUS = ['PENDENTE', 'PREPARANDO', 'PRONTO', 'ENTREGUE', 'CANCELADO'];

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
  if (resp.status === 401 || resp.status === 403) { alert('Acesso restrito ao admin'); location.href = 'index.html'; }
  if (!resp.ok) throw new Error(dados?.erro || 'Erro');
  return dados;
}

const valor = (id) => document.getElementById(id).value;

async function carregarProdutos() {
  const produtos = await api('/api/produtos?todos=1');
  document.getElementById('tabelaProdutos').innerHTML = produtos.map((p) => `
    <tr>
      <td>${p.nome}</td>
      <td>R$ ${Number(p.preco).toFixed(2)}</td>
      <td><input type="checkbox" ${p.disponivel ? 'checked' : ''} onchange="alternar(${p.id}, this.checked)" style="width:auto"></td>
      <td><button class="sec" onclick="excluir(${p.id})">Excluir</button></td>
    </tr>`).join('');
}

async function criarProduto() {
  try {
    await api('/api/produtos', { method: 'POST', body: JSON.stringify({
      nome: valor('pNome'), descricao: valor('pDescricao'), preco: valor('pPreco'), categoria: valor('pCategoria') || undefined,
    }) });
    document.getElementById('msgProduto').textContent = '';
    carregarProdutos();
  } catch (e) { document.getElementById('msgProduto').textContent = e.message; }
}

async function alternar(id, disponivel) {
  await api(`/api/produtos/${id}`, { method: 'PUT', body: JSON.stringify({ disponivel }) });
}

async function excluir(id) {
  if (!confirm('Excluir produto?')) return;
  await api(`/api/produtos/${id}`, { method: 'DELETE' });
  carregarProdutos();
}

async function carregarPedidos() {
  const pedidos = await api('/api/pedidos');
  document.getElementById('pedidosAdmin').innerHTML = pedidos.map((p) => `
    <div class="card">
      <b>#${p.id}</b> — ${p.usuario.nome} — R$ ${Number(p.total).toFixed(2)}
      <br><small>${p.itens.map((i) => `${i.quantidade}x ${i.produto.nome}`).join(', ')}</small>
      <select onchange="mudarStatus(${p.id}, this.value)" style="width:auto">
        ${STATUS.map((s) => `<option ${s === p.status ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    </div>`).join('') || '<p>Nenhum pedido.</p>';
}

async function mudarStatus(id, status) {
  await api(`/api/pedidos/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

carregarProdutos();
carregarPedidos();
