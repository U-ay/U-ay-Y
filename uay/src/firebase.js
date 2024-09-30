// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';


// Substitua as configurações abaixo pelas suas configurações do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA51Gl_50ROX39Uhs3Q0IXf7s1qtAL4_Hc",
    authDomain: "y-uay-e375e.firebaseapp.com",
    projectId: "y-uay-e375e",
    storageBucket: "y-uay-e375e.appspot.com",
    messagingSenderId: "144096183950",
    appId: "1:144096183950:web:5262ad793387968cd86bdf",
    measurementId: "G-W6RFR52NWM"
  };

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Adicionando Storage


// Exportar os serviços para uso em outros arquivos
export { auth, db, storage };
