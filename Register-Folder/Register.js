import { auth, db } from "../firebaseconfig.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const confirmar = document.getElementById("confirmar-senha").value.trim();

  if (!nome || !email || !senha || !confirmar) {
    alert("Preencha todos os campos!");
    return;
  }

  if (senha !== confirmar) {
    alert("As senhas não coincidem!");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;

    await set(ref(db, "users/" + user.uid), {
      nome,
      email,
      uid: user.uid,
      createdAt: new Date().toISOString()
    });

    alert("Conta criada com sucesso!");
    window.location.href = "../Login-Folder/Login.html";
  } catch (error) {
    console.error(error);
    if (error.code === "auth/email-already-in-use") {
      alert("Este e-mail já está em uso.");
    } else {
      alert("Erro ao cadastrar: " + error.message);
    }
  }
});
