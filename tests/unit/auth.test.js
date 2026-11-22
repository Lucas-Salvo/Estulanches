// TESTES UNITÁRIOS do token JWT e dos middlewares (req/res falsos, sem servidor)
const { gerarToken, verificarToken } = require('../../src/utils/token');
const { autenticar, somenteAdmin } = require('../../src/middlewares/auth');

function resFalso() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('token JWT', () => {
  test('gera e verifica token com id e role', () => {
    const dados = verificarToken(gerarToken({ id: 7, role: 'ADMIN' }));
    expect(dados).toMatchObject({ id: 7, role: 'ADMIN' });
  });
  test('token adulterado é rejeitado', () => {
    expect(() => verificarToken(gerarToken({ id: 1, role: 'CLIENTE' }) + 'x')).toThrow();
  });
});

describe('middleware autenticar', () => {
  test('sem cookie -> 401', () => {
    const res = resFalso(); const next = jest.fn();
    autenticar({ cookies: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
  test('aceita token no cabeçalho Authorization: Bearer', () => {
    const req = { cookies: {}, headers: { authorization: `Bearer ${gerarToken({ id: 9, role: 'CLIENTE' })}` } };
    const next = jest.fn();
    autenticar(req, resFalso(), next);
    expect(next).toHaveBeenCalled();
    expect(req.usuario.id).toBe(9);
  });
  test('com token válido -> chama next e preenche req.usuario', () => {
    const req = { cookies: { token: gerarToken({ id: 3, role: 'CLIENTE' }) } };
    const next = jest.fn();
    autenticar(req, resFalso(), next);
    expect(next).toHaveBeenCalled();
    expect(req.usuario.id).toBe(3);
  });
});

describe('middleware somenteAdmin', () => {
  test('cliente -> 403', () => {
    const res = resFalso();
    somenteAdmin({ usuario: { role: 'CLIENTE' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });
  test('admin -> next', () => {
    const next = jest.fn();
    somenteAdmin({ usuario: { role: 'ADMIN' } }, resFalso(), next);
    expect(next).toHaveBeenCalled();
  });
});
