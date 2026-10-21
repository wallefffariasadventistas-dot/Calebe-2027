import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, doc, addDoc, setDoc, getDoc, getDocs,
  deleteDoc, updateDoc, query, where, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider,
  sendPasswordResetEmail, deleteUser
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Configuração do projeto Firebase do Calebe 2027.
// Firebase Console → Configurações do projeto → Seus apps → App da Web → firebaseConfig
const firebaseConfig = {
  apiKey: "AIzaSyDlPgEOkP14Akx6BZg62rK-oLa2GCQyevA",
  authDomain: "calebempi.firebaseapp.com",
  projectId: "calebempi",
  storageBucket: "calebempi.firebasestorage.app",
  messagingSenderId: "925226796829",
  appId: "1:925226796829:web:4a2663ef650e00adb183f4",
  measurementId: "G-075CJ3B7NH"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export {
  collection, doc, addDoc, setDoc, getDoc, getDocs, deleteDoc, updateDoc, query, where, writeBatch,
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
  updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail, deleteUser
};
