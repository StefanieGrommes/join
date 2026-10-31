const TOUCH_DRAG_DELAY = 300;
const TOUCH_MOVE_TOLERANCE = 10;
const TOUCH_SCROLL_EDGE = 60;
const TOUCH_SCROLL_SPEED = 12;
let touchDrag = null;

/**
 * Remembers the touch start and starts a timer; a long press turns into a drag.
 *
 * @param {TouchEvent} event - The touchstart event.
 * @param {HTMLElement} card - The touched task card.
 * @returns {void}
 */
function handleCardTouchStart(event, card) {
  if (event.touches.length !== 1 || event.target.closest(".board-card-move-button")) return;
  cancelTouchDrag();
  const { clientX, clientY } = event.touches[0];
  card.draggable = false;
  touchDrag = { card, startX: clientX, startY: clientY, lastX: clientX, lastY: clientY, active: false };
  touchDrag.timer = setTimeout(startTouchDrag, TOUCH_DRAG_DELAY);
}

/**
 * Creates a floating copy of the card that follows the finger.
 *
 * @param {HTMLElement} card - The dragged card.
 * @param {DOMRect} rect - Size and position of the original card.
 * @returns {HTMLElement} The floating copy.
 */
function createTouchDragGhost(card, rect) {
  const ghost = card.cloneNode(true);
  ghost.classList.add("board-card-touch-ghost");
  ghost.removeAttribute("id");
  ghost.style.width = ghost.style.minWidth = ghost.style.maxWidth = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  document.body.appendChild(ghost);
  return ghost;
}

/**
 * Turns the long press into an active drag.
 *
 * @returns {void}
 */
function startTouchDrag() {
  const { card } = touchDrag;
  const rect = card.getBoundingClientRect();
  touchDrag.offsetX = touchDrag.lastX - rect.left;
  touchDrag.offsetY = touchDrag.lastY - rect.top;
  touchDrag.ghost = createTouchDragGhost(card, rect);
  touchDrag.active = true;
  draggedCard = card;
  card.classList.add("is-dragging");
  if (navigator.vibrate) navigator.vibrate(30);
  moveTouchDragGhost();
  requestAnimationFrame(autoScrollDuringTouchDrag);
}

/**
 * Places the floating copy under the finger.
 *
 * @returns {void}
 */
function moveTouchDragGhost() {
  const { ghost, lastX, lastY, offsetX, offsetY } = touchDrag;
  ghost.style.left = `${lastX - offsetX}px`;
  ghost.style.top = `${lastY - offsetY}px`;
}

/**
 * Highlights the column under the finger and remembers it as drop target.
 *
 * @returns {void}
 */
function updateTouchDropTarget() {
  const element = document.elementFromPoint(touchDrag.lastX, touchDrag.lastY);
  const column = element && element.closest(".board-main-column");
  if (column === touchDrag.column) return;
  if (touchDrag.column) touchDrag.column.classList.remove("is-drop-target");
  if (column) column.classList.add("is-drop-target");
  touchDrag.column = column;
}

/**
 * Follows the finger while dragging; cancels the long press if the finger moves too early.
 *
 * @param {TouchEvent} event - The touchmove event.
 * @returns {void}
 */
function handleCardTouchMove(event) {
  if (!touchDrag) return;
  const { clientX, clientY } = event.touches[0];
  touchDrag.lastX = clientX;
  touchDrag.lastY = clientY;
  if (!touchDrag.active) {
    const moved = Math.hypot(clientX - touchDrag.startX, clientY - touchDrag.startY);
    if (moved > TOUCH_MOVE_TOLERANCE) cancelTouchDrag();
    return;
  }
  event.preventDefault();
  moveTouchDragGhost();
  updateTouchDropTarget();
}

/**
 * Scrolls the page while the finger is near the top or bottom edge.
 *
 * @returns {void}
 */
function autoScrollDuringTouchDrag() {
  if (!touchDrag || !touchDrag.active) return;
  const { lastY } = touchDrag;
  if (lastY < TOUCH_SCROLL_EDGE) window.scrollBy(0, -TOUCH_SCROLL_SPEED);
  else if (lastY > window.innerHeight - TOUCH_SCROLL_EDGE) window.scrollBy(0, TOUCH_SCROLL_SPEED);
  updateTouchDropTarget();
  requestAnimationFrame(autoScrollDuringTouchDrag);
}

/**
 * Drops the card into the highlighted column and cleans up.
 *
 * @param {TouchEvent} event - The touchend event.
 * @returns {void}
 */
function handleCardTouchEnd(event) {
  if (!touchDrag) return;
  if (!touchDrag.active) return cancelTouchDrag();
  event.preventDefault();
  const { card, column } = touchDrag;
  cancelTouchDrag();
  if (column && moveBoardTask(card.dataset.cardId, column.dataset.column)) renderBoard();
}

/**
 * Stops the long-press timer, removes the floating copy and resets all drag styles.
 *
 * @returns {void}
 */
function cancelTouchDrag() {
  if (!touchDrag) return;
  clearTimeout(touchDrag.timer);
  touchDrag.card.draggable = true;
  if (touchDrag.ghost) touchDrag.ghost.remove();
  if (touchDrag.active) handleCardDragEnd(touchDrag.card);
  touchDrag = null;
}

/**
 * Attaches the touch events to a task card so it can be dragged with a finger.
 *
 * @param {HTMLElement} card - The task card.
 * @returns {void}
 */
function bindCardTouchEvents(card) {
  card.addEventListener("touchstart", (event) => handleCardTouchStart(event, card), { passive: true });
  card.addEventListener("touchmove", handleCardTouchMove, { passive: false });
  card.addEventListener("touchend", handleCardTouchEnd, { passive: false });
  card.addEventListener("touchcancel", cancelTouchDrag);
  card.addEventListener("contextmenu", (event) => {
    if (touchDrag) event.preventDefault();
  });
}

/**
 * Cancels a pending long press when the page or a column is scrolled.
 *
 * @returns {void}
 */
function handleTouchDragScroll() {
  if (touchDrag && !touchDrag.active) cancelTouchDrag();
}

document.addEventListener("scroll", handleTouchDragScroll, true);
