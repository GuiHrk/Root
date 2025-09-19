// Abrir e fechar painel lateral
const openPanel = document.getElementById("openThemePanel");
const closePanel = document.getElementById("closeThemePanel");
const themePanel = document.getElementById("themePanel");

openPanel.addEventListener("click", () => themePanel.classList.add("active"));
closePanel.addEventListener("click", () => themePanel.classList.remove("active"));

const themeSlider = document.getElementById("themeSlider");
const body = document.body;

const defaultTheme = {
  cta: "#5C2D91",
  signup: "#5C2D91",
  loginBorder: "#8A4FDC"
};

// Função para aplicar tema
function applyTheme(theme) {
  if (theme === "light") {
    body.style.setProperty("--bg-color", "#F5F5F5");
    body.style.setProperty("--text-color", "#1A112F");
    themeSlider.classList.add("active");
  } else {
    body.style.setProperty("--bg-color", "#1A112F");
    body.style.setProperty("--text-color", "#F5F5F5");
    themeSlider.classList.remove("active");
  }
}

// Slider claro/escuro
themeSlider.addEventListener("click", () => {
  const current = localStorage.getItem("theme") === "light" ? "light" : "dark";
  const newTheme = current === "light" ? "dark" : "light";
  applyTheme(newTheme);
  localStorage.setItem("theme", newTheme);
});

// Paleta de cores
document.querySelectorAll(".color-box").forEach(box => {
  box.addEventListener("click", () => {
    if (box.dataset.default) {
      body.style.setProperty("--btn-cta-start", defaultTheme.cta);
      body.style.setProperty("--btn-signup-start", defaultTheme.signup);
      body.style.setProperty("--btn-login-border", defaultTheme.loginBorder);
      localStorage.removeItem("color"); // remove cor personalizada
    } else {
      let selected = box.getAttribute("data-color");
      body.style.setProperty("--btn-cta-start", selected);
      body.style.setProperty("--btn-signup-start", selected);
      body.style.setProperty("--btn-login-border", selected);
      localStorage.setItem("color", selected);
    }
  });
});

// Aplicar tema e cor ao carregar a página
const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

const savedColor = localStorage.getItem("color");
if (savedColor) {
  body.style.setProperty("--btn-cta-start", savedColor);
  body.style.setProperty("--btn-signup-start", savedColor);
  body.style.setProperty("--btn-login-border", savedColor);
} else {
  body.style.setProperty("--btn-cta-start", defaultTheme.cta);
  body.style.setProperty("--btn-signup-start", defaultTheme.signup);
  body.style.setProperty("--btn-login-border", defaultTheme.loginBorder);
}
