let draggedCard = null;
let moveMenu = null;
let moveMenuButton = null;

/**
 * Creates the hidden "Move to" menu from its template and appends it to the body.
 *
 * @returns {HTMLElement} The menu element.
 */
function createMoveMenu() {
  const menu = cloneTemplate("board-move-menu-template");
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
  const option = cloneTemplate("board-move-option-template");
  const arrow = option.querySelector("span");
  arrow.textContent = targetIndex < currentIndex ? "\u2191" : "\u2193";
  option.append(document.createTextNode(getColumnLabel(columnIds[targetIndex])));
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
  moveMenu.querySelectorAll("button").forEach((option) => option.remove());
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
 * Opens or closes the menu when a move button is clicked (screens up to 1000px).
 *
 * @param {MouseEvent} event - The click event.
 * @returns {void}
 */
function handleMoveButtonClick(event) {
  const button = event.target.closest(".board-card-move-button");
  if (!button || !window.matchMedia("(max-width: 1000px)").matches) return;
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
 * Starts dragging a card regardless of viewport width.
 *
 * @param {DragEvent} event - The dragstart event.
 * @param {HTMLElement} card - The dragged card.
 * @returns {void}
 */
function handleCardDragStart(event, card) {
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
 * Attaches the mouse drag events and the touch drag events to a task card.
 *
 * @param {HTMLElement} card - The task card.
 * @returns {void}
 */
function bindCardDragEvents(card) {
  card.addEventListener("dragstart", (event) => handleCardDragStart(event, card));
  card.addEventListener("dragend", () => handleCardDragEnd(card));
  bindCardTouchEvents(card);
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
