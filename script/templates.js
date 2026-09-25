// ==========================================
// TEMPLATE LAYER / TEMPLATE-RENDERING
// ==========================================
// Diese Datei ist die Render-Schicht der App.
// Sie nimmt Daten aus db.js und erzeugt daraus HTML mit Template-Literals.
//
// Reiner Ablauf:
// 1. db.js liefert Daten
// 2. templates.js formatiert sie als HTML
// 3. board-layout.js oder andere JS-Dateien hängen das HTML in das DOM
//
// Damit bleibt die Trennung sauber:
// - DB = Daten
// - templates.js = Darstellung
// - script.js / board-layout.js = Logik und DOM-Aktualisierung
// ==========================================

// ===============================
// Templates für die einzelnen Seiten
// Hier werden die HTML-Templates zentral definiert,
// damit Help, Privacy Policy und Legal Notice mit derselben Struktur funktionieren.
// ===============================

function updateSidebarActiveState(activePage) {
  document.querySelectorAll('.nav-item').forEach((button) => {
    const isActive = button.dataset.page === activePage;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

function renderSidebar(items, activePage) {
  const sidebar = document.getElementById('sidebar-nav');
  const footer = document.querySelector('.sidebar-footer');

  if (!sidebar) return;

  const navItems = items || (typeof navigationItems !== 'undefined' ? navigationItems : (joinDb?.navigationItems || []));

  if (!sidebar.dataset.initialized) {
    sidebar.innerHTML = navItems
      .map(
        (item) => `
          <button
            class="nav-item ${item.id === activePage ? 'is-active' : ''}"
            data-page="${item.id}"
            type="button"
            aria-label="${item.label}"
          >
            <span class="nav-icon">${item.icon}</span>
            <span>${item.label}</span>
          </button>
        `
      )
      .join('');

    sidebar.querySelectorAll('.nav-item').forEach((button) => {
      button.addEventListener('click', (event) => {
        const nextPage = event.currentTarget.dataset.page;
        if (!nextPage) return;

        updateSidebarActiveState(nextPage);

        if (nextPage === 'summary') {
          renderPage('help');
        } else if (nextPage === 'add-task') {
          renderPage('help');
        } else if (nextPage === 'board') {
          renderPage('privacy');
        } else if (nextPage === 'contacts') {
          renderPage('legal');
        }
      });
    });

    sidebar.dataset.initialized = 'true';
  }

  if (footer) {
    footer.innerHTML = (typeof footerNavigationItems !== 'undefined' ? footerNavigationItems : (joinDb?.footerNavigationItems || []))
      .map(
        (item) => `
          <a href="${item.href}">${item.label}</a>
        `
      )
      .join('');
  }

  updateSidebarActiveState(activePage);
}

function renderInfoSection(section) {
  const paragraphs = section.content
    .map((paragraph) => {
      if (typeof paragraph === 'string' && paragraph.startsWith('1.') || paragraph.startsWith('2.') || paragraph.startsWith('3.') || paragraph.startsWith('4.')) {
        return `<li>${paragraph}</li>`;
      }
      return `<p>${paragraph}</p>`;
    })
    .join('');

  const listMarkup = section.content.some((entry) => typeof entry === 'string' && /^(\d+\.)/.test(entry))
    ? `<ul>${section.content.map((entry) => `<li>${entry}</li>`).join('')}</ul>`
    : '';

  return `
    <section class="info-section">
      <h2>${section.heading}</h2>
      ${listMarkup || paragraphs}
    </section>
  `;
}

function renderInfoPage(pageData) {
  return `
    <article class="info-page">
      <header class="info-header">
        <div class="header-left">
          <div class="header-mark">J</div>
          <h1 class="info-title">${pageData.title}</h1>
        </div>
        <div class="header-badge" aria-label="Info">i</div>
      </header>

      <div class="info-body">
        <p class="info-intro">${pageData.intro}</p>
        ${pageData.sections.map(renderInfoSection).join('')}
      </div>
    </article>
  `;
}

// ===============================
// Kontakt-Helper
// Diese Funktionen lesen die Kontakte aus db.js und
// wandeln sie für die Karten-Renderung in kleine Avatar-Elemente um.
// ===============================
function getContactById(contactId) {
  const contactList = typeof contacts !== 'undefined' ? contacts : (joinDb?.contacts || []);
  if (!Array.isArray(contactList)) return null;
  return contactList.find((contact) => contact.id === contactId) || null;
}

function renderAvatar(contact) {
  if (!contact) return '';

  return `
    <span class="board-contact-avatar" style="background:${contact.color};">
      ${contact.initials}
    </span>
  `;
}

function renderAssignedContacts(assignedIds) {
  if (!Array.isArray(assignedIds) || !assignedIds.length) return '';

  const avatars = assignedIds
    .map((contactId) => getContactById(contactId))
    .filter(Boolean)
    .map((contact) => renderAvatar(contact))
    .join('');

  return `<div class="board-assigned-contacts">${avatars}</div>`;
}

// ===============================
// Standard-Karte für ein Board-Task
// Diese Funktion erzeugt die kleine Task-Karte wie im Board.
// Sie wird in board-layout.js bzw. beim Rendern des Boards verwendet.
// ===============================
function renderTaskCard(task) {
  const assigned = renderAssignedContacts(task.assignedTo || []);
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  const doneSubtasks = subtasks.filter((subtask) => subtask.done).length;
  const totalSubtasks = subtasks.length;
  const progressWidth = totalSubtasks
    ? Math.round((doneSubtasks / totalSubtasks) * 100)
    : Math.max(0, Math.min(100, task.progress || 0));
  const progressLabel = totalSubtasks
    ? `${doneSubtasks}/${totalSubtasks} Subtasks`
    : `${Math.round(progressWidth)}%`;

  return `
    <article class="board-card board-card--task" data-card-id="${task.id}" draggable="true" aria-label="${task.title}">

      <div class="board-card-header">
        <span class="board-card-badge" style="background:${task.categoryColor};">${task.category}</span>
      </div>



      <h3 class="board-card-title">${task.title}</h3>

      <p class="board-card-description">${task.description}</p>


      
      <div class="board-card-progress">
        <div class="board-progress-bar">
          <span style="width:${progressWidth}%"></span>
        </div>
        <span class="board-progress-label">${progressLabel}</span>
      </div>

      <div class="board-card-footer">
        ${assigned}
      </div>




    </article>
  `;
}

// ===============================
// Große Detail-Karte
// Diese Funktion rendert die ausführliche Task-Karte mit:
// Titel, Beschreibung, Fälligkeitsdatum, Priorität,
// Assignees und Subtasks.
// ===============================
function renderTaskDetail(task) {
  const assigned = (task.assignedTo || [])
    .map((contactId) => getContactById(contactId))
    .filter(Boolean)
    .map((contact) => `
      <div class="board-detail-assignee">
        ${renderAvatar(contact)}
        <span>${contact.name}</span>
      </div>
    `)
    .join('');

  const subtasks = (task.subtasks || [])
    .map((subtask) => `
      <label class="board-detail-subtask">
        <input type="checkbox" ${subtask.done ? 'checked' : ''} />
        <span>${subtask.label}</span>
      </label>
    `)
    .join('');

  return `
    <article class="board-detail-card">




      <div class="board-detail-topbar">
        <span class="board-detail-badge" style="background:${task.categoryColor};">${task.category}</span>
        <button class="board-detail-close" type="button" aria-label="Close task">×</button>
      </div>


      <h2 class="board-detail-title">${task.title}</h2>

      <p class="board-detail-description">${task.description}</p>



  <div class="board-detail-content">
      <div class="board-detail-row">
        <span class="board-detail-label">Due date:</span>
        <span class="board-detail-value">${task.dueDate}</span>
      </div>

      <div class="board-detail-row">
        <span class="board-detail-label">Priority:</span>
        <span class="board-detail-value board-detail-priority" style="color:${task.priorityColor};">
          ${task.priority}
        </span>
      </div>

      <div class="board-detail-row board-detail-assignees-row">
        <span class="board-detail-label">Assigned To:</span>
        <div class="board-detail-assignees">${assigned}</div>
      </div>

      <div class="board-detail-subtasks">
        <h4>Subtasks</h4>
        ${subtasks}
      </div>

      <div class="board-detail-actions">
        <button type="button" class="board-detail-button board-detail-button--ghost" aria-label="Delete task">
          <span class="board-detail-button-icon" aria-hidden="true">🗑</span>
          <span class="board-detail-button-text">Delete</span>
        </button>
        <button type="button" class="board-detail-button board-detail-button--primary" aria-label="Edit task">
          <span class="board-detail-button-icon" aria-hidden="true">✎</span>
          <span class="board-detail-button-text">Edit</span>
        </button>
      </div>



  </div>
    </article>
  `;
}

