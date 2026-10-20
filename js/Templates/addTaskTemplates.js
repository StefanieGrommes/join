
/**
 * Initializes session data for the add-task page.
 * @returns {Promise<void>} A promise resolved after initialization.
 */
async function initAddTask() {
  await initSessionData();
}

/**
 * Opens or closes the assigned-contact dropdown.
 * @returns {void}
 */
function toggleContactList() {
  const dropdown = document.getElementById("assigned-to-dropdown");
  if (!dropdown) return;
  const isOpen = dropdown.classList.toggle("open");
  const list = document.getElementById("assigned-to-list");
  if (list) list.style.display = isOpen ? "block" : "none";
  if (isOpen && list && !list.children.length) {
    renderContactOptions(getSessionData("session-contacts") || []);
  }
  if (!isOpen) renderAssignedAvatars();
}

/**
 * Renders avatars for all selected contacts.
 * @returns {void}
 */
function renderAssignedAvatars() {
  const container = document.getElementById("assigned-avatars");
  if (!container) return;
  container.replaceChildren();
  document.querySelectorAll(".contact-option.selected").forEach((option) => {
    const avatar = option.querySelector(".contact-avatar");
    if (avatar) container.insertAdjacentHTML("beforeend",
      getAvatarTemplate(avatar.textContent, avatar.style.backgroundColor));
  });
}

/**
 * Creates the HTML template for a contact avatar.
 * @param {string} initials - The contact initials.
 * @param {string} avatarColor - The avatar background color.
 * @returns {string} The avatar HTML.
 */
function getAvatarTemplate(initials, avatarColor) {
  return `<span class="contact-avatar" style="background-color: ${avatarColor}">${initials}</span>`;
}

/**
 * Returns the full name of a contact.
 * @param {Object} contact - The contact data.
 * @returns {string} The contact's full name.
 */
function getFullUserName(contact) {
  return `${contact.firstName} ${contact.lastName}`;
}

/**
 * Generates uppercase initials for a contact.
 * @param {Object} contact - The contact data.
 * @returns {string} The contact initials or an empty string.
 */
function getUserInitials(contact) {
  if (!contact.firstName || !contact.lastName) return "";
  return `${contact.firstName[0]}${contact.lastName[0]}`.toUpperCase();
}

/**
 * Creates the HTML template for a contact dropdown option.
 * @param {Object} contact - The contact data.
 * @returns {string} The contact option HTML.
 */
function getContactOptionTemplate(contact) {
  return `
    <li class="contact-option">
      <div class="name-and-initials">
        <span class="contact-avatar" style="background-color: ${getContactColor(contact.id)}">${getUserInitials(contact)}</span>
        <span class="contact-name">${getFullUserName(contact)}</span>
      </div>
      <button class="checked-btn" type="button">
        <img src="../assets/checkbox.svg" alt="checkbox" data-checked="false">
      </button>
    </li>`;
}

/**
 * Handles clicks on contact dropdown options.
 * @param {MouseEvent} event - The click event.
 * @returns {void}
 */
function handleContactListClick(event) {
  const option = event.target.closest(".contact-option");
  if (option) toggleContactSelection(option);
}

/**
 * Toggles the selected state of a contact option.
 * @param {HTMLElement} option - The contact option.
 * @returns {void}
 */
function toggleContactSelection(option) {
  const checkbox = option.querySelector("img[data-checked]");
  if (!checkbox) return;
  const isSelected = checkbox.dataset.checked === "true";
  option.classList.toggle("selected", !isSelected);
  checkbox.dataset.checked = String(!isSelected);
  checkbox.src = isSelected
    ? "../assets/checkbox.svg"
    : "../assets/checkbox-checked.svg";
}

/**
 * Renders all available contacts in the dropdown.
 * @param {Object[]} userArray - The available contacts.
 * @returns {void}
 */
function renderContactOptions(userArray) {
  const list = document.getElementById("assigned-to-list");
  if (!list) return;
  list.innerHTML = "";
  userArray.forEach((contact) => {
    list.insertAdjacentHTML("beforeend", getContactOptionTemplate(contact));
  });
}

/**
 * Registers click handlers for priority buttons.
 * @returns {void}
 */
function initPriorityButtons() {
  document.querySelectorAll(".priority-btn").forEach((button) => {
    button.addEventListener("click", () => changePriority(button));
  });
}

/**
 * Activates the selected priority button and its icon.
 * @param {HTMLElement} selectedButton - The selected priority button.
 * @returns {void}
 */
function changePriority(selectedButton) {
  document.querySelectorAll(".priority-btn").forEach((button) => {
    button.classList.remove("priority-active");
    button.querySelector("svg")?.classList.remove("priority-active-svg");
  });
  selectedButton.classList.add("priority-active");
  selectedButton.querySelector("svg")?.classList.add("priority-active-svg");
}

/**
 * Sets today's date as the earliest selectable task due date.
 * @returns {void}
 */
function getTodaysDate() {
  const taskDate = document.getElementById("taskDueDate");
  if (taskDate) taskDate.min = new Date().toISOString().split("T")[0];
}

/**
 * Shows or hides the subtask action buttons.
 * @returns {void}
 */
function showSubtaskActions() {
  const input = document.getElementById("subtaskInput");
  const actions = document.querySelector(".subtask-actions");
  if (!input || !actions) return;
  actions.style.visibility = input.value.trim() ? "visible" : "hidden";
}

/**
 * Adds a subtask using the current input value.
 * @returns {void}
 */
function saveSubtask() {
  const input = document.getElementById("subtaskInput");
  const list = document.querySelector(".subtask-list");
  if (!input || !list || !input.value.trim()) return;
  list.insertAdjacentHTML("beforeend", getSubtaskItemTemplate(input.value.trim()));
  input.value = "";
  showSubtaskActions();
}

/**
 * Creates the HTML template for a subtask list item.
 * @param {string} text - The subtask description.
 * @returns {string} The subtask HTML.
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

/**
 * Saves a subtask when the Enter key is pressed.
 * @param {KeyboardEvent} event - The keyboard event.
 * @returns {void}
 */
function handleSubtaskInputKeydown(event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  saveSubtask();
}

/**
 * Handles editing and deleting subtask list items.
 * @param {MouseEvent} event - The click event.
 * @returns {void}
 */
function handleSubtaskListClick(event) {
  const item = event.target.closest(".subtask-list-item");
  if (!item || item.classList.contains("editing")) return;
  if (event.target.closest(".delete-subtask-item-btn")) return item.remove();
  if (event.target.closest(".edit-subtask-item-btn")) startEditSubtask(item);
}

/**
 * Replaces a subtask description with an editable input.
 * @param {HTMLElement} item - The subtask list item.
 * @returns {void}
 */
function startEditSubtask(item) {
  const span = item.querySelector(".subtask-text");
  if (!span) return;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "subtask-edit-input";
  input.value = span.textContent;
  span.replaceWith(input);
  item.classList.add("editing");
  input.focus();
  input.addEventListener("blur", () => finishEditSubtask(item, input));
  input.addEventListener("keydown", handleSubtaskEditKeydown);
}

/**
 * Finishes editing a subtask when Enter is pressed.
 * @param {KeyboardEvent} event - The keyboard event.
 * @returns {void}
 */
function handleSubtaskEditKeydown(event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  event.currentTarget.blur();
}

/**
 * Saves the edited subtask or removes it if empty.
 * @param {HTMLElement} item - The subtask list item.
 * @param {HTMLInputElement} input - The editing input.
 * @returns {void}
 */
function finishEditSubtask(item, input) {
  if (!item.classList.contains("editing")) return;
  item.classList.remove("editing");
  const newText = input.value.trim();
  if (!newText) return item.remove();
  const span = document.createElement("span");
  span.className = "subtask-text";
  span.textContent = newText;
  input.replaceWith(span);
}

/**
 * Clears the subtask input and hides its action buttons.
 * @returns {void}
 */
function rejectSubtask() {
  const input = document.getElementById("subtaskInput");
  if (input) input.value = "";
  showSubtaskActions();
}

/**
 * Registers event listeners for the contact dropdown.
 * @returns {void}
 */
function initContactList() {
  document.getElementById("assigned-to-list")
    ?.addEventListener("click", handleContactListClick);
}

/**
 * Registers event listeners for subtask input and list actions.
 * @returns {void}
 */
function initSubtaskListeners() {
  document.getElementById("subtaskInput")
    ?.addEventListener("keydown", handleSubtaskInputKeydown);
  document.querySelector(".subtask-list")
    ?.addEventListener("click", handleSubtaskListClick);
}

initContactList();
initPriorityButtons();
initSubtaskListeners();
