
/**
 * Updates the active state of sidebar navigation buttons.
 * @param {string} activePage - The active page identifier.
 * @returns {void} Nothing.
 */
function updateSidebarActiveState(activePage) {
  document.querySelectorAll(".nav-item").forEach((button) => {
    const isActive = button.dataset.page === activePage;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });
}

/**
 * Renders the sidebar navigation and footer links.
 * @param {Array} [items] - Navigation entries.
 * @param {string} activePage - The active page identifier.
 * @returns {void} Nothing.
 */
function renderSidebar(items, activePage) {
  const sidebar = document.getElementById("sidebar-nav");
  const footer = document.querySelector(".sidebar-footer");
  if (!sidebar) return;
  const navItems = items || getNavigationItems();
  if (!sidebar.dataset.initialized) renderSidebarItems(sidebar, navItems);
  if (footer) footer.innerHTML = getFooterItems().map(renderFooterLink).join("");
  updateSidebarActiveState(activePage);
}

/**
 * Returns the configured navigation entries.
 * @returns {Array} The navigation entries.
 */
function getNavigationItems() {
  if (typeof navigationItems !== "undefined") return navigationItems;
  return typeof joinDb !== "undefined" ? joinDb.navigationItems || [] : [];
}

/**
 * Returns the configured footer navigation entries.
 * @returns {Array} The footer entries.
 */
function getFooterItems() {
  if (typeof footerNavigationItems !== "undefined") return footerNavigationItems;
  return typeof joinDb !== "undefined" ? joinDb.footerNavigationItems || [] : [];
}

/**
 * Renders sidebar buttons and attaches their click handlers.
 * @param {HTMLElement} sidebar - The sidebar container.
 * @param {Array} items - The navigation entries.
 * @returns {void} Nothing.
 */
function renderSidebarItems(sidebar, items) {
  sidebar.innerHTML = items.map(renderSidebarItem).join("");
  sidebar.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", handleSidebarNavigation);
  });
  sidebar.dataset.initialized = "true";
}

/**
 * Creates the HTML for a sidebar navigation button.
 * @param {{id: string, label: string, icon: string}} item - A navigation entry.
 * @returns {string} The button HTML.
 */
function renderSidebarItem(item) {
  return `<button class="nav-item" data-page="${item.id}" type="button" aria-label="${item.label}">
    <span class="nav-icon">${item.icon}</span><span>${item.label}</span>
  </button>`;
}

/**
 * Handles clicks on sidebar navigation buttons.
 * @param {MouseEvent} event - The click event.
 * @returns {void} Nothing.
 */
function handleSidebarNavigation(event) {
  const nextPage = event.currentTarget.dataset.page;
  if (!nextPage) return;
  updateSidebarActiveState(nextPage);
  const pageMap = { summary: "help", "add-task": "help", board: "privacy", contacts: "legal" };
  if (pageMap[nextPage]) renderPage(pageMap[nextPage]);
}

/**
 * Creates a footer navigation link.
 * @param {{href: string, label: string}} item - A footer entry.
 * @returns {string} The link HTML.
 */
function renderFooterLink(item) {
  return `<a href="${item.href}">${item.label}</a>`;
}

/**
 * Renders an information section with paragraphs or a numbered list.
 * @param {{heading: string, content: string[]}} section - The section data.
 * @returns {string} The section HTML.
 */
function renderInfoSection(section) {
  const hasList = section.content.some((entry) => /^\d+\./.test(entry));
  const content = hasList
    ? `<ul>${section.content.map(renderListItem).join("")}</ul>`
    : section.content.map(renderParagraph).join("");
  return `<section class="info-section"><h2>${section.heading}</h2>${content}</section>`;
}

/**
 * Creates a list item from a content string.
 * @param {string} text - The list item text.
 * @returns {string} The list item HTML.
 */
function renderListItem(text) {
  return `<li>${text.replace(/^\d+\.\s*/, "")}</li>`;
}

/**
 * Creates a paragraph from a content string.
 * @param {string} text - The paragraph text.
 * @returns {string} The paragraph HTML.
 */
function renderParagraph(text) {
  return `<p>${text}</p>`;
}

/**
 * Renders a complete information page.
 * @param {{title: string, intro: string, sections: Array}} pageData - The page data.
 * @returns {string} The information page HTML.
 */
function renderInfoPage(pageData) {
  const sections = pageData.sections.map(renderInfoSection).join("");
  return `<article class="info-page">
    <header class="info-header"><div class="header-left">
      <div class="header-mark">J</div><h1 class="info-title">${pageData.title}</h1>
    </div><div class="header-badge" aria-label="Info">i</div></header>
    <div class="info-body"><p class="info-intro">${pageData.intro}</p>${sections}</div>
  </article>`;
}

/**
 * Returns the initials of a contact.
 * @param {{name?: string, firstName?: string, lastName?: string, initials?: string}} contact - The contact.
 * @returns {string} The uppercase initials.
 */
function getBoardContactInitials(contact) {
  if (contact.initials) return contact.initials;
  const name = contact.name || `${contact.firstName || ""} ${contact.lastName || ""}`;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length ? `${parts[0][0]}${parts.length > 1 ? parts[parts.length - 1][0] : ""}`.toUpperCase() : "";
}

/**
 * Returns the available contact list.
 * @returns {Array} The contact list.
 */
function getBoardContacts() {
  if (typeof contacts !== "undefined") return contacts;
  return typeof joinDb !== "undefined" ? joinDb.contacts || [] : [];
}

/**
 * Finds a contact by its identifier or initials.
 * @param {string} contactId - The contact identifier.
 * @returns {Object|null} The matching contact or null.
 */
function getContactById(contactId) {
  const contactList = getBoardContacts();
  if (!Array.isArray(contactList)) return null;
  return contactList.find((contact) => String(contact.id) === String(contactId)
    || getBoardContactInitials(contact) === contactId) || null;
}

/**
 * Renders a contact avatar.
 * @param {Object|null} contact - The contact data.
 * @returns {string} The avatar HTML.
 */
function renderAvatar(contact) {
  if (!contact) return "";
  return `<span class="board-contact-avatar" style="background:${contact.color || "transparent"};">${getBoardContactInitials(contact)}</span>`;
}

/**
 * Renders the assigned contact avatars for a task.
 * @param {string[]} assignedIds - The assigned contact identifiers.
 * @returns {string} The avatar container HTML.
 */
function renderAssignedContacts(assignedIds) {
  if (!Array.isArray(assignedIds) || !assignedIds.length) return "";
  const avatars = assignedIds.map(getContactById).filter(Boolean).map(renderAvatar).join("");
  return `<div class="board-assigned-contacts">${avatars}</div>`;
}

/**
 * Returns the icon filename for a task priority.
 * @param {"Urgent"|"Medium"|"Low"} priority - The task priority.
 * @returns {string|undefined} The icon filename.
 */
function getTaskPriorityIcon(priority) {
  const priorityIcons = { Urgent: "priorityUrgent.svg", Medium: "medium.svg", Low: "low.svg" };
  return priorityIcons[priority];
}

/**
 * Calculates task subtask progress.
 * @param {Object} task - The task data.
 * @returns {{width: number, label: string}} The progress width and label.
 */
function getTaskProgress(task) {
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  const completed = subtasks.filter((subtask) => subtask.done).length;
  const width = subtasks.length
    ? Math.round((completed / subtasks.length) * 100)
    : Math.max(0, Math.min(100, task.progress || 0));
  return { width, label: subtasks.length ? `${completed}/${subtasks.length} Subtasks` : `${width}%` };
}

/**
 * Renders the compact board task card.
 * @param {Object} task - The task data.
 * @returns {string} The task card HTML.
 */
function renderTaskCard(task) {
  const assigned = renderAssignedContacts(task.assignedTo || []);
  const priorityIcon = getTaskPriorityIcon(task.priority);
  const progress = getTaskProgress(task);
  return `<article class="board-card board-card--task" data-card-id="${task.id}" draggable="true" aria-label="${task.title}">
    <div class="board-card-header">
      <span class="board-card-badge" style="background:${task.categoryColor};">${task.category}</span>
      ${renderMoveTaskButton()}
    </div>
    <h3 class="board-card-title">${task.title}</h3>
    <p class="board-card-description">${task.description}</p>
    <div class="board-card-progress"><div class="board-progress-bar">
      <span style="width:${progress.width}%"></span>
    </div><span class="board-progress-label">${progress.label}</span></div>
    <div class="board-card-footer">${assigned}${renderPriorityImage(priorityIcon, task.priority)}</div>
  </article>`;
}

/**
 * Renders the mobile task movement button.
 * @returns {string} The button HTML.
 */
function renderMoveTaskButton() {
  return `<button class="board-card-move-button" type="button" aria-label="Move task" aria-haspopup="menu" aria-expanded="false" aria-controls="board-move-menu">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 16V4M4 8l4-4 4 4M16 8v12M12 16l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>`;
}

/**
 * Renders a task priority image when an icon exists.
 * @param {string|undefined} icon - The icon filename.
 * @param {string} priority - The priority label.
 * @returns {string} The image HTML or an empty string.
 */
function renderPriorityImage(icon, priority) {
  return icon ? `<img src="../assets/${icon}" alt="${priority}" class="board-card-priority-icon" />` : "";
}

/**
 * Renders the detailed task modal content.
 * @param {Object} task - The task data.
 * @returns {string} The detail card HTML.
 */
function renderTaskDetail(task) {
  const priorityIcon = getTaskPriorityIcon(task.priority);
  const assigned = (task.assignedTo || []).map(getContactById).filter(Boolean).map(renderDetailAssignee).join("");
  const subtasks = (task.subtasks || []).map(renderDetailSubtask).join("");
  return `<article class="board-detail-card">
    <div class="board-detail-topbar">
      <span class="board-detail-badge" style="background:${task.categoryColor};">${task.category}</span>
      <button class="board-detail-close" type="button" aria-label="Close task">×</button>
    </div>
    <h2 class="board-detail-title">${task.title}</h2><p class="board-detail-description">${task.description}</p>
    <div class="board-detail-content">${renderDetailRow("Due date:", task.dueDate)}
      ${renderDetailPriority(task.priority, priorityIcon)}
      <div class="board-detail-assignees-row"><span class="board-detail-label">Assigned To:</span>
        <div class="board-detail-assignees">${assigned}</div>
      </div>
      <div class="board-detail-subtasks"><h4>Subtasks</h4>${subtasks}</div>
      ${renderDetailActions()}
    </div>
  </article>`;
}

/**
 * Renders a task assignee in the detail view.
 * @param {Object} contact - The contact data.
 * @returns {string} The assignee HTML.
 */
function renderDetailAssignee(contact) {
  return `<div class="board-detail-assignee">${renderAvatar(contact)}<p class="board-detail-assignee-name">${contact.name || `${contact.firstName} ${contact.lastName}`}</p></div>`;
}

/**
 * Renders a subtask checkbox in the detail view.
 * @param {{label: string, done: boolean}} subtask - The subtask data.
 * @param {number} index - The subtask index.
 * @returns {string} The subtask HTML.
 */
function renderDetailSubtask(subtask, index) {
  return `<label class="board-detail-subtask">
    <input type="checkbox" data-subtask-index="${index}" ${subtask.done ? "checked" : ""} />
    <span>${subtask.label}</span>
  </label>`;
}

/**
 * Renders a detail row with a label and value.
 * @param {string} label - The row label.
 * @param {string} value - The row value.
 * @returns {string} The row HTML.
 */
function renderDetailRow(label, value) {
  return `<div class="board-detail-row"><span class="board-detail-label">${label}</span><span class="board-detail-value">${value}</span></div>`;
}

/**
 * Renders the task priority row in the detail view.
 * @param {string} priority - The priority label.
 * @param {string|undefined} icon - The icon filename.
 * @returns {string} The priority row HTML.
 */
function renderDetailPriority(priority, icon) {
  const image = icon ? `<img src="../assets/${icon}" alt="" class="board-detail-priority-icon" />` : "";
  return `<div class="board-detail-row"><span class="board-detail-label">Priority:</span>
    <span class="board-detail-value board-detail-priority">${priority}${image}</span></div>`;
}

/**
 * Renders the delete and edit task actions.
 * @returns {string} The action buttons HTML.
 */
function renderDetailActions() {
  return `<div class="board-detail-actions">
    <button type="button" class="board-detail-button board-detail-button--ghost" data-action="delete-task" aria-label="Delete task">
      <span class="board-detail-button-icon" aria-hidden="true">🗑</span><span class="board-detail-button-text">Delete</span>
    </button>
    <button type="button" class="board-detail-button board-detail-button--primary" data-action="edit-task" aria-label="Edit task">
      <span class="board-detail-button-icon" aria-hidden="true">✎</span><span class="board-detail-button-text">Edit</span>
    </button>
  </div>`;
}
