const boardTaskModal = document.getElementById("board-add-task-modal");
const boardTaskTitle = document.getElementById("board-task-dialog-title");
const boardTaskSaveLabel = document.querySelector("#board-add-task-modal .btn-create");

function openBoardTaskModal() {
  boardTaskModal.classList.add("is-open");
  boardTaskModal.inert = false;
}

function closeBoardTaskModal() {
  boardTaskModal.classList.remove("is-open");
  boardTaskModal.inert = true;
  editingTaskId = null;
  newTaskState = "todo";
  boardTaskTitle.textContent = "Add Task";
  boardTaskSaveLabel.firstChild.textContent = "Create Task ";
  resetForm();
}

function openAddTaskModalForColumn(columnId) {
  closeBoardTaskModal();
  newTaskState = columnToState[columnId] || "todo";
  openBoardTaskModal();
}

function fillAssignedContacts(assigned) {
  const ids = assigned.map((contact) => contact.id);
  renderContactOptions(getSessionData("session-contacts"));
  list.querySelectorAll(".contact-option").forEach((option) => {
    if (ids.includes(option.dataset.contactId)) toggleContactSelection(option);
  });
  renderAssignedAvatars();
}

function openAddTaskEditModal(task) {
  closeBoardTaskModal();
  editingTaskId = task.id;
  boardTaskTitle.textContent = "Edit Task";
  boardTaskSaveLabel.firstChild.textContent = "Save changes ";
  taskTitleInput.value = task.title || "";
  document.getElementById("task-description").value = task.description || "";
  dueDate.value = task.dueDate || "";
  taskCategory.value = task.category || "";
  changePriority(document.querySelector(`.priority-${task.priority || "medium"}`));
  fillAssignedContacts(task.assignedTo || []);
  (task.subtasks || []).forEach((subtask) => {
    subTaskList.insertAdjacentHTML("beforeend", getSubtaskItemTemplate(subtask.label));
  });
  openBoardTaskModal();
}

function onTaskSaved() {
  closeBoardTaskModal();
  renderBoard();
}

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