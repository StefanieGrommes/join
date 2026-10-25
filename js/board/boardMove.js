let draggedCard = null;
let moveMenu = null;
let moveMenuButton = null;

function createMoveMenu() {
  const menu = cloneTemplate("board-move-menu-template");
  document.body.appendChild(menu);
  return menu;
}

function closeMoveMenu(restoreFocus = false) {
  moveMenu.hidden = true;
  if (moveMenuButton) {
    moveMenuButton.setAttribute("aria-expanded", "false");
    if (restoreFocus) moveMenuButton.focus();
  }
  moveMenuButton = null;
}

function moveTaskFromMenu(taskId, columnId) {
  if (!moveBoardTask(taskId, columnId)) return;
  closeMoveMenu();
  renderBoard();
  const movedCard = document.querySelector(`.board-card--task[data-card-id="${taskId}"]`);
  if (movedCard) movedCard.querySelector(".board-card-move-button").focus();
}

function createMoveOption(card, targetIndex, currentIndex) {
  const option = cloneTemplate("board-move-option-template");
  const arrow = option.querySelector("span");
  arrow.textContent = targetIndex < currentIndex ? "\u2191" : "\u2193";
  option.append(document.createTextNode(getColumnLabel(columnIds[targetIndex])));
  option.addEventListener("click", () => moveTaskFromMenu(card.dataset.cardId, columnIds[targetIndex]));
  return option;
}

function fillMoveMenu(card) {
  const currentIndex = columnIds.indexOf(card.closest(".board-main-column").dataset.column);
  moveMenu.querySelectorAll("button").forEach((option) => option.remove());
  [currentIndex - 1, currentIndex + 1]
    .filter((index) => index >= 0 && index < columnIds.length)
    .forEach((index) => moveMenu.appendChild(createMoveOption(card, index, currentIndex)));
}

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

function openMoveMenu(button) {
  closeMoveMenu();
  moveMenuButton = button;
  button.setAttribute("aria-expanded", "true");
  fillMoveMenu(button.closest(".board-card--task"));
  moveMenu.hidden = false;
  positionMoveMenu(button);
  moveMenu.querySelector("button").focus();
}

function handleMoveButtonClick(event) {
  const button = event.target.closest(".board-card-move-button");
  if (!button || !window.matchMedia("(max-width: 360px)").matches) return;
  if (moveMenuButton === button) closeMoveMenu(true);
  else openMoveMenu(button);
}

function handleMoveMenuOutsideClick(event) {
  const isInside = moveMenu.contains(event.target);
  if (!isInside && !event.target.closest(".board-card-move-button")) closeMoveMenu();
}

function handleMoveMenuScroll(event) {
  if (!moveMenu.contains(event.target)) closeMoveMenu();
}

function focusMoveMenuOption(key) {
  const options = Array.from(moveMenu.querySelectorAll("button"));
  const index = options.indexOf(document.activeElement);
  const step = key === "ArrowDown" ? 1 : -1;
  let nextIndex = (index + step + options.length) % options.length;
  if (key === "Home") nextIndex = 0;
  if (key === "End") nextIndex = options.length - 1;
  options[nextIndex].focus();
}

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

function handleCardDragStart(event, card) {
  if (window.matchMedia("(max-width: 360px)").matches) {
    event.preventDefault();
    return;
  }
  draggedCard = card;
  card.classList.add("is-dragging");
  card.setAttribute("data-dragging", "true");
}

function handleCardDragEnd(card) {
  draggedCard = null;
  card.classList.remove("is-dragging");
  card.removeAttribute("data-dragging");
  getBoardColumns().forEach((column) => column.classList.remove("is-drop-target"));
}

function bindCardDragEvents(card) {
  card.addEventListener("dragstart", (event) => handleCardDragStart(event, card));
  card.addEventListener("dragend", () => handleCardDragEnd(card));
}

function handleColumnDrop(event, column) {
  event.preventDefault();
  if (!draggedCard) return;
  const taskId = draggedCard.dataset.cardId;
  draggedCard = null;
  column.classList.remove("is-drop-target");
  if (moveBoardTask(taskId, column.dataset.column)) renderBoard();
}

function bindColumnDropEvents(column) {
  column.ondragover = (event) => {
    if (!draggedCard) return;
    event.preventDefault();
    column.classList.add("is-drop-target");
  };
  column.ondragleave = () => column.classList.remove("is-drop-target");
  column.ondrop = (event) => handleColumnDrop(event, column);
}
