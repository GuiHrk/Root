
// ==============================================================================
// === VARIÁVEIS DE ESTADO GLOBAL E UTILITÁRIOS ===
// ==============================================================================

const root = document.documentElement;
const STATUS_KEY = 'user_current_status'; 
const DEFAULT_AVATAR_URL = "images/default-avatar.png"; 

// ==============================================================================
// === UTILS (ESCOPO GLOBAL) ===
// ==============================================================================

/**
 * Função utilitária para obter as iniciais de um nome.
 */
function getInitials(fullName, max = 2){
    if(!fullName) return '';
    let cleanName = fullName.replace(/#|🔒|\s+/g, ' ').trim();
    // LOGGED_USER ainda não está definido aqui, mas garantimos o comportamento
    if (cleanName === 'Você') cleanName = 'Thiago Souza'; 
    
    const parts = cleanName.split(' ').filter(p => p.length > 0);
    if(parts.length === 1) return parts[0].substring(0, max).toUpperCase();
    return (parts[0][0] + (parts[parts.length - 1][0] || '')).substring(0, max).toUpperCase();
}


/**
 * Função utilitária para obter o primeiro caractere de um nome.
 */
function getInitialChar(fullName){
    if(!fullName) return '';
    const cleanName = fullName.replace(/#|🔒|\s+/g, ' ').trim();
    return cleanName[0].toUpperCase();
}


/**
 * Função utilitária para escapar HTML.
 */
function escapeHtml(unsafe) {
    return unsafe
           .replace(/&/g, "&amp;")
           .replace(/</g, "&lt;")
           .replace(/>/g, "&gt;")
           .replace(/"/g, "&quot;")
           .replace(/'/g, "&#039;");
}

/**
 * Função utilitária para formatar texto (Markdown para HTML).
 */
function formatText(text) {
    let formatted = escapeHtml(text);
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
    return formatted;
}


// ==============================================================================
// === FUNÇÕES DE TEMA E COR (GLOBAL) ===
// ==============================================================================

/**
 * Função auxiliar para escurecer uma cor hexadecimal.
 */
function darkenHex(hex, percent) {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    r = parseInt(r * (100 - percent) / 100);
    g = parseInt(g * (100 - percent) / 100);
    b = parseInt(b * (100 - percent) / 100);

    r = (r < 0) ? 0 : r;
    g = (g < 0) ? 0 : g;
    b = (b < 0) ? 0 : b;

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}


/**
 * Aplica o tema e a cor de destaque (primária) ao componente de Chat.
 */
window.updateChatTheme = function(theme, primaryColor) {
    const chatApp = document.querySelector('.chat-app');
    const rootElement = document.documentElement; 

    if (!chatApp) {
        console.error("Elemento '.chat-app' não encontrado. Não é possível aplicar o tema.");
        return;
    }

    // 1. Aplica a classe do tema
    if (theme === 'light') {
        chatApp.classList.add('light-theme');
        chatApp.classList.remove('dark-theme');
    } else { // Padrão é dark
        chatApp.classList.remove('light-theme');
        chatApp.classList.add('dark-theme');
    }

    // 2. Aplica a cor de destaque personalizada
    if (primaryColor && primaryColor.startsWith('#')) {
        rootElement.style.setProperty('--cor-primaria', primaryColor);
        
        const percentToDarken = theme === 'light' ? 10 : 25;
        const darkerColor = darkenHex(primaryColor, percentToDarken);
        rootElement.style.setProperty('--cor-primaria-escura', darkerColor);
    }
    
    // Garante que o cabeçalho do chat, que pode usar cores, seja atualizado
    if (typeof window.updateChatHeader === 'function' && window.currentConversation) {
        window.updateChatHeader(window.currentConversation);
    }
    
    console.log(`Tema do Chat atualizado para: ${theme} com cor: ${primaryColor}`);
}

// ------------------------------------------------------------------------------
// FUNÇÕES DE PERFIL/STATUS (Carregar e Salvar)
// ------------------------------------------------------------------------------


/**
 * Atualiza o ícone de status no perfil do usuário logado e salva no localStorage.
 */
function updateProfileStatus(newStatus) {
    // AJUSTE 2/3: Adiciona a classe 'profile-status-icon' no HTML
    const icon = document.querySelector('.profile-status-icon');
    const myDmStatusDot = document.querySelector('.dm-user[data-user-name="Thiago Souza"] .status-indicator');
    
    const statusClasses = ['dot-green', 'dot-yellow', 'dot-red', 'dot-gray'];

    if (icon) {
        icon.classList.remove(...statusClasses);
        icon.classList.add(`dot-${newStatus}`);
    }
    
    // Se o seu perfil estiver listado na DM, atualiza o status lá também
    if(myDmStatusDot) {
        myDmStatusDot.classList.remove(...statusClasses);
        myDmStatusDot.classList.add(`dot-${newStatus}`);
    }

    localStorage.setItem(STATUS_KEY, newStatus);
    window.currentStatus = newStatus; // Atualiza o estado interno
    
    // AJUSTE: Atualiza o cabeçalho do chat se a DM do próprio usuário estiver aberta
    if (window.currentConversation === 'Thiago Souza' && typeof window.updateChatHeader === 'function') {
        window.userConversations['Thiago Souza'].dotClass = `dot-${newStatus}`;
        window.updateChatHeader('Thiago Souza');
    }
}

/**
 * Carrega o status salvo no localStorage ao iniciar a tela.
 */
function loadSavedStatus() {
    const savedStatus = localStorage.getItem(STATUS_KEY) || 'green'; // Padrão 'Disponível'
    updateProfileStatus(savedStatus);
}


/**
 * Carrega a foto de perfil salva no localStorage ou exibe a inicial como fallback.
 */
function loadUserAvatar() {
    const profilePicImg = document.getElementById('profile-pic-img'); 
    const initialsText = document.querySelector('#current-user-avatar .initials-text'); 
    
    // 1. Carrega dados do usuário (para o nome, apelido e inicial)
    const userData = JSON.parse(localStorage.getItem('currentUser')) || { nome: 'Thiago Souza' };
    const userProfileData = JSON.parse(localStorage.getItem('user_profile_data')) || { nickname: 'Thiago Souza' };
    
    const fullName = userData.nome;
    
    // 2. Tenta carregar a foto (prioridade)
    const savedAvatar = localStorage.getItem('user_avatar');
    
    // 3. Aplica o nome/apelido
    const profileNameSpan = document.querySelector('.profile-name');
    const displayNickname = userProfileData.nickname === 'Thiago Souza' ? 'Você' : userProfileData.nickname;
    if (profileNameSpan) profileNameSpan.textContent = displayNickname; 

    // 4. Aplica a lógica da imagem na sidebar
    if (profilePicImg && initialsText) {
        initialsText.textContent = getInitials(fullName, 2); 
        
        if (savedAvatar && savedAvatar !== DEFAULT_AVATAR_URL && savedAvatar !== " ") { 
            // Exibe a foto
            profilePicImg.src = savedAvatar;
            profilePicImg.style.display = 'block'; 
            initialsText.style.display = 'none';
        } else {
            // Exibe a inicial (fallback)
            initialsText.style.display = 'flex'; 
            profilePicImg.style.display = 'none';
        }
    }
}


// ==============================================================================
// ========================= CÓDIGO DO CHAT (DOMContentLoaded) ===================
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // === DOM ===
    const chatApp = document.querySelector('.chat-app'); 
    const chatHeaderInitials = document.querySelector('.header-initials');
    const chatHeaderTitle = document.querySelector('.channel-title');
    const messagesContainer = document.querySelector('.messages-container');
    const sendButton = document.getElementById('send-btn');
    const inputField = document.getElementById('message-input');
    const userProfile = document.querySelector('.user-profile-status');
    
    // DOM do Input de Arquivo
    const fileInput = document.getElementById('file-input');
    
    // Modais
    const emojiModal = document.getElementById('emoji-modal');
    const createChannelModal = document.getElementById('create-channel-modal');
    const statusModal = document.getElementById('status-modal');
    // Variáveis DOM para Exclusão
    const deleteChannelModal = document.getElementById('delete-channel-modal');
    const deleteDmModal = document.getElementById('delete-dm-modal');
    const confirmDeleteChannelBtn = document.getElementById('confirm-delete-channel');
    const confirmDeleteDmBtn = document.getElementById('confirm-delete-dm');
    const channelNameToDelete = document.getElementById('channel-name-to-delete');
    const dmNameToDelete = document.getElementById('dm-name-to-delete');
    
    // Triggers
    const emojiTrigger = document.getElementById('emoji-trigger');
    const emojiGrid = document.querySelector('.emoji-grid');
    const addChannelButton = document.querySelector('.add-new');
    const createChannelSubmit = document.getElementById('create-channel-submit');
    const settingsIcon = document.querySelector('.settings-icon');
    const statusList = document.querySelector('.status-list');
    const toolbarIcons = document.querySelectorAll('.toolbar i');


    // === ESTADO INTERNO ===
    const LOGGED_USER = { name: 'Thiago Souza', displayLabel: 'Você', avatar: 'avatar.jpg' };
    
    // Mapeamento de Status
    const STATUS_LABELS = {
        'green': 'Disponível',
        'yellow': 'Ausente',
        'red': 'Ocupado',
        'gray': 'Offline' 
    };

    // Simulação do estado das conversas
    const userConversations = {
        '#geral': { status: '20 membros online', dotClass: '', avatar: 'placeholder.jpg' },
        '#ti-agriltech': { status: '5 membros online', dotClass: '', avatar: 'placeholder.jpg' },
        'Matheus.David': { status: 'Disponível', dotClass: 'dot-green', avatar: 'avatar_matheus.jpg' },
        'Silas Nova': { status: 'Ausente', dotClass: 'dot-yellow', avatar: 'avatar_silas.jpg' },
        'Thiago Souza': { status: 'Disponível', dotClass: 'dot-green', avatar: 'avatar.jpg' } // DM do próprio usuário
    };
    
    // Simulação do histórico de mensagens
    const conversationHistory = {
        'Matheus.David': [
            { type: 'received', sender: 'Matheus.David', text: 'Bom dia! Você já **revisou** o PR?', time: '09:30'},
            { type: 'sent', sender: 'Thiago Souza', text: 'Bom dia! Em 10 *minutos* está ok.', time: '09:35'},
        ],
        '#geral': [
            { type: 'received', sender: 'Silas Nova', text: 'Lembrem-se da reunião de alinhamento às 14h! Veja o [link](https://meeting.com).', time: '13:00'},
        ],
        '#ti-agriltech': []
    };

    let currentConversation = 'Matheus.David';
    window.currentStatus = localStorage.getItem(STATUS_KEY) || 'green'; 
    const statusCycle = { green: 'yellow', yellow: 'red', red: 'gray', gray: 'green' }; 
    let itemToDelete = null; 
    
    // Expõe para funções globais, se necessário, mas tente usar no escopo local
    window.currentConversation = currentConversation;
    window.userConversations = userConversations; // Exposto para a função de status


    // === UTILS ===
    function openModal(modal){ modal.classList.add('open'); }
    function closeModal(modal){ modal.classList.remove('open'); }

    // Função para aplicar formatação Markdown ao input 
    function applyFormat(startTag, endTag) {
        const input = inputField;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const currentValue = input.value;

        let newCursorPos;
        let newText;

        if (start === end) {
            newText = currentValue.substring(0, start) + startTag + endTag + currentValue.substring(end);
            newCursorPos = start + startTag.length;
        } else {
            const selectedText = currentValue.substring(start, end);
            newText = currentValue.substring(0, start) + startTag + selectedText + endTag + currentValue.substring(end);
            newCursorPos = end + startTag.length + endTag.length;
        }

        input.value = newText;
        input.setSelectionRange(newCursorPos, newCursorPos);
        input.focus();
    }
    
    
    // FUNÇÃO: Atualiza o cabeçalho do chat (TORNADA GLOBAL)
    // AJUSTE 1/3: Implementa a lógica para exibir a foto de perfil do usuário logado na DM consigo mesmo.
    window.updateChatHeader = function(key) { 
        const userData = userConversations[key] || { status: '', dotClass: '', avatar: 'placeholder.jpg' };
        
        const isDM = !key.startsWith('#') && !key.startsWith('🔒');
        const isCurrentUserDM = key === LOGGED_USER.name; // Novo: Verifica se é a DM do próprio usuário
        
        // Controla a visibilidade do Avatar Grande do Cabeçalho
        const headerPicImg = document.getElementById('header-contact-pic');
        const headerInitialsText = chatHeaderInitials.querySelector('.initials-text');

        if (isDM) {
            chatHeaderInitials.style.visibility = 'visible';
            
            if (isCurrentUserDM) {
                 // Lógica para o Avatar do PRÓPRIO Usuário (ITEM 5)
                const savedAvatar = localStorage.getItem('user_avatar');
                
                if (savedAvatar && savedAvatar !== DEFAULT_AVATAR_URL && savedAvatar !== " ") { 
                    headerPicImg.src = savedAvatar;
                    headerPicImg.style.display = 'block'; 
                    headerInitialsText.style.display = 'none';
                } else {
                    // Fallback para Inicial
                    headerInitialsText.textContent = getInitials(key, 2); 
                    headerPicImg.style.display = 'none'; 
                    headerInitialsText.style.display = 'flex'; 
                }
            } else {
                // Lógica para Outros Contatos DM
                headerInitialsText.textContent = getInitials(key, 2); 
                headerPicImg.style.display = 'none'; 
                headerInitialsText.style.display = 'flex'; 
            }

        } else {
            chatHeaderInitials.style.visibility = 'hidden';
        }
        
        inputField.placeholder = `Envie uma mensagem para ${key}`;
        currentConversation = key;
        window.currentConversation = currentConversation; 
        messagesContainer.innerHTML = '';

        chatHeaderTitle.innerHTML = '';
        const titleText = document.createElement('h3');
        titleText.textContent = key;
        chatHeaderTitle.appendChild(titleText);
        
        // Adiciona status no cabeçalho se for DM
        if (isDM && userData.dotClass) {
            const statusDot = document.createElement('span');
            statusDot.className = `status-dot-header status-indicator ${userData.dotClass}`;
            
            const statusText = document.createElement('span');
            statusText.className = 'header-status-text';
            const statusKey = userData.dotClass.replace('dot-', '');
            statusText.textContent = STATUS_LABELS[statusKey] || '';
            
            chatHeaderTitle.appendChild(statusDot);
            chatHeaderTitle.appendChild(statusText);
        }
        
        // Renderiza as mensagens
        const messages = conversationHistory[key] || [];
        if (messages.length > 0) {
            messages.forEach(msg => {
                const type = (msg.sender === LOGGED_USER.name) ? 'sent' : 'received';
                addMessage(msg.text, type, msg.sender, 'user-initials-placeholder', msg.time);
            });
        } else {
            addMessage(`Você entrou em ${key}. Início da conversa.`, 'received', 'Sistema', 'placeholder.jpg');
        }
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }


    // FUNÇÃO: Adiciona mensagem
    function addMessage(text, type = 'sent', senderName = LOGGED_USER.name, senderAvatar = 'user-initials-placeholder', fixedTime = null) {
        const time = fixedTime || new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
        const displayLabel = (senderName === LOGGED_USER.name) ? LOGGED_USER.displayLabel : senderName;
        const initialChar = getInitialChar(senderName);
        
        const avatarHtml = `<div class="message-avatar">${initialChar}</div>`;

        const formattedText = formatText(text);

        const newMessageRow = document.createElement('div');
        newMessageRow.classList.add('message-row', type);
        
        newMessageRow.innerHTML = `
            ${avatarHtml}
            <div class="message-content-wrapper">
                <div class="message-header">${displayLabel}</div>
                <div class="message-body">${formattedText}<span class="time">${time}</span></div>
            </div>
        `;

        messagesContainer.appendChild(newMessageRow);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }


    // --- LÓGICA DE EXCLUSÃO (Não alterada) ---
    function setupDeleteListeners() {
        document.querySelectorAll('.delete-icon').forEach(icon => {
            icon.removeEventListener('click', handleDeleteClick);
        });

        document.querySelectorAll('.delete-icon').forEach(icon => {
            icon.addEventListener('click', handleDeleteClick);
        });
    }

    function handleDeleteClick(e) {
        e.stopPropagation(); 
        
        const navItem = e.target.closest('.nav-item');
        const type = e.target.dataset.type; 
        
        const name = navItem.dataset.channel || navItem.dataset.userName || navItem.querySelector('.nav-text').textContent.trim();
        
        itemToDelete = navItem; 

        if (type === 'channel') {
            channelNameToDelete.textContent = name;
            openModal(deleteChannelModal);
        } else if (type === 'dm') {
            dmNameToDelete.textContent = name;
            openModal(deleteDmModal);
        }
    }

    confirmDeleteChannelBtn.addEventListener('click', () => {
        if (itemToDelete) {
            const fullName = itemToDelete.dataset.channel;

            const wasActive = itemToDelete.classList.contains('active');
            itemToDelete.remove();
            
            delete userConversations[fullName];
            delete conversationHistory[fullName];
            
            if (wasActive || currentConversation === fullName) {
                document.querySelector('.nav-item[data-channel="#geral"]').click();
            }

            itemToDelete = null;
            closeModal(deleteChannelModal);
        }
    });

    confirmDeleteDmBtn.addEventListener('click', () => {
        if (itemToDelete) {
            const fullName = itemToDelete.dataset.userName;

            const wasActive = itemToDelete.classList.contains('active');
            itemToDelete.remove();
            
            delete userConversations[fullName];

            if (wasActive || currentConversation === fullName) {
                document.querySelector('.nav-item[data-channel="#geral"]').click();
            }

            itemToDelete = null;
            closeModal(deleteDmModal);
        }
    });


    // --- LISTENERS GERAIS ---

    // AJUSTE 3/3: Remove a lógica de fechar pelo botão e deixa apenas a de clicar fora
    // document.querySelectorAll('.close-modal-btn').forEach(btn => {
    //     btn.addEventListener('click', (e) => closeModal(e.target.closest('.modal-overlay')));
    // });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target.classList.contains('modal-overlay')) closeModal(modal);
        });
    });

    // ENVIO DE MENSAGEM (Não alterado)
    sendButton.addEventListener('click', () => {
        const text = inputField.value.trim();
        if (!text) return;
        
        addMessage(text, 'sent', LOGGED_USER.name, 'user-initials-placeholder');
        
        if (!conversationHistory[currentConversation]) {
            conversationHistory[currentConversation] = [];
        }
        conversationHistory[currentConversation].push({
            type: 'sent',
            sender: LOGGED_USER.name,
            text: text,
            time: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})
        });
        
        inputField.value = '';
        inputField.focus();

        // Resposta automática de teste (simples)
        if (currentConversation.startsWith('#') === false) {
             setTimeout(() => {
                 const senderName = currentConversation;
                 const botText = `Ok. Recebi sua mensagem: "${text.replace(/\*\*|\*|`/g, '').substring(0, 15)}...".`;
                 addMessage(botText, 'received', senderName, 'user-initials-placeholder');
                 
                 conversationHistory[currentConversation].push({
                     type: 'received',
                     sender: senderName,
                     text: botText,
                     time: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})
                 });
             }, 800);
        }
    });


    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendButton.click();
        }
    });
    
    // --- Lógica de listeners de conversas (Não alterado) ---
    function handleConversationClick() {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active'); 

        const userName = this.dataset.userName;
        const channelName = this.dataset.channel;
        const display = userName || channelName || this.querySelector('.nav-text').textContent.trim();

        window.updateChatHeader(display);
    }
    
    function setupSingleConversationListener(item) {
        if (item.classList.contains('add-new')) {
            item.removeEventListener('click', handleConversationClick); 
            item.addEventListener('click', (e) => { 
                e.preventDefault();
                e.stopPropagation(); 
                openModal(createChannelModal); 
            });
            return;
        }
        
        item.removeEventListener('click', handleConversationClick); 
        item.addEventListener('click', handleConversationClick);
    }

    function setupAllConversationListeners() {
        document.querySelectorAll('.nav-item').forEach(setupSingleConversationListener);
        setupDeleteListeners(); 
    }
    
    // --- LÓGICA DO BOTÃO DE ANEXO REAL (Não alterado) ---
    fileInput.addEventListener('change', () => {
        const icon = document.querySelector('.toolbar i.fa-paperclip');
        icon.classList.remove('active');
        
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileName = file.name;
            const fileSize = (file.size / 1024 / 1024).toFixed(2);
            
            const attachmentMessage = ` [Anexo: **${fileName}** (${fileSize}MB)] `;
            
            inputField.value += attachmentMessage;
            fileInput.value = '';
            inputField.focus();
        }
    });
    
    // FUNCIONALIDADE: Ativação visual e funcional dos botões da Toolbar (Não alterada)
    toolbarIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const isFormattingButton = ['fa-bold', 'fa-italic', 'fa-code'].some(cls => icon.classList.contains(cls));
            
            if (isFormattingButton) {
                
                const isActiveBeforeToggle = icon.classList.contains('active');
                
                icon.classList.toggle('active');

                const input = inputField;
                const hasSelection = input.selectionStart !== input.selectionEnd;
                
                // Aplica a formatação se: 
                // 1. O botão ACABOU de ser ativado (!isActiveBeforeToggle é true)
                // OU
                // 2. Há texto SELECIONADO (permite aplicar em uma seleção, mesmo que já ativo/inativo)
                if (!isActiveBeforeToggle || hasSelection) { 
                    let startTag, endTag;
                    if (icon.classList.contains('fa-bold')) {
                        startTag = '**'; endTag = '**';
                    } else if (icon.classList.contains('fa-italic')) {
                        startTag = '*'; endTag = '*';
                    } else if (icon.classList.contains('fa-code')) {
                        startTag = '`'; endTag = '`';
                    }
                    
                    applyFormat(startTag, endTag);
                } 
                
            } else if (icon.classList.contains('fa-link')) {
                icon.classList.add('active');
                
                const url = prompt("Insira o URL do link:");
                if (url) {
                    const linkText = prompt("Insira o texto a ser exibido (opcional):") || url;
                    inputField.value += ` [${linkText}](${url}) `;
                    inputField.focus();
                }
                
                setTimeout(() => icon.classList.remove('active'), 200);

            } else if (icon.classList.contains('fa-paperclip')) {
                icon.classList.add('active');
                fileInput.click();

            } else if (icon.id === 'emoji-trigger') {
                openModal(emojiModal);
            }
            
            if (!icon.classList.contains('fa-paperclip') && !icon.classList.contains('fa-bold') && !icon.classList.contains('fa-italic') && !icon.classList.contains('fa-code')) {
                inputField.focus();
            }
        });
    });


    // === MODAL EMOJI (Não alterado) ===
    emojiTrigger.addEventListener('click', () => openModal(emojiModal));
    emojiGrid.addEventListener('click', e => {
        if (e.target.tagName === 'SPAN') {
            inputField.value += e.target.textContent;
            closeModal(emojiModal);
            inputField.focus();
        }
    });

    // === MODAL CRIAR CANAL (Não alterado) ===
    createChannelSubmit.addEventListener('click', () => {
        const name = document.getElementById('channel-name').value.trim();
        const type = document.getElementById('channel-type').value;
        if (!name) return;

        const prefix = type === 'public' ? '#' : '🔒';
        const iconClass = type === 'public' ? 'fa-hashtag' : 'fa-lock';
        const cleanNameForData = `${prefix}${name.toLowerCase().replace(/\s+/g, '-')}`; 
        
        const channelList = document.querySelector('.channel-list');
        const newChannel = document.createElement('li');
        newChannel.classList.add('nav-item');
        newChannel.dataset.channel = cleanNameForData;
        
        newChannel.innerHTML = `
            <i class="fas ${iconClass}"></i>
            <span class="nav-text">${name}</span>
            <i class="fas fa-times delete-icon" data-type="channel"></i>
        `;

        channelList.insertBefore(newChannel, addChannelButton);

        userConversations[cleanNameForData] = { status: '0 membros online', dotClass: '', avatar: 'placeholder.jpg' };
        conversationHistory[cleanNameForData] = [];

        document.getElementById('channel-name').value = '';
        document.getElementById('channel-type').value = 'public';
        closeModal(createChannelModal);
        
        setupSingleConversationListener(newChannel);
        setupDeleteListeners();

        newChannel.click(); 
    });


    // === MODAL STATUS (Não alterado) ===
    function applyStatus(newStatus) {
        updateProfileStatus(newStatus); 
        
        // Esta lógica já está dentro de updateProfileStatus agora.
        // if (currentConversation === 'Thiago Souza') {
        //     userConversations['Thiago Souza'].dotClass = `dot-${newStatus}`; 
        //     window.updateChatHeader(currentConversation);
        // }
    }
    
    // Abre o modal de status
    settingsIcon.addEventListener('click', () => {
        document.querySelectorAll('.status-list li').forEach(li => li.style.fontWeight = '400');
        const currentLi = document.querySelector(`.status-list li[data-status="${window.currentStatus}"]`); 
        if(currentLi) currentLi.style.fontWeight = '600';

        openModal(statusModal);
    });

    // Mudar status ao clicar na lista do modal
    statusList.addEventListener('click', e => {
        const li = e.target.closest('li');
        if (!li || !li.dataset.status) return;
        
        applyStatus(li.dataset.status);
        closeModal(statusModal);
    });

    // Clique rápido no perfil para ciclar status
    userProfile.addEventListener('click', (e) => {
        // Certifica-se de que o clique não foi no ícone de engrenagem
        if (e.target.closest('.settings-icon')) {
             return; 
        }
        
        const nextStatus = statusCycle[window.currentStatus];
        applyStatus(nextStatus);
    });

    // === INICIALIZAÇÃO GERAL (Não alterado) ===
    
    if (typeof window.updateChatTheme === 'function') {
        const savedTheme = localStorage.getItem('theme') || 'dark'; 
        const savedColor = localStorage.getItem('color') || '#a855f7'; 
        window.updateChatTheme(savedTheme, savedColor);
    }
    
    loadSavedStatus();
    loadUserAvatar();

    setupAllConversationListeners();
    
    const initialKeyFromDashboard = localStorage.getItem('initial_chat_key_from_dashboard');
    let conversationToOpen = currentConversation; 

    if (initialKeyFromDashboard && initialKeyFromDashboard !== 'false') {
        conversationToOpen = initialKeyFromDashboard;
        localStorage.removeItem('initial_chat_key_from_dashboard'); 
    }
    
    const initialConversationItem = document.querySelector(
        `.nav-item[data-user-name="${conversationToOpen}"], .nav-item[data-channel="${conversationToOpen}"]`
    );

    if (initialConversationItem) {
        initialConversationItem.classList.add('active');
        window.updateChatHeader(conversationToOpen); 
    } else {
        const defaultDm = document.querySelector('.nav-item.dm-user[data-user-name="Matheus.David"]');
        const fallbackChannel = document.querySelector('.nav-item[data-channel="#geral"]');

        if (defaultDm) {
            defaultDm.classList.add('active');
            window.updateChatHeader('Matheus.David');
        } else if (fallbackChannel) {
            fallbackChannel.classList.add('active');
            window.updateChatHeader('#geral');
        }
    }
});
