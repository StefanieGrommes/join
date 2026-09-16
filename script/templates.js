// ===============================
// Templates für die einzelnen Seiten
// Hier werden die HTML-Templates zentral definiert,
// damit Help, Privacy Policy und Legal Notice mit derselben Struktur funktionieren.
// ===============================

function updateSidebarActiveState(activePage) {
  document.querySelectorAll('.nav-item').forEach((button) => {
    const isActive = button.dataset.page === activePage;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

function renderSidebar(items, activePage) {
  const sidebar = document.getElementById('sidebar-nav');
  const footer = document.querySelector('.sidebar-footer');

  if (!sidebar) return;

  if (!sidebar.dataset.initialized) {
    sidebar.innerHTML = items
      .map(
        (item) => `
          <button
            class="nav-item ${item.id === activePage ? 'is-active' : ''}"
            data-page="${item.id}"
            type="button"
            aria-label="${item.label}"
          >
            <span class="nav-icon">${item.icon}</span>
            <span>${item.label}</span>
          </button>
        `
      )
      .join('');

    sidebar.querySelectorAll('.nav-item').forEach((button) => {
      button.addEventListener('click', (event) => {
        const nextPage = event.currentTarget.dataset.page;
        if (!nextPage) return;

        updateSidebarActiveState(nextPage);

        if (nextPage === 'summary') {
          renderPage('help');
        } else if (nextPage === 'add-task') {
          renderPage('help');
        } else if (nextPage === 'board') {
          renderPage('privacy');
        } else if (nextPage === 'contacts') {
          renderPage('legal');
        }
      });
    });

    sidebar.dataset.initialized = 'true';
  }

  if (footer) {
    footer.innerHTML = footerNavigationItems
      .map(
        (item) => `
          <a href="${item.href}">${item.label}</a>
        `
      )
      .join('');
  }

  updateSidebarActiveState(activePage);
}

function renderInfoSection(section) {
  const paragraphs = section.content
    .map((paragraph) => {
      if (typeof paragraph === 'string' && paragraph.startsWith('1.') || paragraph.startsWith('2.') || paragraph.startsWith('3.') || paragraph.startsWith('4.')) {
        return `<li>${paragraph}</li>`;
      }
      return `<p>${paragraph}</p>`;
    })
    .join('');

  const listMarkup = section.content.some((entry) => typeof entry === 'string' && /^(\d+\.)/.test(entry))
    ? `<ul>${section.content.map((entry) => `<li>${entry}</li>`).join('')}</ul>`
    : '';

  return `
    <section class="info-section">
      <h2>${section.heading}</h2>
      ${listMarkup || paragraphs}
    </section>
  `;
}

function renderInfoPage(pageData) {
  return `
    <article class="info-page">
      <header class="info-header">
        <div class="header-left">
          <div class="header-mark">J</div>
          <h1 class="info-title">${pageData.title}</h1>
        </div>
        <div class="header-badge" aria-label="Info">i</div>
      </header>

      <div class="info-body">
        <p class="info-intro">${pageData.intro}</p>
        ${pageData.sections.map(renderInfoSection).join('')}
      </div>
    </article>
  `;
}
