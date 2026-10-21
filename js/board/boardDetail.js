const taskDetailModal = document.getElementById("board-task-detail-modal");
const taskDetailRoot = document.getElementById("board-task-detail-root");

/**
 * Deletes a task from the data, the saved state and the board.
 *
 * @param {string} taskId - Id of the task.
 * @returns {void}
 */
function deleteTask(taskId) {
  const taskIndex = tasks.findIndex((task) => task.id === taskId);
  if (taskIndex === -1) return;
  const boardState = loadBoardState();
  tasks.splice(taskIndex, 1);
  delete boardState[taskId];
  saveBoardState(boardState);
  saveTasks();
  renderBoard();
}

/**
 * Closes the task detail dialog and clears its content.
 *
 * @returns {void}
 */
function closeDetailModal() {
  taskDetailModal.classList.remove("is-open");
  taskDetailModal.setAttribute("aria-hidden", "true");
  taskDetailRoot.innerHTML = "";
  taskDetailRoot.removeAttribute("data-task-id");
}

/**
 * Opens the task detail dialog.
 *
 * @param {Object|null} task - The task to show.
 * @returns {void}
 */
function openDetailModal(task) {
  if (!task) return;
  taskDetailRoot.innerHTML = renderTaskDetail(task);
  taskDetailRoot.dataset.taskId = task.id;
  taskDetailModal.classList.add("is-open");
  taskDetailModal.setAttribute("aria-hidden", "false");
}

/**
 * Handles the delete and edit buttons of the detail dialog.
 *
 * @param {MouseEvent} event - The click event.
 * @returns {void}
 */
function handleDetailAction(event) {
  const action = event.target.closest("[data-action]");
  const task = getTaskById(taskDetailRoot.dataset.taskId);
  if (!action || !task) return;
  if (action.dataset.action === "delete-task") {
    if (!window.confirm("Delete this task?")) return;
    deleteTask(task.id);
    closeDetailModal();
  } else if (action.dataset.action === "edit-task") {
    closeDetailModal();
    openAddTaskEditModal(task);
  }
}

/**
 * Routes clicks inside the detail dialog to closing or to an action.
 *
 * @param {MouseEvent} event - The click event.
 * @returns {void}
 */
function handleDetailRootClick(event) {
  if (event.target.closest(".board-detail-close")) closeDetailModal();
  else handleDetailAction(event);
}

/**
 * Stores the done state of a subtask when its checkbox changes.
 *
 * @param {Event} event - The change event.
 * @returns {void}
 */
function handleSubtaskToggle(event) {
  const checkbox = event.target.closest(".board-detail-subtask input[type='checkbox']");
  const task = getTaskById(taskDetailRoot.dataset.taskId);
  if (!checkbox || !task || !Array.isArray(task.subtasks)) return;
  const subtask = task.subtasks[Number(checkbox.dataset.subtaskIndex)];
  if (!subtask) return;
  subtask.done = checkbox.checked;
  saveTasks();
  syncCardContent(task);
}

/**
 * Opens the detail dialog when a task card is clicked.
 *
 * @param {MouseEvent} event - The click event.
 * @returns {void}
 */
function handleCardClick(event) {
  if (event.target.closest(".board-card-move-button")) return;
  const card = event.target.closest(".board-card--task");
  if (card) openDetailModal(getTaskById(card.dataset.cardId));
}

/**
 * Closes the detail dialog when Escape is pressed.
 *
 * @param {KeyboardEvent} event - The keydown event.
 * @returns {void}
 */
function handleDetailEscape(event) {
  const isOpen = taskDetailModal.classList.contains("is-open");
  if (event.key === "Escape" && isOpen) closeDetailModal();
}

/**
 * Closes the detail dialog when its dark backdrop is clicked.
 *
 * @param {MouseEvent} event - The click event.
 * @returns {void}
 */
function handleDetailBackdropClick(event) {
  if (event.target === taskDetailModal) closeDetailModal();
}

/**
 * Sets up the task detail dialog.
 *
 * @returns {void}
 */
function initTaskDetailModal() {
  if (!boardMainContainer || !taskDetailModal || !taskDetailRoot) return;
  taskDetailRoot.addEventListener("click", handleDetailRootClick);
  taskDetailRoot.addEventListener("change", handleSubtaskToggle);
  boardMainContainer.addEventListener("click", handleCardClick);
  taskDetailModal.addEventListener("click", handleDetailBackdropClick);
  document.addEventListener("keydown", handleDetailEscape);
}
