function applyMobileTopNavStyles(topNav, isMobile) {
  const styles = { display: "flex", position: "fixed", top: "0", left: "0", right: "0", gridArea: "auto" };
  Object.entries(styles).forEach(([property, value]) => {
    topNav.style[property] = isMobile ? value : "";
  });
}

function syncBoardMobileNavigation() {
  const topNav = document.querySelector(".board-mobile-top-nav");
  const genericHeader = document.querySelector(".nav-mobile");
  const isMobile = window.innerWidth <= 768;
  if (topNav) applyMobileTopNavStyles(topNav, isMobile);
  if (genericHeader) genericHeader.style.display = isMobile ? "none" : "";
}

function handleColumnAddClick(event) {
  const button = event.target.closest(".board-main-column-add-button[data-column]");
  if (button) openAddTaskModalForColumn(button.dataset.column);
}

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
