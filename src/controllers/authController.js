const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { gerarToken } = require('../utils/token');

const cookieOpts = {
  httpOnly: true,                 // JS do navegador não consegue ler o cookie
  sameSite: 'lax',
  secure: process.env.COOKIE_SECURE === 'true', // true só com HTTPS
  maxAge: 24 * 60 * 60 * 1000,
};

const semSenha = ({ senha, ...u }) => u;

async function registrar(req, res) {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
  if (senha.length < 6) return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres' });

  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) return res.status(409).json({ erro: 'Email já cadastrado' });

  const usuario = await prisma.usuario.create({
    data: { nome, email, senha: await bcrypt.hash(senha, 10) },
  });
  const token = gerarToken(usuario);
  res.cookie('token', token, cookieOpts);
  res.status(201).json({ ...semSenha(usuario), token });
}

async function login(req, res) {
  const { email, senha } = req.body;
  const usuario = email && (await prisma.usuario.findUnique({ where: { email } }));
  if (!usuario || !(await bcrypt.compare(senha || '', usuario.senha))) {
    return res.status(401).json({ erro: 'Email ou senha inválidos' });
  }
  const token = gerarToken(usuario);
  res.cookie('token', token, cookieOpts);
  res.json({ ...semSenha(usuario), token });
}

function logout(req, res) {
  res.clearCookie('token');
  res.json({ mensagem: 'Logout realizado' });
}

async function me(req, res) {
  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } });
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });
  res.json(semSenha(usuario));
}

module.exports = { registrar, login, logout, me };
