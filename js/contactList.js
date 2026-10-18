const CONTACT_COLORS = [
  "#FF7A00",
  "#1FD7C1",
  "#462F8A",
  "#6E52FF",
  "#9327FF",
  "#FFC701",
  "#FF745E",
  "#FFA35E",
  "#FC71FF",
  "#FFBB2B",
  "#FF4646",
  "#00BEE8",
  "#C3FF2B",
  "#FF5EB3",
  "#0038FF",
  "#FFE62B",
];

let allContacts = [];

/**
 * Picks a stable color for a contact based on its id.
 * @param {string} id - Contact id
 * @returns {string} Hex color
 */
function getContactColor(id) {
  return CONTACT_COLORS[Number(id) % CONTACT_COLORS.length];
}

/**
 * Creates the initials from a contact's first and last name.
 * @param {string} firstName - First name, e.g. "Anton"
 * @param {string} lastName - Last name, e.g. "Mayer"
 * @returns {string} Initials in uppercase, e.g. "AM"
 */
function getInitials(firstName, lastName) {
  let first = firstName.charAt(0);
  let last = lastName.charAt(0);
  return (first + last).toUpperCase();
}

/**
 * Builds the HTML for a single contact in the list.
 * @param {Object} contact - Contact with id, firstName, lastName and email
 * @returns {string} HTML string of the list item
 */
function getContactTemplate(contact) {
  return `
    <li class="contact-item" onclick="openContactDetail('${contact.id}', this)">
      <div class="contact-avatar" style="background-color: ${getContactColor(contact.id)}">${getInitials(contact.firstName, contact.lastName)}</div>
      <div class="contact-info">
        <p class="contact-name">${contact.firstName} ${contact.lastName}</p>
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
  return [...contacts].sort((a, b) => a.firstName.localeCompare(b.firstName));
}

/**
 * Groups contacts by the first letter of their name.
 * @param {Array<Object>} contacts - Sorted list of contacts
 * @returns {Object} Letter as key, array of matching contacts as value
 */
function groupContactsByLetter(contacts) {
  let groups = {};
  for (let contact of contacts) {
    let letter = contact.firstName.charAt(0).toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(contact);
  }
  return groups;
}

/**
 * Renders the grouped contact list into the DOM.
 * @param {Array<Object>} contacts - Contacts to render
 * @returns {void}
 */
function renderContactList(contacts) {
  if (!contacts) return;
  allContacts = contacts;
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
 * @param {Object} contact - Contact with id, firstName, lastName, email and phone
 * @returns {string} HTML string of the detail view
 */
function getContactDetailTemplate(contact) {
  return /* HTML */ ` <div class="contact-detail">
      <div
        class="contact-avatar-large"
        style="background-color: ${getContactColor(contact.id)}"
      >
        ${getInitials(contact.firstName, contact.lastName)}
      </div>
      <div class="contact-detail-head">
        <p class="contact-detail-name">${contact.firstName} ${contact.lastName}</p>
        <div class="contact-detail-actions">
          <button class="detail-action-btn">
            <img src="../assets/edit.svg" alt="" /> Edit
          </button>
          <button class="detail-action-btn">
            <img src="../assets/delete.svg" alt="" /> Delete
          </button>
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
      <button class="detail-action-btn"><img src="../assets/edit.svg" alt="" />Edit</button>
      <button class="detail-action-btn">
        <img src="../assets/delete.svg" alt="" />Delete
      </button>
    </div>`;
}

/**
 * Toggles the mobile edit/delete menu in the contact detail view.
 * @returns {void}
 */
function toggleDetailMenu() {
  document.getElementById("detailMenu").classList.toggle("open");
}

/**
 * Shows the detail view of the contact with the given id.
 * @param {string} id - Id identifying the contact
 * @param {HTMLElement} element - The clicked list item
 * @returns {void}
 */
function openContactDetail(id, element) {
  let contact = allContacts.find((c) => c.id === id);
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
  let menu = document.getElementById("detailMenu");
  if (menu) menu.classList.remove("open");
}

/**
 * Close the detail menu when clicking outside of it.
 * @param {MouseEvent} event - The click event
 * @returns {void}
 */
function closeMenuOnOutsideClick(event) {
  let menu = document.getElementById("detailMenu");
  if (!menu) return;
  if (event.target.closest(".detail-menu") || event.target.closest(".detail-menu-btn")) return;
  menu.classList.remove("open");
}

document.addEventListener("click", closeMenuOnOutsideClick);

/**
 * Splits a full name into first and last nameat the last space
 * @param {string} fullNmae - The entered full name
 * @returns {Object}Object with firstName and lastName
 */
function splitName(fullName) {
  let parts = fullName.trim().split(" ");
  lastName = parts.pop();
  return { firstName: parts.join(" "), lastName: lastName };
}

/**
 * Return the next free contact id as a string.
 * @returns {Object}Object with firstName and lastName
 */
function getNextContactId() {
  let numbers = allContacts.map((c) => Number(c.id));
  return String(Math.max(...numbers) + 1);
}

/**
 * Builds a contact object from the form values.
 * @param {HTMLFormElement} form - The add contact form
 * @returns {Object} The new contact
 */
function buildContactFromForm(form) {
  let name = splitName(form.querySelector('[name="name"]').value);
  return {
    id: getNextContactId(),
    firstName: name.firstName,
    lastName: name.lastName,
    email: form.querySelector('[name="email"]').value.trim(),
    phone: form.querySelector('[name="phone"]').value.trim(),
  };
}

/**
 * Creates a new contact from the form and updates list and storage.
 * @param {HTMLFormElement} from - The add contact form
 * @returns {void}
 */
function addNewContact(form) {
let contact = buildContactFromForm(form);
allContacts.push(contact);
saveSessionData("session-contacts", allContacts);
renderContactList(allContacts);
form.reset();
closeDialog();
}
