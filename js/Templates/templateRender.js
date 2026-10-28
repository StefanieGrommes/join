/** @type {Object<string, string>} Maps a sidebar page id to the info page that is shown (placeholder mapping). */
const sidebarPageMap = { summary: 'help', 'add-task': 'help', board: 'privacy', contacts: 'legal' };

/**
 * Marks the sidebar button of the active page.
 * @param {string} activePage - Id of the active page (e.g. "summary").
 * @returns {void}
 */
function updateSidebarActiveState(activePage) {
  document.querySelectorAll('.nav-item').forEach((button) => {
    const isActive = button.dataset.page === activePage;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

/**
 * Handles a click on a sidebar button: highlights it and shows the mapped info page.
 * @param {MouseEvent} event - The click event.
 * @returns {void}
 */
function handleSidebarNavClick(event) {
  const nextPage = event.currentTarget.dataset.page;
  if (!nextPage) return;
  updateSidebarActiveState(nextPage);
  if (sidebarPageMap[nextPage]) renderPage(sidebarPageMap[nextPage]);
}

/**
 * Renders the sidebar buttons once and attaches their click handlers.
 * @param {HTMLElement} sidebar - The sidebar container.
 * @param {Array<{id: string, label: string, icon: string}>} navItems - Navigation entries.
 * @param {string} activePage - Id of the active page.
 * @returns {void}
 */
function buildSidebarButtons(sidebar, navItems, activePage) {
  sidebar.innerHTML = navItems.map((item) => getSidebarButtonTemplate(item, activePage)).join('');
  sidebar.querySelectorAll('.nav-item').forEach((button) => {
    button.addEventListener('click', handleSidebarNavClick);
  });
  sidebar.dataset.initialized = 'true';
}

/**
 * Renders the footer links (Help, Privacy, Legal) of the sidebar.
 * @param {HTMLElement} footer - The sidebar footer container.
 * @returns {void}
 */
function renderSidebarFooter(footer) {
  const links = typeof footerNavigationItems !== 'undefined' ? footerNavigationItems : [];
  footer.innerHTML = links.map((item) => getSidebarFooterLinkTemplate(item)).join('');
}

/**
 * Renders the sidebar navigation (#sidebar-nav) and the footer links (.sidebar-footer).
 * @param {Array<{id: string, label: string, icon: string}>} [items] - Navigation entries; default: navigationItems.
 * @param {string} activePage - Id of the active page.
 * @returns {void}
 */
function renderSidebar(items, activePage) {
  const sidebar = document.getElementById('sidebar-nav');
  const footer = document.querySelector('.sidebar-footer');
  if (!sidebar) return;
  const navItems = items || (typeof navigationItems !== 'undefined' ? navigationItems : []);
  if (!sidebar.dataset.initialized) buildSidebarButtons(sidebar, navItems, activePage);
  if (footer) renderSidebarFooter(footer);
  updateSidebarActiveState(activePage);
}

/**
 * Renders one info page section as list (numbered entries) or as paragraphs.
 * @param {{heading: string, content: string[]}} section - Section from infoPages.
 * @returns {string} HTML string of the section.
 */
function renderInfoSection(section) {
  const hasList = section.content.some((entry) => typeof entry === 'string' && /^(\d+\.)/.test(entry));
  const items = section.content.map((entry) => (hasList ? `<li>${entry}</li>` : `<p>${entry}</p>`)).join('');
  return getInfoSectionTemplate(section.heading, hasList ? `<ul>${items}</ul>` : items);
}

/**
 * Renders a complete info page (Help, Privacy Policy, Legal Notice).
 * @param {{title: string, intro: string, sections: Array}} pageData - Page data from infoPages.
 * @returns {string} HTML string of the page.
 */
function renderInfoPage(pageData) {
  return getInfoPageTemplate(pageData, pageData.sections.map(renderInfoSection).join(''));
}

/**
 * Returns the initials of a contact (e.g. "Anton Mayer" -> "AM").
 * @param {{name: string, initials?: string}} contact - The contact.
 * @returns {string} Initials in upper case.
 */
function getBoardContactInitials(contact) {
  if (contact.initials) return contact.initials;
  const parts = contact.name.trim().split(/\s+/);
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Finds a contact by its id in the localStorage cache.
 * @param {{id: string}|string} ref - Assigned entry ({id}) or plain id.
 * @returns {Object|null} The found contact or null.
 */
function getContactById(ref) {
  const id = typeof ref === 'object' && ref ? ref.id : ref;
  return getSessionData('session-contacts').find((contact) => contact.id === id) || null;
}

/**
 * Renders a round avatar with initials in the contact color.
 * @param {Object|null} contact - Contact from the localStorage cache.
 * @returns {string} HTML string of the avatar, empty if there is no contact.
 */
function renderAvatar(contact) {
  if (!contact) return '';
  return getBoardAvatarTemplate(getContactColor(contact.id), getUserInitials(contact));
}

/**
 * Renders the avatar row of the assigned contacts of a task card.
 * @param {string[]} assignedIds - Contact ids or initials.
 * @returns {string} HTML string with all avatars, empty if nobody is assigned.
 */
function renderAssignedContacts(assignedIds) {
  if (!Array.isArray(assignedIds) || !assignedIds.length) return '';
  const contacts = assignedIds
    .map((contactId) => getContactById(contactId))
    .filter(Boolean);
  const avatars = contacts
    .slice(0, 4)
    .map((contact) => renderAvatar(contact))
    .join('');
  return getAssignedContactsTemplate(avatars, contacts.length);
}

/**
 * Returns the file name of the priority icon in the assets folder.
 * @param {"urgent"|"medium"|"low"} priority - Priority of the task.
 * @returns {string|undefined} File name of the SVG or undefined.
 */
function getTaskPriorityIcon(priority) {
  const priorityIcons = {
    urgent: 'priorityUrgent.svg',
    medium: 'medium.svg',
    low: 'low.svg',
  };
  return priorityIcons[priority];
}

/**
 * Calculates the progress of a task from its subtasks (fallback: task.progress, 0-100).
 * @param {Object} task - Task with optional subtasks and progress.
 * @returns {{percent: number, label: string}} Progress in percent and its label text.
 */
function getSubtaskProgress(task) {
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  const done = subtasks.filter((subtask) => subtask.done).length;
  const fallback = Math.max(0, Math.min(100, task.progress || 0));
  const percent = subtasks.length ? Math.round((done / subtasks.length) * 100) : fallback;
  const label = subtasks.length ? `${done}/${subtasks.length} Subtasks` : `${Math.round(percent)}%`;
  return { percent, label };
}

/**
 * Renders the small task card of a board column (used by renderBoardState in board-layout.js).
 * @param {Object} task - Task from tasks.
 * @returns {string} HTML string of the card.
 */
function renderTaskCard(task) {
  const progress = getSubtaskProgress(task);
  return getTaskCardTemplate(task, {
    assigned: renderAssignedContacts(task.assignedTo || []),
    priorityIcon: getTaskPriorityIcon(task.priority),
    progressWidth: progress.percent,
    progressLabel: progress.label,
  });
}

/**
 * Renders the assignee rows (avatar and full name) of the task detail view.
 * @param {string[]} [assignedIds] - Contact ids or initials.
 * @returns {string} HTML string with all assignee rows.
 */
function renderDetailAssignees(assignedIds) {
  return (assignedIds || [])
    .map((contactId) => getContactById(contactId))
    .filter(Boolean)
    .map((contact) => getDetailAssigneeTemplate(renderAvatar(contact), getFullUserName(contact)))
    .join('');
}

/**
 * Renders the subtask checkboxes of the task detail view.
 * @param {Array<{label: string, done: boolean}>} [subtasks] - The subtasks.
 * @returns {string} HTML string with all subtask checkboxes.
 */
function renderDetailSubtasks(subtasks) {
  return (subtasks || []).map((subtask, index) => getDetailSubtaskTemplate(subtask, index)).join('');
}

/**
 * Renders the large task detail view (used by openDetailModal in board-layout.js).
 * @param {Object} task - Task from tasks.
 * @returns {string} HTML string of the detail card.
 */
function renderTaskDetail(task) {
  return getTaskDetailTemplate(task, {
    priorityIcon: getTaskPriorityIcon(task.priority),
    assigned: renderDetailAssignees(task.assignedTo),
    subtasks: renderDetailSubtasks(task.subtasks),
  });
}

/**
 * Returns label and color of a category.
 * @param {string} category - "TechnicalTask" or "UserStory".
 * @returns {{label: string, color: string}} Display values.
 */
function getCategoryInfo(category) {
  return categoryInfo[category] || { label: category || "", color: "#2d8cff" };
}

/**
 * Escapes text for safe use in HTML.
 * @param {string} text - The raw text.
 * @returns {string} The escaped text.
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text ?? "");
  return div.innerHTML;
}