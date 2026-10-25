const sidebarPageMap = { summary: 'help', 'add-task': 'help', board: 'privacy', contacts: 'legal' };

function updateSidebarActiveState(activePage) {
  document.querySelectorAll('.nav-item').forEach((button) => {
    const isActive = button.dataset.page === activePage;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

function handleSidebarNavClick(event) {
  const nextPage = event.currentTarget.dataset.page;
  if (!nextPage) return;
  updateSidebarActiveState(nextPage);
  if (sidebarPageMap[nextPage]) renderPage(sidebarPageMap[nextPage]);
}

function buildSidebarButtons(sidebar, navItems, activePage) {
  sidebar.innerHTML = navItems.map((item) => getSidebarButtonTemplate(item, activePage)).join('');
  sidebar.querySelectorAll('.nav-item').forEach((button) => {
    button.addEventListener('click', handleSidebarNavClick);
  });
  sidebar.dataset.initialized = 'true';
}

function renderSidebarFooter(footer) {
  const links = typeof footerNavigationItems !== 'undefined' ? footerNavigationItems : [];
  footer.innerHTML = links.map((item) => getSidebarFooterLinkTemplate(item)).join('');
}

function renderSidebar(items, activePage) {
  const sidebar = document.getElementById('sidebar-nav');
  const footer = document.querySelector('.sidebar-footer');
  if (!sidebar) return;
  const navItems = items || (typeof navigationItems !== 'undefined' ? navigationItems : []);
  if (!sidebar.dataset.initialized) buildSidebarButtons(sidebar, navItems, activePage);
  if (footer) renderSidebarFooter(footer);
  updateSidebarActiveState(activePage);
}

function renderInfoSection(section) {
  const hasList = section.content.some((entry) => typeof entry === 'string' && /^(\d+\.)/.test(entry));
  const items = section.content.map((entry) => (hasList ? `<li>${entry}</li>` : `<p>${entry}</p>`)).join('');
  return getInfoSectionTemplate(section.heading, hasList ? `<ul>${items}</ul>` : items);
}

function renderInfoPage(pageData) {
  return getInfoPageTemplate(pageData, pageData.sections.map(renderInfoSection).join(''));
}

function getBoardContactInitials(contact) {
  if (contact.initials) return contact.initials;
  const parts = contact.name.trim().split(/\s+/);
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getContactById(ref) {
  const id = typeof ref === 'object' && ref ? ref.id : ref;
  return getSessionData('session-contacts').find((contact) => contact.id === id) || null;
}

function renderAvatar(contact) {
  if (!contact) return '';
  return getBoardAvatarTemplate(getContactColor(contact.id), getUserInitials(contact));
}

function renderAssignedContacts(assignedIds) {
  if (!Array.isArray(assignedIds) || !assignedIds.length) return '';
  const avatars = assignedIds
    .map((contactId) => getContactById(contactId))
    .filter(Boolean)
    .map((contact) => renderAvatar(contact))
    .join('');
  return getAssignedContactsTemplate(avatars);
}

function getTaskPriorityIcon(priority) {
  const priorityIcons = {
    urgent: 'priorityUrgent.svg',
    medium: 'medium.svg',
    low: 'low.svg',
  };
  return priorityIcons[priority];
}

function getSubtaskProgress(task) {
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  const done = subtasks.filter((subtask) => subtask.done).length;
  const fallback = Math.max(0, Math.min(100, task.progress || 0));
  const percent = subtasks.length ? Math.round((done / subtasks.length) * 100) : fallback;
  const label = subtasks.length ? `${done}/${subtasks.length} Subtasks` : `${Math.round(percent)}%`;
  return { percent, label };
}

function renderTaskCard(task) {
  const progress = getSubtaskProgress(task);
  return getTaskCardTemplate(task, {
    assigned: renderAssignedContacts(task.assignedTo || []),
    priorityIcon: getTaskPriorityIcon(task.priority),
    progressWidth: progress.percent,
    progressLabel: progress.label,
  });
}

function renderDetailAssignees(assignedIds) {
  return (assignedIds || [])
    .map((contactId) => getContactById(contactId))
    .filter(Boolean)
    .map((contact) => getDetailAssigneeTemplate(renderAvatar(contact), getFullUserName(contact)))
    .join('');
}

function renderDetailSubtasks(subtasks) {
  return (subtasks || []).map((subtask, index) => getDetailSubtaskTemplate(subtask, index)).join('');
}

function renderTaskDetail(task) {
  return getTaskDetailTemplate(task, {
    priorityIcon: getTaskPriorityIcon(task.priority),
    assigned: renderDetailAssignees(task.assignedTo),
    subtasks: renderDetailSubtasks(task.subtasks),
  });
}
