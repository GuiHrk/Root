// --------- VARIÁVEIS GLOBAIS ----------
const body = document.body;

// Painel de temas
const openPanel = document.getElementById("openThemePanel");
const closePanel = document.getElementById("closeThemePanel");
const themePanel = document.getElementById("themePanel");
const themeSlider = document.getElementById("themeSlider");
const defaultThemeColor = "#5C2D91";

// Chat
const openChatBtn = document.getElementById('openChatButton');
const chatTargetPage = '../Chat-Folder/telachat.html'; 

// Projetos
const openProjectsBtn = document.getElementById("openProjects");
const closeProjectsModal = document.getElementById("closeProjectsModal");
const projectsModal = document.getElementById("projectsModal");
const createProjectBtn = document.getElementById("createProjectBtn");
const createProjectModal = document.getElementById("createProjectModal");
const closeCreateProjectModal = document.getElementById("closeCreateProjectModal");
const saveProjectBtn = document.getElementById("saveProjectBtn");
const newProjectName = document.getElementById("newProjectName");
const projectsList = document.getElementById("projectsList");

// Configurações
const openSettingsBtn = document.getElementById("openSettings");

// Gráficos
const ctx1 = document.getElementById("activityChart").getContext("2d");
const ctx2 = document.getElementById("progressChart").getContext("2d");

let activityChart = new Chart(ctx1, {
    type: 'bar',
    data: {
        labels:['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'],
        datasets:[{label:'Tarefas Concluídas', data:[12,19,8,15,10,14,7], backgroundColor: defaultThemeColor}]
    },
    options:{responsive:true, plugins:{legend:{display:false}}}
});

let progressChart = new Chart(ctx2, {
    type: 'line',
    data: {
        labels:['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'],
        datasets:[{
            label:'Progresso',
            data:[5,7,8,10,9,11,12],
            fill:true,
            backgroundColor: defaultThemeColor + "33",
            borderColor: defaultThemeColor,
            tension:0.3
        }]
    },
    options:{responsive:true, plugins:{legend:{display:false}}}
});

// --------- FUNÇÃO AUXILIAR: ATUALIZA CORES DOS GRÁFICOS ----------
function updateChartsColors(){
    const color = getComputedStyle(document.documentElement).getPropertyValue("--btn-cta-start").trim();

    activityChart.data.datasets[0].backgroundColor = color;
    activityChart.update();

    progressChart.data.datasets[0].borderColor = color;
    progressChart.data.datasets[0].backgroundColor = color + "33";
    progressChart.update();
}

// --------- PAINEL DE TEMAS ----------
openPanel.addEventListener("click", ()=> themePanel.classList.add("active"));
closePanel.addEventListener("click", ()=> themePanel.classList.remove("active"));

themeSlider.addEventListener("click", ()=>{
    const current = localStorage.getItem("theme") || "dark";
    const newTheme = current === "light" ? "dark" : "light";
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
});

// Seleção de cor do tema
document.querySelectorAll(".color-box").forEach(box => {
    box.addEventListener("click", ()=>{
        if(box.dataset.default){
            document.documentElement.style.setProperty("--btn-cta-start", defaultThemeColor);
            document.documentElement.style.setProperty("--btn-cta-end", defaultThemeColor);
            localStorage.removeItem("color");
        } else {
            let color = box.getAttribute("data-color");
            document.documentElement.style.setProperty("--btn-cta-start", color);
            document.documentElement.style.setProperty("--btn-cta-end", color);
            localStorage.setItem("color", color);
        }
        updateChartsColors();
    });
});

// Aplica o tema
function applyTheme(theme){
    if(theme==="light"){
        document.documentElement.style.setProperty("--bg-color", "#F5F5F5");
        document.documentElement.style.setProperty("--text-color", "#1A112F");
        document.documentElement.style.setProperty("--card-bg", "#EAEAEA");
        document.documentElement.style.setProperty("--card-hover", "#D1D1D1");
        themeSlider.classList.add("active");
    } else {
        document.documentElement.style.setProperty("--bg-color", "#1A112F");
        document.documentElement.style.setProperty("--text-color", "#F5F5F5");
        document.documentElement.style.setProperty("--card-bg", "#2a1a4c");
        document.documentElement.style.setProperty("--card-hover", "#3e2670");
        themeSlider.classList.remove("active");
    }
    updateChartsColors();
}

// --------- USUÁRIO ----------
const userSpan = document.querySelector(".username");
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if(currentUser && currentUser.nome){
    const firstName = currentUser.nome.split(" ")[0];
    userSpan.textContent = `Olá, ${firstName}`;
    const initials = currentUser.nome.split(" ")[0][0] + (currentUser.nome.split(" ")[1]?currentUser.nome.split(" ")[1][0]:"");
    const avatar = document.createElement("div");
    avatar.classList.add("user-avatar");
    avatar.textContent = initials.toUpperCase();
    userSpan.parentElement.insertBefore(avatar,userSpan);
}

// --------- MODAL DE PROJETOS ----------
function updateProjectsList(){
    const projects = JSON.parse(localStorage.getItem("projects")) || [];
    projectsList.innerHTML = "";

    if(projects.length === 0){
        const emptyMsg = document.createElement("p");
        emptyMsg.textContent = "Nenhum projeto encontrado.";
        emptyMsg.style.textAlign = "center";
        projectsList.appendChild(emptyMsg);
        return;
    }

    projects.forEach((project, idx)=>{
        const card = document.createElement("div");
        card.classList.add("project-card");

        const nameSpan = document.createElement("span");
        nameSpan.textContent = project.name;

        const actionsDiv = document.createElement("div");
        actionsDiv.classList.add("project-actions");

        // Botão Abrir Projeto (direciona para a tela de Tarefas/Kanban)
        const openBtn = document.createElement("button");
        openBtn.textContent = "Abrir"; // CORRIGIDO: Agora é apenas 'Abrir'
        openBtn.classList.add("open-btn");
        openBtn.addEventListener("click", ()=> {
            localStorage.setItem("activeProject", JSON.stringify(project));
            window.location.href = "../Project/project.html"; 
        });

        // O Botão Chat (antiga 'bomba') FOI REMOVIDO DESTA PARTE!
        
        // Botão Apagar
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Apagar";
        deleteBtn.classList.add("delete-btn");
        deleteBtn.addEventListener("click", ()=>{
            let projs = JSON.parse(localStorage.getItem("projects")) || [];
            projs.splice(idx,1);
            localStorage.setItem("projects", JSON.stringify(projs));

            // Remove do Kanban também
            let kanbanProjects = JSON.parse(localStorage.getItem("kanbanProjects")) || [];
            kanbanProjects = kanbanProjects.filter(kp => kp.name !== project.name);
            localStorage.setItem("kanbanProjects", JSON.stringify(kanbanProjects));

            const active = JSON.parse(localStorage.getItem("activeProject"));
            if(active && active.name === project.name){
                localStorage.removeItem("activeProject");
            }
            updateProjectsList();
        });

        actionsDiv.appendChild(openBtn);
        // actionsDiv.appendChild(chatBtn); <-- Removido!
        actionsDiv.appendChild(deleteBtn);
        card.appendChild(nameSpan);
        card.appendChild(actionsDiv);

        projectsList.appendChild(card);
    });
}

// Abrir/fechar modais
openProjectsBtn.addEventListener("click", ()=> {
    projectsModal.classList.add("active");
    updateProjectsList();
});
closeProjectsModal.addEventListener("click", ()=> projectsModal.classList.remove("active"));
createProjectBtn.addEventListener("click", ()=> {
    projectsModal.classList.remove("active");
    createProjectModal.classList.add("active");
    newProjectName.value = "";
    // Limpar campo de membros
    if(!document.getElementById("newProjectMembers")){
        const membersInput = document.createElement("input");
        membersInput.type = "text";
        membersInput.id = "newProjectMembers";
        membersInput.placeholder = "Adicionar membros (separe por vírgulas)";
        membersInput.style.marginTop = "10px";
        createProjectModal.querySelector(".modal-body").appendChild(membersInput);
    } else {
        document.getElementById("newProjectMembers").value = "";
    }
});
closeCreateProjectModal.addEventListener("click", ()=> createProjectModal.classList.remove("active"));
saveProjectBtn.addEventListener("click", ()=>{
    const name = newProjectName.value.trim();
    const membersInput = document.getElementById("newProjectMembers");
    const members = membersInput ? membersInput.value.split(",").map(m=>m.trim()).filter(m=>m) : [];
    if(name){
        const projs = JSON.parse(localStorage.getItem("projects")) || [];
        projs.push({name, members});
        localStorage.setItem("projects", JSON.stringify(projs));
        createProjectModal.classList.remove("active");
        projectsModal.classList.add("active");
        updateProjectsList();
    } else {
        alert("Digite um nome válido para o projeto.");
    }
});

// --------- INTEGRAÇÃO CHAT GERAL ----------
if (openChatBtn) {
    openChatBtn.addEventListener('click', () => {
        // Define 'false' para que a tela do chat abra na conversa padrão (ex: a última ativa ou 'Matheus.David')
        localStorage.setItem('initial_chat_key_from_dashboard', 'false'); 
        
        // Redireciona para a tela do chat
        window.location.href = chatTargetPage;
    });
}

// --------- INTEGRAÇÃO COM TELA DE TAREFAS/KANBAN ----------
function setupTasksCard(){
    const cards = document.querySelectorAll('.cards-container .card');
    cards.forEach(card => {
        const title = card.querySelector('h3')?.textContent.trim();
        if(title === "Minhas Tarefas"){
            const btn = card.querySelector('button');
            btn.addEventListener('click', () => {
                const activeProject = localStorage.getItem('currentKanbanProject') || null;
                if(activeProject){
                    localStorage.setItem('activeProject', JSON.stringify({id: activeProject}));
                }
                window.location.href = "../Tarefas/tarefas.html"; 
            });
        }
    });
}
setupTasksCard();

// --------- INTEGRAÇÃO COM TELA DE CONFIGURAÇÕES ----------
openSettingsBtn.addEventListener("click", () => {
    window.location.href = "../Settings-folder/settings.html"
})


// --------- INICIALIZAÇÃO DE TEMA E COR ----------
const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);
const savedColor = localStorage.getItem("color");
if(savedColor){
    document.documentElement.style.setProperty("--btn-cta-start", savedColor);
    document.documentElement.style.setProperty("--btn-cta-end", savedColor);
    updateChartsColors();
}