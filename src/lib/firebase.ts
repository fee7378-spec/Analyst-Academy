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

const firebaseConfigLogs = {
  apiKey: "AIzaSyAvCdM3HxbYY644lOsZtiO21fxQzf_VT4w",
  authDomain: "log-de-atividades.firebaseapp.com",
  databaseURL: "https://log-de-atividades-default-rtdb.firebaseio.com",
  projectId: "log-de-atividades",
  storageBucket: "log-de-atividades.firebasestorage.app",
  messagingSenderId: "364783945233",
  appId: "1:364783945233:web:0be0192fac06cbd706d3b0",
  measurementId: "G-W75F9G8QJ9"
};

const app = initializeApp(firebaseConfig);
const logsApp = initializeApp(firebaseConfigLogs, "logs");

export const db = getDatabase(app);
export const logsDb = getDatabase(logsApp);
export const auth = getAuth(app);
export { ref, set, get, update, remove, push, onValue };
