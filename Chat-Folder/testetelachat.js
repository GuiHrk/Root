import { auth, db } from "../firebaseconfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  ref,
  get,
  onChildAdded,
  push,
  set,
  update,
  query,
  orderByChild,
  equalTo,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

/* ------------------------
   Config / Estado
   ------------------------ */
const STATUS_KEY = "user_current_status";
const DEFAULT_AVATAR_URL = "images/default-avatar.png";

const STATE = {
  currentConversation: null, // key (display name) or conversationId
  currentConversationId: null,
  currentUser: null, // { uid, nome, email }
  userConversations: {}, // { displayName: { uid, dotClass } }
};

/* ------------------------
   Helpers UI / formatting
   ------------------------ */
function escapeHtml(unsafe) {
  return String(unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function formatText(text) {
  if (!text) return "";
  let t = escapeHtml(text);
  t = t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*(.*?)\*/g, "<em>$1</em>");
  t = t.replace(/`(.*?)`/g, "<code>$1</code>");
  t = t.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
  return t;
}
function getInitials(fullName = "", max = 2) {
  const n = String(fullName).replace(/#|🔒|\s+/g, " ").trim();
  if (!n) return "";
  const parts = n.split(" ").filter((p) => p.length);
  if (parts.length === 1) return parts[0].substring(0, max).toUpperCase();
  return (parts[0][0] + (parts[parts.length - 1][0] || "")).substring(0, max).toUpperCase();
}
function getInitialChar(fullName = "") {
  const n = String(fullName).replace(/#|🔒|\s+/g, " ").trim();
  return n ? n[0].toUpperCase() : "";
}

/* ------------------------
   DOM Helpers
   ------------------------ */
function el(selector) {
  return document.querySelector(selector);
}
function show(elem) {
  if (elem) elem.style.display = "";
}
function hide(elem) {
  if (elem) elem.style.display = "none";
}

/* ------------------------
   Conversation ID helper
   ------------------------ */
function getConversationId(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

/* ------------------------
   Firebase: load current user profile (Realtime DB)
   ------------------------ */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.warn("Usuário não logado.");
    // Optional: redirect to login if desired
    return;
  }

  // store basic current user in memory (we're NOT auto-saving in localStorage per your choice)
  STATE.currentUser = { uid: user.uid, email: user.email || "" };

  // fetch user record in Realtime DB /users/{uid}
  try {
    const userRef = ref(db, `users/${user.uid}`);
    const snap = await get(userRef);
    if (snap.exists()) {
      const data = snap.val();
      STATE.currentUser.nome = data.nome || user.email || "Você";
    } else {
      // fallback to display email/localname
      STATE.currentUser.nome = user.email ? user.email.split("@")[0] : "Você";
    }
  } catch (err) {
    console.error("Erro ao buscar usuário no DB:", err);
    STATE.currentUser.nome = user.email ? user.email.split("@")[0] : "Você";
  }

  // Render initial UI pieces that rely on current user
  renderProfileHeader();
  renderEmptySidebar();
});

/* ------------------------
   UI: profile & avatar
   ------------------------ */
function renderProfileHeader() {
  const profileNameEl = el("#profile-name");
  const initialsEl = el("#user-initials");
  const profilePicImg = el("#profile-pic-img");

  const name = (STATE.currentUser && STATE.currentUser.nome) || "Carregando...";
  if (profileNameEl) profileNameEl.textContent = name;
  if (initialsEl) initialsEl.textContent = getInitials(name, 2);

  // avatar: use initials only (user chose initials)
  if (profilePicImg) profilePicImg.style.display = "none";
}

/* ------------------------
   Sidebar: start empty (user wanted a clean page)
   ------------------------ */
function renderEmptySidebar() {
  const dmList = el("#dm-users-list");
  if (!dmList) return;
  dmList.innerHTML = ""; // start empty

  // show helpful placeholder
  const placeholder = document.createElement("li");
  placeholder.className = "placeholder";
  placeholder.innerHTML = `<em>Nenhum contato. Pesquise um email acima para adicionar um contato (aperte Enter).</em>`;
  dmList.appendChild(placeholder);
}

/* ------------------------
   Add DM to list (UI) — called when a contact is found
   ------------------------ */
function addDMToList(displayName, uid) {
  // guard duplicates
  if (STATE.userConversations[displayName]) return;

  // remove placeholder if present
  const dmList = el("#dm-users-list");
  const placeholder = dmList && dmList.querySelector(".placeholder");
  if (placeholder) placeholder.remove();

  const li = document.createElement("li");
  li.className = "nav-item dm-user";
  li.dataset.userName = displayName;
  li.dataset.uid = uid;

  const initials = getInitials(displayName, 2);
  li.innerHTML = `
    <div class="user-avatar-small">
      <span class="initials-text">${initials}</span>
      <span class="status-indicator dot-green"></span>
    </div>
    <span class="nav-text">${escapeHtml(displayName)}</span>
    <i class="fas fa-times delete-icon" data-type="dm"></i>
  `;

  li.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((i) => i.classList.remove("active"));
    li.classList.add("active");
    openConversation(uid, displayName);
  });

  // delete button
  li.querySelector(".delete-icon").addEventListener("click", (e) => {
    e.stopPropagation();
    delete STATE.userConversations[displayName];
    li.remove();
    if (Object.keys(STATE.userConversations).length === 0) renderEmptySidebar();
    // if closed conversation was open, hide header and composer
    if (STATE.currentConversation === displayName) closeConversationUI();
  });

  dmList.appendChild(li);
  STATE.userConversations[displayName] = { uid, dotClass: "dot-green" };
}

/* ------------------------
   Search bar: lookup user by email in Realtime DB
   - user types email in .search-input and presses Enter
   - if found, add DM to list
   ------------------------ */
function setupSearchToAddContact() {
  const searchInput = el(".search-input");
  if (!searchInput) return;

  searchInput.addEventListener("keypress", async (e) => {
    if (e.key !== "Enter") return;
    const q = searchInput.value.trim();
    if (!q) return;

    // assume q is email or displayName -> try to find by email first
    try {
      // fetch all users and search (Realtime DB doesn't have simple 'where email' without index)
      // For production, create an index by email or store user by email-keyed node.
      const usersRef = ref(db, "users");
      const snap = await get(usersRef);
      if (!snap.exists()) {
        alert("Nenhum usuário cadastrado no banco.");
        return;
      }

      let found = null;
      snap.forEach((child) => {
        const u = child.val();
        if (!u) return;
        // compare email or nome
        if (u.email && u.email.toLowerCase() === q.toLowerCase()) found = { uid: child.key, nome: u.nome || u.email };
        else if (u.nome && u.nome.toLowerCase() === q.toLowerCase()) found = { uid: child.key, nome: u.nome };
      });

      if (!found) {
        alert("Usuário não encontrado. Verifique o email/nome e tente novamente.");
        return;
      }

      // add to DM list
      addDMToList(found.nome, found.uid);
      searchInput.value = "";
    } catch (err) {
      console.error("Erro ao pesquisar usuários:", err);
      alert("Erro ao pesquisar usuário. Veja console.");
    }
  });
}

/* ------------------------
   Conversation: open, listen messages, send
   ------------------------ */
let currentMessagesListener = null;

async function createOrGetConversation(uid1, uid2) {
  const convId = getConversationId(uid1, uid2);
  const convRef = ref(db, `conversations/${convId}`);
  const snap = await get(convRef);
  if (!snap.exists()) {
    await set(convRef, {
      participants: { [uid1]: true, [uid2]: true },
      lastMessage: "",
      lastMessageAt: Date.now(),
    });
    console.log("Conversa criada:", convId);
  }
  return convId;
}

function openConversation(targetUid, targetName) {
  if (!STATE.currentUser) {
    alert("Usuário não carregado. Faça login novamente.");
    return;
  }
  // show header and composer
  const header = el("#chat-header");
  const composer = el("#composer");
  const headerInitials = el("#header-initials");
  const headerName = el("#chat-contact-name");

  if (header) show(header);
  if (composer) show(composer);
  if (headerInitials) headerInitials.textContent = getInitials(targetName, 2);
  if (headerName) headerName.textContent = targetName;

  // create / get conversation id and start listening for messages
  createOrGetConversation(STATE.currentUser.uid, targetUid)
    .then((convId) => {
      STATE.currentConversation = targetName;
      STATE.currentConversationId = convId;
      // clear existing messages UI
      const messagesContainer = el("#messages-container");
      if (messagesContainer) messagesContainer.innerHTML = "";

      // detach previous listener if exists by simply ignoring since onChildAdded returns no handle here;
      // We'll attach a new onChildAdded below
      const msgsRef = ref(db, `messages/${convId}`);
      onChildAdded(msgsRef, (snap) => {
        const m = snap.val();
        if (!m) return;
        addMessageToContainer(el("#messages-container"), m, m.from === STATE.currentUser.uid ? STATE.currentUser.nome : targetName);
      });
    })
    .catch((err) => {
      console.error("Erro ao abrir conversa:", err);
      alert("Erro ao abrir conversa. Veja console.");
    });
}

function closeConversationUI() {
  const header = el("#chat-header");
  const composer = el("#composer");
  if (header) hide(header);
  if (composer) hide(composer);
  const messagesContainer = el("#messages-container");
  if (messagesContainer) messagesContainer.innerHTML = "";
  STATE.currentConversation = null;
  STATE.currentConversationId = null;
}

/* send message using composer */
async function sendMessageFromComposer(text) {
  if (!STATE.currentUser || !STATE.currentConversationId) return;
  const msgsRef = ref(db, `messages/${STATE.currentConversationId}`);
  const newMsgRef = push(msgsRef);
  const payload = {
    from: STATE.currentUser.uid,
    text: text,
    timestamp: Date.now(),
  };
  await set(newMsgRef, payload);

  // update conversations meta
  await update(ref(db, `conversations/${STATE.currentConversationId}`), {
    lastMessage: text,
    lastMessageAt: Date.now(),
  });
}

/* ------------------------
   Messages UI helper
   ------------------------ */
function addMessageToContainer(messagesContainer, msg, senderDisplayName) {
  if (!messagesContainer) return;
  const div = document.createElement("div");
  const currentUid = STATE.currentUser ? STATE.currentUser.uid : null;
  const isMine = msg.from === currentUid;
  div.className = "message-row " + (isMine ? "sent" : "received");

  const avatar = getInitialChar(senderDisplayName || msg.from);
  const formatted = formatText(msg.text || "");
  const time = new Date(msg.timestamp || Date.now()).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  div.innerHTML = `
    <div class="message-avatar">${escapeHtml(avatar)}</div>
    <div class="message-content-wrapper">
      <div class="message-header">${escapeHtml(senderDisplayName || msg.from)}</div>
      <div class="message-body">${formatted}<span class="time">${time}</span></div>
    </div>
  `;

  messagesContainer.appendChild(div);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/* ------------------------
   Setup UI event listeners (DOM ready)
   ------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  // hide header/composer until a chat is opened
  hide(el("#chat-header"));
  hide(el("#composer"));

  // search-input -> add contact by email or name (Enter)
  setupSearchToAddContact();

  // composer send button
  const sendBtn = el("#send-btn");
  const inputField = el("#message-input");
  if (sendBtn && inputField) {
    sendBtn.addEventListener("click", async () => {
      const text = inputField.value.trim();
      if (!text) return;
      await sendMessageFromComposer(text);
      // also add local message UI immediately
      addMessageToContainer(el("#messages-container"), { from: STATE.currentUser.uid, text, timestamp: Date.now() }, STATE.currentUser.nome);
      inputField.value = "";
      inputField.focus();
    });

    inputField.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendBtn.click();
      }
    });
  }

  // emoji modal (simple): open and click to append emoji
  const emojiTrigger = el("#emoji-trigger");
  const emojiModal = el("#emoji-modal");
  if (emojiTrigger && emojiModal && inputField) {
    emojiTrigger.addEventListener("click", () => emojiModal.classList.add("open"));
    emojiModal.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-overlay")) emojiModal.classList.remove("open");
      if (e.target.tagName === "SPAN") {
        inputField.value += e.target.textContent;
        emojiModal.classList.remove("open");
        inputField.focus();
      }
    });
  }

  // settings/status modal (simple toggle)
  const settingsIcon = el(".settings-icon");
  const statusModal = el("#status-modal");
  if (settingsIcon && statusModal) {
    settingsIcon.addEventListener("click", () => statusModal.classList.add("open"));
    statusModal.addEventListener("click", (e) => {
      const li = e.target.closest("li[data-status]");
      if (!li) return;
      // visually update profile status dot
      const status = li.dataset.status;
      const icon = el(".profile-status-icon");
      if (icon) {
        ["dot-green", "dot-yellow", "dot-red", "dot-gray"].forEach((c) => icon.classList.remove(c));
        icon.classList.add(`dot-${status}`);
      }
      statusModal.classList.remove("open");
    });
  }

  // delegate delete-icon (for DMs) on document
  document.addEventListener("click", (e) => {
    if (e.target.matches(".delete-icon")) {
      const navItem = e.target.closest(".nav-item");
      if (!navItem) return;
      const type = e.target.dataset.type;
      if (type === "dm") {
        const name = navItem.dataset.userName;
        delete STATE.userConversations[name];
        navItem.remove();
        if (Object.keys(STATE.userConversations).length === 0) renderEmptySidebar();
      } else if (type === "channel") {
        navItem.remove();
      }
    }
  });

  // set minimal theme defaults (if any)
  const savedTheme = localStorage.getItem("theme") || "dark";
  if (window.updateChatTheme) window.updateChatTheme(savedTheme, localStorage.getItem("color") || "#a855f7");
});