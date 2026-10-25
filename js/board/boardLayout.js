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
  const searchInput = document.querySelector(".board-search-field input");
  if (!boardMainContainer) return;
  getBoardColumns().forEach(bindColumnDropEvents);
  boardMainContainer.addEventListener("click", handleColumnAddClick);
  if (searchButton) searchButton.addEventListener("click", runBoardSearch);
  if (searchInput) searchInput.addEventListener("input", handleSearchInput);
  renderBoard();
}

/**
 * Initializes all parts of the board page.
 *
 * @returns {void}
 */
async function initBoardPage() {
  await initSessionData();
  syncBoardMobileNavigation();
  initBoardLayout();
  initBoardMoveMenu();
  initTaskDetailModal();
  initBoardTaskForm();
}

document.addEventListener("DOMContentLoaded", initBoardPage);
window.addEventListener("resize", syncBoardMobileNavigation);
