const categoryInfo = {
  TechnicalTask: { label: "Technical Task", color: "#2bc7b7" },
  UserStory: { label: "User Story", color: "#2d8cff" },
};

function getCategoryInfo(category) {
  return categoryInfo[category] || { label: category || "", color: "#2d8cff" };
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text ?? "");
  return div.innerHTML;
}

function getSidebarButtonTemplate(item, activePage) {
  return `
    <button
      class="nav-item ${item.id === activePage ? 'is-active' : ''}"
      data-page="${item.id}"
      type="button"
      aria-label="${item.label}"
    >
      <span class="nav-icon">${item.icon}</span>
      <span>${item.label}</span>
    </button>
  `;
}

function getSidebarFooterLinkTemplate(item) {
  return `<a href="${item.href}">${item.label}</a>`;
}

function getInfoSectionTemplate(heading, body) {
  return `
    <section class="info-section">
      <h2>${heading}</h2>
      ${body}
    </section>
  `;
}

function getInfoPageTemplate(pageData, sectionsHtml) {
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
        ${sectionsHtml}
      </div>
    </article>
  `;
}

function getBoardAvatarTemplate(color, initials) {
  return `
    <span class="board-contact-avatar" style="background:${color};">
      ${initials}
    </span>
  `;
}

function getAssignedContactsTemplate(avatars) {
  return `<div class="board-assigned-contacts">${avatars}</div>`;
}

function getTaskCardTemplate(task, view) {
  const { assigned, priorityIcon, progressWidth, progressLabel } = view;
  return `
    <article class="board-card board-card--task" data-card-id="${task.id}" draggable="true" aria-label="${escapeHtml(task.title)}">
      <div class="board-card-header">
        <span class="board-card-badge" style="background:${getCategoryInfo(task.category).color};">${getCategoryInfo(task.category).label}</span>
        <button class="board-card-move-button" type="button" aria-label="Move task" aria-haspopup="menu" aria-expanded="false" aria-controls="board-move-menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M8 16V4M4 8l4-4 4 4M16 8v12M12 16l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <h3 class="board-card-title">${escapeHtml(task.title)}</h3>
      <p class="board-card-description">${escapeHtml(task.description)}</p>

      <div class="board-card-progress">
        <div class="board-progress-bar">
          <span style="width:${progressWidth}%"></span>
        </div>
        <span class="board-progress-label">${progressLabel}</span>
      </div>

      <div class="board-card-footer">
        ${assigned}
        ${priorityIcon ? `<img src="../assets/${priorityIcon}" alt="${task.priority}" class="board-card-priority-icon" />` : ''}
      </div>
    </article>
  `;
}

function getDetailAssigneeTemplate(avatarHtml, name) {
  return `
    <div class="board-detail-assignee">
      ${avatarHtml}
      <p class="board-detail-assignee-name">${name}</p>
    </div>
  `;
}

function getDetailSubtaskTemplate(subtask, index) {
  return `
    <label class="board-detail-subtask">
      <input type="checkbox" data-subtask-index="${index}" ${subtask.done ? 'checked' : ''} />
      <span>${escapeHtml(subtask.label)}</span>
    </label>
  `;
}

function getTaskDetailTemplate(task, view) {
  const { priorityIcon, assigned, subtasks } = view;
  return `
    <article class="board-detail-card">
      <div class="board-detail-topbar">
        <span class="board-detail-badge" style="background:${getCategoryInfo(task.category).color};">${getCategoryInfo(task.category).label}</span>
        <button class="board-detail-close" type="button" aria-label="Close task">×</button>
      </div>

      <h2 class="board-detail-title">${escapeHtml(task.title)}</h2>
      <p class="board-detail-description">${escapeHtml(task.description)}</p>

      <div class="board-detail-content">
        <div class="board-detail-row">
          <span class="board-detail-label">Due date:</span>
          <span class="board-detail-value">${task.dueDate}</span>
        </div>

        <div class="board-detail-row">
          <span class="board-detail-label">Priority:</span>
          <span class="board-detail-value board-detail-priority">
            ${task.priority}
            ${priorityIcon ? `<img src="../assets/${priorityIcon}" alt="" class="board-detail-priority-icon" />` : ''}
          </span>
        </div>

        <div class="board-detail-assignees-row">
          <span class="board-detail-label">Assigned To:</span>
          <div class="board-detail-assignees">
            ${assigned}
          </div>
        </div>

        <div class="board-detail-subtasks">
          <h4>Subtasks</h4>
          ${subtasks}
        </div>

        <div class="board-detail-actions">
          <button type="button" class="board-detail-button board-detail-button--ghost" data-action="delete-task" aria-label="Delete task">
            <span class="board-detail-button-icon" aria-hidden="true">🗑</span>
            <span class="board-detail-button-text">Delete</span>
          </button>
          <button type="button" class="board-detail-button board-detail-button--primary" data-action="edit-task" aria-label="Edit task">
            <span class="board-detail-button-icon" aria-hidden="true">✎</span>
            <span class="board-detail-button-text">Edit</span>
          </button>
        </div>
      </div>
    </article>
  `;
}
