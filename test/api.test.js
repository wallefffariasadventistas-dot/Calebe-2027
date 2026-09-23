'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const { createServer } = require('../server');
const { createApi } = require('../lib/api');
const { fileStore, redisStore } = require('../lib/storage');

// Servidor falso que imita a API REST do Upstash (HSET/HGET/HGETALL/HDEL)
function fakeUpstash(token) {
  const data = new Map();
  const srv = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      if (req.headers.authorization !== `Bearer ${token}`) {
        res.writeHead(401);
        return res.end(JSON.stringify({ error: 'Unauthorized' }));
      }
      const [cmd, key, field, value] = JSON.parse(body);
      const h = data.get(key) || new Map();
      data.set(key, h);
      let result = null;
      if (cmd === 'HSET') { result = h.has(field) ? 0 : 1; h.set(field, value); }
      else if (cmd === 'HGET') result = h.get(field) ?? null;
      else if (cmd === 'HGETALL') result = [...h.entries()].flat();
      else if (cmd === 'HDEL') result = h.delete(field) ? 1 : 0;
      res.end(JSON.stringify({ result }));
    });
  });
  return srv;
}

const listen = (srv) => new Promise((r) => srv.listen(0, () => r(`http://localhost:${srv.address().port}`)));

async function scenario(base) {
  async function call(p, { method = 'GET', body, user } = {}) {
    const res = await fetch(base + p, {
      method,
      headers: { 'Content-Type': 'application/json', ...(user ? { 'X-User-Id': user.id } : {}) },
      body: body && JSON.stringify(body),
    });
    return { status: res.status, data: await res.json() };
  }

  const pastor = (await call('/register', { method: 'POST', body: { name: 'Pr. João', phone: '(11) 98888-7777', role: 'pastor', district: 'Central' } })).data;
  assert.ok(pastor.id);
  assert.equal((await call('/register', { method: 'POST', body: { name: 'X', phone: '11988887777', role: 'lider' } })).status, 409);
  assert.equal((await call('/login', { method: 'POST', body: { phone: '11 98888 7777' } })).data.id, pastor.id);
  assert.equal((await call('/login', { method: 'POST', body: { phone: '' } })).status, 404);

  const lider = (await call('/register', { method: 'POST', body: { name: 'Ana', phone: '21 99999-0000', role: 'lider', district: 'Norte' } })).data;

  const t1 = (await call('/teams', { method: 'POST', user: pastor, body: { name: 'Equipe A' } })).data;
  assert.equal(t1.district, 'Central');
  const put = await call(`/teams/${t1.id}`, {
    method: 'PUT', user: pastor,
    body: {
      ...t1,
      members: [{ name: 'Lucas', phone: '1' }, { name: '', phone: 'x' }, { name: 'Maria', phone: '2' }],
      alvoBatismo: 10, alvoEstudos: '25',
      treinamentos: { outubro: { done: true, date: '2026-10-10' } },
      divulgacao: { faixa: { use: true, date: 'bad' } },
      acoes: { sopao: '2026-10-20' },
      ownerId: 'hack',
    },
  });
  assert.equal(put.data.members.length, 2);
  assert.equal(put.data.alvoEstudos, 25);
  assert.equal(put.data.ownerId, pastor.id);
  assert.equal(put.data.divulgacao.faixa.date, '');
  assert.equal(put.data.treinamentos.novembro.done, false);
  assert.equal((await call(`/teams/${t1.id}`, { user: pastor })).data.members.length, 2);

  const t2 = (await call('/teams', { method: 'POST', user: lider, body: { name: 'Equipe B', alvoBatismo: 5, alvoEstudos: 7 } })).data;
  const t3 = (await call('/teams', { method: 'POST', user: lider, body: { name: 'Equipe C', alvoBatismo: 1 } })).data;

  assert.equal((await call(`/teams/${t1.id}`, { method: 'PUT', user: lider, body: { name: 'x' } })).status, 403);
  assert.equal((await call('/teams', { user: lider })).data.length, 2);
  assert.equal((await call('/teams')).status, 401);
  assert.equal((await call(`/teams/${t3.id}`, { method: 'DELETE', user: lider })).status, 200);
  assert.deepEqual((await call('/teams', { user: lider })).data.map((t) => t.id), [t2.id]);

  const ov = (await call('/admin/overview')).data;
  assert.equal(ov.teams.length, 2);
  assert.equal(ov.teams.reduce((a, t) => a + t.alvoBatismo, 0), 15);
  assert.equal(ov.teams.reduce((a, t) => a + t.alvoEstudos, 0), 32);
  assert.equal(ov.teams.find((t) => t.id === t1.id).owner.name, 'Pr. João');
}

test('servidor local com arquivo JSON', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'calebe-'));
  const server = createServer(createApi(fileStore(dir)));
  const base = await listen(server);
  try {
    assert.equal((await (await fetch(`${base}/api/health`)).json()).storage, 'file');
    await scenario(`${base}/api`);
    assert.ok(fs.existsSync(path.join(dir, 'db.json')));
    assert.equal((await fetch(`${base}/`)).status, 200);
  } finally {
    server.close();
  }
});

test('função do Vercel com Redis (Upstash)', async () => {
  const upstash = fakeUpstash('segredo');
  const upstashUrl = await listen(upstash);
  const handle = createApi(redisStore({ url: upstashUrl, token: 'segredo' }));

  // Simula o Vercel: função em /api/index, caminho original em ?path= e corpo já interpretado
  process.env.UPSTASH_REDIS_REST_URL = upstashUrl;
  process.env.UPSTASH_REDIS_REST_TOKEN = 'segredo';
  delete require.cache[require.resolve('../api/index')];
  const vercelFn = require('../api/index');
  const fn = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const rewritten = `/api/index?path=${encodeURIComponent(url.pathname.replace(/^\/api\//, ''))}`;
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      req.url = rewritten;
      if (raw) req.body = JSON.parse(raw);
      vercelFn(req, res);
    });
  });
  const base = await listen(fn);
  try {
    assert.equal((await (await fetch(`${base}/api/health`)).json()).storage, 'redis');
    await scenario(`${base}/api`);
    // Os dados ficam no Redis: uma nova instância da API enxerga tudo
    const again = createApi(redisStore({ url: upstashUrl, token: 'segredo' }));
    const direct = http.createServer((req, res) => again(req, res, new URL(req.url, 'http://x').pathname.slice(5)));
    const b2 = await listen(direct);
    assert.equal((await (await fetch(`${b2}/api/admin/overview`)).json()).teams.length, 2);
    direct.close();
  } finally {
    fn.close();
    upstash.close();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  }
});

test('no Vercel sem Redis, a API avisa que o banco não está configurado', async () => {
  process.env.VERCEL = '1';
  delete require.cache[require.resolve('../api/index')];
  const vercelFn = require('../api/index');
  delete process.env.VERCEL;
  const srv = http.createServer((req, res) => vercelFn(req, res));
  const base = await listen(srv);
  try {
    const health = await (await fetch(`${base}/api/index?path=health`)).json();
    assert.deepEqual(health, { ok: false, storage: 'none' });
    const res = await fetch(`${base}/api/index?path=login`, { method: 'POST', body: '{"phone":"1"}' });
    assert.equal(res.status, 503);
    assert.match((await res.json()).error, /Upstash Redis/);
  } finally {
    srv.close();
  }
});
