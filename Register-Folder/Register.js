// Seleção dos elementos
const form = document.querySelector('form');
const nomeInput = document.getElementById('nome');
const emailInput = document.getElementById('email');
const senhaInput = document.getElementById('senha');
const confirmarSenhaInput = document.getElementById('confirmar-senha');

// Função para mostrar alerta temporário
function showAlert(message, type = 'error') {
    const alertBox = document.createElement('div');
    alertBox.textContent = message;
    alertBox.style.position = 'fixed';
    alertBox.style.top = '20px';
    alertBox.style.left = '50%';
    alertBox.style.transform = 'translateX(-50%)';
    alertBox.style.padding = '15px 25px';
    alertBox.style.borderRadius = '10px';
    alertBox.style.color = '#fff';
    alertBox.style.fontWeight = 'bold';
    alertBox.style.zIndex = '1000';
    alertBox.style.transition = 'all 0.4s ease';
    alertBox.style.opacity = '0.9';
    alertBox.style.background = type === 'error' ? '#FF4C4C' : '#4CAF50';
    document.body.appendChild(alertBox);

    setTimeout(() => {
        alertBox.remove();
    }, 3000);
}

// Função para validar email simples
function isValidEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
}

// Evento de submit
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nome = nomeInput.value.trim();
    const email = emailInput.value.trim();
    const senha = senhaInput.value;
    const confirmarSenha = confirmarSenhaInput.value;

    // Validação dos campos
    if (!nome || !email || !senha || !confirmarSenha) {
        showAlert('Por favor, preencha todos os campos.');
        return;
    }

    if (!isValidEmail(email)) {
        showAlert('E-mail inválido.');
        return;
    }

    if (senha !== confirmarSenha) {
        showAlert('As senhas não coincidem.');
        return;
    }

    if (senha.length < 6) {
        showAlert('A senha deve ter no mínimo 6 caracteres.');
        return;
    }

    // Salvar usuário no localStorage (simulação)
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // Checar se já existe
    if (users.some(u => u.email === email)) {
        showAlert('Este e-mail já está cadastrado.');
        return;
    }

    const user = { nome, email, senha };
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(user)); // salva usuário logado

    // Mostrar sucesso
    showAlert('Cadastro realizado com sucesso!', 'success');

    // Redirecionar para dashboard.html após 1.5s
    setTimeout(() => {
        window.location.href = '../Dashboard/dashboard.html';
    }, 1500);
});
