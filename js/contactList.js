/**
 * Creates the initials from a full name.
 * @param {string} name - Full name, e.g. "Anton Mayer"
 * @returns {string} Initials in uppercase, e.g. "AM"
 */
function getInitials(name) {
  let parts = name.split(" ");
  let first = parts[0].charAt(0);
  let last = parts[parts.length - 1].charAt(0);
  return (first + last).toUpperCase();
}


/**
 * Builds the HTML for a single contact in the list.
 * @param {Object} contact - Contact with name, email and color
 * @returns {string} HTML string of the list item
 */
function getContactTemplate(contact) {
  return `
    <li class="contact-item" onclick="openContactDetail('${contact.email}', this)">
      <div class="contact-avatar" style="background-color: ${contact.color}">${getInitials(contact.name)}</div>
      <div class="contact-info">
        <p class="contact-name">${contact.name}</p>
        <p class="contact-email">${contact.email}</p>
      </div>
    </li>`;
}


/**
 * Builds the HTML for one letter group including all its contacts.
 * @param {string} letter - First letter of the group
 * @param {Array<Object>} groupContacts - Contacts belonging to this group
 * @returns {string} HTML string of the group
 */
function getContactGroupTemplate(letter, groupContacts) {
  let items = "";
  for (let contact of groupContacts) {
    items += getContactTemplate(contact);
  }
  return `
    <div class="contact-group">
      <p class="group-letter">${letter}</p>
      <ul class="contact-list">${items}</ul>
    </div>`;
}


/**
 * Returns a copy of the contacts sorted alphabetically by name.
 * @param {Array<Object>} contacts - Unsorted list of contacts
 * @returns {Array<Object>} New array sorted by name
 */
function sortContactsByName(contacts) {
  return [...contacts].sort((a, b) => a.name.localeCompare(b.name));
}


/**
 * Groups contacts by the first letter of their name.
 * @param {Array<Object>} contacts - Sorted list of contacts
 * @returns {Object} Letter as key, array of matching contacts as value
 */
function groupContactsByLetter(contacts) {
  let groups = {};
  for (let contact of contacts) {
    let letter = contact.name.charAt(0).toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(contact);
  }
  return groups;
}


/**
 * Renders the grouped contact list into the DOM.
 * @returns {void}
 */
function renderContactList() {
  let wrapper = document.getElementById("contactListWrapper");
  let groups = groupContactsByLetter(sortContactsByName(contacts));
  let html = "";
  for (let letter in groups) {
    html += getContactGroupTemplate(letter, groups[letter]);
  }
  wrapper.innerHTML = html;
}


/**
 * Builds the HTML for the detail view of a contact.
 * @param {Object} contact - Contact with name, email, phone and color
 * @returns {string} HTML string of the detail view
 */
function getContactDetailTemplate(contact) {
  return `   
   <div class="contact-detail">
      <div class="contact-avatar-large" style="background-color: ${contact.color}">${getInitials(contact.name)}</div>
      <div class="contact-detail-head">
        <p class="contact-detail-name">${contact.name}</p>
        <div class="contact-detail-actions">
          <button class="detail-action-btn"><img src="../assets/edit.svg" alt="" /> Edit</button>
          <button class="detail-action-btn"><img src="../assets/delete.svg" alt="" /> Delete</button>
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
    </div>`;
}


/**
 * Shows the detail view of the contact with the given email.
 * @param {string} email - Email address identifying the contact
 * @returns {void}
 */

function openContactDetail(email, element) {
  let contact = contacts.find((c) => c.email === email);
  if (!contact) return;
  document.getElementById("contactDetail").innerHTML = getContactDetailTemplate(contact);
  document.querySelector(".add-task-content").classList.add("detail-open");
  setActiveContact(element);
}


/**
 * Highlights the clicked contact and removes the previous highlight.
 * @param {HTMLElement} element - The clicked list item
 * @returns {void}
 */
function setActiveContact(element) {
  let active = document.querySelector(".contact-item-selected");
  if (active) active.classList.remove("contact-item-selected");
  element.classList.add("contact-item-selected");
}


/**
 * Close the contact detail view and returns to the list.
 * @returns {void}
 */
function closeContactDetail() {
  document.querySelector(".add-task-content").classList.remove("detail-open");
}
