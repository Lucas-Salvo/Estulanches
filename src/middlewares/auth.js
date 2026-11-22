const { verificarToken } = require('../utils/token');

// Pega o token do cookie "token" OU do cabeçalho "Authorization: Bearer <token>"
// (o cabeçalho é usado quando o frontend é aberto fora do servidor, ex.: Live Server ou file://)
function pegarToken(req) {
  const header = req.headers?.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return req.cookies?.token;
}

// Exige usuário logado
function autenticar(req, res, next) {
  const token = pegarToken(req);
  if (!token) return res.status(401).json({ erro: 'Não autenticado' });
  try {
    req.usuario = verificarToken(token); // { id, role }
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

// Exige que o usuário seja ADMIN (usar depois de autenticar)
function somenteAdmin(req, res, next) {
  if (req.usuario?.role !== 'ADMIN') return res.status(403).json({ erro: 'Acesso restrito ao administrador' });
  next();
}

module.exports = { autenticar, somenteAdmin };
