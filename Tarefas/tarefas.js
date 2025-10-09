(function() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"))?.nome || "Usuário Padrão";

    let dashboardProjects = JSON.parse(localStorage.getItem('projects')) || [];
    let kanbanProjects = JSON.parse(localStorage.getItem('kanbanProjects')) || [];

    // Sincroniza projetos do dashboard com kanbanProjects
    dashboardProjects.forEach(dp => {
        if (!kanbanProjects.find(kp => kp.name === dp.name)) {
            kanbanProjects.push({
                id: 'p' + Math.random().toString(36).substring(2, 9),
                name: dp.name,
                tasks: dp.tasks || [],
                members: dp.members || []
            });
        }
    });

    localStorage.setItem('kanbanProjects', JSON.stringify(kanbanProjects));
    let projects = kanbanProjects;
    let currentProjectId = localStorage.getItem('currentKanbanProject') || projects[0]?.id;

    const projectsList = document.getElementById('projects-list');
    const currentProjectName = document.getElementById('current-project-name');
    const filterBtns = document.querySelectorAll(".filter-btn");
    const tasksContainer = document.getElementById('tasks-container');

    let currentStatusFilter = "created";

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function normalizeText(str) {
        return (str || "").toLowerCase().trim();
    }

    // Aplica tema salvo do dashboard
    function applyThemeFromDashboard() {
        const savedTheme = localStorage.getItem("theme") || "dark";
        const savedColor = localStorage.getItem("color") || "#6a3be2"; // cor principal do tema

        if (savedTheme === "light") {
            document.documentElement.style.setProperty("--bg", "#F5F5F5");
            document.documentElement.style.setProperty("--panel", "#EAEAEA");
            document.documentElement.style.setProperty("--muted", "rgba(0,0,0,0.6)");
            document.documentElement.style.setProperty("--text-color", "#1A112F");
            document.body.classList.add('light-mode');
        } else {
            document.documentElement.style.setProperty("--bg", "#0f0b16");
            document.documentElement.style.setProperty("--panel", "#1a122b");
            document.documentElement.style.setProperty("--muted", "rgba(255,255,255,0.6)");
            document.documentElement.style.setProperty("--text-color", "#eaeaf2");
            document.body.classList.remove('light-mode');
        }

        // Atualiza cores do tema
        document.documentElement.style.setProperty("--purple-1", savedColor);
        document.documentElement.style.setProperty("--purple-2", savedColor);
        document.documentElement.style.setProperty("--accent", `linear-gradient(135deg, ${savedColor}, ${savedColor})`);
        document.documentElement.style.setProperty("--hover-color", savedColor); // hover segue o tema

        // Atualiza sidebar ativa
        document.querySelectorAll('.project-item.active').forEach(el => {
            el.style.background = `linear-gradient(135deg, ${savedColor}, ${savedColor})`;
        });

        // cores fixas das prioridades
        document.documentElement.style.setProperty("--priority-low", "#4da6ff");
        document.documentElement.style.setProperty("--priority-normal", "#ffc107");
        document.documentElement.style.setProperty("--priority-high", "#ff4d4d");
    }

    applyThemeFromDashboard();

    function renderProjects() {
        projectsList.innerHTML = '';
        projects.forEach(p => {
            const li = document.createElement('li');
            li.className = 'project-item';
            if (p.id === currentProjectId) li.classList.add('active');
            li.textContent = escapeHtml(p.name);
            li.addEventListener('click', () => {
                currentProjectId = p.id;
                localStorage.setItem('currentKanbanProject', currentProjectId);
                renderProjects();
                renderTasks();
            });
            projectsList.appendChild(li);
        });

        const activeProj = projects.find(p => p.id === currentProjectId);
        if (activeProj) currentProjectName.textContent = activeProj.name;

        // Atualiza sidebar ativa para seguir tema
        const savedColor = localStorage.getItem("color") || "#6a3be2";
        document.querySelectorAll('.project-item.active').forEach(el => {
            el.style.background = `linear-gradient(135deg, ${savedColor}, ${savedColor})`;
        });
    }

    function renderTasks() {
        tasksContainer.innerHTML = '';
        const project = projects.find(p => p.id === currentProjectId);
        if (!project) return;

        const filteredTasks = (project.tasks || []).filter(t => {
            let taskUser = typeof t.assignee === "string" ? t.assignee : t.assignee?.nome || "";
            const assigneeMatch = normalizeText(taskUser) === normalizeText(currentUser);
            const statusMatch = normalizeText(t.status) === normalizeText(currentStatusFilter);
            return assigneeMatch && statusMatch;
        });

        if (filteredTasks.length === 0) {
            tasksContainer.innerHTML = `<p class="no-tasks">Nenhuma tarefa nesta categoria.</p>`;
            return;
        }

        filteredTasks.forEach((t, i) => {
            const card = document.createElement('div');
            card.className = 'task-card';

            const priorityText = escapeHtml(t.priority);
            const priorityLower = t.priority?.toLowerCase() || 'normal';

            // pega a cor correta da prioridade
            const priorityColor = getComputedStyle(document.documentElement)
                .getPropertyValue(`--priority-${priorityLower}`)
                .trim() || '#888';

            card.innerHTML = `
                <div class="task-title">${escapeHtml(t.title)}</div>
                <div class="task-desc">${escapeHtml(t.desc)}</div>
                <div class="task-meta">
                    <span class="task-priority">${priorityText}</span>
                    <span class="task-assignee">${typeof t.assignee === "object" ? escapeHtml(t.assignee?.nome) : escapeHtml(t.assignee)}</span>
                </div>
            `;

            // aplica a cor da prioridade
            card.querySelector('.task-priority').style.backgroundColor = priorityColor;

            tasksContainer.appendChild(card);

            setTimeout(() => {
                requestAnimationFrame(() => card.classList.add('show'));
            }, i * 100);
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStatusFilter = btn.dataset.status;
            renderTasks();
        });
    });

    window.addEventListener('storage', () => {
        projects = JSON.parse(localStorage.getItem('kanbanProjects')) || [];
        currentProjectId = localStorage.getItem('currentKanbanProject') || projects[0]?.id;
        renderProjects();
        renderTasks();
        applyThemeFromDashboard();
    });

    renderProjects();
    renderTasks();
})();
