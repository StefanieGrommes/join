// ==========================================
// TEMPLATE LAYER / TEMPLATE-RENDERING
// ==========================================
// Diese Datei ist die Render-Schicht der App.
// Sie nimmt Daten aus den Daten-Dateien und erzeugt daraus HTML mit Template-Literals.
//
// Reiner Ablauf:
// 1. Daten-Dateien liefern Daten
// 2. templates.js formatiert sie als HTML
// 3. board-layout.js oder andere JS-Dateien hängen das HTML in das DOM
//
// Damit bleibt die Trennung sauber:
// - Daten-Dateien = Daten
// - templates.js = Darstellung
// - script.js / board-layout.js = Logik und DOM-Aktualisierung
// ==========================================

// ===============================
// Templates für die einzelnen Seiten
// Hier werden die HTML-Templates zentral definiert,
// damit Help, Privacy Policy und Legal Notice mit derselben Struktur funktionieren.
// ===============================

/**
 * Markiert in der Sidebar den Button der aktuell aktiven Seite.
 *
 * @param {string} activePage - id der aktiven Seite (z. B. "summary").
 * @returns {void}
 */
function updateSidebarActiveState(activePage) {
  // Alle Navigations-Buttons durchgehen.
  document.querySelectorAll('.nav-item').forEach((button) => {
    // Ist dieser Button die aktive Seite? (data-page vergleichen)
    const isActive = button.dataset.page === activePage;
    // CSS-Klasse "is-active" für die Hervorhebung setzen/entfernen.
    button.classList.toggle('is-active', isActive);
    // Für Screenreader: aria-current="page" auf dem aktiven Button.
    button.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

/**
 * Rendert die Sidebar-Navigation (#sidebar-nav) und die Footer-Links (.sidebar-footer).
 *
 * @param {Array<{id: string, label: string, icon: string}>} [items] - Navigationseinträge; Standard: navigationItems aus app-data.js.
 * @param {string} activePage - id der aktuell aktiven Seite.
 * @returns {void}
 */
function renderSidebar(items, activePage) {
  // Container für die Navigations-Buttons.
  const sidebar = document.getElementById('sidebar-nav');
  // Container für die Footer-Links unten in der Sidebar.
  const footer = document.querySelector('.sidebar-footer');

  // Ohne Sidebar im HTML gibt es nichts zu rendern.
  if (!sidebar) return;

  // Übergebene Items nutzen, sonst die globalen Navigationseinträge.
  const navItems = items || (typeof navigationItems !== 'undefined' ? navigationItems : []);

  // Buttons nur beim ersten Aufruf erzeugen (verhindert doppelte Event-Listener).
  if (!sidebar.dataset.initialized) {
    // Für jeden Eintrag einen Button erzeugen und als HTML in die Sidebar schreiben.
    sidebar.innerHTML = navItems
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

    // Jedem Button einen Klick-Handler geben.
    sidebar.querySelectorAll('.nav-item').forEach((button) => {
      button.addEventListener('click', (event) => {
        // Ziel-Seite aus data-page des geklickten Buttons lesen.
        const nextPage = event.currentTarget.dataset.page;
        if (!nextPage) return;

        // Geklickten Button als aktiv markieren.
        updateSidebarActiveState(nextPage);

        // Jede Navigation zeigt aktuell eine der Info-Seiten an (Platzhalter-Zuordnung).
        // renderPage() ist in einer anderen Datei definiert.
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

    // Merken, dass die Sidebar bereits aufgebaut ist.
    sidebar.dataset.initialized = 'true';
  }

  // Footer-Links (Help, Privacy, Legal) als <a>-Elemente rendern.
  if (footer) {
    footer.innerHTML = (typeof footerNavigationItems !== 'undefined' ? footerNavigationItems : [])
      .map(
        (item) => `
          <a href="${item.href}">${item.label}</a>
        `
      )
      .join('');
  }

  // Aktive Seite in der Sidebar hervorheben.
  updateSidebarActiveState(activePage);
}

/**
 * Erzeugt das HTML für einen Abschnitt einer Info-Seite (Überschrift + Text/Liste).
 *
 * @param {{heading: string, content: string[]}} section - Abschnitt aus infoPages (app-data.js).
 * @returns {string} HTML-String des Abschnitts.
 */
function renderInfoSection(section) {
  // Jeden Absatz in HTML umwandeln.
  const paragraphs = section.content
    .map((paragraph) => {
      // Beginnt der Text mit "1." bis "4.", wird er als Listenpunkt <li> ausgegeben ...
      if (typeof paragraph === 'string' && paragraph.startsWith('1.') || paragraph.startsWith('2.') || paragraph.startsWith('3.') || paragraph.startsWith('4.')) {
        return `<li>${paragraph}</li>`;
      }
      // ... sonst als normaler Absatz <p>.
      return `<p>${paragraph}</p>`;
    })
    .join('');

  // Enthält der Abschnitt nummerierte Einträge, wird alles als <ul>-Liste gerendert.
  const listMarkup = section.content.some((entry) => typeof entry === 'string' && /^(\d+\.)/.test(entry))
    ? `<ul>${section.content.map((entry) => `<li>${entry}</li>`).join('')}</ul>`
    : '';

  // Abschnitt zurückgeben: Liste hat Vorrang, sonst die Absätze.
  return `
    <section class="info-section">
      <h2>${section.heading}</h2>
      ${listMarkup || paragraphs}
    </section>
  `;
}

/**
 * Erzeugt das komplette HTML einer Info-Seite (Help, Privacy Policy, Legal Notice).
 *
 * @param {{title: string, intro: string, sections: Array}} pageData - Seitendaten aus infoPages.
 * @returns {string} HTML-String der Seite.
 */
function renderInfoPage(pageData) {
  // Kopfbereich mit Titel + Einleitung + alle Abschnitte über renderInfoSection().
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

// ===============================
// Kontakt-Helper
// Diese Funktionen lesen die Kontakte aus den Daten-Dateien und
// wandeln sie für die Karten-Renderung in kleine Avatar-Elemente um.
// ===============================
/**
 * Liefert die Initialen eines Kontakts (z. B. "Anton Mayer" -> "AM").
 *
 * @param {{name: string, initials?: string}} contact - Kontakt aus contacts.js.
 * @returns {string} Initialen in Großbuchstaben.
 */
function getBoardContactInitials(contact) {
  // Hat der Kontakt bereits Initialen gespeichert, diese verwenden.
  if (contact.initials) return contact.initials;
  // Namen an Leerzeichen in Teile aufsplitten.
  const parts = contact.name.trim().split(/\s+/);
  // Erster Buchstabe vom ersten + letzten Namensteil, groß geschrieben.
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Sucht einen Kontakt anhand seiner id bzw. seiner Initialen.
 *
 * @param {string} contactId - id oder Initialen (z. B. "AM" aus task.assignedTo).
 * @returns {Object|null} Gefundener Kontakt oder null.
 */
function getContactById(contactId) {
  // Kontaktliste aus den globalen Kontaktdaten.
  const contactList = typeof contacts !== 'undefined' ? contacts : [];
  // Keine gültige Liste -> kein Kontakt.
  if (!Array.isArray(contactList)) return null;
  // Ersten Kontakt finden, dessen id (oder Initialen) passt.
  return contactList.find((contact) => (contact.id || getBoardContactInitials(contact)) === contactId) || null;
}

/**
 * Erzeugt einen runden Avatar mit Initialen in der Kontaktfarbe.
 *
 * @param {Object|null} contact - Kontakt mit name und color.
 * @returns {string} HTML-String des Avatars (leer, wenn kein Kontakt).
 */
function renderAvatar(contact) {
  // Kein Kontakt -> nichts anzeigen.
  if (!contact) return '';

  // <span> mit Hintergrundfarbe des Kontakts und seinen Initialen.
  return `
    <span class="board-contact-avatar" style="background:${contact.color};">
      ${getBoardContactInitials(contact)}
    </span>
  `;
}

/**
 * Erzeugt die Avatar-Reihe der zugewiesenen Kontakte für eine Task-Karte.
 *
 * @param {string[]} assignedIds - Liste der Kontakt-ids/Initialen.
 * @returns {string} HTML-String mit allen Avataren.
 */
function renderAssignedContacts(assignedIds) {
  // Keine Zuweisungen -> nichts anzeigen.
  if (!Array.isArray(assignedIds) || !assignedIds.length) return '';

  const avatars = assignedIds
    // ids in Kontakt-Objekte umwandeln.
    .map((contactId) => getContactById(contactId))
    // Nicht gefundene Kontakte (null) herausfiltern.
    .filter(Boolean)
    // Für jeden Kontakt einen Avatar erzeugen.
    .map((contact) => renderAvatar(contact))
    // Zu einem HTML-String zusammenfügen.
    .join('');

  // Avatare in einen Container packen.
  return `<div class="board-assigned-contacts">${avatars}</div>`;
}

// ===============================
// Standard-Karte für ein Board-Task
// Diese Funktion erzeugt die kleine Task-Karte wie im Board.
// Sie wird in board-layout.js bzw. beim Rendern des Boards verwendet.
// ===============================
/**
 * Liefert den Dateinamen des Prioritäts-Icons aus dem assets-Ordner.
 *
 * @param {"Urgent"|"Medium"|"Low"} priority - Priorität der Aufgabe.
 * @returns {string|undefined} Dateiname des SVG oder undefined.
 */
function getTaskPriorityIcon(priority) {
  // Zuordnung Priorität -> Icon-Datei in /assets.
  const priorityIcons = {
    Urgent: 'priorityUrgent.svg',
    Medium: 'medium.svg',
    Low: 'low.svg',
  };
  // Passendes Icon zurückgeben.
  return priorityIcons[priority];
}

/**
 * Erzeugt die kleine Task-Karte für eine Board-Spalte.
 * Wird in board-layout.js (renderBoardState) aufgerufen.
 *
 * @param {Object} task - Aufgabe aus tasks (app-data.js).
 * @returns {string} HTML-String der Karte.
 */
function renderTaskCard(task) {
  // Avatar-Reihe der zugewiesenen Kontakte.
  const assigned = renderAssignedContacts(task.assignedTo || []);
  // Icon für die Priorität.
  const priorityIcon = getTaskPriorityIcon(task.priority);
  // Subtasks als Array (Fallback: leeres Array).
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
  // Anzahl erledigter Subtasks.
  const doneSubtasks = subtasks.filter((subtask) => subtask.done).length;
  // Gesamtanzahl der Subtasks.
  const totalSubtasks = subtasks.length;
  // Fortschritt in %: aus Subtasks berechnet, sonst task.progress (begrenzt auf 0–100).
  const progressWidth = totalSubtasks
    ? Math.round((doneSubtasks / totalSubtasks) * 100)
    : Math.max(0, Math.min(100, task.progress || 0));
  // Text neben dem Balken: "1/2 Subtasks" oder Prozentwert.
  const progressLabel = totalSubtasks
    ? `${doneSubtasks}/${totalSubtasks} Subtasks`
    : `${Math.round(progressWidth)}%`;

  // Karte: Kategorie-Badge, Move-Button (Mobile), Titel, Beschreibung,
  // Fortschrittsbalken, Avatare und Prioritäts-Icon. draggable="true" für Drag & Drop.
  return `
    <article class="board-card board-card--task" data-card-id="${task.id}" draggable="true" aria-label="${task.title}">

      <div class="board-card-header">
        <span class="board-card-badge" style="background:${task.categoryColor};">${task.category}</span>
        <button class="board-card-move-button" type="button" aria-label="Move task" aria-haspopup="menu" aria-expanded="false" aria-controls="board-move-menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M8 16V4M4 8l4-4 4 4M16 8v12M12 16l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>



      <h3 class="board-card-title">${task.title}</h3>

      <p class="board-card-description">${task.description}</p>



      <div class="board-card-progress">
        <div class="board-progress-bar">
          <span style="width:${progressWidth}%"></span>
        </div>
        <span class="board-progress-label">${progressLabel}</span>
      </div>

      <div class="board-card-footer">
        ${assigned}
        ${priorityIcon ? `<img src="../assets/${priorityIcon}" alt="${task.priority}" class="board-card-priority-icon" />` : ''}
      </div>




    </article>
  `;
}

// ===============================
// Große Detail-Karte
// Diese Funktion rendert die ausführliche Task-Karte mit:
// Titel, Beschreibung, Fälligkeitsdatum, Priorität,
// Assignees und Subtasks.
// ===============================
/**
 * Erzeugt die große Detailansicht einer Aufgabe (Dialog im Board).
 * Wird in board-layout.js (openDetailModal) aufgerufen.
 *
 * @param {Object} task - Aufgabe aus tasks (app-data.js).
 * @returns {string} HTML-String der Detailkarte.
 */
function renderTaskDetail(task) {
  // Icon für die Priorität.
  const priorityIcon = getTaskPriorityIcon(task.priority);

  // Liste der zugewiesenen Kontakte mit Avatar und vollem Namen.
  const assigned = (task.assignedTo || [])
    // ids in Kontakt-Objekte umwandeln.
    .map((contactId) => getContactById(contactId))
    // Nicht gefundene Kontakte entfernen.
    .filter(Boolean)
    // HTML pro Kontakt erzeugen.
    .map((contact) => `
      <div class="board-detail-assignee">
        ${renderAvatar(contact)}
        <p class="board-detail-assignee-name">${contact.name}</p>
      </div>
    `)
    .join('');

  // Subtasks als Checkboxen; data-subtask-index wird beim Abhaken in board-layout.js gelesen.
  const subtasks = (task.subtasks || [])
    .map((subtask, index) => `
      <label class="board-detail-subtask">
        <input type="checkbox" data-subtask-index="${index}" ${subtask.done ? 'checked' : ''} />
        <span>${subtask.label}</span>
      </label>
    `)
    .join('');

  // Detailkarte: Badge, Schließen-Button, Titel, Beschreibung, Datum, Priorität,
  // Assignees, Subtasks sowie Delete-/Edit-Buttons (data-action wird in board-layout.js ausgewertet).
  return `
    <article class="board-detail-card">
      <div class="board-detail-topbar">
        <span class="board-detail-badge" style="background:${task.categoryColor};">${task.category}</span>
        <button class="board-detail-close" type="button" aria-label="Close task">×</button>
      </div>

      <h2 class="board-detail-title">${task.title}</h2>
      <p class="board-detail-description">${task.description}</p>

      <div class="board-detail-content">
        <div class="board-detail-row">
          <span class="board-detail-label">Due date:</span>
          <span class="board-detail-value">${task.dueDate}</span>
        </div>

        <div class="board-detail-row">
          <span class="board-detail-label">Priority:</span>
          <span class="board-detail-value board-detail-priority">
            ${task.priority}
            ${priorityIcon ? `<img src="../assets/${priorityIcon}" alt="" class="board-detail-priority-icon" />` : ''}
          </span>
        </div>

        <div class="board-detail-assignees-row">

          <span class="board-detail-label">Assigned To:</span>


          <div class="board-detail-assignees">
          ${assigned}
          </div>
        </div>

        <div class="board-detail-subtasks">
          <h4>Subtasks</h4>
          ${subtasks}
        </div>

        <div class="board-detail-actions">
          <button type="button" class="board-detail-button board-detail-button--ghost" data-action="delete-task" aria-label="Delete task">
            <span class="board-detail-button-icon" aria-hidden="true">🗑</span>
            <span class="board-detail-button-text">Delete</span>
          </button>
          <button type="button" class="board-detail-button board-detail-button--primary" data-action="edit-task" aria-label="Edit task">
            <span class="board-detail-button-icon" aria-hidden="true">✎</span>
            <span class="board-detail-button-text">Edit</span>
          </button>
        </div>
      </div>
    </article>
  `;
}
