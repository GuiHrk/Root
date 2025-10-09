(function(){
  // --------- FUNÇÃO PARA APLICAR TEMA ---------
  function applyThemeKanban(){
    const savedTheme = localStorage.getItem("theme") || "dark";
    const savedColor = localStorage.getItem("color") || "#5C2D91";

    document.documentElement.setAttribute('data-theme', savedTheme);

    document.documentElement.style.setProperty("--primary-start", savedColor);
    document.documentElement.style.setProperty("--primary-end", savedColor);
    document.documentElement.style.setProperty("--primary-light", savedColor+"33");
    document.documentElement.style.setProperty("--primary-hover", savedColor+"40");
    document.documentElement.style.setProperty("--primary-outline", savedColor+"60");
    document.documentElement.style.setProperty("--primary-bg", savedColor+"15");
  }

  applyThemeKanban();

  window.addEventListener('storage', (e)=>{
    if(['theme','color','projects','kanbanProjects'].includes(e.key)){
      applyThemeKanban();
      projects = JSON.parse(localStorage.getItem('kanbanProjects')) || [];
      renderProjects();
      renderTasks();
    }
  });

  // --------- SINCRONIZAÇÃO DE PROJETOS DO DASHBOARD ---------
  const dashboardProjects = JSON.parse(localStorage.getItem('projects')) || [];
  let kanbanProjects = JSON.parse(localStorage.getItem('kanbanProjects')) || [];

  dashboardProjects.forEach(dp => {
    if(!kanbanProjects.find(kp => kp.name === dp.name)){
      kanbanProjects.push({id:'p'+Math.random().toString(36).substring(2,9), name:dp.name, tasks:[], members:dp.members || []});
    }
  });

  localStorage.setItem('kanbanProjects', JSON.stringify(kanbanProjects));
  let projects = kanbanProjects;

  const uid = () => Math.random().toString(36).substring(2,9);
  const activeDashboardProject = JSON.parse(localStorage.getItem('activeProject'));
  let currentProjectId = activeDashboardProject
    ? projects.find(p => p.name === activeDashboardProject.name)?.id || projects[0]?.id
    : localStorage.getItem('currentKanbanProject') || projects[0]?.id;

  // --------- ELEMENTOS DO DOM ---------
  const projectsList = document.getElementById('projects-list');
  const currentProjectName = document.getElementById('current-project-name');
  const workspace = document.getElementById('workspace');
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('toggle-sidebar');

  const btnNewTask = document.getElementById('btn-new-task');
  const modalTask = document.getElementById('modal-task');
  const modalTitle = document.getElementById('modal-task-title');
  const taskTitle = document.getElementById('task-title');
  const taskDesc = document.getElementById('task-desc');
  const taskAssignee = document.getElementById('task-assignee');
  const taskStart = document.getElementById('task-start');
  const taskEnd = document.getElementById('task-end');
  const taskPriority = document.getElementById('task-priority');
  const taskCancelBtn = document.getElementById('task-cancel');
  const taskSaveBtn = document.getElementById('task-save');
  const taskDeleteBtn = document.getElementById('task-delete');

  const modalDelete = document.getElementById('modal-delete');
  const modalDeleteText = document.getElementById('modal-delete-text');
  const deleteConfirmBtn = document.getElementById('delete-confirm');
  const deleteCancelBtn = document.getElementById('delete-cancel');

  // Alert custom
  const modalAlert = document.createElement('div');
  modalAlert.className = 'custom-alert hidden';
  modalAlert.textContent = 'O título da tarefa é obrigatório!';
  document.body.appendChild(modalAlert);

  let editingTask = null;
  let deleteCallback = null;

  // --------- EVENTOS GERAIS ---------
  toggleBtn.addEventListener('click', ()=> sidebar.classList.toggle('collapsed'));
  btnNewTask.addEventListener('click', ()=> openTaskModal());
  taskCancelBtn.addEventListener('click', closeTaskModal);
  deleteCancelBtn.addEventListener('click', ()=> { modalDelete.classList.add('hidden'); deleteCallback=null; });
  deleteConfirmBtn.addEventListener('click', ()=> { if(deleteCallback) deleteCallback(); modalDelete.classList.add('hidden'); deleteCallback=null; saveProjects(); });

  // --------- FUNÇÕES DE MODAIS ---------
  function openDeleteModal(entity, callback){
    modalDeleteText.textContent = `Deseja realmente excluir ${entity}?`;
    deleteCallback = callback;
    modalDelete.classList.remove('hidden');
  }

  function escapeHtml(str){ 
    if(!str) return ''; 
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;'); 
  }

  function getInitials(name){ 
    if(!name) return '?'; 
    return name.split(' ').map(n=>n[0]||'').join('').toUpperCase(); 
  }

  function showAlert(){
    modalAlert.classList.remove('hidden');
    setTimeout(()=> modalAlert.classList.add('hidden'), 2000);
  }

  function openTaskModal(task=null){
    editingTask = task;
    modalTask.classList.remove('hidden');

    // Sincroniza membros do projeto atual no select
    taskAssignee.innerHTML = '<option value="">(sem atribuição)</option>';
    const project = projects.find(p=>p.id===currentProjectId);
    if(project && project.members){
      project.members.forEach(m=>{
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        taskAssignee.appendChild(opt);
      });
    }

    if(task){
      modalTitle.textContent='Editar Tarefa';
      taskTitle.value = task.title || '';
      taskDesc.value = task.desc || '';
      taskStart.value = task.start || '';
      taskEnd.value = task.end || '';
      taskPriority.value = task.priority || 'normal';
      taskAssignee.value = task.assignee || '';
      taskDeleteBtn.style.display='inline-block';
    } else {
      modalTitle.textContent='Nova Tarefa';
      taskTitle.value=''; taskDesc.value=''; taskStart.value=''; taskEnd.value=''; taskPriority.value='normal'; taskAssignee.value='';
      taskDeleteBtn.style.display='none';
    }
  }

  function closeTaskModal(){ 
    modalTask.classList.add('hidden'); 
    editingTask=null; 
  }

  // --------- SALVAR E DELETAR TAREFAS ---------
  taskSaveBtn.addEventListener('click', ()=>{
    const project = projects.find(p=>p.id===currentProjectId);
    if(!project) return;

    if(!taskTitle.value.trim()){
      showAlert(); // alert custom
      taskTitle.focus();
      return;
    }

    if(editingTask){
      Object.assign(editingTask,{
        title:taskTitle.value,
        desc:taskDesc.value,
        start:taskStart.value,
        end:taskEnd.value,
        priority:taskPriority.value,
        assignee:taskAssignee.value
      });
    } else {
      project.tasks.push({
        id:uid(),
        title:taskTitle.value,
        desc:taskDesc.value,
        start:taskStart.value,
        end:taskEnd.value,
        priority:taskPriority.value,
        assignee:taskAssignee.value,
        status:'created'
      });
    }
    closeTaskModal();
    renderTasks();
    saveProjects();
  });

  taskDeleteBtn.addEventListener('click', ()=>{
    openDeleteModal('essa tarefa', ()=>{
      const project = projects.find(p=>p.id===currentProjectId);
      if(project && editingTask){ 
        project.tasks = project.tasks.filter(t=>t!==editingTask); 
        renderTasks(); 
      }
      closeTaskModal();
      saveProjects();
    });
  });

  // --------- RENDERIZAÇÃO DE PROJETOS ---------
  function renderProjects(){
    projectsList.innerHTML='';
    projects.forEach(p=>{
      const li=document.createElement('li');
      li.className='project-item';
      if(p.id===currentProjectId) li.classList.add('active');

      li.innerHTML = `<div class="project-name">${escapeHtml(p.name)}</div>`;

      const delBtn=document.createElement('button');
      delBtn.className='project-del'; delBtn.textContent='✕';
      delBtn.addEventListener('click',(e)=>{
        e.stopPropagation();
        openDeleteModal('este projeto', ()=>{
          projects = projects.filter(pr => pr.id !== p.id);
          const dashboardProjects = JSON.parse(localStorage.getItem('projects')) || [];
          const updatedDashboardProjects = dashboardProjects.filter(dp => dp.name !== p.name);
          localStorage.setItem('projects', JSON.stringify(updatedDashboardProjects));
          localStorage.setItem('kanbanProjects', JSON.stringify(projects));

          if(currentProjectId===p.id) currentProjectId = projects[0] ? projects[0].id : null;
          renderProjects();
          renderTasks();
          saveProjects();
        });
      });

      li.appendChild(delBtn);
      li.addEventListener('click', ()=>{
        currentProjectId = p.id;
        currentProjectName.textContent = p.name;
        localStorage.setItem('currentKanbanProject', currentProjectId);
        renderProjects(); 
        renderTasks();
      });

      projectsList.appendChild(li);
    });

    if(!currentProjectId && projects.length>0){ 
      currentProjectId = projects[0].id; 
      currentProjectName.textContent = projects[0].name; 
    } else if(currentProjectId){
      const activeProj = projects.find(p=>p.id===currentProjectId);
      if(activeProj) currentProjectName.textContent = activeProj.name;
    }
  }

  // --------- RENDERIZAÇÃO DE TAREFAS ---------
  function renderTasks(){
    const lists={
      created:document.getElementById('created-tasks'), 
      'in-progress':document.getElementById('in-progress-tasks'), 
      done:document.getElementById('done-tasks')
    };
    Object.values(lists).forEach(l=>l.innerHTML='');
    const project = projects.find(p=>p.id===currentProjectId);
    if(!project) return;

    project.tasks.forEach(t=>{
      const div=document.createElement('div');
      div.className=`task-card ${t.priority || 'normal'} ${t.status || ''}`;
      div.draggable=true;

      const content=document.createElement('div'); 
      content.className='task-content';
      content.innerHTML=`<strong>${escapeHtml(t.title)}</strong>
                         ${t.desc ? `<span class="desc">${escapeHtml(t.desc)}</span>` : ''}
                         ${t.start || t.end ? `<span class="dates">Início: ${t.start || '-'} | Término: ${t.end || '-'}</span>` : ''}`;

      div.appendChild(content);

      if(t.assignee){
        const resp=document.createElement('div');
        resp.className='responsible';
        resp.textContent=getInitials(t.assignee);
        div.appendChild(resp);
      }

      const del=document.createElement('button');
      del.className='task-del'; del.textContent='✕';
      del.addEventListener('click',(e)=>{
        e.stopPropagation();
        openDeleteModal('essa tarefa', ()=>{
          project.tasks=project.tasks.filter(tt=>tt!==t); 
          renderTasks(); 
          saveProjects();
        });
      });
      div.appendChild(del);

      div.addEventListener('click', ()=>openTaskModal(t));
      div.addEventListener('dragstart', ()=>div.classList.add('dragging'));
      div.addEventListener('dragend', ()=>{
        div.classList.remove('dragging'); 
        renderTasks(); 
        saveProjects();
      });

      lists[t.status || 'created'].appendChild(div);
    });

    Object.entries(lists).forEach(([status,list])=>{
      list.addEventListener('dragover', e=>{
        e.preventDefault();
        list.classList.add('drag-over');
        const dragging=document.querySelector('.dragging');
        const afterElement=getDragAfterElement(list,e.clientY);
        if(afterElement) list.insertBefore(dragging,afterElement); 
        else list.appendChild(dragging);
      });
      list.addEventListener('dragleave', ()=>list.classList.remove('drag-over'));
      list.addEventListener('drop', ()=>{
        list.classList.remove('drag-over');
        const dragging=document.querySelector('.dragging');
        if(!dragging) return;
        const project = projects.find(p=>p.id===currentProjectId);
        const taskObj = project.tasks.find(tt=>tt.title===dragging.querySelector('strong').textContent);
        if(taskObj){
          taskObj.status=status;
          if(status==='done') dragging.classList.add('done');
          else dragging.classList.remove('done');
        }
        saveProjects();
      });
    });
  }

  function getDragAfterElement(container, y){
    const draggableElements=[...container.querySelectorAll('.task-card:not(.dragging)')];
    return draggableElements.reduce((closest,child)=>{
      const box=child.getBoundingClientRect();
      const offset=y-box.top-box.height/2;
      if(offset<0 && offset>closest.offset) return {offset:offset,element:child};
      return closest;
    },{offset:Number.NEGATIVE_INFINITY}).element;
  }

  function saveProjects(){
    localStorage.setItem('kanbanProjects', JSON.stringify(projects));
  }

  // --------- INICIALIZAÇÃO ---------
  renderProjects();
  renderTasks();

})();
