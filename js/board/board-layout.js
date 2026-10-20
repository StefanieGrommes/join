const boardStorageKey = "join-board-layout-state";
const columnIds = ["todo", "in-progress", "await-feedback", "done"];
const columnLabels = {
  "todo": "To do",
  "in-progress": "In progress",
  "await-feedback": "Await feedback",
  "done": "Done"
};
const addTaskPriorityClasses = { Urgent: "priority-urgent", Medium: "priority-medium", Low: "priority-low" };
const addTaskPriorityColors = { Urgent: "#f66a5f", Medium: "#f9a35c", Low: "#5bc0be" };
const addTaskCategoryColors = { "Technical Task": "#2bc7b7", "User Story": "#2d8cff" };

const boardMainContainer = document.querySelector(".board-main-container");
const taskDetailModal = document.getElementById("board-task-detail-modal");
const taskDetailRoot = document.getElementById("board-task-detail-root");
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

let boardSearchQuery = "";
let draggedCard = null;
let moveMenu = null;
let moveMenuButton = null;
let addTaskEditingId = null;

/**
 * Applies or removes the fixed mobile top navigation styles.
 *
 * @param {HTMLElement} topNav - The board specific mobile navigation element.
 * @param {boolean} isMobile - Whether the viewport is in mobile mode.
 * @returns {void}
 */
function applyMobileTopNavStyles(topNav, isMobile) {
  const styles = { display: "flex", position: "fixed", top: "0", left: "0", right: "0", gridArea: "auto" };
  Object.entries(styles).forEach(([property, value]) => {
    topNav.style[property] = isMobile ? value : "";
  });
}

/**
 * Switches between the board mobile navigation and the generic header
 * depending on the viewport width (mobile: 768px or less).
 *
 * @returns {void}
 */
function syncBoardMobileNavigation() {
  const topNav = document.querySelector(".board-mobile-top-nav");
  const genericHeader = document.querySelector(".nav-mobile");
  const isMobile = window.innerWidth <= 768;
  if (topNav) applyMobileTopNavStyles(topNav, isMobile);
  if (genericHeader) genericHeader.style.display = isMobile ? "none" : "";
}

/**
 * Returns the placeholder text for an empty column.
 *
 * @param {string} columnId - Id of the column, e.g. "todo".
 * @returns {string} Text such as "No tasks To do".
 */
function getEmptyColumnMessage(columnId) {
  const label = columnLabels[columnId];
  return label ? `No tasks ${label}` : "No tasks";
}

/**
 * Returns the visible heading of a column.
 *
 * @param {string} columnId - Id of the column.
 * @returns {string} Column name such as "In progress".
 */
function getColumnLabel(columnId) {
  return columnLabels[columnId] || "Board";
}

/**
 * Loads the saved task-to-column mapping from localStorage.
 *
 * @returns {Object<string, string>} Object { taskId: columnId } or an empty object.
 */
function loadBoardState() {
  try {
    const storedState = window.localStorage.getItem(boardStorageKey);
    return storedState ? JSON.parse(storedState) : {};
  } catch {
    return {};
  }
}

/**
 * Saves the task-to-column mapping to localStorage.
 *
 * @param {Object<string, string>} state - Object { taskId: columnId }.
 * @returns {void}
 */
function saveBoardState(state) {
  window.localStorage.setItem(boardStorageKey, JSON.stringify(state));
}

/**
 * Creates the default mapping in which every task is in "todo".
 *
 * @returns {Object<string, string>} Object { taskId: "todo" }.
 */
function getDefaultBoardState() {
  if (!Array.isArray(tasks)) return {};
  return tasks.reduce((state, task) => {
    state[task.id] = "todo";
    return state;
  }, {});
}

/**
 * Merges the default mapping with the saved mapping.
 *
 * @returns {Object<string, string>} Object { taskId: columnId }.
 */
function getBoardState() {
  return { ...getDefaultBoardState(), ...loadBoardState() };
}

/**
 * Finds a task by its id.
 *
 * @param {string} taskId - Id of the task.
 * @returns {Object|null} The task or null if it does not exist.
 */
function getTaskById(taskId) {
  if (!taskId || !Array.isArray(tasks)) return null;
  return tasks.find((task) => task.id === taskId) || null;
}

/**
 * Moves a task to another column and persists the change.
 *
 * @param {string} taskId - Id of the task.
 * @param {string} columnId - Id of the target column.
 * @returns {boolean} True on success, false if the task or column does not exist.
 */
function moveBoardTask(taskId, columnId) {
  const task = getTaskById(taskId);
  if (!task || !columnIds.includes(columnId)) {
    console.error("Cannot move task: task or target column not found.", { taskId, columnId });
    return false;
  }
  saveBoardState({ ...getBoardState(), [taskId]: columnId });
  task.status = columnId;
  return true;
}

/**
 * Creates the hidden "Move to" menu element and appends it to the body.
 *
 * @returns {HTMLElement} The menu element.
 */
function createMoveMenu() {
  const menu = document.createElement("div");
  menu.id = "board-move-menu";
  menu.className = "board-move-menu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "Move to");
  menu.hidden = true;
  document.body.appendChild(menu);
  return menu;
}

/**
 * Closes the "Move to" menu and optionally restores focus to its trigger button.
 *
 * @param {boolean} [restoreFocus=false] - Whether to focus the trigger button again.
 * @returns {void}
 */
function closeMoveMenu(restoreFocus = false) {
  moveMenu.hidden = true;
  if (moveMenuButton) {
    moveMenuButton.setAttribute("aria-expanded", "false");
    if (restoreFocus) moveMenuButton.focus();
  }
  moveMenuButton = null;
}

/**
 * Moves a task via the menu, re-renders the board and focuses the moved card.
 *
 * @param {string} taskId - Id of the task.
 * @param {string} columnId - Id of the target column.
 * @returns {void}
 */
function moveTaskFromMenu(taskId, columnId) {
  if (!moveBoardTask(taskId, columnId)) return;
  closeMoveMenu();
  renderBoard();
  const movedCard = document.querySelector(`.board-card--task[data-card-id="${taskId}"]`);
  if (movedCard) movedCard.querySelector(".board-card-move-button").focus();
}

/**
 * Creates one menu item that moves the card to the column at the given index.
 *
 * @param {HTMLElement} card - The task card.
 * @param {number} targetIndex - Index of the target column in columnIds.
 * @param {number} currentIndex - Index of the current column in columnIds.
 * @returns {HTMLButtonElement} The menu item button.
 */
function createMoveOption(card, targetIndex, currentIndex) {
  const option = document.createElement("button");
  const arrow = document.createElement("span");
  option.type = "button";
  option.setAttribute("role", "menuitem");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = targetIndex < currentIndex ? "\u2191" : "\u2193";
  option.append(arrow, document.createTextNode(getColumnLabel(columnIds[targetIndex])));
  option.addEventListener("click", () => moveTaskFromMenu(card.dataset.cardId, columnIds[targetIndex]));
  return option;
}

/**
 * Fills the "Move to" menu with the previous and next column of a card.
 *
 * @param {HTMLElement} card - The task card the menu belongs to.
 * @returns {void}
 */
function fillMoveMenu(card) {
  const currentIndex = columnIds.indexOf(card.closest(".board-main-column").dataset.column);
  const heading = document.createElement("p");
  heading.className = "board-move-menu-title";
  heading.textContent = "Move to";
  moveMenu.replaceChildren(heading);
  [currentIndex - 1, currentIndex + 1]
    .filter((index) => index >= 0 && index < columnIds.length)
    .forEach((index) => moveMenu.appendChild(createMoveOption(card, index, currentIndex)));
}

/**
 * Positions the menu next to its trigger button and keeps it inside the viewport.
 *
 * @param {HTMLElement} button - The trigger button.
 * @returns {void}
 */
function positionMoveMenu(button) {
  const rect = button.getBoundingClientRect();
  const width = moveMenu.offsetWidth;
  const height = moveMenu.offsetHeight;
  const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
  const fitsBelow = rect.bottom + height + 8 <= window.innerHeight;
  const top = fitsBelow ? rect.bottom + 8 : Math.max(8, rect.top - height - 8);
  moveMenu.style.left = `${left}px`;
  moveMenu.style.top = `${top}px`;
}

/**
 * Opens the "Move to" menu for a card.
 *
 * @param {HTMLElement} button - The move button of the card.
 * @returns {void}
 */
function openMoveMenu(button) {
  closeMoveMenu();
  moveMenuButton = button;
  button.setAttribute("aria-expanded", "true");
  fillMoveMenu(button.closest(".board-card--task"));
  moveMenu.hidden = false;
  positionMoveMenu(button);
  moveMenu.querySelector("button").focus();
}

/**
 * Opens or closes the menu when a move button is clicked (screens up to 360px).
 *
 * @param {MouseEvent} event - The click event.
 * @returns {void}
 */
function handleMoveButtonClick(event) {
  const button = event.target.closest(".board-card-move-button");
  if (!button || !window.matchMedia("(max-width: 360px)").matches) return;
  if (moveMenuButton === button) closeMoveMenu(true);
  else openMoveMenu(button);
}

/**
 * Closes the menu when the user clicks outside of it.
 *
 * @param {MouseEvent} event - The click event.
 * @returns {void}
 */
function handleMoveMenuOutsideClick(event) {
  const isInside = moveMenu.contains(event.target);
  if (!isInside && !event.target.closest(".board-card-move-button")) closeMoveMenu();
}

/**
 * Closes the menu when something outside of it is scrolled.
 *
 * @param {Event} event - The scroll event.
 * @returns {void}
 */
function handleMoveMenuScroll(event) {
  if (!moveMenu.contains(event.target)) closeMoveMenu();
}

/**
 * Focuses a menu item depending on the pressed navigation key.
 *
 * @param {string} key - One of "ArrowDown", "ArrowUp", "Home" or "End".
 * @returns {void}
 */
function focusMoveMenuOption(key) {
  const options = Array.from(moveMenu.querySelectorAll("button"));
  const index = options.indexOf(document.activeElement);
  const step = key === "ArrowDown" ? 1 : -1;
  let nextIndex = (index + step + options.length) % options.length;
  if (key === "Home") nextIndex = 0;
  if (key === "End") nextIndex = options.length - 1;
  options[nextIndex].focus();
}

/**
 * Handles keyboard control while the menu is open.
 *
 * @param {KeyboardEvent} event - The keydown event.
 * @returns {void}
 */
function handleMoveMenuKeydown(event) {
  if (moveMenu.hidden) return;
  if (event.key === "Escape" || event.key === "Tab") {
    if (event.key === "Escape") event.preventDefault();
    closeMoveMenu(true);
  } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
    event.preventDefault();
    focusMoveMenuOption(event.key);
  }
}

/**
 * Sets up the "Move to" menu used on small screens instead of drag and drop.
 *
 * @returns {void}
 */
function initBoardMoveMenu() {
  if (!boardMainContainer) return;
  moveMenu = createMoveMenu();
  boardMainContainer.addEventListener("click", handleMoveButtonClick);
  boardMainContainer.addEventListener("input", () => closeMoveMenu());
  document.addEventListener("click", handleMoveMenuOutsideClick);
  document.addEventListener("keydown", handleMoveMenuKeydown);
  document.addEventListener("scroll", handleMoveMenuScroll, true);
  window.addEventListener("resize", () => closeMoveMenu());
}

/**
 * Returns all board columns.
 *
 * @returns {HTMLElement[]} Array of column elements.
 */
function getBoardColumns() {
  return Array.from(document.querySelectorAll(".board-main-column"));
}

/**
 * Starts dragging a card (disabled on screens up to 360px).
 *
 * @param {DragEvent} event - The dragstart event.
 * @param {HTMLElement} card - The dragged card.
 * @returns {void}
 */
function handleCardDragStart(event, card) {
  if (window.matchMedia("(max-width: 360px)").matches) {
    event.preventDefault();
    return;
  }
  draggedCard = card;
  card.classList.add("is-dragging");
  card.setAttribute("data-dragging", "true");
}

/**
 * Cleans up drag styles after dragging ends.
 *
 * @param {HTMLElement} card - The dragged card.
 * @returns {void}
 */
function handleCardDragEnd(card) {
  draggedCard = null;
  card.classList.remove("is-dragging");
  card.removeAttribute("data-dragging");
  getBoardColumns().forEach((column) => column.classList.remove("is-drop-target"));
}

/**
 * Attaches the drag events to a task card.
 *
 * @param {HTMLElement} card - The task card.
 * @returns {void}
 */
function bindCardDragEvents(card) {
  card.addEventListener("dragstart", (event) => handleCardDragStart(event, card));
  card.addEventListener("dragend", () => handleCardDragEnd(card));
}

/**
 * Handles dropping a card into a column.
 *
 * @param {DragEvent} event - The drop event.
 * @param {HTMLElement} column - The target column.
 * @returns {void}
 */
function handleColumnDrop(event, column) {
  event.preventDefault();
  if (!draggedCard) return;
  const taskId = draggedCard.dataset.cardId;
  draggedCard = null;
  column.classList.remove("is-drop-target");
  if (moveBoardTask(taskId, column.dataset.column)) renderBoard();
}

/**
 * Attaches the drag-over, drag-leave and drop events to a column.
 *
 * @param {HTMLElement} column - The column element.
 * @returns {void}
 */
function bindColumnDropEvents(column) {
  column.ondragover = (event) => {
    if (!draggedCard) return;
    event.preventDefault();
    column.classList.add("is-drop-target");
  };
  column.ondragleave = () => column.classList.remove("is-drop-target");
  column.ondrop = (event) => handleColumnDrop(event, column);
}

/**
 * Creates the header of a column with its title and add button.
 *
 * @param {string} columnId - Id of the column.
 * @returns {HTMLElement} The header element.
 */
function createColumnHeader(columnId) {
  const header = document.createElement("div");
  const title = document.createElement("h2");
  const addButton = document.createElement("button");
  header.className = "board-main-column-header";
  title.className = "board-main-column-title";
  title.textContent = getColumnLabel(columnId);
  addButton.type = "button";
  addButton.className = "board-main-column-add-button";
  addButton.dataset.column = columnId;
  addButton.setAttribute("aria-label", `Add ${getColumnLabel(columnId)}`);
  addButton.textContent = "+";
  header.append(title, addButton);
  return header;
}

/**
 * Creates the empty content area of a column.
 *
 * @returns {HTMLElement} The content element.
 */
function createColumnContent() {
  const content = document.createElement("div");
  content.className = "board-main-column-content";
  return content;
}

/**
 * Resets all columns to header and empty content and removes the search hint.
 *
 * @returns {void}
 */
function resetBoardColumns() {
  const emptyState = boardMainContainer.querySelector(".board-search-empty-state");
  if (emptyState) emptyState.remove();
  getBoardColumns().forEach((column) => {
    column.style.display = "";
    column.replaceChildren(createColumnHeader(column.dataset.column), createColumnContent());
  });
}

/**
 * Adds a hint to every column that contains no task card.
 *
 * @returns {void}
 */
function renderEmptyColumnHints() {
  getBoardColumns().forEach((column) => {
    const content = column.querySelector(".board-main-column-content");
    if (content.querySelector(".board-card--task")) return;
    const hint = document.createElement("p");
    hint.className = "board-empty-state";
    hint.textContent = getEmptyColumnMessage(column.dataset.column);
    hint.setAttribute("aria-label", hint.textContent);
    content.appendChild(hint);
  });
}

/**
 * Hides all columns and shows the "no results" hint.
 *
 * @returns {void}
 */
function renderSearchEmptyState() {
  const message = document.createElement("p");
  getBoardColumns().forEach((column) => {
    column.style.display = "none";
  });
  message.className = "board-search-empty-state";
  message.textContent = "Keine Ergebnisse gefunden";
  message.setAttribute("aria-label", message.textContent);
  boardMainContainer.appendChild(message);
}

/**
 * Checks whether the current search query is long enough to filter (3+ characters).
 *
 * @returns {boolean} True if a search is active.
 */
function hasActiveSearch() {
  return boardSearchQuery.trim().length >= 3;
}

/**
 * Returns the tasks matching the current search query.
 *
 * @returns {Object[]} All tasks if no search is active, otherwise the matches.
 */
function getVisibleTasks() {
  if (!Array.isArray(tasks)) return [];
  if (!hasActiveSearch()) return tasks;
  const query = boardSearchQuery.trim().toLowerCase();
  return tasks.filter((task) => {
    const title = String(task.title || "").toLowerCase();
    const description = String(task.description || "").toLowerCase();
    return title.includes(query) || description.includes(query);
  });
}

/**
 * Renders a task card into its column.
 *
 * @param {Object} task - The task to render.
 * @param {Object<string, string>} boardState - Mapping { taskId: columnId }.
 * @returns {void}
 */
function appendTaskCard(task, boardState) {
  const columnId = boardState[task.id] || "todo";
  const column = getBoardColumns().find((item) => item.dataset.column === columnId);
  const content = column && column.querySelector(".board-main-column-content");
  if (!content) return;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = renderTaskCard(task);
  const card = wrapper.firstElementChild;
  if (!card) return;
  bindCardDragEvents(card);
  content.appendChild(card);
}

/**
 * Renders the complete board: columns, task cards and hints.
 *
 * @returns {void}
 */
function renderBoard() {
  resetBoardColumns();
  const visibleTasks = getVisibleTasks();
  if (hasActiveSearch() && visibleTasks.length === 0) {
    renderSearchEmptyState();
    return;
  }
  const boardState = getBoardState();
  visibleTasks.forEach((task) => appendTaskCard(task, boardState));
  renderEmptyColumnHints();
}

/**
 * Applies the value of the search field and re-renders the board.
 *
 * @returns {void}
 */
function runBoardSearch() {
  const input = document.querySelector(".board-search-field input");
  boardSearchQuery = input ? input.value : "";
  renderBoard();
}

/**
 * Opens the add-task dialog when a column add button is clicked.
 *
 * @param {MouseEvent} event - The click event.
 * @returns {void}
 */
function handleColumnAddClick(event) {
  const button = event.target.closest(".board-main-column-add-button[data-column]");
  if (button) openAddTaskModalForColumn(button.dataset.column);
}

/**
 * Sets up the board: drop events, column add buttons, search button and first render.
 *
 * @returns {void}
 */
function initBoardLayout() {
  const searchButton = document.querySelector(".board-search-button");
  if (!boardMainContainer) return;
  getBoardColumns().forEach(bindColumnDropEvents);
  boardMainContainer.addEventListener("click", handleColumnAddClick);
  if (searchButton) searchButton.addEventListener("click", runBoardSearch);
  renderBoard();
}

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

/**
 * Calculates the progress of a task from its subtasks or its progress value.
 *
 * @param {Object} task - The task.
 * @returns {{width: number, label: string}} Progress bar width in percent and its label.
 */
function getTaskProgress(task) {
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  const doneCount = subtasks.filter((subtask) => subtask.done).length;
  if (!subtasks.length) {
    const width = Math.max(0, Math.min(100, task.progress || 0));
    return { width, label: `${Math.round(width)}%` };
  }
  const width = Math.round((doneCount / subtasks.length) * 100);
  return { width, label: `${doneCount}/${subtasks.length} Subtasks` };
}

/**
 * Updates title, description and progress of a card without re-rendering the board.
 *
 * @param {Object} task - The task whose card should be updated.
 * @returns {void}
 */
function syncCardContent(task) {
  const card = boardMainContainer.querySelector(`.board-card--task[data-card-id="${task.id}"]`);
  if (!card) return;
  const progress = getTaskProgress(task);
  const bar = card.querySelector(".board-progress-bar span");
  const label = card.querySelector(".board-progress-label");
  card.querySelector(".board-card-title").textContent = task.title;
  card.querySelector(".board-card-description").textContent = task.description;
  if (bar) bar.style.width = `${progress.width}%`;
  if (label) label.textContent = progress.label;
}

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

/**
 * Initializes all parts of the board page.
 *
 * @returns {void}
 */
function initBoardPage() {
  syncBoardMobileNavigation();
  initBoardLayout();
  initBoardMoveMenu();
  initAddTaskModal();
  initTaskDetailModal();
}

document.addEventListener("DOMContentLoaded", initBoardPage);
window.addEventListener("resize", syncBoardMobileNavigation);
