'use strict';

// Servidor do Sistema de Acompanhamento Calebe 2027.
// Sem dependências externas: Node.js puro + armazenamento em arquivo JSON.

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const MAX_BODY = 1024 * 1024;

const RESPONSAVEIS = [
  'visitacao', 'pregador', 'louvor', 'criancas', 'sonoplastia',
  'recepcao', 'midia', 'apoio', 'brindes', 'lanche',
];
const TREINAMENTOS = ['outubro', 'novembro', 'dezembro'];
const DIVULGACAO = ['faixa', 'convites', 'carroSom', 'redesSociais'];
const ACOES = ['sopao', 'mutirao', 'feiraSaude'];

// ---------- Banco de dados ----------

function loadDb() {
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return { users: db.users || [], teams: db.teams || [] };
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Falha ao ler o banco:', err.message);
    return { users: [], teams: [] };
  }
}

let db = loadDb();

function saveDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

// ---------- Sanitização ----------

const str = (v, max = 160) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const bool = (v) => v === true;
const int = (v) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 1000000) : 0;
};
const date = (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '');
const digits = (v) => str(v, 40).replace(/\D/g, '');

function sanitizeTeam(input, existing) {
  const src = input && typeof input === 'object' ? input : {};
  const base = existing || {};
  const pick = (key, fn) => (key in src ? fn(src[key]) : base[key]);

  const members = Array.isArray(src.members)
    ? src.members.slice(0, 500)
        .map((m) => ({ name: str(m && m.name, 120), phone: str(m && m.phone, 30) }))
        .filter((m) => m.name)
    : base.members || [];

  const obj = (key, keys, fn) => {
    const from = src[key] && typeof src[key] === 'object' ? src[key] : null;
    const prev = base[key] || {};
    const out = {};
    for (const k of keys) out[k] = from && k in from ? fn(from[k]) : fn(prev[k]);
    return out;
  };

  return {
    name: pick('name', (v) => str(v, 120)) || '',
    church: pick('church', (v) => str(v, 120)) || '',
    district: pick('district', (v) => str(v, 120)) || '',
    members,
    responsaveis: obj('responsaveis', RESPONSAVEIS, (v) => str(v, 120)),
    treinamentos: obj('treinamentos', TREINAMENTOS, (v) => ({
      done: bool(v && v.done),
      date: date(v && v.date),
    })),
    local: pick('local', (v) => str(v, 600)) || '',
    divulgacao: obj('divulgacao', DIVULGACAO, (v) => ({
      use: bool(v && v.use),
      date: date(v && v.date),
    })),
    alvoBatismo: pick('alvoBatismo', int) || 0,
    alvoEstudos: pick('alvoEstudos', int) || 0,
    acoes: obj('acoes', ACOES, date),
  };
}

function publicUser(u) {
  return u && { id: u.id, name: u.name, role: u.role, phone: u.phone, church: u.church, district: u.district, createdAt: u.createdAt };
}

// ---------- HTTP ----------

function send(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('Requisição muito grande'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('JSON inválido'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

const fail = (status, message) => Object.assign(new Error(message), { status });

function requireUser(req) {
  const userId = req.headers['x-user-id'];
  const user = db.users.find((u) => u.id === userId);
  if (!user) throw fail(401, 'Sessão inválida. Entre novamente.');
  return user;
}

function ownTeam(user, teamId) {
  const team = db.teams.find((t) => t.id === teamId);
  if (!team) throw fail(404, 'Equipe não encontrada.');
  if (team.ownerId !== user.id) throw fail(403, 'Esta equipe pertence a outro usuário.');
  return team;
}

async function api(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean).slice(1); // remove "api"
  const method = req.method;

  // Cadastro de pastor/líder (sem senha por enquanto)
  if (method === 'POST' && parts[0] === 'register') {
    const body = await readBody(req);
    const name = str(body.name, 120);
    const phone = str(body.phone, 30);
    const role = body.role === 'pastor' ? 'pastor' : body.role === 'lider' ? 'lider' : '';
    if (!name || !role || digits(phone).length < 8) {
      throw fail(400, 'Informe nome, função e um telefone válido.');
    }
    if (db.users.some((u) => digits(u.phone) === digits(phone))) {
      throw fail(409, 'Já existe um cadastro com este telefone. Use "Entrar".');
    }
    const user = {
      id: id(), name, phone, role,
      church: str(body.church, 120),
      district: str(body.district, 120),
      createdAt: now(),
    };
    db.users.push(user);
    saveDb();
    return send(res, 201, publicUser(user));
  }

  // Acesso sem senha: identificação pelo telefone
  if (method === 'POST' && parts[0] === 'login') {
    const body = await readBody(req);
    const user = db.users.find((u) => digits(u.phone) === digits(body.phone) && digits(body.phone));
    if (!user) throw fail(404, 'Nenhum cadastro encontrado com este telefone.');
    return send(res, 200, publicUser(user));
  }

  if (method === 'GET' && parts[0] === 'me') {
    return send(res, 200, publicUser(requireUser(req)));
  }

  if (parts[0] === 'teams') {
    const user = requireUser(req);
    const teamId = parts[1];

    if (method === 'GET' && !teamId) {
      return send(res, 200, db.teams.filter((t) => t.ownerId === user.id));
    }
    if (method === 'POST' && !teamId) {
      const body = await readBody(req);
      const data = sanitizeTeam(body);
      if (!data.name) throw fail(400, 'Informe o nome da equipe.');
      if (!data.district) data.district = user.district;
      if (!data.church) data.church = user.church;
      const team = { id: id(), ownerId: user.id, ...data, createdAt: now(), updatedAt: now() };
      db.teams.push(team);
      saveDb();
      return send(res, 201, team);
    }
    if (teamId && method === 'GET') return send(res, 200, ownTeam(user, teamId));
    if (teamId && method === 'PUT') {
      const team = ownTeam(user, teamId);
      const body = await readBody(req);
      const data = sanitizeTeam(body, team);
      if (!data.name) throw fail(400, 'Informe o nome da equipe.');
      Object.assign(team, data, { updatedAt: now() });
      saveDb();
      return send(res, 200, team);
    }
    if (teamId && method === 'DELETE') {
      ownTeam(user, teamId);
      db.teams = db.teams.filter((t) => t.id !== teamId);
      saveDb();
      return send(res, 200, { ok: true });
    }
  }

  // Área do administrador (sem senha por enquanto)
  if (method === 'GET' && parts[0] === 'admin' && parts[1] === 'overview') {
    const users = new Map(db.users.map((u) => [u.id, publicUser(u)]));
    return send(res, 200, {
      generatedAt: now(),
      users: [...users.values()],
      teams: db.teams.map((t) => ({ ...t, owner: users.get(t.ownerId) || null })),
    });
  }

  throw fail(404, 'Rota não encontrada.');
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/' || !path.extname(rel)) rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403);
    return res.end();
  }
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Não encontrado');
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(buf);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') throw fail(405, 'Método não permitido.');
    return serveStatic(req, res, url);
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) console.error(err);
    return send(res, status, { error: status === 500 ? 'Erro interno do servidor.' : err.message });
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Calebe 2027 rodando em http://localhost:${PORT}`);
  });
}

module.exports = { server, sanitizeTeam };
