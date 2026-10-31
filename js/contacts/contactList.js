const CONTACT_COLORS = [
  "#FF7A00","#1FD7C1","#462F8A","#6E52FF","#9327FF","#FFC701",
  "#FF745E","#FFA35E","#FC71FF","#FFBB2B","#FF4646","#00BEE8",
  "#C3FF2B","#FF5EB3","#0038FF","#FFE62B"
];

let allContacts = [];
let editingContactId = null;

/**
 * Syncs the edited data in local Storage.
 * @param {string} allContacts - every contact that has been created.
 */
function syncContactsCache() {
  saveSessionData("session-contacts", allContacts);
}

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
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
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
  return displayContactGroupTemplate(letter, items);
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
  if (!wrapper) return;
  let groups = groupContactsByLetter(sortContactsByName(contacts));
  let html = "";
  for (let letter in groups) {
    html += getContactGroupTemplate(letter, groups[letter]);
  }
  wrapper.innerHTML = html;
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
 * Splits a full name into first and last name at the last space
 * @param {string} fullName - The entered full name
 * @returns {Object} Object with firstName and lastName
 */
function splitName(fullName) {
  let parts = fullName.trim().split(" ");
  let lastName = parts.pop();
  return { firstName: parts.join(" "), lastName: lastName };
}

/**
 * Return the next free contact id as a string.
 * @returns {string} The next free contact id
 */
function getNextContactId() {
  let numbers = allContacts.map((c) => Number(c.id));
  return String(Math.max(0, ...numbers) + 1);
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
 * Creates a new contact, saves it to the database and shows it in the list.
 * @param {HTMLFormElement} form - The add contact form
 * @returns {Promise<void>}
 */
async function addNewContact(form) {
  let contact = buildContactFromForm(form);
  let button = form.querySelector(".create-contact-btn");
  button.disabled = true;
  await putData("contacts/" + contact.id, contact);
  button.disabled = false;
  allContacts.push(contact);
  syncContactsCache();
  renderContactList(allContacts);
  let element = document.querySelector(`[data-id="${contact.id}"]`);
  openContactDetail(contact.id, element);
  form.reset();
  closeDialog();
  showSuccessToast("Contact successfully created");
}

/**
 * Loads all contacts from the database and renders the list.
 * @returns {Promise<void>}
 */
async function loadContacts() {
  let response = await fetch(BASE_URL + "contacts.json");
  let data = await response.json();
  allContacts = Object.values(data || {}).filter((c) => c && c.firstName);
  await ensureOwnContact();
  renderContactList(allContacts);
}

/**
 * Opens the contact dialog prefilled with an existing contact.
 * @param {string} id - The id of the contact to edit.
 * @returns {void}
 */
function openEditDialog(id) {
  let contact = allContacts.find((c) => c.id === id);
  if (!contact) return;
  editingContactId = id;
  let form = document.querySelector(".add-contact-form");
  form.querySelector('[name="name"]').value = contact.firstName + " " + contact.lastName;
  form.querySelector('[name="email"]').value = contact.email;
  form.querySelector('[name="phone"]').value = contact.phone;
  document.getElementById("dialogHeadline").textContent = "Edit contact";
  document.getElementById("dialogSubline").style.display = "none";
  document.getElementById("submitBtnText").textContent = "Save";
  renderDialogAvatar(contact);
  showDialog();
}

/**
 * Builds the contact object from the form and keeps the id of the edited contact.
 * @param {HTMLFormElement} form - The contact form.
 * @returns {Object} The edited contact.
 */
function buildEditedContact(form) {
  const contact = buildContactFromForm(form);
  contact.id = editingContactId;
  return contact;
}

/**
 * Writes the edited contact to the database and, for the own contact, to the account.
 * @param {Object} contact - The edited contact.
 * @param {{key: string|null}|null} own - The own account info, or null for other contacts.
 * @returns {Promise<void>}
 */
async function persistEditedContact(contact, own) {
  await putData("contacts/" + (await findContactKey(contact.id)), contact);
  if (own && own.key !== null) await updateOwnAccount(contact, own.key);
}

/**
 * Replaces the contact in the list and updates the local cache.
 * @param {Object} contact - The edited contact.
 * @returns {void}
 */
function updateContactInList(contact) {
  const index = allContacts.findIndex((c) => c.id === contact.id);
  allContacts[index] = contact;
  syncContactsCache();
}

/**
 * Redraws the list, opens the detail view and shows the success message.
 * @param {Object} contact - The edited contact.
 * @returns {void}
 */
function showEditedContact(contact) {
  renderContactList(allContacts);
  openContactDetail(contact.id, document.querySelector(`[data-id="${contact.id}"]`));
  closeDialog();
  showSuccessToast("Contact successfully edited");
}

/**
 * Saves the changes of an edited contact to the database.
 * @param {HTMLFormElement} form - The contact form.
 * @returns {Promise<void>}
 */
async function saveEditedContact(form) {
  const contact = buildEditedContact(form);
  const button = form.querySelector(".create-contact-btn");
  const own = isOwnContact(contact.id) ? await findOwnUserKey(contact) : null;
  if (own && own.conflict) return showToastMessage("This email is already used by another account.");
  button.disabled = true;
  await persistEditedContact(contact, own);
  button.disabled = false;
  updateContactInList(contact);
  showEditedContact(contact);
}

/**
 * Shows the colored initials of a contact inside the dialog.
 * @param {Object} contact - The contact to show.
 * @returns {void}
 */
function renderDialogAvatar(contact) {
  let avatar = document.getElementById("dialogAvatar");
  avatar.innerHTML = displayDialogAvatar(contact);
}

/**
 * Removes a deleted contact from the assigned list of all tasks in the local cache.
 * @param {string} id - The id of the deleted contact.
 * @returns {void}
 */
function removeContactFromTaskCache(id) {
  const tasks = getSessionData("session-tasks").map((task) => ({
    ...task,
    assignedTo: (task.assignedTo || []).filter((entry) => entry.id !== id),
  }));
  saveSessionData("session-tasks", tasks);
}

/**
 * Deletes the contact from the database, from all tasks and from the list
 * @param {string} id - The id of the contact to delete.
 * @returns {Promise<void>}
 */
async function deleteContact(id) {
  if (isOwnContact(id)) return;
  await removeContactFromTasks(id);
  removeContactFromTaskCache(id);
  await deleteData("contacts/" + (await findContactKey(id)));
  allContacts = allContacts.filter((contact) => contact.id !== id);
  syncContactsCache();
  renderContactList(allContacts);
  closeContactDetail();
  document.getElementById("contactDetail").innerHTML = "";
}

/**
 * Removes a deleted contact from the assigned list of all tasks.
 * @param {string} id - The id of the deleted contact.
 * @returns {Promise<void>}
 */
async function removeContactFromTasks(id) {
  let response = await fetch(BASE_URL + "tasks.json");
  let tasks = await response.json();
  for (let key in tasks) {
    let assigned = tasks[key]?.assignedTo;
    if (!assigned) continue;
    let left = assigned.filter((entry) => entry.id !== id);
    if (left.length !== assigned.length) await putData(`tasks/${key}/assignedTo`, left);
  }
}

/**
 * Shows a message at the center of the screen and hides it after a short delay.
 * @param {string} message - The text to show.
 * @returns {void}
 */
function showSuccessToast(message) {
  let toast = document.getElementById("successToast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1500);
}
