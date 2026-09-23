'use strict';

// Armazenamento dos dados.
// - Redis (Upstash) quando as variáveis de ambiente estão definidas — usado no Vercel.
// - Arquivo JSON local nos demais casos (npm start).

const fs = require('fs');
const path = require('path');

// ---------- Redis (Upstash REST) ----------

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ''), token } : null;
}

function redisStore({ url, token }) {
  const PREFIX = process.env.REDIS_PREFIX || 'calebe2027';
  const USERS = `${PREFIX}:users`;
  const TEAMS = `${PREFIX}:teams`;

  async function cmd(...args) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) throw new Error(`Redis: ${data.error || res.status}`);
    return data.result;
  }

  const parseAll = (flat) => {
    const out = [];
    for (let i = 1; i < (flat || []).length; i += 2) out.push(JSON.parse(flat[i]));
    return out;
  };
  const parseOne = (v) => (v ? JSON.parse(v) : null);

  return {
    kind: 'redis',
    listUsers: async () => parseAll(await cmd('HGETALL', USERS)),
    getUser: async (id) => parseOne(await cmd('HGET', USERS, id)),
    putUser: (u) => cmd('HSET', USERS, u.id, JSON.stringify(u)),
    listTeams: async () => parseAll(await cmd('HGETALL', TEAMS)),
    getTeam: async (id) => parseOne(await cmd('HGET', TEAMS, id)),
    putTeam: (t) => cmd('HSET', TEAMS, t.id, JSON.stringify(t)),
    deleteTeam: (id) => cmd('HDEL', TEAMS, id),
  };
}

// ---------- Arquivo JSON local ----------

function fileStore(dir) {
  const file = path.join(dir, 'db.json');
  let db;
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    db = { users: raw.users || [], teams: raw.teams || [] };
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Falha ao ler o banco:', err.message);
    db = { users: [], teams: [] };
  }

  function save() {
    fs.mkdirSync(dir, { recursive: true });
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
    fs.renameSync(tmp, file);
  }
  const upsert = (list, item) => {
    const i = list.findIndex((x) => x.id === item.id);
    if (i >= 0) list[i] = item; else list.push(item);
    save();
  };
  const clone = (v) => (v ? JSON.parse(JSON.stringify(v)) : null);

  return {
    kind: 'file',
    listUsers: async () => clone(db.users),
    getUser: async (id) => clone(db.users.find((u) => u.id === id)),
    putUser: async (u) => upsert(db.users, clone(u)),
    listTeams: async () => clone(db.teams),
    getTeam: async (id) => clone(db.teams.find((t) => t.id === id)),
    putTeam: async (t) => upsert(db.teams, clone(t)),
    deleteTeam: async (id) => { db.teams = db.teams.filter((t) => t.id !== id); save(); },
  };
}

// No Vercel o disco não é persistente: sem Redis, os dados se perderiam.
function unavailableStore() {
  const fail = async () => {
    throw Object.assign(new Error(
      'Banco de dados não configurado. No Vercel, adicione a integração Upstash Redis ao projeto e faça um novo deploy.'
    ), { status: 503 });
  };
  return {
    kind: 'none',
    listUsers: fail, getUser: fail, putUser: fail,
    listTeams: fail, getTeam: fail, putTeam: fail, deleteTeam: fail,
  };
}

function createStore() {
  const redis = redisConfig();
  if (redis) return redisStore(redis);
  if (process.env.VERCEL) return unavailableStore();
  return fileStore(process.env.DATA_DIR || path.join(__dirname, '..', 'data'));
}

module.exports = { createStore, redisStore, fileStore };
