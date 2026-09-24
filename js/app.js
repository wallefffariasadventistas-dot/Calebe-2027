/* =========================================================
   Calebe 2027 — Sistema de Acompanhamento
   Site estático + Firebase Firestore
   ========================================================= */

import {
  db, firebaseReady, collection, doc, addDoc, setDoc, getDoc, getDocs, deleteDoc, query, where,
} from './firebase-config.js';

// ---------- Configuração ----------

const DEADLINE = new Date(2026, 9, 31, 23, 59, 59); // 31/10/2026

const RESPONSAVEIS = [
  { key: 'visitacao', label: 'Visitação', icon: 'door' },
  { key: 'pregador', label: 'Pregador', icon: 'book' },
  { key: 'louvor', label: 'Equipe de louvor', icon: 'music' },
  { key: 'criancas', label: 'Crianças', icon: 'smile' },
  { key: 'sonoplastia', label: 'Sonoplastia', icon: 'speaker' },
  { key: 'recepcao', label: 'Recepção', icon: 'hand' },
  { key: 'midia', label: 'Mídia', icon: 'camera' },
  { key: 'apoio', label: 'Apoio', icon: 'users' },
  { key: 'brindes', label: 'Brindes', icon: 'gift' },
  { key: 'lanche', label: 'Lanche', icon: 'coffee' },
];

const TREINAMENTOS = [
  { key: 'outubro', label: 'Outubro', short: 'Out', min: '2026-10-01', max: '2026-10-31' },
  { key: 'novembro', label: 'Novembro', short: 'Nov', min: '2026-11-01', max: '2026-11-30' },
  { key: 'dezembro', label: 'Dezembro', short: 'Dez', min: '2026-12-01', max: '2026-12-31' },
];

const DIVULGACAO = [
  { key: 'faixa', label: 'Faixa do Calebe', desc: 'Faixa exposta na igreja ou no local', icon: 'flag' },
  { key: 'convites', label: 'Convites', desc: 'Convites impressos entregues na comunidade', icon: 'mail' },
  { key: 'carroSom', label: 'Carro de som', desc: 'Divulgação volante pelas ruas', icon: 'megaphone' },
  { key: 'redesSociais', label: 'Redes sociais', desc: 'Instagram, WhatsApp, Facebook e outras', icon: 'share' },
];

const ACOES = [
  { key: 'sopao', label: 'Sopão', desc: 'Realizado no local, em outubro', month: 'Out', year: '2026', min: '2026-10-01', max: '2026-10-31', icon: 'soup' },
  { key: 'mutirao', label: 'Mutirão de Visitas', desc: 'Realizado em novembro', month: 'Nov', year: '2026', min: '2026-11-01', max: '2026-11-30', icon: 'door' },
  { key: 'feiraSaude', label: 'Feira de Saúde', desc: 'Realizada em janeiro', month: 'Jan', year: '2027', min: '2027-01-01', max: '2027-01-31', icon: 'heart' },
];

const STEPS = [
  { key: 'equipe', label: 'Equipe', sub: 'Participantes' },
  { key: 'responsaveis', label: 'Responsáveis', sub: '10 áreas' },
  { key: 'treinamento', label: 'Treinamento', sub: 'Out · Nov · Dez' },
  { key: 'local', label: 'Local', sub: 'Onde será o Calebe' },
  { key: 'divulgacao', label: 'Divulgação', sub: 'Meios e datas' },
  { key: 'alvos', label: 'Alvos', sub: 'Batismos e estudos' },
  { key: 'acoes', label: 'Ações', sub: 'Sopão · Mutirão · Feira' },
];

// ---------- Ícones ----------

const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.6.8 2.6 2.5 3 5.2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.2-6 8-6s7 2 8 6"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6Z"/><path d="m9 12 2 2 4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  pin: '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
  water: '<path d="M12 3s6.5 7.2 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10.2 12 3 12 3Z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5M12 7v6M9 10h6"/>',
  door: '<path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18"/><circle cx="15" cy="12" r="1"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>',
  speaker: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="14" r="3.5"/><path d="M12 7h.01"/>',
  hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11.5v-8a1.5 1.5 0 0 1 3 0v8M14 11.5v-6a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.9-2.6L3 14a1.6 1.6 0 0 1 2.5-2L8 14"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.5"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8S10.5 3 7.5 4.5 9 8 12 8Zm0 0s1.5-5 4.5-3.5S15 8 12 8Z"/>',
  coffee: '<path d="M4 9h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6Z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3"/>',
  flag: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  megaphone: '<path d="M3 10v4h3l8 5V5L6 10Z"/><path d="M18 9a4 4 0 0 1 0 6M6 14l1.5 6H10l-1-5.5"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
  soup: '<path d="M3 11h18a9 9 0 0 1-18 0ZM7 21h10"/><path d="M8 7c0-1.5 1-1.5 1-3M12 7c0-1.5 1-1.5 1-3M16 7c0-1.5 1-1.5 1-3"/>',
  heart: '<path d="M12 20s-7.5-4.5-9-9.5C2 6.9 4.5 4 7.5 4c1.9 0 3.4 1 4.5 2.5C13.1 5 14.6 4 16.5 4 19.5 4 22 6.9 21 10.5 19.5 15.5 12 20 12 20Z"/><path d="M8 11h2.5l1-2 1.5 4 1-2H16"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.7-4.4M4 4v4h4M4 13a8 8 0 0 0 14.7 4.4M20 20v-4h-4"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  grad: '<path d="m2 9 10-5 10 5-10 5Z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M12 3 2 20h20Z"/><path d="M12 10v4M12 17h.01"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
};

function icon(name, extra = '') {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${ICONS[name] || ''}</svg>`;
}

// ---------- Utilidades ----------

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const app = document.getElementById('app');

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function fmtShort(iso) {
  if (!iso) return { d: '', m: '' };
  const [y, m, d] = iso.split('-');
  return { d, m: MONTHS[Number(m) - 1], y };
}
const weekday = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' });
const num = (n) => Number(n || 0).toLocaleString('pt-BR');
const initials = (name) => (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
// Primeiro nome, ignorando títulos como "Pr." ou "Ev."
const firstName = (name) => (name || '').split(/\s+/).find((p) => p && !p.endsWith('.')) || name;
const inRange = (iso, min, max) => !iso || (iso >= min && iso <= max);

function maskPhone(v) {
  const d = String(v).replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function daysUntil(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

const store = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  },
  set(key, value) {
    try { value == null ? localStorage.removeItem(key) : localStorage.setItem(key, JSON.stringify(value)); } catch { /* armazenamento indisponível */ }
  },
};

let toastTimer;
function toast(message, type = '') {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 2800);
}

// ---------- Sessão e API ----------

let session = store.get('calebe.session'); // { kind: 'user', user } | { kind: 'admin' }

function setSession(s) {
  session = s;
  if (!s) sessionChecked = false;
  store.set('calebe.session', s);
}

// ---------- Dados (Firestore) ----------

const USERS = 'calebe_usuarios';
const TEAMS = 'calebe_equipes';

const clean = (v, max = 160) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const onlyDigits = (v) => String(v || '').replace(/\D/g, '');
const cleanDate = (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '');
const cleanInt = (v) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 1000000) : 0;
};

function fail(message) { return new Error(message); }

// Traduz erros do Firebase para mensagens claras
async function guard(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err && err.code === 'permission-denied') throw fail('Sem permissão no banco de dados. Verifique as regras do Firestore.');
    if (err && err.code === 'unavailable') throw fail('Sem conexão com o banco de dados. Verifique sua internet.');
    throw err instanceof Error && !err.code ? err : fail('Não foi possível concluir a operação. Tente novamente.');
  }
}

const withId = (snap) => ({ id: snap.id, ...snap.data() });
const byCreated = (a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || ''));

function sanitizeTeam(t) {
  return {
    name: clean(t.name, 120),
    church: clean(t.church, 120),
    district: clean(t.district, 120),
    members: (t.members || []).slice(0, 500)
      .map((m) => ({ name: clean(m.name, 120), phone: clean(m.phone, 30) }))
      .filter((m) => m.name),
    responsaveis: Object.fromEntries(RESPONSAVEIS.map((r) => [r.key, clean(t.responsaveis?.[r.key], 120)])),
    treinamentos: Object.fromEntries(TREINAMENTOS.map((m) => [m.key, {
      done: t.treinamentos?.[m.key]?.done === true, date: cleanDate(t.treinamentos?.[m.key]?.date),
    }])),
    local: clean(t.local, 600),
    divulgacao: Object.fromEntries(DIVULGACAO.map((d) => [d.key, {
      use: t.divulgacao?.[d.key]?.use === true, date: cleanDate(t.divulgacao?.[d.key]?.date),
    }])),
    alvoBatismo: cleanInt(t.alvoBatismo),
    alvoEstudos: cleanInt(t.alvoEstudos),
    acoes: Object.fromEntries(ACOES.map((a) => [a.key, cleanDate(t.acoes?.[a.key])])),
  };
}

const data = {
  register: (input) => guard(async () => {
    const name = clean(input.name, 120);
    const phone = clean(input.phone, 30);
    const role = input.role === 'pastor' || input.role === 'lider' ? input.role : '';
    if (!name || !role || onlyDigits(phone).length < 8) throw fail('Informe nome, função e um telefone válido.');
    const dup = await getDocs(query(collection(db, USERS), where('phoneDigits', '==', onlyDigits(phone))));
    if (!dup.empty) throw fail('Já existe um cadastro com este telefone. Use "Entrar".');
    const user = {
      name, phone, phoneDigits: onlyDigits(phone), role,
      church: clean(input.church, 120), district: clean(input.district, 120),
      createdAt: new Date().toISOString(),
    };
    const ref = await addDoc(collection(db, USERS), user);
    return { id: ref.id, ...user };
  }),

  login: (phone) => guard(async () => {
    const digits = onlyDigits(phone);
    if (!digits) throw fail('Informe o telefone.');
    const snap = await getDocs(query(collection(db, USERS), where('phoneDigits', '==', digits)));
    if (snap.empty) throw fail('Nenhum cadastro encontrado com este telefone.');
    return withId(snap.docs[0]);
  }),

  getUser: (id) => guard(async () => {
    const snap = await getDoc(doc(db, USERS, id));
    return snap.exists() ? withId(snap) : null;
  }),

  myTeams: () => guard(async () => {
    const snap = await getDocs(query(collection(db, TEAMS), where('ownerId', '==', session.user.id)));
    return snap.docs.map(withId).sort(byCreated);
  }),

  getTeam: (id) => guard(async () => {
    const snap = await getDoc(doc(db, TEAMS, id));
    if (!snap.exists()) throw fail('Equipe não encontrada.');
    const team = withId(snap);
    if (team.ownerId !== session.user.id) throw fail('Esta equipe pertence a outro usuário.');
    return team;
  }),

  createTeam: (input) => guard(async () => {
    const t = sanitizeTeam({ ...blankTeam(), ...input });
    if (!t.name) throw fail('Informe o nome da equipe.');
    t.church = t.church || session.user.church || '';
    t.district = t.district || session.user.district || '';
    const now = new Date().toISOString();
    const team = { ...t, ownerId: session.user.id, createdAt: now, updatedAt: now };
    const ref = await addDoc(collection(db, TEAMS), team);
    return { id: ref.id, ...team };
  }),

  saveTeam: (team) => guard(async () => {
    const t = sanitizeTeam(team);
    if (!t.name) throw fail('Informe o nome da equipe.');
    await setDoc(doc(db, TEAMS, team.id), {
      ...t, ownerId: session.user.id, createdAt: team.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
  }),

  deleteTeam: (id) => guard(() => deleteDoc(doc(db, TEAMS, id))),

  overview: () => guard(async () => {
    const [us, ts] = await Promise.all([getDocs(collection(db, USERS)), getDocs(collection(db, TEAMS))]);
    const users = new Map(us.docs.map((d) => [d.id, withId(d)]));
    return {
      users: [...users.values()],
      teams: ts.docs.map(withId).sort(byCreated).map((t) => ({ ...t, owner: users.get(t.ownerId) || null })),
    };
  }),
};

// ---------- Cálculos ----------

function blankTeam() {
  return {
    name: '', church: '', district: '', members: [], local: '', alvoBatismo: 0, alvoEstudos: 0,
    responsaveis: Object.fromEntries(RESPONSAVEIS.map((r) => [r.key, ''])),
    treinamentos: Object.fromEntries(TREINAMENTOS.map((t) => [t.key, { done: false, date: '' }])),
    divulgacao: Object.fromEntries(DIVULGACAO.map((d) => [d.key, { use: false, date: '' }])),
    acoes: Object.fromEntries(ACOES.map((a) => [a.key, ''])),
  };
}

function normalize(team) {
  const b = blankTeam();
  return {
    ...b, ...team,
    responsaveis: { ...b.responsaveis, ...(team.responsaveis || {}) },
    treinamentos: { ...b.treinamentos, ...(team.treinamentos || {}) },
    divulgacao: { ...b.divulgacao, ...(team.divulgacao || {}) },
    acoes: { ...b.acoes, ...(team.acoes || {}) },
    members: team.members || [],
  };
}

function stepScores(t) {
  const resp = RESPONSAVEIS.filter((r) => (t.responsaveis[r.key] || '').trim()).length;
  const trein = TREINAMENTOS.filter((m) => t.treinamentos[m.key].done && t.treinamentos[m.key].date && inRange(t.treinamentos[m.key].date, m.min, m.max)).length;
  const used = DIVULGACAO.filter((d) => t.divulgacao[d.key].use);
  const div = used.length ? used.filter((d) => t.divulgacao[d.key].date).length / used.length : 0;
  const acoes = ACOES.filter((a) => t.acoes[a.key] && inRange(t.acoes[a.key], a.min, a.max)).length;
  return {
    equipe: t.members.length ? 1 : 0,
    responsaveis: resp / RESPONSAVEIS.length,
    treinamento: trein / TREINAMENTOS.length,
    local: (t.local || '').trim() ? 1 : 0,
    divulgacao: div,
    alvos: ((t.alvoBatismo > 0) + (t.alvoEstudos > 0)) / 2,
    acoes: acoes / ACOES.length,
  };
}

function progress(t) {
  const s = Object.values(stepScores(t));
  return Math.round((s.reduce((a, b) => a + b, 0) / s.length) * 100);
}

function trainingsDone(t) {
  return TREINAMENTOS.filter((m) => t.treinamentos[m.key].done).length;
}

// ---------- Componentes ----------

function ring(pct, size = '') {
  const r = 22;
  const c = 2 * Math.PI * r;
  return `<div class="ring ${size} ${pct >= 100 ? 'done' : ''}" role="img" aria-label="${pct}% concluído">
    <svg viewBox="0 0 54 54"><circle class="bg" cx="27" cy="27" r="${r}"/><circle class="fg" cx="27" cy="27" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}"/></svg>
    <b>${pct}%</b></div>`;
}

function deadlineBanner({ admin = false } = {}) {
  const days = daysUntil(DEADLINE);
  const late = days < 0;
  const title = late ? 'O prazo de cadastro das equipes encerrou' : 'Cadastre suas equipes até 31 de outubro de 2026';
  const text = admin
    ? 'Pastores e líderes devem concluir o cadastro das equipes (participantes e responsáveis) até esta data.'
    : 'Pastor e líder: registre todos os participantes, com nome e telefone, e os responsáveis de cada área até esta data.';
  return `<section class="deadline ${late ? 'late' : ''}">
    <div class="cal" aria-hidden="true"><b>OUT 2026</b><span>31</span></div>
    <div class="txt"><h3>${title}</h3><p>${text}</p></div>
    <div class="countdown">${late
      ? `<strong>${Math.abs(days)}</strong><small>dias após o prazo</small>`
      : days === 0 ? '<strong>Hoje</strong><small>último dia</small>'
      : `<strong>${days}</strong><small>${days === 1 ? 'dia restante' : 'dias restantes'}</small>`}</div>
  </section>`;
}

function kpi({ label, value, foot = '', ico = 'chart', variant = '' }) {
  return `<div class="card kpi ${variant}">
    <div class="kpi-ico">${icon(ico)}</div>
    <div class="kpi-label">${label}</div>
    <div class="kpi-value">${value}</div>
    ${foot ? `<div class="kpi-foot">${foot}</div>` : ''}
  </div>`;
}

// Barras horizontais de uma única série (cor única, rótulos em tinta de texto)
function bars(rows, { unit = '', max } = {}) {
  if (!rows.length) return `<div class="empty">${icon('chart')}<p>Sem dados ainda.</p></div>`;
  const top = max ?? Math.max(1, ...rows.map((r) => r.value));
  return `<div class="bars">${rows.map((r) => `
    <div class="bar-row" data-tip="<b>${esc(r.label)}</b><br>${num(r.value)} ${esc(r.unit || unit)}${r.extra ? `<br>${esc(r.extra)}` : ''}">
      <span class="b-label" title="${esc(r.label)}">${esc(r.label)}</span>
      <div class="b-track"><div class="b-fill" style="width:${(r.value / top) * 100}%"></div></div>
      <span class="b-val">${num(r.value)}</span>
    </div>`).join('')}</div>`;
}

function statusBadge(ok, yes = 'Realizado', no = 'Pendente') {
  return ok ? `<span class="badge ok">${icon('check')}${yes}</span>` : `<span class="badge muted">${no}</span>`;
}

function modal(html, onMount) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(wrap);
  onMount(wrap, close);
  const first = $('input, button', wrap);
  if (first) first.focus();
}

function confirmDialog(title, text, confirmLabel = 'Excluir') {
  return new Promise((resolve) => {
    modal(`<h3>${esc(title)}</h3><p class="sub">${esc(text)}</p>
      <div class="actions" style="margin-top:24px">
        <button class="btn btn-ghost" data-no>Cancelar</button>
        <button class="btn btn-primary" data-yes style="background:var(--danger)">${esc(confirmLabel)}</button>
      </div>`, (el, close) => {
      $('[data-no]', el).onclick = () => { close(); resolve(false); };
      $('[data-yes]', el).onclick = () => { close(); resolve(true); };
    });
  });
}

// Tooltip dos gráficos
const tip = document.getElementById('tooltip');
document.addEventListener('mousemove', (e) => {
  const row = e.target.closest && e.target.closest('[data-tip]');
  if (!row) { tip.hidden = true; return; }
  tip.innerHTML = row.dataset.tip;
  tip.hidden = false;
  const x = Math.min(e.clientX + 14, window.innerWidth - tip.offsetWidth - 8);
  const y = Math.min(e.clientY + 14, window.innerHeight - tip.offsetHeight - 8);
  tip.style.left = `${x}px`;
  tip.style.top = `${y}px`;
});

// ---------- Estrutura (sidebar) ----------

function shell(content, active) {
  const isAdmin = session.kind === 'admin';
  const links = isAdmin
    ? [
        { href: '#/admin/geral', label: 'Visão geral', ico: 'chart', key: 'geral' },
        { href: '#/admin/equipes', label: 'Equipes', ico: 'users', key: 'equipes' },
        { href: '#/admin/evangelismo', label: 'Evangelismo', ico: 'water', key: 'evangelismo' },
        { href: '#/admin/estrutura', label: 'Estrutura', ico: 'grad', key: 'estrutura' },
        { href: '#/admin/divulgacao', label: 'Divulgação', ico: 'megaphone', key: 'divulgacao' },
        { href: '#/admin/acoes', label: 'Ações', ico: 'calendar', key: 'acoes' },
      ]
    : [
        { href: '#/painel', label: 'Minhas equipes', ico: 'home', key: 'painel' },
      ];
  const name = isAdmin ? 'Administrador' : session.user.name;
  const role = isAdmin ? 'Acompanhamento geral' : session.user.role === 'pastor' ? 'Pastor' : 'Líder';

  return `<div class="shell">
    <aside class="sidebar">
      <div class="brand"><img class="brand-logo" src="assets/logo-calebe-claro.png" alt="Missão Calebe"><div class="brand-sub">Acompanhamento 2027</div></div>
      <nav class="nav" aria-label="Principal">
        <div class="nav-title">${isAdmin ? 'Administração' : 'Área do líder'}</div>
        ${links.map((l) => `<a href="${l.href}" class="${active === l.key ? 'active' : ''}">${icon(l.ico)}${l.label}</a>`).join('')}
      </nav>
      <div class="sidebar-foot">
        <div class="user-chip"><div class="avatar">${isAdmin ? icon('shield', 'style="width:18px;height:18px"') : esc(initials(name))}</div>
          <div class="who"><strong>${esc(name)}</strong><small>${esc(role)}</small></div></div>
        <button class="btn btn-sm logout" data-logout>${icon('logout')}Sair</button>
      </div>
    </aside>
    <header class="topbar">
      <div class="brand"><img class="brand-logo" src="assets/logo-calebe-claro.png" alt="Missão Calebe"></div>
      <button class="btn btn-sm logout" data-logout>${icon('logout')}Sair</button>
    </header>
    <main class="main fade-in">${content}</main>
  </div>`;
}

function bindShell() {
  $$('[data-logout]').forEach((b) => b.addEventListener('click', async (e) => {
    e.preventDefault();
    if (saveTimer) flushSave();
    await saving;
    draft = null;
    overview = null;
    setSession(null);
    location.hash = '#/entrar';
  }));
}

// ---------- Tela de entrada ----------

function renderAuth(mode = 'entrar') {
  const watermark = Array.from({ length: 14 }, (_, i) =>
    `<span>${(i % 2 ? 'EU VOU ' : 'EU SOU ').repeat(12)}</span>`).join('');
  app.innerHTML = `<div class="auth">
    <div class="auth-watermark" aria-hidden="true">${watermark}</div>
    <section class="auth-hero">
      <img class="auth-logo" src="assets/logo-calebe.png" alt="Missão Calebe — Minhas férias no topo! Jovens Adventistas">
      <p class="auth-tag">Sistema de acompanhamento <b>Calebe 2027</b></p>
      <div class="hero-steps">${STEPS.map((s, i) => `<span>${i + 1}. ${s.label}</span>`).join('')}</div>
      <blockquote class="hero-verse">“Dá-me este monte.”<small>Josué 14:12</small></blockquote>
    </section>
    <section class="auth-panel">
      <div class="auth-card fade-in">
        <h2>${mode === 'cadastrar' ? 'Criar cadastro' : 'Bem-vindo'}</h2>
        <p class="lead">${mode === 'cadastrar' ? 'Pastor ou líder: crie seu acesso para cadastrar suas equipes.' : 'Entre com o telefone informado no seu cadastro.'}</p>
        <div class="segmented auth-tabs" role="tablist">
          <label><input type="radio" name="mode" value="entrar" ${mode === 'entrar' ? 'checked' : ''}><span>Entrar</span></label>
          <label><input type="radio" name="mode" value="cadastrar" ${mode === 'cadastrar' ? 'checked' : ''}><span>Cadastrar</span></label>
        </div>
        ${mode === 'cadastrar' ? `
        <form class="auth-form" id="authForm" novalidate>
          <div class="field"><span>Função</span>
            <div class="segmented">
              <label><input type="radio" name="role" value="pastor" checked><span>Pastor</span></label>
              <label><input type="radio" name="role" value="lider"><span>Líder</span></label>
            </div>
          </div>
          <label class="field"><span>Nome completo</span><input class="input" name="name" autocomplete="name" placeholder="Ex.: João da Silva" required></label>
          <label class="field"><span>Telefone (WhatsApp)</span><input class="input" name="phone" inputmode="tel" autocomplete="tel" placeholder="(00) 00000-0000" data-phone required></label>
          <div class="grid-2">
            <label class="field"><span>Igreja</span><input class="input" name="church" placeholder="Nome da igreja"></label>
            <label class="field"><span>Distrito</span><input class="input" name="district" placeholder="Nome do distrito" list="districtList"></label>
          </div>
          <button class="btn btn-gold btn-block" style="height:48px">Criar cadastro ${icon('arrowRight')}</button>
        </form>` : `
        <form class="auth-form" id="authForm" novalidate>
          <label class="field"><span>Telefone</span><input class="input" name="phone" inputmode="tel" autocomplete="tel" placeholder="(00) 00000-0000" data-phone required></label>
          <button class="btn btn-primary btn-block" style="height:48px">Entrar ${icon('arrowRight')}</button>
        </form>`}
        <div class="auth-divider">ou</div>
        <button class="admin-link" data-admin>
          <span class="ico">${icon('shield')}</span>
          <span><strong>Área do Administrador</strong><small>Acompanhamento geral do Calebe 2027</small></span>
          <span class="chev">${icon('chev', 'style="width:18px;height:18px"')}</span>
        </button>
        <p class="notice-free">Acesso sem senha nesta fase do projeto.</p>
        <div id="storageWarn"></div>
      </div>
    </section>
  </div>`;

  checkStorage();
  $$('input[name="mode"]').forEach((r) => r.addEventListener('change', () => { location.hash = `#/${r.value}`; }));
  $$('[data-phone]').forEach(bindPhoneMask);
  $('[data-admin]').onclick = () => { setSession({ kind: 'admin' }); location.hash = '#/admin/geral'; };

  $('#authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.target).entries());
    const btn = $('button', e.target);
    btn.disabled = true;
    try {
      const user = mode === 'cadastrar'
        ? await data.register(form)
        : await data.login(form.phone);
      setSession({ kind: 'user', user });
      toast(mode === 'cadastrar' ? 'Cadastro criado com sucesso!' : `Olá, ${firstName(user.name)}!`);
      location.hash = '#/painel';
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false;
    }
  });
}

function checkStorage() {
  const box = $('#storageWarn');
  if (!firebaseReady && box) {
    box.innerHTML = `<div class="setup-warn">${icon('alert')}<div><strong>Modo local (teste)</strong>
      <p>O banco de dados ainda não foi conectado. Os cadastros ficam salvos apenas neste navegador e aparecem só neste aparelho.</p></div></div>`;
  }
}

function bindPhoneMask(input) {
  input.addEventListener('input', () => { input.value = maskPhone(input.value); });
}

// ---------- Painel do líder ----------

async function renderDashboard() {
  const teams = (await data.myTeams()).map(normalize);
  const calebes = teams.reduce((a, t) => a + t.members.length, 0);
  const batismo = teams.reduce((a, t) => a + t.alvoBatismo, 0);
  const estudos = teams.reduce((a, t) => a + t.alvoEstudos, 0);
  const first = firstName(session.user.name);

  app.innerHTML = shell(`
    <div class="page-head">
      <div>
        <div class="eyebrow">${session.user.role === 'pastor' ? 'Pastor' : 'Líder'}${session.user.district ? ` · Distrito ${esc(session.user.district)}` : ''}</div>
        <h1 class="page-title">Olá, ${esc(first)}</h1>
        <p class="page-sub">Acompanhe as etapas do Calebe 2027 de cada uma das suas equipes.</p>
      </div>
      <button class="btn btn-gold" data-new>${icon('plus')}Nova equipe</button>
    </div>
    <div class="stack">
      ${deadlineBanner()}
      <div class="kpis">
        ${kpi({ label: 'Equipes cadastradas', value: num(teams.length), ico: 'users' })}
        ${kpi({ label: 'Calebes inscritos', value: num(calebes), ico: 'user', variant: 'feature', foot: 'Contagem automática' })}
        ${kpi({ label: 'Alvo de batismos', value: num(batismo), ico: 'water', variant: 'gold' })}
        ${kpi({ label: 'Alvo de estudantes da Bíblia', value: num(estudos), ico: 'book', variant: 'gold' })}
      </div>
      <div>
        <div class="card-title" style="margin-bottom:14px">Suas equipes</div>
        <div class="team-grid">
          ${teams.map(teamCard).join('')}
          <button class="new-team" data-new><span class="plus">${icon('plus')}</span>Cadastrar nova equipe</button>
        </div>
      </div>
    </div>`, 'painel');
  bindShell();
  $$('[data-new]').forEach((b) => (b.onclick = newTeamDialog));
}

function teamCard(t) {
  const s = stepScores(t);
  const pct = progress(t);
  return `<a class="card team-card" href="#/equipe/${t.id}">
    <div class="top">
      <div style="min-width:0">
        <h3>${esc(t.name)}</h3>
        <div class="meta">${esc([t.church, t.district && `Distrito ${t.district}`].filter(Boolean).join(' · ') || 'Sem igreja informada')}</div>
      </div>
      ${ring(pct)}
    </div>
    <div class="steps-dots" aria-label="Etapas">${STEPS.map((st) => `<i class="${s[st.key] >= 1 ? 'on' : s[st.key] > 0 ? 'part' : ''}" title="${st.label}"></i>`).join('')}</div>
    <div class="stats">
      <div><b>${num(t.members.length)}</b><small>Calebes</small></div>
      <div><b>${num(t.alvoBatismo)}</b><small>Batismos</small></div>
      <div><b>${num(t.alvoEstudos)}</b><small>Estudos</small></div>
    </div>
  </a>`;
}

function newTeamDialog() {
  const u = session.user;
  modal(`<h3>Nova equipe</h3><p class="sub">Depois de criar, você poderá preencher todas as etapas.</p>
    <form id="newTeam">
      <label class="field"><span>Nome da equipe</span><input class="input" name="name" placeholder="Ex.: Equipe Monte Hebrom" required></label>
      <div class="grid-2">
        <label class="field"><span>Igreja</span><input class="input" name="church" value="${esc(u.church)}"></label>
        <label class="field"><span>Distrito</span><input class="input" name="district" value="${esc(u.district)}"></label>
      </div>
      <div class="actions"><button type="button" class="btn btn-ghost" data-cancel>Cancelar</button><button class="btn btn-primary">Criar equipe</button></div>
    </form>`, (el, close) => {
    $('[data-cancel]', el).onclick = close;
    $('form', el).addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = Object.fromEntries(new FormData(e.target).entries());
      if (!input.name.trim()) return toast('Informe o nome da equipe.', 'error');
      try {
        const team = await data.createTeam(input);
        close();
        toast('Equipe criada!');
        location.hash = `#/equipe/${team.id}/equipe`;
      } catch (err) { toast(err.message, 'error'); }
    });
  });
}

// ---------- Editor da equipe ----------

let draft = null;
let saveTimer = null;
let saving = Promise.resolve();

function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }
function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((o, k) => o[k], obj)[last] = value;
}

function scheduleSave() {
  setSaveState('saving', 'Salvando…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave, 600);
}

function flushSave() {
  clearTimeout(saveTimer);
  saveTimer = null;
  if (!draft) return saving;
  const snapshot = JSON.parse(JSON.stringify(draft));
  saving = saving.then(() => data.saveTeam(snapshot))
    .then(() => setSaveState('', 'Todas as alterações salvas'))
    .catch((err) => { setSaveState('error', 'Erro ao salvar'); toast(err.message, 'error'); });
  return saving;
}

function setSaveState(cls, text) {
  const el = $('#saveState');
  if (el) { el.className = `save-state ${cls}`; el.innerHTML = `<i></i>${text}`; }
}

window.addEventListener('beforeunload', (e) => {
  if (saveTimer) { flushSave(); e.preventDefault(); }
});

async function renderTeam(id, stepKey = 'equipe') {
  if (saveTimer) await flushSave();
  if (!draft || draft.id !== id) draft = normalize(await data.getTeam(id));
  const stepIndex = Math.max(0, STEPS.findIndex((s) => s.key === stepKey));
  const step = STEPS[stepIndex];

  app.innerHTML = shell(`
    <a class="back" href="#/painel">${icon('arrowLeft')}Minhas equipes</a>
    <div class="page-head">
      <div>
        <div class="eyebrow">Etapas do Calebe</div>
        <h1 class="page-title" id="teamTitle">${esc(draft.name)}</h1>
        <p class="page-sub">${esc([draft.church, draft.district && `Distrito ${draft.district}`].filter(Boolean).join(' · '))}</p>
      </div>
      <span class="save-state" id="saveState"><i></i>Todas as alterações salvas</span>
    </div>
    <div class="editor">
      <nav class="card stepper" id="stepper" aria-label="Etapas">${stepperHtml(step.key)}</nav>
      <section class="card section-card fade-in" id="section">
        ${SECTIONS[step.key]()}
        <div class="section-nav">
          ${stepIndex > 0 ? `<a class="btn btn-ghost" href="#/equipe/${id}/${STEPS[stepIndex - 1].key}">${icon('arrowLeft')}${STEPS[stepIndex - 1].label}</a>` : '<span></span>'}
          ${stepIndex < STEPS.length - 1
            ? `<a class="btn btn-primary" href="#/equipe/${id}/${STEPS[stepIndex + 1].key}">${STEPS[stepIndex + 1].label}${icon('arrowRight')}</a>`
            : `<a class="btn btn-gold" href="#/painel">${icon('check')}Concluir</a>`}
        </div>
      </section>
    </div>`, 'painel');
  bindShell();
  bindSection(step.key);
}

function stepperHtml(active) {
  const s = stepScores(draft);
  const pct = progress(draft);
  return STEPS.map((st, i) => `
    <button class="step ${st.key === active ? 'active' : ''} ${s[st.key] >= 1 ? 'ok' : ''}" data-step="${st.key}">
      <span class="num">${s[st.key] >= 1 ? icon('check') : i + 1}</span>
      <span><strong>${st.label}</strong><small>${st.sub}</small></span>
    </button>`).join('') +
    `<div class="progress-box">${ring(pct, 'lg')}<div><strong style="font-size:14px">Progresso geral</strong><div class="hint">${STEPS.filter((st) => s[st.key] >= 1).length} de ${STEPS.length} etapas completas</div></div></div>`;
}

function refreshDerived() {
  const active = ($('.step.active') || {}).dataset?.step;
  $('#stepper').innerHTML = stepperHtml(active);
  bindStepper();
  $$('[data-derived]').forEach((el) => { el.innerHTML = DERIVED[el.dataset.derived](); });
  $('#teamTitle').textContent = draft.name;
}

const DERIVED = {
  count: () => `<b>${draft.members.length}</b><span>Calebes<br>inscritos</span>`,
  respCount: () => `${RESPONSAVEIS.filter((r) => draft.responsaveis[r.key].trim()).length} de ${RESPONSAVEIS.length} preenchidos`,
};

function bindStepper() {
  $$('[data-step]').forEach((b) => (b.onclick = () => { location.hash = `#/equipe/${draft.id}/${b.dataset.step}`; }));
}

function sectionHead(title, text, aside = '') {
  return `<div class="section-head"><div><h2>${title}</h2><p>${text}</p></div>${aside}</div>`;
}

const SECTIONS = {
  equipe() {
    return `${sectionHead('Cadastro da equipe', 'Informe o nome e o telefone de cada participante. A quantidade de Calebes inscritos é contabilizada automaticamente.',
      `<div class="counter-pill" data-derived="count">${DERIVED.count()}</div>`)}
      <div class="grid-3" style="margin-bottom:24px">
        <label class="field"><span>Nome da equipe</span><input class="input" data-path="name" value="${esc(draft.name)}"></label>
        <label class="field"><span>Igreja</span><input class="input" data-path="church" value="${esc(draft.church)}"></label>
        <label class="field"><span>Distrito</span><input class="input" data-path="district" value="${esc(draft.district)}"></label>
      </div>
      <div class="label" style="margin-bottom:10px">Participantes</div>
      <div id="members">${membersHtml()}</div>
      <form class="member-add" id="memberAdd">
        <input class="input" name="name" placeholder="Nome do participante" aria-label="Nome do participante">
        <input class="input" name="phone" placeholder="Telefone" inputmode="tel" aria-label="Telefone" data-phone>
        <button class="btn btn-primary">${icon('plus')}Adicionar</button>
      </form>
      <div style="display:flex;justify-content:flex-end;margin-top:24px"><button class="btn btn-danger btn-sm" data-delete-team>${icon('trash')}Excluir equipe</button></div>`;
  },
  responsaveis() {
    return `${sectionHead('Responsáveis da equipe', 'Informe o nome do responsável por cada área.', `<span class="badge navy" data-derived="respCount">${DERIVED.respCount()}</span>`)}
      <div class="resp-grid">${RESPONSAVEIS.map((r) => `
        <div class="resp-item ${draft.responsaveis[r.key].trim() ? 'filled' : ''}">
          <span class="r-ico">${icon(r.icon)}</span>
          <label class="field"><span>${r.key === 'pregador' ? 'Pregador' : `Responsável — ${r.label}`}</span>
          <input class="input" data-path="responsaveis.${r.key}" value="${esc(draft.responsaveis[r.key])}" placeholder="Nome do responsável"></label>
        </div>`).join('')}</div>`;
  },
  treinamento() {
    return `${sectionHead('Treinamento', 'A equipe deve realizar o treinamento em outubro, novembro e dezembro. Marque quando for realizado e informe a data.')}
      <div class="option-list">${TREINAMENTOS.map((m) => {
        const t = draft.treinamentos[m.key];
        return `<div class="option ${t.done ? 'on' : ''}">
          <span class="o-ico">${icon('grad')}</span>
          <div><strong>Treinamento de ${m.label}</strong><small>${t.done ? 'Treinamento realizado' : 'Ainda não realizado'}</small></div>
          <label class="switch"><input type="checkbox" data-path="treinamentos.${m.key}.done" ${t.done ? 'checked' : ''}><span class="track"></span><span class="sr-only">Realizado</span></label>
          <label class="field"><span class="sr-only">Data do treinamento</span><input class="input" type="date" data-path="treinamentos.${m.key}.date" value="${t.date}" min="${m.min}" max="${m.max}" ${t.done ? '' : 'disabled'}>
          <small class="field-error" data-range-msg></small></label>
        </div>`;
      }).join('')}</div>`;
  },
  local() {
    return `${sectionHead('Local do Calebe', 'Descreva onde será realizado o Calebe: endereço, bairro, cidade e pontos de referência.')}
      <label class="field"><span>Local</span>
      <textarea class="textarea" data-path="local" rows="6" placeholder="Ex.: Salão comunitário do bairro Esperança — Rua das Flores, 120, próximo à escola municipal.">${esc(draft.local)}</textarea></label>`;
  },
  divulgacao() {
    return `${sectionHead('Divulgação', 'Marque os meios de divulgação que a equipe irá utilizar e registre as respectivas datas.')}
      <div class="option-list">${DIVULGACAO.map((d) => {
        const v = draft.divulgacao[d.key];
        return `<div class="option ${v.use ? 'on' : ''}">
          <span class="o-ico">${icon(d.icon)}</span>
          <div><strong>${d.label}</strong><small>${d.desc}</small></div>
          <label class="switch"><input type="checkbox" data-path="divulgacao.${d.key}.use" ${v.use ? 'checked' : ''}><span class="track"></span><span class="sr-only">Utilizar</span></label>
          <label class="field"><span class="sr-only">Data</span><input class="input" type="date" data-path="divulgacao.${d.key}.date" value="${v.date}" ${v.use ? '' : 'disabled'}></label>
        </div>`;
      }).join('')}</div>`;
  },
  alvos() {
    const target = (key, title, text, ico) => `<div class="target">
      <div class="t-top"><span class="t-ico">${icon(ico)}</span><div><h3>${title}</h3><p>${text}</p></div></div>
      <div class="stepper-input">
        <button type="button" data-inc="${key}" data-d="-1" aria-label="Diminuir">−</button>
        <input class="input big" type="number" min="0" inputmode="numeric" data-path="${key}" data-type="int" value="${draft[key]}">
        <button type="button" data-inc="${key}" data-d="1" aria-label="Aumentar">+</button>
      </div></div>`;
    return `${sectionHead('Alvos da equipe', 'Os alvos são somados automaticamente entre todas as equipes para o acompanhamento do administrador.')}
      <div class="target-grid">
        ${target('alvoBatismo', 'Alvo de batismo', 'Quantas pessoas a equipe tem como alvo batizar.', 'water')}
        ${target('alvoEstudos', 'Estudos bíblicos', 'Quantos estudos bíblicos a equipe irá levantar na localidade.', 'book')}
      </div>`;
  },
  acoes() {
    return `${sectionHead('Ações na localidade', 'Informe o dia em que cada ação será realizada.')}
      <div class="action-list">${ACOES.map((a) => `
        <div class="action-item">
          <div class="month"><b>${a.year}</b><span>${a.month}</span></div>
          <div><strong>${a.label}</strong><p>${a.desc}${draft.acoes[a.key] ? ` · ${weekday(draft.acoes[a.key])}` : ''}</p></div>
          <label class="field"><span class="sr-only">Data — ${a.label}</span><input class="input" type="date" data-path="acoes.${a.key}" value="${draft.acoes[a.key]}" min="${a.min}" max="${a.max}">
          <small class="field-error" data-range-msg></small></label>
        </div>`).join('')}</div>`;
  },
};

function membersHtml() {
  if (!draft.members.length) {
    return `<div class="empty">${icon('users')}<p>Nenhum participante cadastrado ainda.<br>Adicione o primeiro Calebe abaixo.</p></div>`;
  }
  return `<div class="members-head"><span>#</span><span>Nome</span><span>Telefone</span><span></span></div>
    ${draft.members.map((m, i) => `<div class="member-row">
      <span class="idx">${i + 1}</span>
      <input class="input" data-path="members.${i}.name" value="${esc(m.name)}" aria-label="Nome do participante ${i + 1}">
      <input class="input phone" data-path="members.${i}.phone" value="${esc(m.phone)}" data-phone inputmode="tel" aria-label="Telefone do participante ${i + 1}">
      <button class="icon-btn" data-remove="${i}" aria-label="Remover ${esc(m.name)}">${icon('trash')}</button>
    </div>`).join('')}`;
}

function validateRange(input) {
  const msg = input.parentElement.querySelector('[data-range-msg]');
  if (!msg) return;
  const ok = inRange(input.value, input.min, input.max);
  input.classList.toggle('invalid', !ok);
  msg.textContent = ok ? '' : `Escolha uma data entre ${fmtDate(input.min)} e ${fmtDate(input.max)}.`;
}

function bindSection(key) {
  bindStepper();
  const section = $('#section');

  section.addEventListener('input', (e) => onFieldChange(e.target));
  section.addEventListener('change', (e) => { if (e.target.type === 'checkbox') onFieldChange(e.target); });
  $$('[data-phone]', section).forEach(bindPhoneMask);
  $$('input[type="date"]', section).forEach(validateRange);

  if (key === 'equipe') {
    const addForm = $('#memberAdd');
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = addForm.name.value.trim();
      if (!name) { toast('Informe o nome do participante.', 'error'); addForm.name.focus(); return; }
      draft.members.push({ name, phone: addForm.phone.value.trim() });
      addForm.reset();
      rerenderMembers();
      addForm.name.focus();
      scheduleSave();
      refreshDerived();
    });
    $('[data-delete-team]').onclick = async () => {
      const ok = await confirmDialog('Excluir equipe?', `A equipe "${draft.name}" e todos os seus dados serão removidos permanentemente.`);
      if (!ok) return;
      clearTimeout(saveTimer); saveTimer = null;
      try {
        await data.deleteTeam(draft.id);
        draft = null;
        toast('Equipe excluída.');
        location.hash = '#/painel';
      } catch (err) { toast(err.message, 'error'); }
    };
  }

  if (key === 'alvos') {
    $$('[data-inc]', section).forEach((b) => (b.onclick = () => {
      const input = $(`[data-path="${b.dataset.inc}"]`, section);
      input.value = Math.max(0, (parseInt(input.value, 10) || 0) + Number(b.dataset.d));
      onFieldChange(input);
    }));
  }
}

function rerenderMembers() {
  const box = $('#members');
  box.innerHTML = membersHtml();
  $$('[data-phone]', box).forEach(bindPhoneMask);
  $$('[data-remove]', box).forEach((b) => (b.onclick = () => {
    draft.members.splice(Number(b.dataset.remove), 1);
    rerenderMembers();
    scheduleSave();
    refreshDerived();
  }));
}

function onFieldChange(el) {
  const path = el.dataset.path;
  if (!path) return;
  let value;
  if (el.type === 'checkbox') value = el.checked;
  else if (el.dataset.type === 'int') value = Math.max(0, parseInt(el.value, 10) || 0);
  else value = el.value;
  setPath(draft, path, value);

  // Interdependências visuais
  const option = el.closest('.option');
  if (option && el.type === 'checkbox') {
    option.classList.toggle('on', el.checked);
    const date = $('input[type="date"]', option);
    date.disabled = !el.checked;
    const small = $('div > small', option);
    if (small && path.startsWith('treinamentos')) small.textContent = el.checked ? 'Treinamento realizado' : 'Ainda não realizado';
  }
  const resp = el.closest('.resp-item');
  if (resp) resp.classList.toggle('filled', !!el.value.trim());
  if (el.type === 'date') {
    validateRange(el);
    const item = el.closest('.action-item');
    if (item) {
      const a = ACOES.find((x) => path === `acoes.${x.key}`);
      $('p', item).textContent = `${a.desc}${el.value ? ` · ${weekday(el.value)}` : ''}`;
    }
  }
  scheduleSave();
  refreshDerived();
}

// ---------- Área do administrador ----------

let overview = null;
let adminFilter = store.get('calebe.adminDistrict') || '';
let adminQuery = '';

async function loadOverview(force = false) {
  if (!overview || force) {
    const result = await data.overview();
    overview = { ...result, teams: result.teams.map(normalize) };
  }
  return overview;
}

const districtOf = (t) => (t.district || '').trim() || 'Sem distrito';

function filteredTeams() {
  const q = adminQuery.trim().toLowerCase();
  return overview.teams.filter((t) =>
    (!adminFilter || districtOf(t) === adminFilter) &&
    (!q || [t.name, t.church, t.district, t.owner && t.owner.name].join(' ').toLowerCase().includes(q)));
}

function groupCount(teams, keyFn, valueFn = () => 1) {
  const map = new Map();
  teams.forEach((t) => map.set(keyFn(t), (map.get(keyFn(t)) || 0) + valueFn(t)));
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

const ADMIN_TABS = [
  { key: 'geral', label: 'Visão geral' },
  { key: 'equipes', label: 'Equipes' },
  { key: 'evangelismo', label: 'Evangelismo' },
  { key: 'estrutura', label: 'Estrutura' },
  { key: 'divulgacao', label: 'Divulgação' },
  { key: 'acoes', label: 'Ações' },
];

async function renderAdmin(tab = 'geral', force = false) {
  await loadOverview(force);
  if (!ADMIN_TABS.some((t) => t.key === tab)) tab = 'geral';
  const districts = [...new Set(overview.teams.map(districtOf))].sort();
  if (adminFilter && !districts.includes(adminFilter)) adminFilter = '';
  const teams = filteredTeams();

  app.innerHTML = shell(`
    <div class="page-head">
      <div>
        <div class="eyebrow">Área do administrador</div>
        <h1 class="page-title">Acompanhamento Calebe 2027</h1>
        <p class="page-sub">Dados consolidados automaticamente a partir de todas as equipes cadastradas.</p>
        ${firebaseReady ? '' : '<span class="badge warn" style="margin-top:10px">Modo local: dados apenas deste navegador</span>'}
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-ghost" data-refresh>${icon('refresh')}Atualizar</button>
        <button class="btn btn-primary" data-csv>${icon('download')}Exportar planilha</button>
      </div>
    </div>
    <nav class="tabs" aria-label="Seções">${ADMIN_TABS.map((t) => `<a href="#/admin/${t.key}" class="${t.key === tab ? 'active' : ''}">${t.label}</a>`).join('')}</nav>
    <div class="toolbar">
      <div class="search">${icon('search')}<input class="input" id="adminSearch" placeholder="Buscar equipe, igreja ou responsável" value="${esc(adminQuery)}"></div>
      <select class="select" id="adminDistrict" aria-label="Filtrar por distrito">
        <option value="">Todos os distritos</option>
        ${districts.map((d) => `<option ${d === adminFilter ? 'selected' : ''}>${esc(d)}</option>`).join('')}
      </select>
      <span class="hint">${teams.length} de ${overview.teams.length} equipes</span>
    </div>
    <div class="stack" id="adminBody">${ADMIN_VIEWS[tab](teams)}</div>`, tab);
  bindShell();
  bindAdminBody();

  $('[data-refresh]').onclick = async () => { await renderAdmin(tab, true); toast('Dados atualizados.'); };
  $('[data-csv]').onclick = () => exportCsv(teams);
  $('#adminDistrict').onchange = (e) => {
    adminFilter = e.target.value;
    store.set('calebe.adminDistrict', adminFilter || null);
    renderAdmin(tab);
  };
  $('#adminSearch').addEventListener('input', (e) => {
    adminQuery = e.target.value;
    $('#adminBody').innerHTML = ADMIN_VIEWS[tab](filteredTeams());
    $('.toolbar .hint').textContent = `${filteredTeams().length} de ${overview.teams.length} equipes`;
    bindAdminBody();
  });
}

function bindAdminBody() {
  $$('[data-team]').forEach((el) => {
    el.onclick = () => { location.hash = `#/admin/equipe/${el.dataset.team}`; };
    el.onkeydown = (e) => { if (e.key === 'Enter') el.click(); };
  });
}

function teamCell(t) {
  return `<div class="t-name"><strong>${esc(t.name)}</strong><small>${esc([t.church, districtOf(t)].filter(Boolean).join(' · '))}</small></div>`;
}
const rowAttrs = (t) => `class="link" data-team="${t.id}" tabindex="0"`;
const dateCell = (iso) => (iso ? fmtDate(iso) : '<span class="muted">—</span>');
const actionDateCell = (t, a) => {
  const iso = t.acoes[a.key];
  if (!iso || inRange(iso, a.min, a.max)) return dateCell(iso);
  return `<span class="badge warn" title="Fora do mês previsto">${icon('alert')}${fmtDate(iso)}</span>`;
};
const tableCard = (title, sub, table) => `<div class="card"><div class="card-head"><div><div class="card-title">${title}</div>${sub ? `<div class="card-sub">${sub}</div>` : ''}</div></div><div class="card-body" style="padding-left:0;padding-right:0;padding-bottom:0"><div class="table-wrap">${table}</div></div></div>`;
const chartCard = (title, sub, body) => `<div class="card"><div class="card-head"><div><div class="card-title">${title}</div>${sub ? `<div class="card-sub">${sub}</div>` : ''}</div></div><div class="card-body">${body}</div></div>`;
const emptyTable = (cols) => `<tr><td colspan="${cols}"><div class="empty">${icon('users')}<p>Nenhuma equipe encontrada.</p></div></td></tr>`;

function totals(teams) {
  return {
    equipes: teams.length,
    calebes: teams.reduce((a, t) => a + t.members.length, 0),
    batismo: teams.reduce((a, t) => a + t.alvoBatismo, 0),
    estudos: teams.reduce((a, t) => a + t.alvoEstudos, 0),
    distritos: new Set(teams.map(districtOf)).size,
  };
}

const ADMIN_VIEWS = {
  geral(teams) {
    const T = totals(teams);
    const trained = TREINAMENTOS.map((m) => ({ label: m.label, value: teams.filter((t) => t.treinamentos[m.key].done).length, unit: 'equipes' }));
    const div = DIVULGACAO.map((d) => ({ label: d.label, value: teams.filter((t) => t.divulgacao[d.key].use).length, unit: 'equipes' }));
    const avg = teams.length ? Math.round(teams.reduce((a, t) => a + progress(t), 0) / teams.length) : 0;
    const complete = teams.filter((t) => t.members.length && RESPONSAVEIS.every((r) => t.responsaveis[r.key].trim())).length;
    return `
      ${deadlineBanner({ admin: true })}
      <div class="kpis">
        ${kpi({ label: 'Equipes cadastradas', value: num(T.equipes), ico: 'users', foot: `${T.distritos} ${T.distritos === 1 ? 'distrito' : 'distritos'}` })}
        ${kpi({ label: 'Calebes inscritos', value: num(T.calebes), ico: 'user', variant: 'feature', foot: T.equipes ? `média de ${(T.calebes / T.equipes).toFixed(1).replace('.', ',')} por equipe` : '' })}
        ${kpi({ label: 'Alvo total de batismos', value: num(T.batismo), ico: 'water', variant: 'gold' })}
        ${kpi({ label: 'Alvo de estudantes da Bíblia', value: num(T.estudos), ico: 'book', variant: 'gold' })}
      </div>
      <div class="row-2">
        ${chartCard('Equipes por distrito', 'Quantidade de equipes cadastradas', bars(groupCount(teams, districtOf), { unit: 'equipes' }))}
        ${chartCard('Calebes por distrito', 'Participantes inscritos', bars(groupCount(teams, districtOf, (t) => t.members.length), { unit: 'Calebes' }))}
      </div>
      <div class="row-3">
        ${chartCard('Andamento', 'Preenchimento médio das etapas', `<div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">${ring(avg, 'lg')}<div class="mini-stats" style="flex:1;min-width:160px;grid-template-columns:1fr">
          <div class="mini-stat"><small>Cadastro completo (participantes + responsáveis)</small><b>${complete} <span class="muted" style="font-size:15px">/ ${T.equipes}</span></b></div></div></div>`)}
        ${chartCard('Treinamentos realizados', 'Equipes por mês', bars(trained, { max: Math.max(1, T.equipes) }))}
        ${chartCard('Meios de divulgação', 'Equipes que utilizarão', bars(div, { max: Math.max(1, T.equipes) }))}
      </div>`;
  },

  equipes(teams) {
    const T = totals(teams);
    return tableCard('Equipes cadastradas', 'Clique em uma equipe para ver todos os detalhes.', `<table class="data">
      <thead><tr><th>Equipe</th><th>Responsável pelo cadastro</th><th class="num">Calebes</th><th class="num">Batismos</th><th class="num">Estudos</th><th>Treinamentos</th><th class="num">Progresso</th></tr></thead>
      <tbody>${teams.length ? teams.map((t) => `<tr ${rowAttrs(t)}>
        <td>${teamCell(t)}</td>
        <td>${t.owner ? `${esc(t.owner.name)}<br><small class="muted">${t.owner.role === 'pastor' ? 'Pastor' : 'Líder'} · ${esc(t.owner.phone)}</small>` : '—'}</td>
        <td class="num">${num(t.members.length)}</td><td class="num">${num(t.alvoBatismo)}</td><td class="num">${num(t.alvoEstudos)}</td>
        <td><span class="badge ${trainingsDone(t) === 3 ? 'ok' : trainingsDone(t) ? 'gold' : 'muted'}">${trainingsDone(t)}/3</span></td>
        <td class="num"><strong>${progress(t)}%</strong></td></tr>`).join('') : emptyTable(7)}</tbody>
      ${teams.length ? `<tfoot><tr><td>Total · ${T.equipes} equipes</td><td></td><td class="num">${num(T.calebes)}</td><td class="num">${num(T.batismo)}</td><td class="num">${num(T.estudos)}</td><td></td><td></td></tr></tfoot>` : ''}
    </table>`);
  },

  evangelismo(teams) {
    const T = totals(teams);
    const byTeam = (key) => teams.map((t) => ({ label: t.name, value: t[key], extra: districtOf(t) })).sort((a, b) => b.value - a.value);
    return `
      <div class="kpis">
        ${kpi({ label: 'Alvo total de batismos', value: num(T.batismo), ico: 'water', variant: 'feature' })}
        ${kpi({ label: 'Alvo de estudantes da Bíblia', value: num(T.estudos), ico: 'book', variant: 'gold', foot: 'Total de estudos bíblicos previstos' })}
        ${kpi({ label: 'Média de batismos por equipe', value: T.equipes ? (T.batismo / T.equipes).toFixed(1).replace('.', ',') : '0', ico: 'target' })}
        ${kpi({ label: 'Média de estudos por equipe', value: T.equipes ? (T.estudos / T.equipes).toFixed(1).replace('.', ',') : '0', ico: 'target' })}
      </div>
      <div class="row-2">
        ${chartCard('Alvo de batismos por equipe', '', bars(byTeam('alvoBatismo'), { unit: 'batismos' }))}
        ${chartCard('Estudos bíblicos por equipe', '', bars(byTeam('alvoEstudos'), { unit: 'estudos' }))}
      </div>
      <div class="row-2">
        ${chartCard('Batismos por distrito', '', bars(groupCount(teams, districtOf, (t) => t.alvoBatismo), { unit: 'batismos' }))}
        ${chartCard('Estudos bíblicos por distrito', '', bars(groupCount(teams, districtOf, (t) => t.alvoEstudos), { unit: 'estudos' }))}
      </div>
      ${tableCard('Alvos por equipe', '', `<table class="data">
        <thead><tr><th>Equipe</th><th class="num">Calebes</th><th class="num">Alvo de batismo</th><th class="num">Estudos bíblicos</th></tr></thead>
        <tbody>${teams.length ? teams.map((t) => `<tr ${rowAttrs(t)}><td>${teamCell(t)}</td><td class="num">${num(t.members.length)}</td><td class="num">${num(t.alvoBatismo)}</td><td class="num">${num(t.alvoEstudos)}</td></tr>`).join('') : emptyTable(4)}</tbody>
        ${teams.length ? `<tfoot><tr><td>Total</td><td class="num">${num(T.calebes)}</td><td class="num">${num(T.batismo)}</td><td class="num">${num(T.estudos)}</td></tr></tfoot>` : ''}
      </table>`)}`;
  },

  estrutura(teams) {
    const n = teams.length;
    return `
      <div class="month-cards">${TREINAMENTOS.map((m) => {
        const done = teams.filter((t) => t.treinamentos[m.key].done).length;
        return `<div class="month-card"><h4>Treinamento · ${m.label}</h4><div class="big">${done} <small>de ${n} equipes</small></div><div class="meter"><i style="width:${n ? (done / n) * 100 : 0}%"></i></div></div>`;
      }).join('')}</div>
      ${tableCard('Treinamentos por equipe', 'Status e data de realização', `<table class="data">
        <thead><tr><th>Equipe</th>${TREINAMENTOS.map((m) => `<th>${m.label}</th>`).join('')}<th class="num">Total</th></tr></thead>
        <tbody>${n ? teams.map((t) => `<tr ${rowAttrs(t)}><td>${teamCell(t)}</td>${TREINAMENTOS.map((m) => {
          const v = t.treinamentos[m.key];
          return `<td>${v.done ? `<span class="badge ok">${icon('check')}${v.date ? fmtDate(v.date) : 'Realizado'}</span>` : '<span class="badge muted">Pendente</span>'}</td>`;
        }).join('')}<td class="num"><strong>${trainingsDone(t)}/3</strong></td></tr>`).join('') : emptyTable(5)}</tbody>
      </table>`)}
      ${chartCard('Locais do Calebe', 'Onde cada equipe realizará o Calebe', n ? teams.map((t) => `
        <div class="place"><span class="p-ico">${icon('pin')}</span><div><strong>${esc(t.name)} <span class="muted" style="font-weight:400;font-size:13px">· ${esc(districtOf(t))}</span></strong>
        <p>${t.local.trim() ? esc(t.local) : '<span class="muted">Local ainda não informado</span>'}</p></div></div>`).join('') : '<div class="empty">Nenhuma equipe encontrada.</div>')}
      ${tableCard('Responsáveis de cada equipe', 'Deslize horizontalmente para ver todas as áreas', `<table class="data">
        <thead><tr><th>Equipe</th>${RESPONSAVEIS.map((r) => `<th>${r.label}</th>`).join('')}</tr></thead>
        <tbody>${n ? teams.map((t) => `<tr ${rowAttrs(t)}><td>${teamCell(t)}</td>${RESPONSAVEIS.map((r) => `<td style="white-space:nowrap">${t.responsaveis[r.key].trim() ? esc(t.responsaveis[r.key]) : '<span class="muted">—</span>'}</td>`).join('')}</tr>`).join('') : emptyTable(11)}</tbody>
      </table>`)}`;
  },

  divulgacao(teams) {
    const n = teams.length;
    const rows = DIVULGACAO.map((d) => ({ label: d.label, value: teams.filter((t) => t.divulgacao[d.key].use).length, unit: `de ${n} equipes` }));
    const events = [];
    teams.forEach((t) => DIVULGACAO.forEach((d) => {
      const v = t.divulgacao[d.key];
      if (v.use && v.date) events.push({ date: v.date, title: d.label, team: t });
    }));
    return `
      <div class="kpis">${DIVULGACAO.map((d, i) => kpi({
        label: `Equipes com ${d.label.toLowerCase()}`, value: num(rows[i].value), ico: d.icon,
        foot: n ? `${Math.round((rows[i].value / n) * 100)}% das equipes` : '',
      })).join('')}</div>
      <div class="row-2">
        ${chartCard('Meios de divulgação', 'Quantidade de equipes que utilizarão cada meio', bars(rows, { max: Math.max(1, n) }))}
        ${chartCard('Agenda de divulgação', 'Datas registradas pelas equipes', timeline(events))}
      </div>
      ${tableCard('Divulgação por equipe', '', `<table class="data">
        <thead><tr><th>Equipe</th>${DIVULGACAO.map((d) => `<th>${d.label}</th>`).join('')}</tr></thead>
        <tbody>${n ? teams.map((t) => `<tr ${rowAttrs(t)}><td>${teamCell(t)}</td>${DIVULGACAO.map((d) => {
          const v = t.divulgacao[d.key];
          return `<td>${v.use ? `<span class="badge ok">${icon('check')}${v.date ? fmtDate(v.date) : 'Sem data'}</span>` : '<span class="muted">Não utilizará</span>'}</td>`;
        }).join('')}</tr>`).join('') : emptyTable(5)}</tbody>
      </table>`)}`;
  },

  acoes(teams) {
    const col = (a) => {
      const events = teams.filter((t) => t.acoes[a.key]).map((t) => ({ date: t.acoes[a.key], title: t.name, team: t, sub: districtOf(t) }));
      return chartCard(a.label, `${events.length} de ${teams.length} equipes com data definida`, timeline(events, true));
    };
    return `
      <div class="row-3">${ACOES.map(col).join('')}</div>
      ${tableCard('Datas das ações por equipe', '', `<table class="data">
        <thead><tr><th>Equipe</th>${ACOES.map((a) => `<th>${a.label}</th>`).join('')}</tr></thead>
        <tbody>${teams.length ? teams.map((t) => `<tr ${rowAttrs(t)}><td>${teamCell(t)}</td>${ACOES.map((a) => `<td>${actionDateCell(t, a)}</td>`).join('')}</tr>`).join('') : emptyTable(4)}</tbody>
      </table>`)}`;
  },
};

function timeline(events, teamTitle = false) {
  if (!events.length) return `<div class="empty">${icon('calendar')}<p>Nenhuma data registrada.</p></div>`;
  events.sort((a, b) => a.date.localeCompare(b.date));
  return `<div class="timeline">${events.map((e) => {
    const s = fmtShort(e.date);
    return `<div class="tl-item" data-team="${e.team.id}" style="cursor:pointer">
      <div class="tl-date"><b>${s.d}</b><small>${s.m} ${s.y}</small></div>
      <div class="tl-line"><i></i></div>
      <div class="tl-body"><strong>${esc(e.title)}</strong><p>${teamTitle ? esc(e.sub) : esc(e.team.name)} · ${weekday(e.date)}</p></div>
    </div>`;
  }).join('')}</div>`;
}

async function renderAdminTeam(id) {
  await loadOverview();
  const t = overview.teams.find((x) => x.id === id);
  if (!t) { toast('Equipe não encontrada.', 'error'); location.hash = '#/admin/equipes'; return; }
  const s = stepScores(t);
  const dl = (rows) => `<dl class="detail-list" style="grid-template-columns:1fr">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;

  app.innerHTML = shell(`
    <a class="back" href="#/admin/equipes">${icon('arrowLeft')}Todas as equipes</a>
    <div class="page-head">
      <div>
        <div class="eyebrow">${esc(districtOf(t))}</div>
        <h1 class="page-title">${esc(t.name)}</h1>
        <p class="page-sub">${esc(t.church || '')}${t.owner ? ` · Cadastrada por ${esc(t.owner.name)} (${t.owner.role === 'pastor' ? 'Pastor' : 'Líder'}, ${esc(t.owner.phone)})` : ''}</p>
      </div>
      ${ring(progress(t), 'lg')}
    </div>
    <div class="stack">
      <div class="kpis">
        ${kpi({ label: 'Calebes inscritos', value: num(t.members.length), ico: 'user', variant: 'feature' })}
        ${kpi({ label: 'Alvo de batismo', value: num(t.alvoBatismo), ico: 'water', variant: 'gold' })}
        ${kpi({ label: 'Estudos bíblicos', value: num(t.alvoEstudos), ico: 'book', variant: 'gold' })}
        ${kpi({ label: 'Treinamentos realizados', value: `${trainingsDone(t)}/3`, ico: 'grad' })}
      </div>
      <div class="card" style="padding:18px 24px;display:flex;gap:10px;flex-wrap:wrap">
        ${STEPS.map((st) => `<span class="badge ${s[st.key] >= 1 ? 'ok' : s[st.key] > 0 ? 'gold' : 'muted'}">${s[st.key] >= 1 ? icon('check') : ''}${st.label}</span>`).join('')}
      </div>
      <div class="row-2">
        ${tableCard(`Participantes (${t.members.length})`, '', `<table class="data"><thead><tr><th>#</th><th>Nome</th><th>Telefone</th></tr></thead>
          <tbody>${t.members.length ? t.members.map((m, i) => `<tr><td class="muted">${i + 1}</td><td>${esc(m.name)}</td><td>${esc(m.phone) || '<span class="muted">—</span>'}</td></tr>`).join('') : '<tr><td colspan="3"><div class="empty">Nenhum participante.</div></td></tr>'}</tbody></table>`)}
        ${chartCard('Responsáveis', '', dl(RESPONSAVEIS.map((r) => [r.label, t.responsaveis[r.key].trim() ? esc(t.responsaveis[r.key]) : '<span class="muted">—</span>'])))}
      </div>
      <div class="row-3">
        ${chartCard('Treinamento', '', dl(TREINAMENTOS.map((m) => [m.label, t.treinamentos[m.key].done ? `<span class="badge ok">${icon('check')}${t.treinamentos[m.key].date ? fmtDate(t.treinamentos[m.key].date) : 'Realizado'}</span>` : '<span class="badge muted">Pendente</span>'])))}
        ${chartCard('Divulgação', '', dl(DIVULGACAO.map((d) => [d.label, t.divulgacao[d.key].use ? `<span class="badge ok">${icon('check')}${t.divulgacao[d.key].date ? fmtDate(t.divulgacao[d.key].date) : 'Sem data'}</span>` : '<span class="muted">Não</span>'])))}
        ${chartCard('Ações na localidade', '', dl(ACOES.map((a) => [a.label, actionDateCell(t, a)])))}
      </div>
      ${chartCard('Local do Calebe', '', `<div class="place" style="padding:0"><span class="p-ico">${icon('pin')}</span><p>${t.local.trim() ? esc(t.local) : '<span class="muted">Local ainda não informado</span>'}</p></div>`)}
    </div>`, 'equipes');
  bindShell();
}

// ---------- Exportação ----------

function exportCsv(teams) {
  const head = ['Equipe', 'Igreja', 'Distrito', 'Cadastrado por', 'Função', 'Telefone', 'Calebes inscritos', 'Participantes',
    ...RESPONSAVEIS.map((r) => `Resp. ${r.label}`),
    ...TREINAMENTOS.flatMap((m) => [`Treinamento ${m.label}`, `Data treinamento ${m.label}`]),
    'Local',
    ...DIVULGACAO.flatMap((d) => [d.label, `Data ${d.label}`]),
    'Alvo de batismo', 'Estudos bíblicos',
    ...ACOES.map((a) => a.label), 'Progresso (%)'];
  const rows = teams.map((t) => [
    t.name, t.church, districtOf(t), t.owner?.name || '', t.owner ? (t.owner.role === 'pastor' ? 'Pastor' : 'Líder') : '', t.owner?.phone || '',
    t.members.length, t.members.map((m) => `${m.name}${m.phone ? ` (${m.phone})` : ''}`).join('; '),
    ...RESPONSAVEIS.map((r) => t.responsaveis[r.key]),
    ...TREINAMENTOS.flatMap((m) => [t.treinamentos[m.key].done ? 'Sim' : 'Não', fmtDate(t.treinamentos[m.key].date)]),
    t.local,
    ...DIVULGACAO.flatMap((d) => [t.divulgacao[d.key].use ? 'Sim' : 'Não', fmtDate(t.divulgacao[d.key].date)]),
    t.alvoBatismo, t.alvoEstudos,
    ...ACOES.map((a) => fmtDate(t.acoes[a.key])), progress(t),
  ]);
  const cell = (v) => {
    let s = String(v ?? '');
    if (/^[=+\-@]/.test(s)) s = `'${s}`; // evita execução de fórmulas no Excel
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = '﻿' + [head, ...rows].map((r) => r.map(cell).join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `calebe-2027-equipes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- Roteador ----------

let sessionChecked = false;

async function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [page, a, b] = parts;
  tip.hidden = true;

  if (!session) {
    return renderAuth(page === 'cadastrar' ? 'cadastrar' : 'entrar');
  }
  if (page === 'entrar' || page === 'cadastrar') {
    setSession(null);
    return renderAuth(page);
  }

  try {
    if (session.kind === 'admin') {
      if (page !== 'admin') { location.hash = '#/admin/geral'; return; }
      if (a === 'equipe' && b) return await renderAdminTeam(b);
      return await renderAdmin(a || 'geral', true);
    }
    if (!sessionChecked) {
      const fresh = await data.getUser(session.user.id);
      if (!fresh) {
        setSession(null);
        toast('Cadastro não encontrado. Entre novamente.', 'error');
        return renderAuth('entrar');
      }
      setSession({ kind: 'user', user: fresh });
      sessionChecked = true;
    }
    if (page === 'equipe' && a) return await renderTeam(a, b);
    if (page !== 'painel') { location.hash = '#/painel'; return; }
    if (saveTimer) flushSave();
    await saving;
    draft = null;
    return await renderDashboard();
  } catch (err) {
    toast(err.message, 'error');
    if (session && session.kind === 'user' && page === 'equipe') location.hash = '#/painel';
  }
}

window.addEventListener('hashchange', route);
app.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
route();
