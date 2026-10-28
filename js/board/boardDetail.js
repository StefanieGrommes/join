const taskDetailModal = document.getElementById("board-task-detail-modal");
const taskDetailRoot = document.getElementById("board-task-detail-root");
let assignedContactsPopover = null;
let assignedContactsTrigger = null;

/**
 * Deletes the task.
 *
 * @param {string} taskId - Id of the task to be deleted.
 * @returns {void}
 */
function deleteTask(taskId) {
  saveTasks(getTasks().filter((task) => task.id !== taskId));
  deleteData("tasks/" + taskId).catch(console.error);
  renderBoard();
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
  updateTask(task);
  syncCardContent(task);
}

/**
 * Opens the detail dialog when a task card is clicked.
 *
 * @param {MouseEvent} event - The click event.
 * @returns {void}
 */
function handleCardClick(event) {
  const contactsTrigger = event.target.closest(".board-assigned-contacts");
  if (contactsTrigger) {
    if (contactsTrigger.classList.contains("has-assignee-list")) {
      toggleAssignedContactsPopover(contactsTrigger);
    }
    return;
  }
  if (event.target.closest(".board-card-move-button")) return;
  const card = event.target.closest(".board-card--task");
  if (card) openDetailModal(getTaskById(card.dataset.cardId));
}

/**
 * Toggles the assigned-contact list for a task card.
 * @param {HTMLElement} trigger - The avatar row that opens the list.
 * @returns {void}
 */
function toggleAssignedContactsPopover(trigger) {
  if (assignedContactsTrigger === trigger) {
    closeAssignedContactsPopover();
    return;
  }
  closeAssignedContactsPopover();
  const card = trigger.closest(".board-card--task");
  if (!card) return;
  const task = getTaskById(card.dataset.cardId);
  const contacts = (task?.assignedTo || []).map(getContactById).filter(Boolean);
  if (contacts.length < 4) return;
  assignedContactsPopover = createAssignedContactsPopover(contacts);
  assignedContactsTrigger = trigger;
  document.body.appendChild(assignedContactsPopover);
  positionAssignedContactsPopover(trigger);
}

/**
 * Builds the existing Add Task contact list using only the task's assigned contacts.
 * @param {Object[]} contacts - Contacts assigned to the task.
 * @returns {HTMLUListElement} The scrollable contact list.
 */
function createAssignedContactsPopover(contacts) {
  const list = document.createElement("ul");
  list.className = "contact-list board-assigned-contact-list";
  list.id = "board-assigned-contact-list";
  list.setAttribute("aria-label", "Assigned contacts");
  list.innerHTML = contacts.map(getContactOptionTemplate).join("");
  list.querySelectorAll(".contact-option").forEach((option) => {
    option.classList.add("selected");
    const checkbox = option.querySelector(".checked-btn");
    checkbox.disabled = true;
    checkbox.setAttribute("aria-label", "Assigned");
    checkbox.querySelector("img").src = "../assets/checkbox-checked.svg";
  });
  return list;
}

/**
 * Positions the contact list beside its avatar row while keeping it in the viewport.
 * @param {HTMLElement} trigger - The avatar row that opened the list.
 * @returns {void}
 */
function positionAssignedContactsPopover(trigger) {
  const rect = trigger.getBoundingClientRect();
  const list = assignedContactsPopover;
  trigger.setAttribute("aria-expanded", "true");
  trigger.setAttribute("aria-controls", list.id);
  const width = Math.min(320, window.innerWidth - 16);
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
  const belowTop = rect.bottom + 8;
  const top = belowTop + list.offsetHeight <= window.innerHeight
    ? belowTop
    : Math.max(8, rect.top - list.offsetHeight - 8);
  list.style.left = `${left}px`;
  list.style.top = `${top}px`;
}

/**
 * Closes the assigned-contact list and optionally restores focus.
 * @param {boolean} [restoreFocus=false] - Whether to focus the avatar row.
 * @returns {void}
 */
function closeAssignedContactsPopover(restoreFocus = false) {
  if (assignedContactsPopover) assignedContactsPopover.remove();
  if (assignedContactsTrigger?.isConnected) {
    assignedContactsTrigger.setAttribute("aria-expanded", "false");
    assignedContactsTrigger.removeAttribute("aria-controls");
    if (restoreFocus) assignedContactsTrigger.focus();
  }
  assignedContactsPopover = null;
  assignedContactsTrigger = null;
}

/**
 * Toggles the contact list when its trigger is activated from the keyboard.
 * @param {KeyboardEvent} event - The keyboard event.
 * @returns {void}
 */
function handleAssignedContactsTriggerKeydown(event) {
  const trigger = event.target.closest(".board-assigned-contacts.has-assignee-list");
  if (!trigger || (event.key !== "Enter" && event.key !== " ")) return;
  event.preventDefault();
  toggleAssignedContactsPopover(trigger);
}

/**
 * Closes the contact list when the user clicks or scrolls outside it.
 * @param {Event} event - The outside interaction.
 * @returns {void}
 */
function handleAssignedContactsOutside(event) {
  if (assignedContactsPopover?.contains(event.target) || assignedContactsTrigger?.contains(event.target)) return;
  closeAssignedContactsPopover();
}

/**
 * Closes the contact list with Escape and returns focus to its trigger.
 * @param {KeyboardEvent} event - The keyboard event.
 * @returns {void}
 */
function handleAssignedContactsKeydown(event) {
  if (event.key !== "Escape" || !assignedContactsPopover) return;
  event.preventDefault();
  closeAssignedContactsPopover(true);
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
  boardMainContainer.addEventListener("keydown", handleAssignedContactsTriggerKeydown);
  taskDetailModal.addEventListener("click", handleDetailBackdropClick);
  document.addEventListener("keydown", handleDetailEscape);
  document.addEventListener("click", handleAssignedContactsOutside);
  document.addEventListener("keydown", handleAssignedContactsKeydown);
  document.addEventListener("scroll", handleAssignedContactsOutside, true);
  window.addEventListener("resize", () => closeAssignedContactsPopover());
}

/**
 * Closes the detailed Task Dialog.
 *
 * @returns {void}
 */
function closeDetailModal() {
  taskDetailModal.classList.remove("is-open");
  taskDetailModal.inert = true;
  taskDetailRoot.innerHTML = "";
  taskDetailRoot.removeAttribute("data-task-id");
}

/**
 * Opens the detailed Task Dialog.
 *
 * @param {Object} task - The task to show.
 * @returns {void}
 */
function openDetailModal(task) {
  if (!task) return;
  taskDetailRoot.innerHTML = renderTaskDetail(task);
  taskDetailRoot.dataset.taskId = task.id;
  taskDetailModal.classList.add("is-open");
  taskDetailModal.inert = false;
}
