const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, limit, startAfter, orderBy} = require('firebase/firestore');

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAo3ZAtNr36qP1CutncYJVL31VAyijBw5I",
    authDomain: "old-store-czb.firebaseapp.com",
    projectId: "old-store-czb",
    storageBucket: "old-store-czb.appspot.com",
    messagingSenderId: "251610821426",
    appId: "1:251610821426:web:535912dcbb1971db711d2b"
  };

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

module.exports = { auth, db, collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, limit, startAfter, orderBy };

