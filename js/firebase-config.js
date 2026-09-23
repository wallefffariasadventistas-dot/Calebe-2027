import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection as fsCollection, doc as fsDoc, addDoc as fsAddDoc,
  setDoc as fsSetDoc, getDoc as fsGetDoc, getDocs as fsGetDocs,
  deleteDoc as fsDeleteDoc, updateDoc as fsUpdateDoc,
  query as fsQuery, where as fsWhere
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Configuração do projeto Firebase do Calebe 2027.
// Firebase Console → Configurações do projeto → Seus apps → App da Web → firebaseConfig
const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};

export const firebaseReady = !firebaseConfig.apiKey.startsWith("COLE_");
export const app = firebaseReady ? initializeApp(firebaseConfig) : null;
export const db  = firebaseReady ? getFirestore(app) : null;

// ---------- Modo local ----------
// Enquanto o Firebase não estiver configurado, os dados ficam salvos
// apenas neste navegador (localStorage), com as mesmas funções do Firestore.

const LOCAL_KEY = "calebe2027.localdb";
let memory = null;

function localRead() {
  if (memory) return memory;
  try { memory = JSON.parse(localStorage.getItem(LOCAL_KEY)) || {}; } catch { memory = {}; }
  return memory;
}
function localWrite() {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(memory)); } catch { /* armazenamento indisponível */ }
}
const table = (name) => (localRead()[name] ||= {});
const copy = (v) => JSON.parse(JSON.stringify(v));
const snap = (id, v) => ({ id, exists: () => v !== undefined, data: () => copy(v) });
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

const local = {
  collection: (_db, name) => ({ name, filters: [] }),
  doc: (_db, name, id) => ({ name, id }),
  where: (field, _op, value) => ({ field, value }),
  query: (col, ...filters) => ({ ...col, filters }),
  async addDoc(col, value) {
    const id = newId();
    table(col.name)[id] = copy(value);
    localWrite();
    return { id };
  },
  async setDoc(ref, value) {
    table(ref.name)[ref.id] = copy(value);
    localWrite();
  },
  async updateDoc(ref, value) {
    table(ref.name)[ref.id] = { ...table(ref.name)[ref.id], ...copy(value) };
    localWrite();
  },
  async getDoc(ref) {
    return snap(ref.id, table(ref.name)[ref.id]);
  },
  async deleteDoc(ref) {
    delete table(ref.name)[ref.id];
    localWrite();
  },
  async getDocs(q) {
    const docs = Object.entries(table(q.name))
      .filter(([, v]) => q.filters.every((f) => v[f.field] === f.value))
      .map(([id, v]) => snap(id, v));
    return { empty: docs.length === 0, docs };
  },
};

export const collection = firebaseReady ? fsCollection : local.collection;
export const doc        = firebaseReady ? fsDoc        : local.doc;
export const addDoc     = firebaseReady ? fsAddDoc     : local.addDoc;
export const setDoc     = firebaseReady ? fsSetDoc     : local.setDoc;
export const getDoc     = firebaseReady ? fsGetDoc     : local.getDoc;
export const getDocs    = firebaseReady ? fsGetDocs    : local.getDocs;
export const deleteDoc  = firebaseReady ? fsDeleteDoc  : local.deleteDoc;
export const updateDoc  = firebaseReady ? fsUpdateDoc  : local.updateDoc;
export const query      = firebaseReady ? fsQuery      : local.query;
export const where      = firebaseReady ? fsWhere      : local.where;
