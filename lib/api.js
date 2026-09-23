'use strict';

// API do Sistema de Acompanhamento Calebe 2027.
// Usada tanto pelo servidor local (server.js) quanto pela função do Vercel (api/index.js).

const crypto = require('crypto');
const { createStore } = require('./storage');

const MAX_BODY = 1024 * 1024;

const RESPONSAVEIS = [
  'visitacao', 'pregador', 'louvor', 'criancas', 'sonoplastia',
  'recepcao', 'midia', 'apoio', 'brindes', 'lanche',
];
const TREINAMENTOS = ['outubro', 'novembro', 'dezembro'];
const DIVULGACAO = ['faixa', 'convites', 'carroSom', 'redesSociais'];
const ACOES = ['sopao', 'mutirao', 'feiraSaude'];

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
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

const fail = (status, message) => Object.assign(new Error(message), { status });

function readBody(req) {
  // No Vercel o corpo pode já vir interpretado em req.body
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
    try {
      const text = String(req.body);
      return Promise.resolve(text ? JSON.parse(text) : {});
    } catch {
      return Promise.reject(fail(400, 'JSON inválido'));
    }
  }
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(fail(413, 'Requisição muito grande'));
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
        reject(fail(400, 'JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}

function createApi(store = createStore()) {
  async function requireUser(req) {
    const userId = req.headers['x-user-id'];
    const user = userId && (await store.getUser(String(userId)));
    if (!user) throw fail(401, 'Sessão inválida. Entre novamente.');
    return user;
  }

  async function ownTeam(user, teamId) {
    const team = await store.getTeam(teamId);
    if (!team) throw fail(404, 'Equipe não encontrada.');
    if (team.ownerId !== user.id) throw fail(403, 'Esta equipe pertence a outro usuário.');
    return team;
  }

  async function route(req, res, parts) {
    const method = req.method;

    if (method === 'GET' && parts[0] === 'health') {
      return send(res, 200, { ok: store.kind !== 'none', storage: store.kind });
    }

    // Cadastro de pastor/líder (sem senha por enquanto)
    if (method === 'POST' && parts[0] === 'register') {
      const body = await readBody(req);
      const name = str(body.name, 120);
      const phone = str(body.phone, 30);
      const role = body.role === 'pastor' ? 'pastor' : body.role === 'lider' ? 'lider' : '';
      if (!name || !role || digits(phone).length < 8) {
        throw fail(400, 'Informe nome, função e um telefone válido.');
      }
      const users = await store.listUsers();
      if (users.some((u) => digits(u.phone) === digits(phone))) {
        throw fail(409, 'Já existe um cadastro com este telefone. Use "Entrar".');
      }
      const user = {
        id: id(), name, phone, role,
        church: str(body.church, 120),
        district: str(body.district, 120),
        createdAt: now(),
      };
      await store.putUser(user);
      return send(res, 201, publicUser(user));
    }

    // Acesso sem senha: identificação pelo telefone
    if (method === 'POST' && parts[0] === 'login') {
      const body = await readBody(req);
      const phone = digits(body.phone);
      const user = phone && (await store.listUsers()).find((u) => digits(u.phone) === phone);
      if (!user) throw fail(404, 'Nenhum cadastro encontrado com este telefone.');
      return send(res, 200, publicUser(user));
    }

    if (method === 'GET' && parts[0] === 'me') {
      return send(res, 200, publicUser(await requireUser(req)));
    }

    if (parts[0] === 'teams') {
      const user = await requireUser(req);
      const teamId = parts[1];

      if (method === 'GET' && !teamId) {
        const teams = (await store.listTeams()).filter((t) => t.ownerId === user.id);
        teams.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        return send(res, 200, teams);
      }
      if (method === 'POST' && !teamId) {
        const data = sanitizeTeam(await readBody(req));
        if (!data.name) throw fail(400, 'Informe o nome da equipe.');
        if (!data.district) data.district = user.district;
        if (!data.church) data.church = user.church;
        const team = { id: id(), ownerId: user.id, ...data, createdAt: now(), updatedAt: now() };
        await store.putTeam(team);
        return send(res, 201, team);
      }
      if (teamId && method === 'GET') return send(res, 200, await ownTeam(user, teamId));
      if (teamId && method === 'PUT') {
        const team = await ownTeam(user, teamId);
        const data = sanitizeTeam(await readBody(req), team);
        if (!data.name) throw fail(400, 'Informe o nome da equipe.');
        Object.assign(team, data, { updatedAt: now() });
        await store.putTeam(team);
        return send(res, 200, team);
      }
      if (teamId && method === 'DELETE') {
        await ownTeam(user, teamId);
        await store.deleteTeam(teamId);
        return send(res, 200, { ok: true });
      }
    }

    // Área do administrador (sem senha por enquanto)
    if (method === 'GET' && parts[0] === 'admin' && parts[1] === 'overview') {
      const [users, teams] = await Promise.all([store.listUsers(), store.listTeams()]);
      const byId = new Map(users.map((u) => [u.id, publicUser(u)]));
      teams.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return send(res, 200, {
        generatedAt: now(),
        users: [...byId.values()],
        teams: teams.map((t) => ({ ...t, owner: byId.get(t.ownerId) || null })),
      });
    }

    throw fail(404, 'Rota não encontrada.');
  }

  // Recebe a requisição e o caminho após "/api/"
  return async function handle(req, res, apiPath) {
    try {
      const parts = String(apiPath || '').split('/').filter(Boolean);
      await route(req, res, parts);
    } catch (err) {
      const status = err.status || 500;
      if (status === 500) console.error(err);
      send(res, status, { error: status === 500 ? 'Erro interno do servidor.' : err.message });
    }
  };
}

module.exports = { createApi, sanitizeTeam };
