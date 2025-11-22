import {
  getDatabase,
  ref,
  get,
  set,
  push,
  onChildAdded,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// ----------------------
// ELEMENTOS DO FRONTEND
// ----------------------
const messagesContainer = document.querySelector(".messages-container");
const messageInput = document.getElementById("message-input");
const currentUsername = document.getElementById("current-username");
const initialsText = document.getElementById("initials-text");

// ----------------------
const db = getDatabase();
const auth = getAuth();

function getConversationId(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

async function createOrGetConversation(uid1, uid2) {
  const conversationId = getConversationId(uid1, uid2);

  const convRef = ref(db, "conversations/" + conversationId);
  const snap = await get(convRef);

  if (!snap.exists()) {
    await set(convRef, {
      lastMessage: "",
      lastMessageAt: Date.now(),
      participants: {
        [uid1]: true,
        [uid2]: true
      }
    });

    console.log("Conversa Criada:", conversationId);
  } else {
    console.log("Conversa Existente:", conversationId);
  }

  return conversationId;
}

let currentConversationId = null;

async function openConversation(targetUid) {
  const loggedUser = auth.currentUser.uid;

  currentConversationId = await createOrGetConversation(loggedUser, targetUid);

  messagesContainer.innerHTML = "";

  const msgRef = ref(db, "messages/" + currentConversationId);

  onChildAdded(msgRef, (snapshot) => {
    const msg = snapshot.val();
    const div = document.createElement("div");

    div.className =
      msg.from === auth.currentUser.uid
        ? "message my-message"
        : "message other-message";

    div.innerHTML = `
      <strong>${msg.from === auth.currentUser.uid ? "Você" : msg.from}</strong>: 
      <span>${msg.text}</span>
    `;

    messagesContainer.appendChild(div);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });

  console.log("Conversa Aberta:", currentConversationId);
}

async function enviarMensagem() {
  const text = messageInput.value.trim();
  if (text === "" || !currentConversationId) return;

  const newMsgRef = push(ref(db, "messages/" + currentConversationId));

  await set(newMsgRef, {
    from: auth.currentUser.uid,
    text: text,
    timestamp: Date.now()
  });

  await update(ref(db, "conversations/" + currentConversationId), {
    lastMessage: text,
    lastMessageAt: Date.now()
  });

  messageInput.value = "";
}

// ----------------------
// LISTA DE USUÁRIOS
// ----------------------
function loadUserList(currentUid) {
  const userListRef = ref(db, "users");
  const dmList = document.getElementById("dm-users-list");

  onValue(userListRef, (snapshot) => {
    dmList.innerHTML = "";

    snapshot.forEach((child) => {
      const user = child.val();
      const uid = child.key;

      if (uid === currentUid) return;

      const li = document.createElement("li");
      li.classList.add("nav-item", "dm-user");
      li.dataset.uid = uid;

      li.innerHTML = `
        <div class="user-avatar-small">
          <span class="initials-text">${user.nome[0].toUpperCase()}</span>
          <span class="status-indicator dot-green"></span>
        </div>
        <span class="nav-text">${user.nome}</span>
      `;

      li.addEventListener("click", () => openConversation(uid));

      dmList.appendChild(li);
    });
  });
}

// ----------------------
// LOGIN AUTOMÁTICO
// ----------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../Index_folder/Login-Folder/Login.html";
    return;
  }

  const userRef = ref(db, "users/" + user.uid);
  const snapshot = await get(userRef);

  if (snapshot.exists()) {
    const userData = snapshot.val();

    currentUsername.textContent = userData.nome;
    initialsText.textContent = userData.nome.charAt(0).toUpperCase();

    console.log("Usuário carregado:", userData);

    loadUserList(user.uid);
  }
});
