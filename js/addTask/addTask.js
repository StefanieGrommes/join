const list = document.getElementById("assigned-to-list");
const priorityBtns = document.getElementsByClassName("priority-btn");
const subtaskInput = document.getElementById("subtaskInput");
const subTaskList = document.querySelector(".subtask-list");
let editingTaskId = null;
let newTaskState = "todo";

/**
 * Loads the session data (contacts and tasks) for the add-task page.
 * @returns {Promise<void>}
 */
async function initAddTask() {
  await initSessionData();
}

/**
 * Closes the dropdown list when clicking on backdrop.
 * @returns {<void>}
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
 * Closes the dropdown, shows the avatars again and renders the selected ones.
 * @param {HTMLElement} dropdown - The assigned-to dropdown container.
 * @returns {void}
 */
function closeContactList(dropdown) {
  dropdown.classList.remove("open");
  list.style.display = "none";
  document.getElementById("assigned-avatars").style.display = "flex";
  renderAssignedAvatars();
}

/**
 * Opens the dropdown, renders the contact options once and hides the avatars.
 * @param {HTMLElement} dropdown - The assigned-to dropdown container.
 * @returns {void}
 */
function openContactList(dropdown) {
  if (!list.children.length) renderContactOptions(getSessionData("session-contacts"));
  dropdown.classList.add("open");
  list.style.display = "block";
  document.getElementById("assigned-avatars").style.display = "none";
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
 * @returns {string} Two initials, or an empty string if a name is missing.
 */
function getUserInitials(contact) {
  if (!contact.firstName || !contact.lastName) return "";
  return (contact.firstName.charAt(0) + contact.lastName.charAt(0)).toUpperCase();
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
    checkboxImg.src ="../assets/checkbox.svg";
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
 * Each handler takes no event parameter and returns nothing.
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

const form = document.getElementById("add-task-form");
const taskTitleInput = document.getElementById("task-title");
const taskCategory = document.getElementById("task-category");
const errorMessage = document.getElementById("error-message");
const dueDate = document.getElementById("taskDueDate");
const errorMessageArray = [];

form.addEventListener("submit", handleTaskFormSubmit);

/**
 * Collects the error messages of the required task fields.
 * @returns {string[]} The messages, empty if all fields are valid.
 */
function getTaskFormErrors() {
  const errors = [];
  if (taskTitleInput.value.trim().length <= 2) {
    errors.push("The title must be at least 3 characters!");
  }
  if (taskCategory.value === "none") errors.push("Please enter a task category!");
  if (dueDate.value === "") errors.push("Please enter a due date!");
  return errors;
}

/**
 * Checks if the required fields are valid and shows error message if not.
 * Prevents the form from submitting if the fields do not pass the test.
 * @param {SubmitEvent} event - The submit event of the task form.
 * @returns {Promise<void>}
 */
async function handleTaskFormSubmit(event) {
  event.preventDefault();
  errorMessageArray.length = 0;
  errorMessageArray.push(...getTaskFormErrors());
  errorMessage.innerText = errorMessageArray.join(" , ");
  if (errorMessageArray.length > 0) return;
  await submitForm();
}

/**
 * Returns the priority of the active priority button.
 * @returns {string} "urgent", "medium" or "low".
 */
function getSelectedPriority() {
  const btn = document.querySelector(".priority-btn.priority-active");
  return btn.classList.contains("priority-urgent") ? "urgent"
    : btn.classList.contains("priority-low") ? "low" : "medium";
}

/**
 * Returns the selected contacts in the assigned-to dropdown.
 * @returns {{id: string}[]} The selected contacts as id objects.
 */
function getAssignedContactIds() {
  return Array.from(document.querySelectorAll(".contact-option.selected")).map(
    (option) => ({ id: option.dataset.contactId }),
  );
}

/**
 * Reads the subtasks and keeps the done state of unchanged labels.
 * @param {{label: string, done: boolean}[]} [previous=[]] - Subtasks of the edited task.
 * @returns {{label: string, done: boolean}[]} The subtasks.
 */
function getSubtasks(previous = []) {
  saveSubtask();
  return Array.from(subTaskList.querySelectorAll(".subtask-text")).map((el) => {
    const label = el.textContent.trim();
    const old = previous.find((subtask) => subtask.label === label);
    return { label, done: old ? Boolean(old.done) : false };
  });
}

/**
 * Saves the task form: updates the session data and the database, then resets the form.
 * @returns {Promise<void>}
 */
async function submitForm() {
  const all = getSessionData("session-tasks");
  const existing = editingTaskId ? all.find((t) => t.id === editingTaskId) : null;
  const task = buildTaskFromForm(existing);
  saveSessionData("session-tasks", upsertTask(all, task));
  await putData("tasks/" + task.id, task);
  resetForm();
  if (!existing) showTaskAddedOverlay();
  if (typeof onTaskSaved === "function") onTaskSaved();
}

/**
 * Shows the "Task added to board" overlay and hides it again after 1.5 seconds.
 * @returns {void}
 */
function showTaskAddedOverlay() {
  const overlay = document.getElementById("task-added-overlay");
  if (!overlay) return;
  overlay.classList.add("visible");
  window.setTimeout(() => {
    window.location.href = "./board-layout.html";
  }, 1500);
}

/**
 * Builds the task object from the form fields.
 * @param {Object|null} existing - The task that is edited, or null for a new task.
 * @returns {Object} The task.
 */
function buildTaskFromForm(existing) {
  return {
    id: existing ? existing.id : String(Date.now()),
    title: taskTitleInput.value.trim(),
    state: existing ? existing.state : newTaskState,
    description: document.getElementById("task-description").value.trim(),
    dueDate: dueDate.value,
    priority: getSelectedPriority(),
    assignedTo: getAssignedContactIds(),
    category: taskCategory.value,
    subtasks: getSubtasks(existing ? existing.subtasks : []),
  };
}

/**
 * Replaces the task with the same id or appends it if it is new.
 * @param {Object[]} tasks - The current tasks.
 * @param {Object} task - The saved task.
 * @returns {Object[]} The updated list.
 */
function upsertTask(tasks, task) {
  const isEdit = tasks.some((t) => t.id === task.id);
  return isEdit ? tasks.map((t) => (t.id === task.id ? task : t)) : [...tasks, task];
}

list.style.display = "none";
document.getElementById("assigned-to-dropdown").classList.remove("open");

/**
 * Resets the whole add-task form including priority, contacts and subtasks.
 * @returns {void}
 */
function resetForm() {
  form.reset();
  errorMessageArray.length = 0;
  errorMessage.innerText = "";
  subTaskList.innerHTML = "";
  showSubtaskActions();
  resetPriority();
  resetAssignedContacts();
}

/**
 * Sets the priority back to "medium".
 * @returns {void}
 */
function resetPriority() {
  changePriority(document.querySelector(".priority-medium"));
}

/**
 * Deselects all contacts and clears the avatars.
 * @returns {void}
 */
function resetAssignedContacts() {
  list.innerHTML = "";
  document.getElementById("assigned-avatars").innerHTML = "";
}
