const boardMainContainer = document.querySelector(".board-main-container");

let boardSearchQuery = "";

function cloneTemplate(templateId) {
  return document.getElementById(templateId).content.firstElementChild.cloneNode(true);
}

function getBoardColumns() {
  return Array.from(document.querySelectorAll(".board-main-column"));
}

function createColumnHeader(columnId) {
  const header = cloneTemplate("board-column-header-template");
  const addButton = header.querySelector(".board-main-column-add-button");
  header.querySelector(".board-main-column-title").textContent = getColumnLabel(columnId);
  addButton.dataset.column = columnId;
  addButton.setAttribute("aria-label", `Add ${getColumnLabel(columnId)}`);
  return header;
}

function createColumnContent() {
  return cloneTemplate("board-column-content-template");
}

function resetBoardColumns() {
  const emptyState = boardMainContainer.querySelector(".board-search-empty-state");
  if (emptyState) emptyState.remove();
  getBoardColumns().forEach((column) => {
    column.style.display = "";
    column.replaceChildren(createColumnHeader(column.dataset.column), createColumnContent());
  });
}

function createEmptyColumnHint(columnId) {
  const hint = cloneTemplate("board-empty-hint-template");
  hint.textContent = getEmptyColumnMessage(columnId);
  hint.setAttribute("aria-label", hint.textContent);
  return hint;
}

function renderEmptyColumnHints() {
  getBoardColumns().forEach((column) => {
    const content = column.querySelector(".board-main-column-content");
    if (content.querySelector(".board-card--task")) return;
    content.appendChild(createEmptyColumnHint(column.dataset.column));
  });
}

function renderSearchEmptyState() {
  const message = cloneTemplate("board-search-empty-template");
  getBoardColumns().forEach((column) => {
    column.style.display = "none";
  });
  message.setAttribute("aria-label", message.textContent);
  boardMainContainer.appendChild(message);
}

function hasActiveSearch() {
  return boardSearchQuery.trim().length >= 3;
}

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

function renderBoard() {
  resetBoardColumns();
  const visibleTasks = getVisibleTasks();
  if (hasActiveSearch() && visibleTasks.length === 0) {
    renderSearchEmptyState();
    return;
  }
  visibleTasks.forEach((task) => appendTaskCard(task));
  renderEmptyColumnHints();
}

function runBoardSearch() {
  const input = document.querySelector(".board-search-field input");
  boardSearchQuery = input ? input.value : "";
  renderBoard();
}

function handleSearchInput(event) {
  runBoardSearch();
}

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
