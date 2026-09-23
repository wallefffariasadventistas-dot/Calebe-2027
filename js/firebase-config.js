import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, doc, addDoc,
  setDoc, getDoc, getDocs, deleteDoc, updateDoc,
  query, where
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
export {
  collection, doc, addDoc, setDoc, getDoc, getDocs, deleteDoc, updateDoc,
  query, where
};
