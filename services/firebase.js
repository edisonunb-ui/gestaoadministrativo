// Configuração do Firebase copiada do seu console.
const firebaseConfig = {
  apiKey: "AIzaSyAk7RV5rjTq0xJIoj_kaPbTiP74v-SuMS0",
  authDomain: "gestaoadministrativo-38e42.firebaseapp.com",
  databaseURL: "https://gestaoadministrativo-38e42-default-rtdb.firebaseio.com",
  projectId: "gestaoadministrativo-38e42",
  storageBucket: "gestaoadministrativo-38e42.appspot.com",
  messagingSenderId: "1053927073390",
  appId: "1:1053927073390:web:d493c88626d5f4679b687f",
  measurementId: "G-TPJQELS9WD"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Atalhos para os serviços do Firebase que vamos usar
const auth = firebase.auth();
const db = firebase.firestore();
