/**
 * Returns the HTML of a round contact avatar.
 * @param {string} initials - Initials shown in the avatar.
 * @param {string} avatarColor - Background color of the avatar.
 * @returns {string} HTML string of the avatar.
 */
function getAvatarTemplate(initials, avatarColor) {
  return `<span class="contact-avatar" style="background-color: ${avatarColor}">${initials}</span>`;
}

/**
 * Returns the HTML for one contact entry in the assigned-to dropdown.
 * @param {Object} contact - Contact with id, firstName and lastName.
 * @returns {string} HTML string of the list item.
 */
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

/**
 * Returns the HTML for one subtask list entry with edit and delete button.
 * @param {string} text - Text of the subtask.
 * @returns {string} HTML string of the list item.
 */
function getSubtaskItemTemplate(text) {
  return `
    <li class="subtask-list-item">
      <span class="subtask-text">${text}</span>
      <div class="subtask-list-buttons">
        <button type="button" class="edit-subtask-item-btn"><img src="../assets/edit-subtask.png" alt="edit subtask item"></button>
        <span class="action-divider"></span>
        <button type="button" class="delete-subtask-item-btn"><img src="../assets/delete-subtask.png" alt="delete subtask item"></button>
      </div>
    </li>`;
}
