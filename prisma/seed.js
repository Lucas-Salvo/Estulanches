// Popula o banco com um admin e alguns produtos (só cria se ainda não existir)
require('dotenv').config({ quiet: true });
const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@estulanches.com';
  const senha = process.env.ADMIN_SENHA || 'admin123';

  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (!existe) {
    await prisma.usuario.create({
      data: { nome: 'Administrador', email, senha: await bcrypt.hash(senha, 10), role: 'ADMIN' },
    });
    console.log(`[seed] Admin criado: ${email}`);
  }

  // Cardápio da cantina: só cria os itens que ainda não existem (pode rodar o seed várias vezes)
  const cardapio = [
    // Salgados
    { nome: 'Pão de Queijo', descricao: 'Porção com 3 unidades', preco: 6.0, categoria: 'Salgado' },
    { nome: 'Coxinha', descricao: 'Frango com catupiry', preco: 6.5, categoria: 'Salgado' },
    { nome: 'Esfiha de Carne', descricao: 'Esfiha aberta', preco: 5.5, categoria: 'Salgado' },
    { nome: 'Enroladinho de Salsicha', descricao: 'Massa assada', preco: 5.0, categoria: 'Salgado' },
    { nome: 'Pastel de Queijo', descricao: 'Pastel frito na hora', preco: 7.0, categoria: 'Salgado' },
    // Lanches
    { nome: 'Misto Quente', descricao: 'Pão de forma, presunto e queijo', preco: 7.5, categoria: 'Lanche' },
    { nome: 'X-Burguer', descricao: 'Pão, hambúrguer e queijo', preco: 13.0, categoria: 'Lanche' },
    { nome: 'X-Salada', descricao: 'Pão, hambúrguer, queijo, alface e tomate', preco: 15.0, categoria: 'Lanche' },
    { nome: 'Sanduíche Natural', descricao: 'Frango, cenoura e requeijão no pão integral', preco: 10.0, categoria: 'Lanche' },
    { nome: 'Pão na Chapa', descricao: 'Pão francês com manteiga', preco: 4.0, categoria: 'Lanche' },
    // Bebidas
    { nome: 'Café', descricao: 'Copo 100ml', preco: 3.0, categoria: 'Bebida' },
    { nome: 'Café com Leite', descricao: 'Copo 200ml', preco: 4.5, categoria: 'Bebida' },
    { nome: 'Achocolatado', descricao: 'Caixinha 200ml', preco: 4.0, categoria: 'Bebida' },
    { nome: 'Água Mineral', descricao: 'Garrafa 500ml', preco: 3.0, categoria: 'Bebida' },
    { nome: 'Água com Gás', descricao: 'Garrafa 500ml', preco: 3.5, categoria: 'Bebida' },
    { nome: 'Suco Natural de Laranja', descricao: 'Copo 300ml', preco: 6.0, categoria: 'Bebida' },
    { nome: 'Refrigerante Lata', descricao: 'Lata 350ml', preco: 5.5, categoria: 'Bebida' },
    // Doces
    { nome: 'Bolo de Cenoura', descricao: 'Fatia com cobertura de chocolate', preco: 5.0, categoria: 'Doce' },
    { nome: 'Brigadeiro', descricao: 'Unidade', preco: 2.5, categoria: 'Doce' },
    { nome: 'Salada de Frutas', descricao: 'Pote 250ml', preco: 7.0, categoria: 'Doce' },
  ];

  const existentes = (await prisma.produto.findMany({ select: { nome: true } })).map((p) => p.nome);
  const faltando = cardapio.filter((p) => !existentes.includes(p.nome));
  if (faltando.length) {
    await prisma.produto.createMany({ data: faltando });
    console.log(`[seed] ${faltando.length} produtos adicionados ao cardápio`);
  } else {
    console.log('[seed] Cardápio já estava completo');
  }
}

main()
  .catch((e) => { console.error('[seed] Erro:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
