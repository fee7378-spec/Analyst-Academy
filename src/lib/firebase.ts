import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, remove, push, onValue } from "firebase/database";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword, fetchSignInMethodsForEmail } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAwdvP1QHX3hBjh_XFOEvVEok9GwKGdky0",
  authDomain: "analyst-academy-e814d.firebaseapp.com",
  databaseURL: "https://analyst-academy-e814d-default-rtdb.firebaseio.com",
  projectId: "analyst-academy-e814d",
  storageBucket: "analyst-academy-e814d.firebasestorage.app",
  messagingSenderId: "910476714098",
  appId: "1:910476714098:web:a803bba8d4b7be5b9522eb",
  measurementId: "G-KMSR274KP3"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const logsDb = db; // Use the same database for logs to avoid hanging if the second DB is not created
export const auth = getAuth(app);
export { ref, set, get, update, remove, push, onValue };
