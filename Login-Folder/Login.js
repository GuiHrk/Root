document.addEventListener("DOMContentLoaded", () => {
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
      const response = await fetch("https://root-backend-chat.onrender.com/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        console.error("❌ A resposta não é JSON (pode ser erro 500 HTML)");
        alert("Erro inesperado no servidor.");
        return;
      }

      if (!response.ok) {
        console.error("❌ Erro do servidor:", data);
        alert(data?.error || "Falha no login. Verifique suas credenciais.");
        return;
      }
      if (data.success) {
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userName", data.user.nome);

        alert(`✅ Bem-vindo, ${data.user.nome}! Redirecionando...`);

        setTimeout(() => {
          window.location.href = "../Dashboard/dashboard.html";
        }, 1500);
      } else {
        alert("Credenciais inválidas. Tente novamente.");
      }

    } catch (error) {
      console.error("🚨 Erro durante o login:", error);
      alert("Erro ao conectar com o servidor.");
    }
  });
});