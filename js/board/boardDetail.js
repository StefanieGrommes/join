const taskDetailModal = document.getElementById("board-task-detail-modal");
const taskDetailRoot = document.getElementById("board-task-detail-root");

function deleteTask(taskId) {
  saveTasks(getTasks().filter((task) => task.id !== taskId));
  deleteData("tasks/" + taskId).catch(console.error);
  renderBoard();
}

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

function handleDetailRootClick(event) {
  if (event.target.closest(".board-detail-close")) closeDetailModal();
  else handleDetailAction(event);
}

function handleSubtaskToggle(event) {
  const checkbox = event.target.closest(".board-detail-subtask input[type='checkbox']");
  const task = getTaskById(taskDetailRoot.dataset.taskId);
  if (!checkbox || !task || !Array.isArray(task.subtasks)) return;
  const subtask = task.subtasks[Number(checkbox.dataset.subtaskIndex)];
  if (!subtask) return;
  subtask.done = checkbox.checked;
  updateTask(task);
  syncCardContent(task);
}

function handleCardClick(event) {
  if (event.target.closest(".board-card-move-button")) return;
  const card = event.target.closest(".board-card--task");
  if (card) openDetailModal(getTaskById(card.dataset.cardId));
}

function handleDetailEscape(event) {
  const isOpen = taskDetailModal.classList.contains("is-open");
  if (event.key === "Escape" && isOpen) closeDetailModal();
}

function handleDetailBackdropClick(event) {
  if (event.target === taskDetailModal) closeDetailModal();
}

function initTaskDetailModal() {
  if (!boardMainContainer || !taskDetailModal || !taskDetailRoot) return;
  taskDetailRoot.addEventListener("click", handleDetailRootClick);
  taskDetailRoot.addEventListener("change", handleSubtaskToggle);
  boardMainContainer.addEventListener("click", handleCardClick);
  taskDetailModal.addEventListener("click", handleDetailBackdropClick);
  document.addEventListener("keydown", handleDetailEscape);
}


function closeDetailModal() {
  taskDetailModal.classList.remove("is-open");
  taskDetailModal.inert = true;
  taskDetailRoot.innerHTML = "";
  taskDetailRoot.removeAttribute("data-task-id");
}

function openDetailModal(task) {
  if (!task) return;
  taskDetailRoot.innerHTML = renderTaskDetail(task);
  taskDetailRoot.dataset.taskId = task.id;
  taskDetailModal.classList.add("is-open");
  taskDetailModal.inert = false;
}
