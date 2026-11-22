// TESTES UNITÁRIOS: testam funções isoladas, sem banco e sem servidor
const { validarItens, calcularTotal, statusValido } = require('../../src/utils/pedido');

describe('calcularTotal', () => {
  test('soma preço x quantidade de cada item', () => {
    expect(calcularTotal([{ precoUnit: 12.5, quantidade: 2 }, { precoUnit: 5, quantidade: 1 }])).toBe(30);
  });
  test('não tem erro de arredondamento com centavos', () => {
    expect(calcularTotal([{ precoUnit: 0.1, quantidade: 3 }])).toBe(0.3);
  });
  test('lista vazia dá zero', () => {
    expect(calcularTotal([])).toBe(0);
  });
});

describe('validarItens', () => {
  test('aceita itens válidos', () => {
    expect(validarItens([{ produtoId: 1, quantidade: 2 }])).toBeNull();
  });
  test('recusa pedido vazio', () => {
    expect(validarItens([])).toMatch(/pelo menos 1 item/);
  });
  test('recusa quantidade zero ou negativa', () => {
    expect(validarItens([{ produtoId: 1, quantidade: 0 }])).toMatch(/Quantidade/);
  });
  test('recusa produtoId inválido', () => {
    expect(validarItens([{ produtoId: 'abc', quantidade: 1 }])).toMatch(/produtoId/);
  });
});

describe('statusValido', () => {
  test('aceita status conhecido', () => expect(statusValido('PRONTO')).toBe(true));
  test('recusa status desconhecido', () => expect(statusValido('VOANDO')).toBe(false));
});
