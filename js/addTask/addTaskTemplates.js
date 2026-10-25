function getAvatarTemplate(initials, avatarColor) {
  return `<span class="contact-avatar" style="background-color: ${avatarColor}">${initials}</span>`;
}

function getContactOptionTemplate(contact) {
  return `
    <li class="contact-option" data-contact-id="${contact.id}">
      <div class="name-and-initials">
        <span class="contact-avatar" style="background-color: ${getContactColor(contact.id)}">${getUserInitials(contact)}</span>
        <span class="contact-name">${getFullUserName(contact)}</span>
      </div>
      <button class="checked-btn" type="button">
        <img src="../assets/checkbox.svg" alt="checkbox" data-checked="false"/>
      </button>
    </li>`;
}

function getSubtaskItemTemplate(text) {
  return `
    <li class="subtask-list-item">
      <span class="subtask-text">${escapeHtml(text)}</span>
      <div class="subtask-list-buttons">
        <button type="button" class="edit-subtask-item-btn"><img src="../assets/edit-subtask.png" alt="edit subtask item"></button>
        <span class="action-divider"></span>
        <button type="button" class="delete-subtask-item-btn"><img src="../assets/delete-subtask.png" alt="delete subtask item"></button>
      </div>
    </li>`;
}
