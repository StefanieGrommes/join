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
let editingContactId = null;

function getContactColor(id) {
  return CONTACT_COLORS[Number(id) % CONTACT_COLORS.length];
}

function getInitials(firstName, lastName) {
  let first = firstName.charAt(0);
  let last = lastName.charAt(0);
  return (first + last).toUpperCase();
}

function getContactTemplate(contact) {
  return `
    <li class="contact-item" data-id="${contact.id}" onclick="openContactDetail('${contact.id}', this)">
      <div class="contact-avatar" style="background-color: ${getContactColor(contact.id)}">${getInitials(contact.firstName, contact.lastName)}</div>
      <div class="contact-info">
        <p class="contact-name">${contact.firstName} ${contact.lastName}</p>
        <p class="contact-email">${contact.email}</p>
      </div>
    </li>`;
}

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

function sortContactsByName(contacts) {
  return [...contacts].sort((a, b) => a.firstName.localeCompare(b.firstName));
}

function groupContactsByLetter(contacts) {
  let groups = {};
  for (let contact of contacts) {
    let letter = contact.firstName.charAt(0).toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(contact);
  }
  return groups;
}

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

function getContactDetailTemplate(contact) {
  return ` <div class="contact-detail">
      <div
        class="contact-avatar-large"
        style="background-color: ${getContactColor(contact.id)}"
      >
        ${getInitials(contact.firstName, contact.lastName)}
      </div>
      <div class="contact-detail-head">
        <p class="contact-detail-name">${contact.firstName} ${contact.lastName}</p>
        <div class="contact-detail-actions">
          <button class="detail-action-btn" onclick="openEditDialog('${contact.id}')">
            <img class="icon-edit" src="../assets/edit.svg" alt="" /> Edit
          </button>
          <button class="detail-action-btn" onclick="deleteContact('${contact.id}')">
            <img class="icon-delete" src="../assets/delete.svg" alt="" /> Delete
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
      <button class="detail-action-btn" onclick="openEditDialog('${contact.id}')">
        <img class="icon-edit" src="../assets/edit.svg" alt="" />Edit
      </button>
      <button class="detail-action-btn" onclick="deleteContact('${contact.id}')">
        <img class="icon-delete" src="../assets/delete.svg" alt="" />Delete
      </button>
    </div>`;
}

function toggleDetailMenu() {
  document.getElementById("detailMenu").classList.toggle("open");
}

function openContactDetail(id, element) {
  let contact = allContacts.find((c) => c.id === id);
  if (!contact) return;
  document.getElementById("contactDetail").innerHTML = getContactDetailTemplate(contact);
  document.querySelector(".add-task-content").classList.add("detail-open");
  setActiveContact(element);
}

function setActiveContact(element) {
  let active = document.querySelector(".contact-item-selected");
  if (active) active.classList.remove("contact-item-selected");
  element.classList.add("contact-item-selected");
}

function closeContactDetail() {
  document.querySelector(".add-task-content").classList.remove("detail-open");
  let menu = document.getElementById("detailMenu");
  if (menu) menu.classList.remove("open");
}

function closeMenuOnOutsideClick(event) {
  let menu = document.getElementById("detailMenu");
  if (!menu) return;
  if (event.target.closest(".detail-menu") || event.target.closest(".detail-menu-btn")) return;
  menu.classList.remove("open");
}

document.addEventListener("click", closeMenuOnOutsideClick);

function splitName(fullName) {
  let parts = fullName.trim().split(" ");
  let lastName = parts.pop();
  return { firstName: parts.join(" "), lastName: lastName };
}

function getNextContactId() {
  let numbers = allContacts.map((c) => Number(c.id));
  return String(Math.max(0, ...numbers) + 1);
}

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

async function addNewContact(form) {
  let contact = buildContactFromForm(form);
  let button = form.querySelector(".create-contact-btn");
  button.disabled = true;
  await putData("contacts/" + contact.id, contact);
  button.disabled = false;
  allContacts.push(contact);
  renderContactList(allContacts);
  let element = document.querySelector(`[data-id="${contact.id}"]`);
  openContactDetail(contact.id, element);
  form.reset();
  closeDialog();
  showSuccessToast("Contact successfully created");
}

async function loadContacts() {
  let response = await fetch(BASE_URL + "contacts.json");
  let data = await response.json();
  allContacts = Object.values(data || {}).filter(Boolean);
  renderContactList(allContacts);
}

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
  showDialogAvatar(contact);
  showDialog();
}

async function saveEditedContact(form) {
  let contact = buildContactFromForm(form);
  contact.id = editingContactId;
  let button = form.querySelector(".create-contact-btn");
  button.disabled = true;
  await putData("contacts/" + contact.id, contact);
  button.disabled = false;
  let index = allContacts.findIndex((c) => c.id === contact.id);
  allContacts[index] = contact;
  renderContactList(allContacts);
  openContactDetail(contact.id, document.querySelector(`[data-id="${contact.id}"]`));
  closeDialog();
  showSuccessToast("Contact successfully edited");
}

function showDialogAvatar(contact) {
  let avatar = document.getElementById("dialogAvatar");
  avatar.innerHTML = `<div
    class="contact-avatar-large"
    style="background-color: ${getContactColor(contact.id)}"
  >
    ${getInitials(contact.firstName, contact.lastName)}
  </div>`;
}

async function deleteContact(id) {
  await removeContactFromTasks(id);
  await deleteData("contacts/" + id);
  allContacts = allContacts.filter((contact) => contact.id !== id);
  renderContactList(allContacts);
  closeContactDetail();
  document.getElementById("contactDetail").innerHTML = "";
}

async function removeContactFromTasks(id) {
  let response = await fetch(BASE_URL + "tasks.json");
  let tasks = await response.json();
  for (let key in tasks) {
    let assigned = tasks[key].assignedTo;
    if (!assigned) continue;
    let left = assigned.filter((entry) => entry.id !== id);
    if (left.length !== assigned.length) await putData(`tasks/${key}/assignedTo`, left);
  }
}

function showSuccessToast(message) {
  let toast = document.getElementById("successToast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1500);
}
