/* import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { firebaseConfig } from "./firebaseconfig.js";

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const messagesContainer = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

// Verifica se o usuário está logado
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "./Index_folder/Login-Folder/Login.html";
  } else {
    carregarMensagens();
  }
});

// Enviar mensagem
sendButton.addEventListener("click", async () => {
  const text = messageInput.value.trim();
  if (text === "") return;

  await addDoc(collection(db, "messages"), {
    text,
    sender: auth.currentUser.email,
    timestamp: serverTimestamp()
  });

  messageInput.value = "";
});

// Carregar mensagens em tempo real
function carregarMensagens() {
  const q = query(collection(db, "messages"), orderBy("timestamp"));
  onSnapshot(q, (snapshot) => {
    messagesContainer.innerHTML = "";
    snapshot.forEach((doc) => {
      const msg = doc.data();
      const div = document.createElement("div");
      div.className = msg.sender === auth.currentUser.email ? "minha-msg" : "outra-msg";
      div.textContent = `${msg.sender}: ${msg.text}`;
      messagesContainer.appendChild(div);
    });
  });
}
  */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { firebaseConfig } from "./firebaseconfig.js";

// --- Inicializa Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Referências no DOM ---
const messagesContainer = document.getElementById("messages");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-btn");
const logoutButton = document.getElementById("logout-btn");
const currentUsername = document.getElementById("current-username");
const initialsText = document.querySelector(".initials-text");
const headerChatName = document.getElementById("current-chat-name");

// --- Verifica autenticação ---
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "../Index_folder/Login-Folder/Login.html";
  } else {
    // Mostra nome e iniciais
    const name = user.displayName || user.email.split("@")[0];
    currentUsername.textContent = name;
    initialsText.textContent = name.charAt(0).toUpperCase();

    // Exibe o canal atual
    headerChatName.textContent = "#geral";

    // Começa a ouvir as mensagens
    carregarMensagens();
  }
});

// --- Enviar mensagem ---
sendButton.addEventListener("click", enviarMensagem);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") enviarMensagem();
});

async function enviarMensagem() {
  const text = messageInput.value.trim();
  if (text === "") return;

  try {
    await addDoc(collection(db, "messages"), {
      text,
      sender: auth.currentUser.email,
      timestamp: serverTimestamp(),
    });
    messageInput.value = "";
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
  }
}

// --- Carregar mensagens em tempo real ---
function carregarMensagens() {
  const q = query(collection(db, "messages"), orderBy("timestamp"));

  onSnapshot(q, (snapshot) => {
    messagesContainer.innerHTML = "";

    snapshot.forEach((doc) => {
      const msg = doc.data();
      const div = document.createElement("div");

      div.className =
        msg.sender === auth.currentUser.email
          ? "message my-message"
          : "message other-message";

      div.innerHTML = `
        <strong>${msg.sender === auth.currentUser.email ? "Você" : msg.sender}</strong>: 
        <span>${msg.text}</span>
      `;

      messagesContainer.appendChild(div);
    });

    // Scroll automático
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
}

// --- Logout ---
logoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "../Index_folder/Login-Folder/Login.html";
  } catch (error) {
    console.error("Erro ao sair:", error);
  }
});
