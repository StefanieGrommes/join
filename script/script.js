// ===============================
// App-Logik zur Anzeige der Info-Seiten
// Hier wird entschieden, welche Seite im Hauptbereich gerendert wird.
// ===============================

const state = {
  currentPage: 'help'
};

function renderPage(pageId) {
  const pageData = infoPages[pageId];
  const panel = document.getElementById('main-panel');

  if (!pageData || !panel) return;

  state.currentPage = pageId;

  const activeSidebarItem = menuPageMap[pageId] || 'summary';
  renderSidebar(navigationItems, activeSidebarItem);
  panel.innerHTML = renderInfoPage(pageData);
}

const menuPageMap = {
  help: 'summary',
  privacy: 'board',
  legal: 'contacts'
};

document.addEventListener('DOMContentLoaded', () => {
  renderPage(state.currentPage);
});
