// Regras de negócio puras (sem banco) -> fáceis de testar com teste unitário

function validarItens(itens) {
  if (!Array.isArray(itens) || itens.length === 0) return 'O pedido precisa ter pelo menos 1 item';
  for (const item of itens) {
    if (!Number.isInteger(item.produtoId)) return 'produtoId inválido';
    if (!Number.isInteger(item.quantidade) || item.quantidade < 1) return 'Quantidade deve ser um inteiro maior que 0';
  }
  return null; // null = sem erro
}

// itens: [{ quantidade, precoUnit }]
function calcularTotal(itens) {
  const centavos = itens.reduce((soma, i) => soma + Math.round(Number(i.precoUnit) * 100) * i.quantidade, 0);
  return centavos / 100;
}

const STATUS_VALIDOS = ['PENDENTE', 'PREPARANDO', 'PRONTO', 'ENTREGUE', 'CANCELADO'];
const statusValido = (s) => STATUS_VALIDOS.includes(s);

module.exports = { validarItens, calcularTotal, statusValido, STATUS_VALIDOS };
