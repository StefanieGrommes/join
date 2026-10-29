const categoryInfo = {
  TechnicalTask: { label: "Technical Task", color: "#2bc7b7" },
  UserStory: { label: "User Story", color: "#2d8cff" },
};

/**
 * Returns the HTML of one sidebar navigation button.
 * @param {{id: string, label: string, icon: string}} item - Navigation entry.
 * @param {string} activePage - Id of the currently active page.
 * @returns {string} HTML string of the button.
 */
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

/**
 * Returns the HTML of one footer link in the sidebar.
 * @param {{href: string, label: string}} item - Footer link entry.
 * @returns {string} HTML string of the link.
 */
function getSidebarFooterLinkTemplate(item) {
  return `<a href="${item.href}">${item.label}</a>`;
}

/**
 * Returns the HTML of one info page section.
 * @param {string} heading - Heading of the section.
 * @param {string} body - Prepared HTML of the section content.
 * @returns {string} HTML string of the section.
 */
function getInfoSectionTemplate(heading, body) {
  return `
    <section class="info-section">
      <h2>${heading}</h2>
      ${body}
    </section>
  `;
}

/**
 * Returns the HTML of a complete info page (Help, Privacy Policy, Legal Notice).
 * @param {{title: string, intro: string}} pageData - Title and intro of the page.
 * @param {string} sectionsHtml - Prepared HTML of all sections.
 * @returns {string} HTML string of the page.
 */
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

/**
 * Returns the HTML of a round board avatar with initials.
 * @param {string} color - Background color of the avatar.
 * @param {string} initials - Initials shown in the avatar.
 * @returns {string} HTML string of the avatar.
 */
function getBoardAvatarTemplate(color, initials) {
  return `
    <span class="board-contact-avatar" style="background:${color};">
      ${initials}
    </span>
  `;
}

/**
 * Returns the HTML container for the avatars of the assigned contacts.
 * @param {string} avatars - Prepared HTML of the visible contact avatars.
 * @param {number} assignedCount - Total number of assigned contacts.
 * @returns {string} HTML string of the container.
 */
function getAssignedContactsTemplate(avatars, assignedCount) {
  const canShowList = assignedCount >= 4;
  const triggerAttributes = canShowList
    ? ` tabindex="0" role="button" aria-expanded="false" aria-label="Show ${assignedCount} assigned contacts"`
    : "";
  const triggerClass = canShowList ? " has-assignee-list" : "";
  const overflowCount = assignedCount > 4
    ? `<span class="board-contact-overflow" aria-hidden="true">+${assignedCount - 4}</span>`
    : "";
  return `<div class="board-assigned-contacts${triggerClass}"${triggerAttributes}>${avatars}${overflowCount}</div>`;
}

/**
 * Returns the HTML of the small task card of a board column.
 * @param {Object} task - Task with id, title, description, category and categoryColor.
 * @param {{assigned: string, priorityIcon: (string|undefined), progressWidth: number, progressLabel: string}} view - Prepared display values.
 * @returns {string} HTML string of the card.
 */
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

/**
 * Returns the HTML of one assignee row in the task detail view.
 * @param {string} avatarHtml - Prepared HTML of the avatar.
 * @param {string} name - Full name of the contact.
 * @returns {string} HTML string of the row.
 */
function getDetailAssigneeTemplate(avatarHtml, name) {
  return `
    <div class="board-detail-assignee">
      ${avatarHtml}
      <p class="board-detail-assignee-name">${name}</p>
    </div>
  `;
}

/**
 * Returns the HTML of one subtask checkbox in the task detail view.
 * @param {{label: string, done: boolean}} subtask - The subtask.
 * @param {number} index - Index of the subtask (read as data-subtask-index).
 * @returns {string} HTML string of the checkbox.
 */
function getDetailSubtaskTemplate(subtask, index) {
  return `
    <label class="board-detail-subtask">
      <input type="checkbox" data-subtask-index="${index}" ${subtask.done ? 'checked' : ''} />
      <span>${escapeHtml(subtask.label)}</span>
    </label>
  `;
}

/**
 * Returns the HTML of the large task detail card.
 * @param {Object} task - Task with title, description, category, categoryColor, dueDate and priority.
 * @param {{priorityIcon: (string|undefined), assigned: string, subtasks: string}} view - Prepared display values.
 * @returns {string} HTML string of the detail card.
 */
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

/**
 * Builds the HTML for the detail view of a contact.
 * @param {Object} contact - Contact with id, firstName, lastName, email and phone
 * @returns {string} HTML string of the detail view
 */
function getContactDetailTemplate(contact) {
  return ` <div class="contact-detail">
      <div
        class="contact-avatar-large"
        style="background-color: ${getContactColor(contact.id)}"
      >
        ${getInitials(contact.firstName, contact.lastName)}
      </div>
      <div class="contact-detail-head">
        <p class="contact-detail-name">${getContactDisplayName(contact)}</p>
        <div class="contact-detail-actions">
          <button class="detail-action-btn" onclick="openEditDialog('${contact.id}')">
            <img class="icon-edit" src="../assets/edit.svg" alt="" /> Edit
          </button>
         ${getContactDeleteButtonTemplate(contact)}
        </div>
      </div>
    </div>
    <p class="section-label">Contact Information</p>
    <div class="contact-detail-field">
      <p class="detail-label">Email</p>
      <a href="mailto:${contact.email}" class="contact-email">${contact.email}</a>
    </div>
    <div class="contact-detail-field">
      <p class="detail-label">Phone</p>
      <p>${contact.phone}</p>
    </div>
    <button class="detail-menu-btn" onclick="toggleDetailMenu()">
      <img src="../assets/more-vert.svg" alt="More options" />
    </button>
    <div class="detail-menu" id="detailMenu">
      <button class="detail-action-btn" onclick="openEditDialog('${contact.id}')">
        <img class="icon-edit" src="../assets/edit.svg" alt="" />Edit
      </button>
      ${getContactDeleteButtonTemplate(contact)}
    </div>`;
}

/**
 * Returns the delete button of the contact detail view, empty for the own contact.
 * @param {Object} contact - Contact with id.
 * @returns {string} HTML string of the button or an empty string.
 */
function getContactDeleteButtonTemplate(contact) {
  if (isOwnContact(contact.id)) return "";
  return `
    <button class="detail-action-btn" onclick="deleteContact('${contact.id}')">
      <img class="icon-delete" src="../assets/delete.svg" alt="" /> Delete
    </button>`;
}

/**
 * Builds the HTML for a single contact in the list.
 * @param {Object} contact - Contact with id, firstName, lastName and email
 * @returns {string} HTML string of the list item
 */
function getContactTemplate(contact) {
  return `
    <li class="contact-item" data-id="${contact.id}" onclick="openContactDetail('${contact.id}', this)">
      <div class="contact-avatar" style="background-color: ${getContactColor(contact.id)}">${getInitials(contact.firstName, contact.lastName)}</div>
      <div class="contact-info">
        <p class="contact-name">${getContactDisplayName(contact)}</p>
        <p class="contact-email">${contact.email}</p>
      </div>
    </li>`;
}

/**
 * Builds an image if logged in as guest.
 * @returns {string} HTML string of the image item
 */
function displayGuestImage() {
  return `<img src="../assets/contact-guest-img.svg" alt="Guest Image" />`;
}

/**
 * Builds a large image of the Avatar.
 * @param {Object} contact - Contact with id, firstName, lastName and email
 * @returns {string} HTML string of the large image including Initials and individuals color.
 */
function displayDialogAvatar(contact) {
  return `<div class="contact-avatar-large" style="background-color: ${getContactColor(contact.id)}">${getInitials(contact.firstName, contact.lastName)}
          </div>`;
}

/**
 * Builds an alphabetic list for each letter and fills it with the contacts sorted by their last name.
 * @param {string} letter - first letter of lastName
 * @returns {string} HTML string of one letter
 */
function displayContactGroupTemplate(letter, items) {
return `<div class="contact-group">
           <p class="group-letter">${letter}</p>
          <ul class="contact-list">${items}</ul>
        </div>`;
}


