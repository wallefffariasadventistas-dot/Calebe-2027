'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'calebe-'));
const { server } = require('../server');

let base;
test.before(() => new Promise((r) => server.listen(0, () => { base = `http://localhost:${server.address().port}/api`; r(); })));
test.after(() => server.close());

async function call(p, { method = 'GET', body, user } = {}) {
  const res = await fetch(base + p, {
    method,
    headers: { 'Content-Type': 'application/json', ...(user ? { 'X-User-Id': user.id } : {}) },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

test('cadastro, equipes e consolidação do administrador', async () => {
  const pastor = (await call('/register', { method: 'POST', body: { name: 'Pr. João', phone: '(11) 98888-7777', role: 'pastor', district: 'Central' } })).data;
  assert.ok(pastor.id);
  assert.equal((await call('/register', { method: 'POST', body: { name: 'X', phone: '11988887777', role: 'lider' } })).status, 409);
  assert.equal((await call('/login', { method: 'POST', body: { phone: '11 98888 7777' } })).data.id, pastor.id);

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

  await call('/teams', { method: 'POST', user: lider, body: { name: 'Equipe B', alvoBatismo: 5, alvoEstudos: 7 } });

  assert.equal((await call(`/teams/${t1.id}`, { method: 'PUT', user: lider, body: { name: 'x' } })).status, 403);
  assert.equal((await call('/teams', { user: lider })).data.length, 1);
  assert.equal((await call('/teams')).status, 401);

  const ov = (await call('/admin/overview')).data;
  assert.equal(ov.teams.length, 2);
  assert.equal(ov.teams.reduce((a, t) => a + t.alvoBatismo, 0), 15);
  assert.equal(ov.teams.reduce((a, t) => a + t.alvoEstudos, 0), 32);
  assert.ok(fs.existsSync(path.join(process.env.DATA_DIR, 'db.json')));
});
