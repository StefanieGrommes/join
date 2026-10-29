const boardTaskModal = document.getElementById("board-add-task-modal");
const boardTaskTitle = document.getElementById("board-task-dialog-title");
const boardTaskSaveLabel = document.querySelector("#board-add-task-modal .btn-create");

/**
 * Shows the add-task overlay.
 * @returns {void}
 */
function openBoardTaskModal() {
  boardTaskModal.classList.add("is-open");
  boardTaskModal.inert = false;
}

/**
 * Closes the overlay and resets it to the "Add Task" state.
 * @returns {void}
 */
function closeBoardTaskModal() {
  boardTaskModal.classList.remove("is-open");
  boardTaskModal.inert = true;
  editingTaskId = null;
  newTaskState = "todo";
  boardTaskTitle.textContent = "Add Task";
  boardTaskSaveLabel.firstChild.textContent = "Create Task ";
  resetForm();
}

/**
 * Opens the overlay for a new task in the given column.
 * @param {string} columnId - Id of the target column, e.g. "in-progress".
 * @returns {void}
 */
function openAddTaskModalForColumn(columnId) {
  closeBoardTaskModal();
  newTaskState = columnToState[columnId] || "todo";
  openBoardTaskModal();
}

/**
 * Selects the assigned contacts in the dropdown and renders their avatars.
 * @param {{id: string}[]} assigned - The assigned contacts.
 * @returns {void}
 */
function fillAssignedContacts(assigned) {
  const ids = assigned.map((contact) => contact.id);
  renderContactOptions(getSessionData("session-contacts"));
  list.querySelectorAll(".contact-option").forEach((option) => {
    if (ids.includes(option.dataset.contactId)) toggleContactSelection(option);
  });
  renderAssignedAvatars();
}

/**
 * Opens the overlay in edit mode and fills it with the task data.
 * @param {Object} task - The task to edit.
 * @returns {void}
 */
function openAddTaskEditModal(task) {
  closeBoardTaskModal();
  editingTaskId = task.id;
  setEditModalTexts();
  fillTaskFields(task);
  fillAssignedContacts(task.assignedTo || []);
  fillSubtaskList(task.subtasks || []);
  openBoardTaskModal();
}

/**
 * Sets the title and the save button label for edit mode.
 * @returns {void}
 */
function setEditModalTexts() {
  boardTaskTitle.textContent = "Edit Task";
  boardTaskSaveLabel.firstChild.textContent = "Save changes ";
}

/**
 * Fills the form fields and the priority with the task data.
 * @param {Object} task - The task to edit.
 * @returns {void}
 */
function fillTaskFields(task) {
  taskTitleInput.value = task.title || "";
  document.getElementById("task-description").value = task.description || "";
  dueDate.value = task.dueDate || "";
  taskCategory.value = task.category || "";
  changePriority(document.querySelector(`.priority-${task.priority || "medium"}`));
}

/**
 * Adds the subtasks of the task to the subtask list.
 * @param {Object[]} subtasks - The subtasks of the task.
 * @returns {void}
 */
function fillSubtaskList(subtasks) {
  subtasks.forEach((subtask) => {
    subTaskList.insertAdjacentHTML("beforeend", getSubtaskItemTemplate(subtask.label));
  });
}

/**
 * Connects the buttons and the backdrop of the overlay.
 * @returns {void}
 */
function initBoardTaskForm() {
  document.getElementById("board-open-add-task-modal")
    .addEventListener("click", () => openAddTaskModalForColumn("todo"));
  document.querySelectorAll(".board-header-column button[data-column]").forEach((button) => {
    button.addEventListener("click", () => openAddTaskModalForColumn(button.dataset.column));
  });
  document.getElementById("board-task-close-button").addEventListener("click", closeBoardTaskModal);
  boardTaskModal.addEventListener("click", (event) => {
    if (event.target === boardTaskModal) closeBoardTaskModal();
  });
}

/**
 * Closes the overlay and redraws the board after a task was saved.
 * @returns {void}
 */
function onTaskSaved() {
  closeBoardTaskModal();
  renderBoard();
}