const boardMainContainer = document.querySelector(".board-main-container");

let boardSearchQuery = "";

/**
 * Clones the first element of an HTML template from the page.
 *
 * @param {string} templateId - Id of the template element.
 * @returns {HTMLElement} A new element created from the template.
 */
function cloneTemplate(templateId) {
  return document.getElementById(templateId).content.firstElementChild.cloneNode(true);
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
 * Creates the header of a column with its title and add button.
 *
 * @param {string} columnId - Id of the column.
 * @returns {HTMLElement} The header element.
 */
function createColumnHeader(columnId) {
  const header = cloneTemplate("board-column-header-template");
  const addButton = header.querySelector(".board-main-column-add-button");
  header.querySelector(".board-main-column-title").textContent = getColumnLabel(columnId);
  addButton.dataset.column = columnId;
  addButton.setAttribute("aria-label", `Add ${getColumnLabel(columnId)}`);
  return header;
}

/**
 * Creates the empty content area of a column.
 *
 * @returns {HTMLElement} The content element.
 */
function createColumnContent() {
  return cloneTemplate("board-column-content-template");
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
 * Creates the hint that is shown in a column without tasks.
 *
 * @param {string} columnId - Id of the column.
 * @returns {HTMLElement} The hint element.
 */
function createEmptyColumnHint(columnId) {
  const hint = cloneTemplate("board-empty-hint-template");
  hint.textContent = getEmptyColumnMessage(columnId);
  hint.setAttribute("aria-label", hint.textContent);
  return hint;
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
    content.appendChild(createEmptyColumnHint(column.dataset.column));
  });
}

/**
 * Hides all columns and shows the "no results" hint.
 *
 * @returns {void}
 */
function renderSearchEmptyState() {
  const message = cloneTemplate("board-search-empty-template");
  getBoardColumns().forEach((column) => {
    column.style.display = "none";
  });
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
  const allTasks = getTasks();
  if (!Array.isArray(allTasks)) return [];
  if (!hasActiveSearch()) return allTasks;
  const query = boardSearchQuery.trim().toLowerCase();
  return allTasks.filter((allTasks) => {
    const title = String(allTasks.title || "").toLowerCase();
    const description = String(allTasks.description || "").toLowerCase();
    return title.includes(query) || description.includes(query);
  });
}

/**
 * Renders a task card into its column.
 *
 * @param {Object} task - The task to render.
 * @returns {void}
 */
function appendTaskCard(task) {
  const columnId = getTaskColumnId(task);
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
  closeAssignedContactsPopover();
  resetBoardColumns();
  const visibleTasks = getVisibleTasks();
  if (hasActiveSearch() && visibleTasks.length === 0) {
    renderSearchEmptyState();
    return;
  }
  visibleTasks.forEach((task) => appendTaskCard(task));
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
 * Resets the search as soon as the search field is cleared.
 *
 * @param {InputEvent} event - The input event.
 * @returns {void}
 */
function handleSearchInput(event) {
  runBoardSearch();
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
 * Closes the overlay and redraws the board after a task was saved.
 * @returns {void}
 */
function onTaskSaved() {
  closeBoardTaskModal();
  renderBoard();
}