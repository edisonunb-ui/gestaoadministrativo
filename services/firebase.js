// Configuração do Firebase copiada do seu console.
const firebaseConfig = {
  apiKey: "AIzaSyDCgS0wVa4N1GeX6ERsmx5dKJrbMAcbJR0",
  authDomain: "gestor-final-sp.firebaseapp.com",
  projectId: "gestor-final-sp",
  storageBucket: "gestor-final-sp.firebasestorage.app",
  messagingSenderId: "813516694558",
  appId: "1:813516694558:web:1b53ebf2e42e2622913a0f",
  measurementId: "G-D7XV8SQND6"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Atalhos para os serviços do Firebase que vamos usar
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
