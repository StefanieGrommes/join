/**
 * Returns the HTML for one contact entry in the assigned-to dropdown.
 * @param {Object} contact - Contact with initials and name.
 * @returns {string} HTML string of the list item
 */
function getContactOptionTemplate(contact) {
  return /* HTML */ `
    <li class="contact-option">
      <span class="contact-avatar">${contact.initials}</span>
      <span class="contact-name">${contact.name}</span>
      <img src="./assets/checkbox.svg" alt="" />
    </li>
  `;
}
