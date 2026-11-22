const prisma = require('../lib/prisma');
const { validarItens, calcularTotal, statusValido } = require('../utils/pedido');

const incluir = { itens: { include: { produto: true } }, usuario: { select: { id: true, nome: true } } };

async function criar(req, res) {
  const { itens } = req.body;
  const erro = validarItens(itens);
  if (erro) return res.status(400).json({ erro });

  // Busca os preços no banco (nunca confiar no preço enviado pelo navegador)
  const produtos = await prisma.produto.findMany({
    where: { id: { in: itens.map((i) => i.produtoId) }, disponivel: true },
  });
  const itensComPreco = [];
  for (const item of itens) {
    const p = produtos.find((x) => x.id === item.produtoId);
    if (!p) return res.status(400).json({ erro: `Produto ${item.produtoId} não existe ou está indisponível` });
    itensComPreco.push({ produtoId: p.id, quantidade: item.quantidade, precoUnit: p.preco });
  }

  const pedido = await prisma.pedido.create({
    data: {
      usuarioId: req.usuario.id,
      total: calcularTotal(itensComPreco),
      itens: { create: itensComPreco },
    },
    include: incluir,
  });
  res.status(201).json(pedido);
}

async function listar(req, res) {
  const where = req.usuario.role === 'ADMIN' ? {} : { usuarioId: req.usuario.id };
  res.json(await prisma.pedido.findMany({ where, include: incluir, orderBy: { id: 'desc' } }));
}

async function atualizarStatus(req, res) {
  const { status } = req.body;
  if (!statusValido(status)) return res.status(400).json({ erro: 'Status inválido' });
  try {
    const pedido = await prisma.pedido.update({ where: { id: Number(req.params.id) }, data: { status }, include: incluir });
    res.json(pedido);
  } catch {
    res.status(404).json({ erro: 'Pedido não encontrado' });
  }
}

module.exports = { criar, listar, atualizarStatus };
