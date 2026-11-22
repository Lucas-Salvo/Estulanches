const prisma = require('../lib/prisma');

async function listar(req, res) {
  // Admin vê tudo; público vê só os disponíveis (?todos=1 para admin)
  const where = req.query.todos ? {} : { disponivel: true };
  res.json(await prisma.produto.findMany({ where, orderBy: [{ categoria: 'asc' }, { nome: 'asc' }] }));
}

async function criar(req, res) {
  const { nome, descricao, preco, categoria, disponivel } = req.body;
  if (!nome || preco === undefined || Number(preco) <= 0) {
    return res.status(400).json({ erro: 'Nome e preço (> 0) são obrigatórios' });
  }
  const produto = await prisma.produto.create({
    data: { nome, descricao, preco: Number(preco), categoria, disponivel },
  });
  res.status(201).json(produto);
}

async function atualizar(req, res) {
  const id = Number(req.params.id);
  const { nome, descricao, preco, categoria, disponivel } = req.body;
  try {
    const produto = await prisma.produto.update({
      where: { id },
      data: { nome, descricao, categoria, disponivel, preco: preco !== undefined ? Number(preco) : undefined },
    });
    res.json(produto);
  } catch {
    res.status(404).json({ erro: 'Produto não encontrado' });
  }
}

async function remover(req, res) {
  const id = Number(req.params.id);
  try {
    // Se já tem pedido com esse produto, apenas desativa (não perde histórico)
    const usado = await prisma.itemPedido.count({ where: { produtoId: id } });
    if (usado) await prisma.produto.update({ where: { id }, data: { disponivel: false } });
    else await prisma.produto.delete({ where: { id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ erro: 'Produto não encontrado' });
  }
}

module.exports = { listar, criar, atualizar, remover };
