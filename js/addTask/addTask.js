const list = document.getElementById("assigned-to-list");
const priorityBtns = document.getElementsByClassName("priority-btn");
const subtaskInput = document.getElementById("subtaskInput");
const subTaskList = document.querySelector(".subtask-list");

/**
 * Closes the dropdown list when clicking on backdrop.
 * @returns {<void}
 */
document.addEventListener("click", (event) => {
  const dropdown = document.getElementById("assigned-to-dropdown");
  if (!dropdown.classList.contains("open")) return;
  if (event.target.closest("#assigned-to-dropdown, #assigned-to-list")) return;
  toggleContactList();
});

/**
 * Opens or closes the assigned-to dropdown.
 * @returns {void}
 */
function toggleContactList() {
  const dropdown = document.getElementById("assigned-to-dropdown");
  if (dropdown.classList.contains("open")) closeContactList(dropdown);
  else openContactList(dropdown);
}

/**
 * Closes the dropdown and renders the selected avatars.
 * @param {HTMLElement} dropdown - The assigned-to dropdown container.
 * @returns {void}
 */
function closeContactList(dropdown) {
  dropdown.classList.remove("open");
  list.style.display = "none";
  renderAssignedAvatars();
}

/**
 * Opens the dropdown and renders the contact options once.
 * @param {HTMLElement} dropdown - The assigned-to dropdown container.
 * @returns {void}
 */
function openContactList(dropdown) {
  if (!list.children.length) renderContactOptions(getSessionData("session-contacts"));
  dropdown.classList.add("open");
  list.style.display = "block";
}

/**
 * Renders the avatars of all selected contacts below the dropdown.
 * @returns {void}
 */
function renderAssignedAvatars() {
  const container = document.getElementById("assigned-avatars");
  const selectedOptions = document.querySelectorAll(".contact-option.selected");
  container.innerHTML = "";
  selectedOptions.forEach((option) => {
    const avatar = option.querySelector(".contact-avatar");
    container.insertAdjacentHTML("beforeend", getAvatarTemplate(avatar.textContent, avatar.style.backgroundColor));
  });
}

/**
 * Returns the full name of a contact.
 * @param {{firstName: string, lastName: string}} contact - The contact.
 * @returns {string} First and last name separated by a space.
 */
function getFullUserName(contact) {
  return `${contact.firstName} ${contact.lastName}`;
}

/**
 * Returns the initials of a contact in upper case.
 * @param {{firstName: string, lastName: string}} contact - The contact.
 * @returns {string} Up to two initials, or an empty string if both names are missing.
 */
function getUserInitials(contact) {
  const first = (contact.firstName || "").trim();
  const last = (contact.lastName || "").trim();
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

/**
 * Selects or deselects a contact option in the dropdown.
 * @param {HTMLElement} option - The clicked contact option.
 * @returns {void}
 */
function toggleContactSelection(option) {
  const checkboxImg = option.querySelector("img[data-checked]");
  if (checkboxImg.dataset.checked === "true") {
    option.classList.remove("selected");
    checkboxImg.src = "../assets/checkbox.svg";
    checkboxImg.dataset.checked = "false";
    return;
  }
  checkboxImg.src = "../assets/checkbox-checked-white.svg";
  checkboxImg.dataset.checked = "true";
  option.classList.add("selected");
}

/**
 * Renders the contacts as options into the assigned-to dropdown.
 * @param {Object[]} userArray - The contacts to render.
 * @returns {void}
 */
function renderContactOptions(userArray) {
  list.innerHTML = "";
  userArray.forEach((contact) => {
    list.insertAdjacentHTML("beforeend", getContactOptionTemplate(contact));
  });
}

/**
 * Marks the clicked priority button as active and all others as inactive.
 * @param {HTMLElement} thisBtn - The clicked priority button.
 * @returns {void}
 */
function changePriority(thisBtn) {
  for (let i = 0; i < priorityBtns.length; i++) {
    priorityBtns[i].classList.remove("priority-active");
    priorityBtns[i].querySelector("svg").classList.remove("priority-active-svg");
  }
  thisBtn.classList.add("priority-active");
  thisBtn.querySelector("svg").classList.add("priority-active-svg");
}

/**
 * Sets the priority back to "medium".
 * @returns {void}
 */
function resetPriority() {
  changePriority(document.querySelector(".priority-medium"));
}

/**
 * Sets today as the minimum selectable date of the due date field.
 * @returns {void}
 */
function getTodaysDate() {
  const taskDate = document.getElementById("taskDueDate");
  const today = new Date().toISOString().split("T")[0];
  taskDate.setAttribute("min", today);
}

/**
 * Shows the subtask action buttons only while the subtask input is not empty.
 * @returns {void}
 */
function showSubtaskActions() {
  const subtaskActions = document.querySelector(".subtask-actions");
  subtaskActions.style.visibility = subtaskInput.value.trim().length > 0 ? "visible" : "hidden";
}

/**
 * Adds the entered subtask to the subtask list and clears the input.
 * @returns {void}
 */
function saveSubtask() {
  const text = subtaskInput.value.trim();
  if (!text) return;
  subTaskList.insertAdjacentHTML("beforeend", getSubtaskItemTemplate(text));
  subtaskInput.value = "";
  showSubtaskActions();
}

/**
 * Clears the subtask input and hides the action buttons.
 * @returns {void}
 */
function rejectSubtask() {
  subtaskInput.value = "";
  showSubtaskActions();
}

/**
 * Creates the text input that replaces a subtask text while it is edited.
 * @param {string} text - Current text of the subtask.
 * @returns {HTMLInputElement} The edit input.
 */
function createSubtaskEditInput(text) {
  const input = document.createElement("input");
  input.type = "text";
  input.classList.add("subtask-edit-input");
  input.value = text;
  return input;
}

/**
 * Switches a subtask list item into edit mode.
 * @param {HTMLElement} item - The subtask list item.
 * @returns {void}
 */
function startEditSubtask(item) {
  const span = item.querySelector(".subtask-text");
  const input = createSubtaskEditInput(span.textContent);
  span.replaceWith(input);
  item.classList.add("editing");
  input.focus();
  input.addEventListener("blur", () => finishEditSubtask(item, input));
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    input.blur();
  });
}

/**
 * Ends the edit mode of a subtask. An empty text removes the subtask.
 * @param {HTMLElement} item - The subtask list item.
 * @param {HTMLInputElement} input - The edit input.
 * @returns {void}
 */
function finishEditSubtask(item, input) {
  if (!item.classList.contains("editing")) return;
  item.classList.remove("editing");
  const newText = input.value.trim();
  if (!newText) {
    item.remove();
    return;
  }
  const span = document.createElement("span");
  span.classList.add("subtask-text");
  span.textContent = newText;
  input.replaceWith(span);
}

/**
 * Selects or deselects a contact when an option in the assigned-to dropdown is clicked.
 * @param {MouseEvent} event - The click event.
 * @returns {void}
 */
list.addEventListener("click", (event) => {
  const option = event.target.closest(".contact-option");
  if (option) toggleContactSelection(option);
});

/**
 * Registers a click handler on every priority button that activates the clicked button.
 * @returns {void}
 */
for (let i = 0; i < priorityBtns.length; i++) {
  priorityBtns[i].addEventListener("click", () => changePriority(priorityBtns[i]));
}

/**
 * Saves the entered subtask when Enter is pressed in the subtask input.
 * Prevents the default form submission.
 * @param {KeyboardEvent} event - The keydown event.
 * @returns {void}
 */
subtaskInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  saveSubtask();
});

/**
 * Handles clicks inside the subtask list. A click on the delete button removes the
 * subtask, any other click on an item that is not being edited starts the edit mode.
 * @param {MouseEvent} event - The click event.
 * @returns {void}
 */
subTaskList.addEventListener("click", (event) => {
  const item = event.target.closest(".subtask-list-item");
  if (!item || item.classList.contains("editing")) return;
  if (event.target.closest(".delete-subtask-item-btn")) {
    item.remove();
    return;
  }
  startEditSubtask(item);
});

list.style.display = "none";
document.getElementById("assigned-to-dropdown").classList.remove("open");
