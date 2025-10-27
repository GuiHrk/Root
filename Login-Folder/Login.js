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

      const data = await response.json();

      if (!response.ok) {
        const text = await response.text();
        console.error("Erro na resposta: ", text);
        alert(data.error || "Falha no login. Verifique suas credenciais.");
        return;
      }

      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userName", data.user.nome);

      alert(`Bem-vindo, ${data.user.nome}! Redirecionando...`);

      setTimeout(() => { 
        window.location.href = "/Root/chat.html";
      }, 1500);

    } catch (error) {
        console.error("Erro durante o login:", error);
        alert("Erro ao conectar com o servidor.");
      }
    });
  });
