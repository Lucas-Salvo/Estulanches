const jwt = require('jsonwebtoken');

const segredo = () => process.env.JWT_SECRET || 'segredo-dev';

function gerarToken(usuario) {
  return jwt.sign({ id: usuario.id, role: usuario.role }, segredo(), { expiresIn: '1d' });
}

function verificarToken(token) {
  return jwt.verify(token, segredo()); // lança erro se inválido/expirado
}

module.exports = { gerarToken, verificarToken };
