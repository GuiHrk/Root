import { auth, db } from "../firebaseconfig.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, get, child } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();

  if (!email || !senha) {
    alert("Preencha todos os campos!");
    return;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, senha);

    // pega dados do usuário no Realtime Database
    const dbRef = ref(db);
    const snap = await get(child(dbRef, `users/${cred.user.uid}`));

    if (!snap.exists()) {
      alert("Usuário não encontrado no banco!");
      return;
    }

    alert("Login realizado com sucesso!");
    window.location.href = "../Chat-Folder/telachat.html";

  } catch (error) {
    console.error(error);

    if (error.code === "auth/invalid-credential") {
      alert("E-mail ou senha incorretos.");
    } else {
      alert("Erro ao fazer login: " + error.message);
    }
  }
});
