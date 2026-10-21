const addTaskPriorityClasses = { Urgent: "priority-urgent", Medium: "priority-medium", Low: "priority-low" };
const addTaskPriorityColors = { Urgent: "#f66a5f", Medium: "#f9a35c", Low: "#5bc0be" };
const addTaskCategoryColors = { "Technical Task": "#2bc7b7", "User Story": "#2d8cff" };

const addTaskModal = document.getElementById("board-add-task-modal");
const addTaskForm = document.getElementById("board-task-form");
const addTaskSaveButton = document.getElementById("board-task-save-button");
const addTaskClearButton = document.getElementById("board-task-clear-button");
const addTaskCloseButton = document.getElementById("board-task-close-button");
const addTaskOpenButton = document.getElementById("board-open-add-task-modal");
const addTaskDialogTitle = document.getElementById("board-task-dialog-title");
const addTaskTitleInput = document.getElementById("taskTitle");
const addTaskDescriptionInput = document.getElementById("taskDescription");
const addTaskDateInput = document.getElementById("taskDueDate");
const addTaskCategoryInput = document.getElementById("taskCategory");
const addTaskDropdown = document.getElementById("assigned-to-dropdown");
const addTaskAvatars = document.getElementById("assigned-avatars");
const addTaskRequiredFields = [addTaskTitleInput, addTaskDateInput, addTaskCategoryInput];
const addTaskHeaderButtons = Array.from(document.querySelectorAll(".board-header-column button[data-column]"));

let addTaskEditingId = null;

/**
 * Reads the selected priority from the form.
 *
 * @returns {string} "Urgent", "Medium" or "Low".
 */
function getAddTaskPriority() {
  const active = addTaskForm.querySelector(".priority-btn.priority-active");
  const match = Object.keys(addTaskPriorityClasses).find((key) => {
    return active && active.classList.contains(addTaskPriorityClasses[key]);
  });
  return match || "Medium";
}

/**
 * Selects a priority button in the form.
 *
 * @param {string} value - "Urgent", "Medium" or "Low".
 * @returns {void}
 */
function setAddTaskPriority(value) {
  const cssClass = addTaskPriorityClasses[value] || addTaskPriorityClasses.Medium;
  changePriority(addTaskForm.querySelector(`.${cssClass}`));
}

/**
 * Reads the initials of all selected contacts.
 *
 * @returns {string[]} Initials such as ["AM", "EM"].
 */
function getSelectedAssignedContacts() {
  return Array.from(document.querySelectorAll("#assigned-to-list .contact-option.selected"))
    .map((option) => option.querySelector(".contact-avatar").textContent.trim());
}

/**
 * Reads the subtasks from the form and keeps the done state of unchanged labels.
 *
 * @param {Object[]} [previous=[]] - Previous subtasks of the edited task.
 * @returns {{label: string, done: boolean}[]} The subtasks.
 */
function readAddTaskSubtasks(previous = []) {
  saveSubtask();
  return Array.from(subTaskList.querySelectorAll(".subtask-text")).map((element) => {
    const label = element.textContent.trim();
    const old = previous.find((subtask) => subtask.label === label);
    return { label, done: old ? Boolean(old.done) : false };
  });
}

/**
 * Builds the task fields shared by creating and editing a task.
 *
 * @returns {Object} Task data without id, status and subtasks.
 */
function buildAddTaskData() {
  const priority = getAddTaskPriority();
  const category = addTaskCategoryInput.value;
  return {
    title: addTaskTitleInput.value.trim(),
    description: addTaskDescriptionInput.value.trim(),
    dueDate: addTaskDateInput.value,
    priority,
    priorityColor: addTaskPriorityColors[priority] || addTaskPriorityColors.Low,
    category,
    categoryColor: addTaskCategoryColors[category] || addTaskCategoryColors["User Story"],
    assignedTo: getSelectedAssignedContacts()
  };
}

/**
 * Shows or clears the error state of a form field.
 *
 * @param {HTMLElement} field - The input element.
 * @param {string} message - Error text, an empty string clears the error.
 * @returns {void}
 */
function setAddTaskError(field, message) {
  const error = field.closest(".form-field").querySelector(".field-error");
  field.classList.toggle("input-error", Boolean(message));
  if (error) error.textContent = message;
}

/**
 * Clears the errors of all required fields.
 *
 * @returns {void}
 */
function clearAddTaskErrors() {
  addTaskRequiredFields.forEach((field) => setAddTaskError(field, ""));
}

/**
 * Validates the required fields and shows an error for each missing one.
 *
 * @returns {boolean} True if all required fields are filled.
 */
function validateAddTaskForm() {
  let isValid = true;
  addTaskRequiredFields.forEach((field) => {
    const isMissing = !field.value.trim();
    setAddTaskError(field, isMissing ? "This field is required" : "");
    if (isMissing) isValid = false;
  });
  return isValid;
}

/**
 * Clears the error of a required field as soon as the user changes it.
 *
 * @returns {void}
 */
function bindAddTaskFieldReset() {
  addTaskRequiredFields.forEach((field) => {
    field.addEventListener("input", () => setAddTaskError(field, ""));
  });
}

/**
 * Sets the text of the save button without touching its icon.
 *
 * @param {string} text - New label text.
 * @returns {void}
 */
function setAddTaskSaveLabel(text) {
  addTaskSaveButton.firstChild.textContent = text;
}

/**
 * Resets all form fields, the contact list, the subtasks and the errors.
 *
 * @returns {void}
 */
function resetAddTaskForm() {
  addTaskForm.reset();
  list.innerHTML = "";
  list.style.display = "none";
  addTaskDropdown.classList.remove("open");
  addTaskAvatars.innerHTML = "";
  subTaskList.innerHTML = "";
  showSubtaskActions();
  setAddTaskPriority("Medium");
  clearAddTaskErrors();
}

/**
 * Resets the dialog to the "Add Task" state.
 *
 * @returns {void}
 */
function resetAddTaskState() {
  addTaskEditingId = null;
  addTaskDialogTitle.textContent = "Add Task";
  setAddTaskSaveLabel("Create Task ");
  addTaskModal.dataset.status = "todo";
  resetAddTaskForm();
}

/**
 * Shows the add-task dialog.
 *
 * @returns {void}
 */
function showAddTaskModal() {
  addTaskModal.classList.add("is-open");
  addTaskModal.setAttribute("aria-hidden", "false");
}

/**
 * Opens the dialog for a new task in the given column.
 *
 * @param {string} status - Id of the target column.
 * @returns {void}
 */
function openAddTaskModalForColumn(status) {
  resetAddTaskState();
  addTaskModal.dataset.status = status || "todo";
  showAddTaskModal();
}

/**
 * Closes the dialog and resets it.
 *
 * @returns {void}
 */
function closeAddTaskModal() {
  addTaskModal.classList.remove("is-open");
  addTaskModal.setAttribute("aria-hidden", "true");
  resetAddTaskState();
}

/**
 * Fills the basic form fields with the data of a task.
 *
 * @param {Object} task - The task to edit.
 * @returns {void}
 */
function fillAddTaskForm(task) {
  addTaskTitleInput.value = task.title || "";
  addTaskDescriptionInput.value = task.description || "";
  addTaskDateInput.value = task.dueDate || "";
  addTaskCategoryInput.value = task.category || "";
  setAddTaskPriority(task.priority || "Medium");
}

/**
 * Renders the contact list and selects the assigned contacts.
 *
 * @param {string[]} assigned - Initials of the assigned contacts.
 * @returns {void}
 */
function fillAddTaskContacts(assigned) {
  renderContactOptions(getSessionData("session-contacts"));
  list.querySelectorAll(".contact-option").forEach((option) => {
    const initials = option.querySelector(".contact-avatar").textContent.trim();
    if (assigned.includes(initials)) toggleContactSelection(option);
  });
  renderAssignedAvatars();
}

/**
 * Renders the subtasks of a task into the subtask list.
 *
 * @param {{label: string}[]} subtasks - Subtasks of the task.
 * @returns {void}
 */
function fillAddTaskSubtasks(subtasks) {
  subtasks.forEach((subtask) => {
    subTaskList.insertAdjacentHTML("beforeend", getSubtaskItemTemplate(subtask.label));
  });
}

/**
 * Opens the dialog in edit mode for an existing task.
 *
 * @param {Object} task - The task to edit.
 * @returns {void}
 */
function openAddTaskEditModal(task) {
  if (!task) return;
  resetAddTaskState();
  addTaskEditingId = task.id;
  addTaskDialogTitle.textContent = "Edit Task";
  setAddTaskSaveLabel("Save changes ");
  fillAddTaskForm(task);
  fillAddTaskContacts(task.assignedTo || []);
  fillAddTaskSubtasks(task.subtasks || []);
  showAddTaskModal();
}

/**
 * Writes the form data into the task that is being edited.
 *
 * @returns {void}
 */
function updateAddTask() {
  const task = getTaskById(addTaskEditingId);
  if (!task) return;
  Object.assign(task, buildAddTaskData(), { subtasks: readAddTaskSubtasks(task.subtasks) });
  saveTasks();
}

/**
 * Creates a new task from the form data and stores its column.
 *
 * @returns {void}
 */
function createAddTask() {
  const newTask = {
    ...buildAddTaskData(),
    id: `task-${Date.now()}`,
    status: addTaskModal.dataset.status || "todo",
    subtasks: readAddTaskSubtasks(),
    progress: 0
  };
  newTask.badge = newTask.category;
  tasks.unshift(newTask);
  saveTasks();
  saveBoardState({ ...loadBoardState(), [newTask.id]: newTask.status });
}

/**
 * Validates the form, saves the task, re-renders the board and closes the dialog.
 *
 * @returns {void}
 */
function saveAddTask() {
  if (!validateAddTaskForm()) return;
  if (addTaskEditingId) updateAddTask();
  else createAddTask();
  renderBoard();
  closeAddTaskModal();
}

/**
 * Handles the submit event of the add-task form.
 *
 * @param {SubmitEvent} event - The submit event.
 * @returns {void}
 */
function handleAddTaskSubmit(event) {
  event.preventDefault();
  saveAddTask();
}

/**
 * Closes the dialog when the dark backdrop is clicked.
 *
 * @param {MouseEvent} event - The click event.
 * @returns {void}
 */
function handleAddTaskBackdropClick(event) {
  if (event.target === addTaskModal) closeAddTaskModal();
}

/**
 * Lets the column buttons in the board header open the dialog for their column.
 *
 * @returns {void}
 */
function bindAddTaskHeaderButtons() {
  addTaskHeaderButtons.forEach((button) => {
    button.addEventListener("click", () => openAddTaskModalForColumn(button.dataset.column));
  });
}

/**
 * Sets up the add and edit task dialog.
 *
 * @returns {void}
 */
function initAddTaskModal() {
  bindAddTaskFieldReset();
  bindAddTaskHeaderButtons();
  addTaskForm.addEventListener("submit", handleAddTaskSubmit);
  addTaskOpenButton.addEventListener("click", () => openAddTaskModalForColumn("todo"));
  addTaskCloseButton.addEventListener("click", closeAddTaskModal);
  addTaskClearButton.addEventListener("click", resetAddTaskForm);
  addTaskModal.addEventListener("click", handleAddTaskBackdropClick);
}
