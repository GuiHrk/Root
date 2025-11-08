const root = document.documentElement;

const defaultThemeColor = "#6a3be2";

// ===============================================
// DADOS DO PERFIL - FALLBACK E ESTRUTURA
// ===============================================

// VALORES PADRÃO (FALLBACK) caso não encontre um usuário logado
const DEFAULT_USER_DATA = {
    fullName: "Usuário Desconhecido", 
    email: "email@naocadastrado.com",
    nickname: "Visitante",
    avatarUrl: "images/default-avatar.png", 
};

// Valor antigo do mock para forçar a correção do apelido inicial
const MOCKED_NICKNAME = "JoãozinhoDev";

// ===============================================
// ELEMENTOS DO DOM (Perfil)
// ===============================================
const fullNameInput = document.getElementById('full-name');
const nicknameInput = document.getElementById('nickname');
const emailInput = document.getElementById('email');
const profileForm = document.querySelector('.user-info');

// ===============================================
// TEMA E INICIALIZAÇÃO
// ===============================================

// ✅ FUNÇÃO ÚNICA: Define as cores do tema claro/escuro
function getThemeColors(themeName) {
    
    if (themeName === "light") {
        return {
            '--bg': '#F5F5F5',
            '--card': '#EAEAEA',
            '--text': '#1a112f',
            '--muted': '#555',
            '--border': '#ccc',
            '--shadow': 'rgba(0,0,0,0.08)'
        };
    } else { 
        return {
            '--bg': '#1A112F',
            '--card': '#2a1a4c',
            '--text': '#F5F5F5',
            '--muted': '#ccc',
            '--border': '#444',
            '--shadow': 'rgba(0,0,0,0.15)'
        };
    }
}
    
// ✅ FUNÇÃO ATUALIZADA: Aplica o tema e as cores do Dashboard
function applySavedTheme() {
    
    const savedThemeName = localStorage.getItem('theme') || 'dark';
    const themeColors = getThemeColors(savedThemeName);
    
    // 1. Aplica cores de fundo/texto (tema claro/escuro)
    for (const [prop, value] of Object.entries(themeColors)) {
        root.style.setProperty(prop, value);
    }
    
    // 2. Aplica a cor principal (cor de sotaque)
    const savedColor = localStorage.getItem("color");
    const primaryColor = savedColor || defaultThemeColor; 
    
    // LINHAS CRUCIAIS: Define as variáveis que o CSS usa para a cor principal/interativa
    root.style.setProperty('--btn-cta-start', primaryColor);
    root.style.setProperty('--btn-cta-end', primaryColor);
    root.style.setProperty('--primary-hover', primaryColor); 

}

// Chama a função para aplicar o tema e a cor na inicialização
applySavedTheme();


window.addEventListener('storage', (event) => {
    // O Dashboard usa "theme" e "color"
    if (event.key === 'theme' || event.key === 'color') {
        applySavedTheme();
    }
});


document.querySelectorAll('.sidebar ul li').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.sidebar ul li').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.tab').forEach(s => s.classList.remove('active'));
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

const modal = document.querySelector('.modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const confirmBtn = document.getElementById('confirm-btn');
const cancelBtn = document.getElementById('cancel-btn');

function showModal(title, message, onConfirm) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.classList.add('show');
    confirmBtn.onclick = () => {
        modal.classList.remove('show');
        onConfirm();
    };
}

cancelBtn.addEventListener('click', () => modal.classList.remove('show'));


function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 2500);
}


// Otimiza para usar o toast no lugar dos modais padrões para o botão salvar
// ATENÇÃO: O formulário de Perfil será tratado com a lógica de submit abaixo.
document.querySelector('.save-btn')?.addEventListener('click', e => {
    // Se o elemento clicado for o botão de salvar do PERFIL, ignoramos esta função.
    if (e.target.parentElement.parentElement.classList.contains('user-info')) {
        return; 
    }
    
    e.preventDefault();
    // Apenas os botões genéricos de salvar, os demais são tratados individualmente.
    if (!e.target.classList.contains('save-status') && !e.target.classList.contains('save-locale') && !e.target.classList.contains('save-notif') && !e.target.classList.contains('save-security')) {
        showToast("Alterações salvas com sucesso!");
    }
});

const deleteBtn = document.querySelector('.delete-btn');
deleteBtn?.addEventListener('click', () => {
    showModal("Excluir Conta", "Deseja realmente excluir sua conta? Essa ação não pode ser desfeita.", () => {
        showToast("Conta excluída permanentemente!");
    });
});

// ===============================================
// FUNÇÕES DE PERFIL (Foto e Dados)
// ===============================================

const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const profilePic = document.getElementById('profile-pic');
const photoEditorOverlay = document.querySelector('.photo-editor-overlay');
const photoToEdit = document.getElementById('photo-to-edit');
const zoomSlider = document.getElementById('zoom-slider');
const cancelEdit = document.getElementById('cancel-edit');
const saveEdit = document.getElementById('save-edit');

uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        photoToEdit.src = reader.result;
        zoomSlider.value = 1;
        photoToEdit.style.transform = 'translate(-50%, -50%) scale(1)';
        photoEditorOverlay.classList.add('show');
    };
    reader.readAsDataURL(file);
});

zoomSlider.addEventListener('input', () => {
    const scale = parseFloat(zoomSlider.value);
    photoToEdit.style.transform = `translate(-50%, -50%) scale(${scale})`;
});

cancelEdit.addEventListener('click', () => photoEditorOverlay.classList.remove('show'));
saveEdit.addEventListener('click', () => {
    // Salva a foto no localStorage como Base64 (isso pode ocupar bastante espaço, mas funciona no frontend)
    localStorage.setItem('user_avatar', photoToEdit.src);
    profilePic.src = photoToEdit.src;
    photoEditorOverlay.classList.remove('show');
    showToast("Foto de perfil atualizada!");
});


// 1. FUNÇÃO PARA CARREGAR OS DADOS DO PERFIL
function loadProfileData() {
    // -----------------------------------------------------------------
    // ✅ PASSO 1: LÊ OS DADOS IMUTÁVEIS (Nome e Email) DO SEU CADASTRO
    // -----------------------------------------------------------------
    let currentUserData = JSON.parse(localStorage.getItem('currentUser'));
    
    // -----------------------------------------------------------------
    // ✅ PASSO 2: LÊ OS DADOS MUTÁVEIS (Apelido, etc.) DA CHAVE DE CONFIG
    // -----------------------------------------------------------------
    let profileData = JSON.parse(localStorage.getItem('user_profile_data'));
    
    // Se o usuário não estiver logado (ou não tiver dados), usa o fallback
    if (!currentUserData) {
        currentUserData = { nome: DEFAULT_USER_DATA.fullName, email: DEFAULT_USER_DATA.email };
    }

    // -----------------------------------------------------------------
    // ✅ PASSO 3: CORREÇÃO E INICIALIZAÇÃO DO APELIDO
    // -----------------------------------------------------------------
    let shouldUpdateProfile = false;

    // Se a estrutura de profileData não existe (primeiro acesso)
    if (!profileData) {
        profileData = { nickname: DEFAULT_USER_DATA.nickname, avatarUrl: DEFAULT_USER_DATA.avatarUrl };
        shouldUpdateProfile = true;
    }
    
    // Se o apelido ainda for o valor MOCK que estava salvo, force a correção
    if (profileData.nickname === MOCKED_NICKNAME || profileData.nickname === DEFAULT_USER_DATA.nickname) {
        // Usa o primeiro nome do cadastro como apelido inicial
        const initialNickname = (currentUserData.nome || DEFAULT_USER_DATA.nickname).split(' ')[0];
        profileData.nickname = initialNickname;
        shouldUpdateProfile = true;
    }

    // Salva o objeto atualizado (se houver correção/inicialização)
    if (shouldUpdateProfile) {
        localStorage.setItem('user_profile_data', JSON.stringify(profileData));
    }
    
    // Aplica os dados IMUTÁVEIS (lidos do 'currentUser')
    // O nome do objeto é 'nome', mas o input é 'fullNameInput'
    if (fullNameInput) fullNameInput.value = currentUserData.nome || '';
    if (emailInput) emailInput.value = currentUserData.email || '';
    
    // Aplica o apelido MUTÁVEL (lido/corrigido do 'user_profile_data')
    if (nicknameInput) nicknameInput.value = profileData.nickname || '';

    // Carrega a foto de perfil
    const savedAvatar = localStorage.getItem('user_avatar') || profileData.avatarUrl;
    if (profilePic) profilePic.src = savedAvatar;
}

// 2. FUNÇÃO PARA SALVAR AS ALTERAÇÕES DO PERFIL (apenas o apelido)
function saveProfileChanges() {
    // Carrega a estrutura de dados atual
    let profileData = JSON.parse(localStorage.getItem('user_profile_data'));
    
    if (!profileData) {
        // Se a chave não existir (imprevisto), cria uma nova com os dados padrão.
        profileData = { nickname: DEFAULT_USER_DATA.nickname, avatarUrl: DEFAULT_USER_DATA.avatarUrl };
    }

    if (nicknameInput) {
        // Atualiza APENAS o apelido no objeto
        profileData.nickname = nicknameInput.value.trim();
        
        // Salva o objeto completo (agora com o novo apelido)
        localStorage.setItem('user_profile_data', JSON.stringify(profileData));
        
        showToast("Apelido salvo com sucesso!"); 
    }
}

// 3. EVENT LISTENER ESPECÍFICO PARA O FORMULÁRIO DE PERFIL
profileForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Confirmação via Modal
    showModal(
        "Salvar Perfil", 
        "Deseja salvar as alterações no seu apelido?", 
        () => {
            saveProfileChanges();
        }
    );
});


// ===============================================
// STATUS
// ===============================================

const statusCards = document.querySelectorAll('.status-card');
statusCards.forEach(card => {
    card.addEventListener('click', () => {
        statusCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
    });
});

document.querySelector('.save-status')?.addEventListener('click', () => {
    const activeCard = document.querySelector('.status-card.active');
    if(activeCard) showToast(`Status salvo: ${activeCard.dataset.status}`);
    else showToast("Selecione um status primeiro!");
});


// ===============================================
// NOTIFICAÇÕES
// ===============================================

const playSoundBtn = document.querySelector('.play-btn');
const soundSelect = document.getElementById('sound-select');
let audio = new Audio();

playSoundBtn?.addEventListener('click', () => {
    const selectedSound = soundSelect.value;
    // O áudio.src está como '../Sounds/', verifique se o caminho está correto para o seu projeto.
    audio.src = `../Sounds/${selectedSound}.mp3`; 
    audio.currentTime = 0;
    audio.play().then(() => {
        playSoundBtn.classList.add('active');
    setTimeout(() => playSoundBtn.classList.remove('active'), 400);
    showToast(`Tocando som: ${selectedSound}`);
    }).catch(err => {
        console.error("Erro ao tocar som:", err);
    });
});


// ===============================================
// IDIOMA E REGIÃO (LOCALE)
// ===============================================
const languageSelect = document.getElementById('language-select');
const dateFormatSelect = document.getElementById('date-format-select');
const timeFormatSelect = document.getElementById('time-format-select');
const datetimePreview = document.getElementById('datetime-preview');
const saveLocaleBtn = document.querySelector('.save-locale');

// Função principal de formatação
function formatDateTime(locale, dateFormat, timeFormat) {
    const now = new Date();
    
    let dateLocale = locale; 
    let timeLocale = locale;

    // Configurações de formatação de data
    let dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    
    if (dateFormat === 'yyyy-mm-dd') {
             // Formato ISO: usa um locale neutro para YYYY-MM-DD
             dateLocale = 'sv-SE';
    } else if (dateFormat === 'mm/dd/yyyy') {
        // Formato Americano: força locale en-US
        dateLocale = 'en-US'; 
    }
    // Para 'dd/mm/yyyy', usa o locale do idioma selecionado (pt-BR, es-ES, etc.)

    // Configurações de formatação de hora
    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: timeFormat === '12h' 
    };
    
    // Obter partes formatadas
    const datePart = now.toLocaleDateString(dateLocale, dateOptions);
    const timePart = now.toLocaleTimeString(timeLocale, timeOptions);
    
    return `${datePart} ${timePart}`;
}


// Atualiza a preview e salva as preferências no localStorage
function updateAndSaveLocale() {
    // Garante que os elementos existem antes de tentar acessar .value
    if (!languageSelect || !dateFormatSelect || !timeFormatSelect || !datetimePreview) return;

    const lang = languageSelect.value;
    const dFormat = dateFormatSelect.value;
    const tFormat = timeFormatSelect.value;
    
    // 1. Atualiza a preview
    datetimePreview.textContent = formatDateTime(lang, dFormat, tFormat);
    
    // 2. Salva no localStorage
    localStorage.setItem('user_interface_lang', lang);
    localStorage.setItem('user_date_format', dFormat);
    localStorage.setItem('user_time_format', tFormat);
}


// Carrega as preferências salvas e as aplica ao carregar a página
function loadSavedLocale() {
    if (!languageSelect || !dateFormatSelect || !timeFormatSelect) return;

    // Valores padrão ou os salvos
    const savedLang = localStorage.getItem('user_interface_lang') || 'pt-BR';
    const savedDateFormat = localStorage.getItem('user_date_format') || 'dd/mm/yyyy';
    const savedTimeFormat = localStorage.getItem('user_time_format') || '24h';
    
    // Aplica os valores salvos aos selects
    languageSelect.value = savedLang;
    dateFormatSelect.value = savedDateFormat;
    timeFormatSelect.value = savedTimeFormat;
    
    updateAndSaveLocale(); // Aplica imediatamente após carregar
}


// Event listeners de Mudança
languageSelect?.addEventListener('change', updateAndSaveLocale);
dateFormatSelect?.addEventListener('change', updateAndSaveLocale);
timeFormatSelect?.addEventListener('change', updateAndSaveLocale);

// Event listener para o botão Salvar
saveLocaleBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    updateAndSaveLocale();
    showToast("Preferências de Idioma e Região salvas!");
});


// Inicializa a data/hora, idioma e DADOS DO PERFIL ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    loadSavedLocale();
    loadProfileData(); // ✅ AGORA LÊ AS CHAVES CORRETAS DO CADASTRO
    
    // Atualiza a preview a cada segundo (para dar efeito de relógio)
    // Roda a cada 1000ms (1 segundo) apenas quando a aba 'idioma' estiver ativa.
    setInterval(() => {
        const idiomaSection = document.getElementById('idioma');
        if (idiomaSection && idiomaSection.classList.contains('active')) {
            updateAndSaveLocale();
        }
    }, 1000);
});