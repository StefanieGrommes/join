// ==========================================
// BOARD-SEITE (pages/board-layout.html)
// ==========================================
// Steuert das Kanban-Board:
// - Rendern der Task-Karten in die vier Spalten
// - Drag & Drop zwischen Spalten (Desktop)
// - "Move to"-Menü für kleine Bildschirme (<= 360px)
// - Suche nach Titel/Beschreibung
// - Add-/Edit-Task-Dialog
// - Detail-Dialog mit Subtasks, Löschen und Bearbeiten
// Die Spaltenzuordnung wird im localStorage gespeichert.
// HTML der Karten kommt aus templates.js, die Daten aus app-data.js.
// ==========================================

// Schlüssel im localStorage, unter dem gespeichert wird, welche Task in welcher Spalte liegt.
const BOARD_STORAGE_KEY = "join-board-layout-state";
// Aktueller Suchbegriff aus dem Suchfeld (bleibt beim Neu-Rendern erhalten).
let currentBoardSearchQuery = "";

/**
 * Schaltet auf Mobilgeräten (<= 768px) die Board-eigene obere Navigation ein
 * und blendet die allgemeine mobile Kopfzeile aus.
 *
 * @returns {void}
 */
function syncBoardMobileNavigation() {
  // Board-spezifische obere Leiste für Mobile.
  const boardTopNav = document.querySelector(".board-mobile-top-nav");
  // Allgemeine mobile Kopfzeile aus header.txt.
  const genericHeader = document.querySelector(".nav-mobile");

  // Mobile-Ansicht, wenn das Fenster höchstens 768px breit ist.
  const isMobile = window.innerWidth <= 768;

  if (boardTopNav) {
    // Mobile: oben fixierte Leiste über die ganze Breite; Desktop: Inline-Styles entfernen ("").
    boardTopNav.style.display = isMobile ? "flex" : "";
    boardTopNav.style.position = isMobile ? "fixed" : "";
    boardTopNav.style.top = isMobile ? "0" : "";
    boardTopNav.style.left = isMobile ? "0" : "";
    boardTopNav.style.right = isMobile ? "0" : "";
    boardTopNav.style.gridArea = isMobile ? "auto" : "";
  }

  if (genericHeader) {
    // Allgemeinen Header auf Mobile ausblenden, damit er nicht doppelt erscheint.
    genericHeader.style.display = isMobile ? "none" : "";
  }

}

/**
 * Liefert den Platzhaltertext für eine leere Spalte.
 *
 * @param {string} columnId - id der Spalte (z. B. "todo").
 * @returns {string} Text wie "No tasks To do".
 */
function getEmptyColumnMessage(columnId) {
  // Zuordnung Spalten-id -> Leer-Text.
  const messageMap = {
    "todo": "No tasks To do",
    "in-progress": "No tasks In progress",
    "await-feedback": "No tasks Await feedback",
    "done": "No tasks Done"
  };

  // Unbekannte Spalte -> allgemeiner Text.
  return messageMap[columnId] || "No tasks";
}

/**
 * Liefert die sichtbare Überschrift einer Spalte.
 *
 * @param {string} columnId - id der Spalte.
 * @returns {string} Spaltenname wie "In progress".
 */
function getColumnLabel(columnId) {
  // Zuordnung Spalten-id -> Überschrift.
  const labelMap = {
    "todo": "To do",
    "in-progress": "In progress",
    "await-feedback": "Await feedback",
    "done": "Done"
  };

  // Unbekannte Spalte -> "Board".
  return labelMap[columnId] || "Board";
}

/**
 * Lädt die gespeicherte Spaltenzuordnung aus dem localStorage.
 *
 * @returns {Object<string, string>} Objekt { taskId: columnId } oder {}.
 */
function loadBoardState() {
  try {
    // Gespeicherten JSON-String lesen.
    const storedState = window.localStorage.getItem(BOARD_STORAGE_KEY);
    // In ein Objekt umwandeln; nichts gespeichert -> leeres Objekt.
    return storedState ? JSON.parse(storedState) : {};
  } catch {
    // Kaputtes JSON oder kein Zugriff auf localStorage -> leeres Objekt.
    return {};
  }
}

/**
 * Erzeugt die Standard-Zuordnung: jede Task liegt in "To do".
 *
 * @returns {Object<string, string>} Objekt { taskId: "todo" }.
 */
function getDefaultBoardState() {
  // Ohne Task-Liste gibt es keine Zuordnung.
  if (!Array.isArray(tasks)) return {};

  // Für jede Task einen Eintrag taskId -> "todo" anlegen.
  return tasks.reduce((state, task) => {
    state[task.id] = "todo";
    return state;
  }, {});
}

/**
 * Verschiebt eine Task in eine andere Spalte und speichert das im localStorage.
 *
 * @param {string} taskId - id der Task.
 * @param {string} columnId - id der Ziel-Spalte.
 * @returns {boolean} True bei Erfolg, false wenn Task oder Spalte nicht existiert.
 */
function moveBoardTask(taskId, columnId) {
  // Task-Objekt in der Datenliste suchen.
  const task = tasks.find((item) => item.id === taskId);
  // Ziel-Spalte im HTML anhand von data-column suchen.
  const column = Array.from(document.querySelectorAll(".board-main-column"))
    .find((item) => item.dataset.column === columnId);
  // Eins von beiden fehlt -> Fehler loggen und abbrechen.
  if (!task || !column) {
    console.error("Cannot move task: task or target column not found.", { taskId, columnId });
    return false;
  }

  // Standard + gespeicherten Zustand zusammenführen und die neue Spalte für diese Task eintragen.
  const state = { ...getDefaultBoardState(), ...loadBoardState(), [taskId]: columnId };
  // Neuen Zustand im localStorage speichern.
  window.localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(state));
  // Status auch direkt im Task-Objekt aktualisieren.
  task.status = columnId;
  return true;
}

/**
 * Erstellt das "Move to"-Menü für kleine Bildschirme (<= 360px),
 * auf denen Drag & Drop nicht genutzt wird. Über den Pfeil-Button einer Karte
 * kann die Task eine Spalte nach oben oder unten verschoben werden.
 * Inklusive Tastatursteuerung (Pfeiltasten, Home/End, Escape, Tab).
 *
 * @returns {void}
 */
function initBoardMoveMenu() {
  // Board-Container mit allen Spalten.
  const board = document.querySelector(".board-main-container");
  if (!board) return;

  // Menü-Element einmalig erzeugen.
  const menu = document.createElement("div");
  // id passt zu aria-controls am Move-Button der Karte (templates.js).
  menu.id = "board-move-menu";
  menu.className = "board-move-menu";
  // Barrierefreiheit: als Menü kennzeichnen.
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "Move to");
  // Anfangs versteckt.
  menu.hidden = true;

  // Menü an den <body> hängen, damit es über allem schwebt.
  document.body.appendChild(menu);
  // Der Move-Button, der das Menü gerade geöffnet hat.
  let activeButton = null;
  // Reihenfolge der Spalten (für "eine nach oben/unten").
  const columnIds = ["todo", "in-progress", "await-feedback", "done"];

  // Schließt das Menü; optional Fokus zurück auf den auslösenden Button.
  const closeMenu = (restoreFocus = false) => {
    menu.hidden = true;
    if (activeButton) {
      // Button wieder als "zugeklappt" markieren.
      activeButton.setAttribute("aria-expanded", "false");
      if (restoreFocus) activeButton.focus();
    }
    activeButton = null;
  };

  // Ein Klick-Listener für alle Karten (Event-Delegation).
  board.addEventListener("click", (event) => {
    // Wurde ein Move-Button geklickt?
    const button = event.target.closest(".board-card-move-button");
    // Nur reagieren, wenn es ein Move-Button ist UND der Bildschirm <= 360px ist.
    if (!button || !window.matchMedia("(max-width: 360px)").matches) return;
    // Zweiter Klick auf denselben Button -> Menü schließen.
    if (activeButton === button) {
      closeMenu(true);
      return;
    }
    // Evtl. offenes Menü eines anderen Buttons schließen.
    closeMenu();
    // Neuen auslösenden Button merken und als "aufgeklappt" markieren.
    activeButton = button;
    button.setAttribute("aria-expanded", "true");
    // Zugehörige Karte.
    const card = button.closest(".board-card--task");
    // Position der aktuellen Spalte in columnIds.
    const currentIndex = columnIds.indexOf(card.closest(".board-main-column").dataset.column);
    // Alten Menü-Inhalt leeren.
    menu.replaceChildren();
    // Überschrift "Move to" erzeugen.
    const heading = document.createElement("p");
    heading.className = "board-move-menu-title";
    heading.textContent = "Move to";
    menu.appendChild(heading);

    // Optionen für die vorherige und die nächste Spalte erzeugen.
    [currentIndex - 1, currentIndex + 1].forEach((index) => {
      // Außerhalb der Spalten (vor "To do" / nach "Done") -> keine Option.
      if (index < 0 || index >= columnIds.length) return;
      // Menüpunkt als Button.
      const option = document.createElement("button");
      option.type = "button";
      option.setAttribute("role", "menuitem");
      // Pfeil-Symbol (nur optisch, für Screenreader versteckt).
      const arrow = document.createElement("span");
      arrow.setAttribute("aria-hidden", "true");
      // ↑ für vorherige Spalte, ↓ für nächste Spalte.
      arrow.textContent = index < currentIndex ? "\u2191" : "\u2193";
      // Pfeil + Spaltenname in den Button einfügen.
      option.append(arrow, document.createTextNode(getColumnLabel(columnIds[index])));
      // Klick auf die Option -> Task verschieben.
      option.addEventListener("click", () => {
        // id der Task aus data-card-id.
        const taskId = card.dataset.cardId;
        // Verschieben; bei Fehler abbrechen.
        if (!moveBoardTask(taskId, columnIds[index])) return;
        // Menü schließen und Board neu rendern.
        closeMenu();
        initBoardLayout();
        // Neu gerenderte Karte suchen ...
        const movedCard = Array.from(board.querySelectorAll(".board-card--task"))
          .find((item) => item.dataset.cardId === taskId);
        // ... und den Fokus auf ihren Move-Button setzen (Tastaturnutzer).
        movedCard.querySelector(".board-card-move-button").focus();
      });
      // Option ins Menü einfügen.
      menu.appendChild(option);
    });

    // Menü anzeigen (muss sichtbar sein, damit offsetWidth/Height gemessen werden können).
    menu.hidden = false;

    // Position des Buttons auf dem Bildschirm.
    const rect = button.getBoundingClientRect();
    // Menü rechtsbündig zum Button, aber mind. 8px Abstand zum Bildschirmrand.
    const left = Math.max(8, Math.min(rect.right - menu.offsetWidth, window.innerWidth - menu.offsetWidth - 8));
    // Unter dem Button, wenn genug Platz ist, sonst darüber.
    const top = rect.bottom + menu.offsetHeight + 8 <= window.innerHeight
      ? rect.bottom + 8
      : Math.max(8, rect.top - menu.offsetHeight - 8);
    // Berechnete Position setzen.
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    // Fokus auf die erste Option.
    menu.querySelector("button").focus();
  });

  // Klick außerhalb von Menü und Move-Button -> Menü schließen.
  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target) && !event.target.closest(".board-card-move-button")) closeMenu();
  });
  // Tastatursteuerung, solange das Menü offen ist.
  document.addEventListener("keydown", (event) => {
    // Menü zu -> nichts tun.
    if (menu.hidden) return;
    if (event.key === "Escape") {
      // Escape: schließen und Fokus zurück auf den Button.
      event.preventDefault();
      closeMenu(true);
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      // Pfeiltasten/Home/End: zwischen den Optionen wechseln (Seite nicht scrollen).
      event.preventDefault();
      // Alle Option-Buttons im Menü.
      const options = Array.from(menu.querySelectorAll("button"));
      // Aktuell fokussierte Option.
      const index = options.indexOf(document.activeElement);

      // Home -> erste, End -> letzte, Pfeile -> nächste/vorherige (mit Umlauf am Ende/Anfang).
      const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
        : (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
      // Neue Option fokussieren.
      options[nextIndex].focus();
    } else if (event.key === "Tab") {
      // Tab: Menü schließen, Fokus zurück auf den Button.
      closeMenu(true);
    }
  });
  // Fenstergröße ändert sich -> Menü schließen (Position wäre falsch).
  window.addEventListener("resize", () => closeMenu());
  // Scrollen außerhalb des Menüs -> schließen (true = auch Scrolls in Unterelementen erfassen).
  document.addEventListener("scroll", (event) => {
    if (!menu.contains(event.target)) closeMenu();
  }, true);
  // Eingabe im Board (z. B. Suche) -> Menü schließen.
  board.addEventListener("input", () => closeMenu());
}

/**
 * Hängt die Drag-Events (dragstart/dragend) an eine Task-Karte.
 *
 * @param {HTMLElement} card - Die Task-Karte.
 * @param {{value: HTMLElement|null}} draggedCardRef - Gemeinsame Referenz auf die gerade gezogene Karte.
 * @returns {void}
 */
function bindCardDragEvents(card, draggedCardRef) {
  if (!card) return;

  // Ziehen beginnt.
  card.addEventListener("dragstart", (event) => {
    // Auf sehr kleinen Bildschirmen kein Drag & Drop (dort gibt es das Move-Menü).
    if (window.matchMedia("(max-width: 360px)").matches) {
      event.preventDefault();
      return;
    }
    // Gezogene Karte merken (für ondrop der Spalten).
    draggedCardRef.value = card;
    // Optisches Feedback per CSS (z. B. gedreht/transparent).
    card.classList.add("is-dragging");
    card.setAttribute("data-dragging", "true");
  });

  // Ziehen endet (egal ob abgelegt oder abgebrochen).
  card.addEventListener("dragend", () => {
    // Referenz zurücksetzen.
    draggedCardRef.value = null;
    // Drag-Styles entfernen.
    card.classList.remove("is-dragging");
    card.removeAttribute("data-dragging");
    // Hervorhebung aller Spalten als Ablageziel entfernen.
    document.querySelectorAll(".board-main-column").forEach((column) => {
      column.classList.remove("is-drop-target");
    });
  });
}

/**
 * Baut das Board auf: rendert Spalten, Karten, Leer-Hinweise,
 * richtet Drag & Drop und die Suche ein. Wird bei jeder Änderung erneut aufgerufen.
 *
 * @returns {void}
 */
function initBoardLayout() {
  // Alle Spalten-Elemente (mit data-column) aus board-layout.html.
  const columns = Array.from(document.querySelectorAll(".board-main-column"));
  // Suchfeld oben im Board.
  const searchInput = document.querySelector(".board-search-field input");
  // Container, der alle Spalten enthält.
  const boardMainContainer = document.querySelector(".board-main-container");

  // Keine Spalten -> nicht auf der Board-Seite, abbrechen.
  if (!columns.length) return;

  // Standard: alle Tasks in "To do".
  const defaultState = getDefaultBoardState();
  // Gespeicherte Zuordnung aus dem localStorage.
  const savedState = loadBoardState();
  // Gespeichertes überschreibt den Standard.
  const boardState = { ...defaultState, ...savedState };

  // Gemeinsame Referenz auf die gerade gezogene Karte (Objekt, damit sie per Referenz geteilt wird).
  const draggedCardRef = { value: null };

  // Klick-Listener für die "+"-Buttons der Spalten nur EINMAL anhängen (Flag im data-Attribut).
  if (boardMainContainer && !boardMainContainer.dataset.columnButtonDelegation) {
    boardMainContainer.dataset.columnButtonDelegation = "true";
    boardMainContainer.addEventListener("click", (event) => {
      // Wurde ein "+"-Button einer Spalte geklickt?
      const columnButton = event.target.closest(".board-main-column-add-button[data-column]");
      if (!columnButton) return;

      // Add-Task-Dialog für genau diese Spalte öffnen (Funktion kommt aus initAddTaskModal).
      if (typeof window.openBoardTaskModalForColumn === "function") {
        window.openBoardTaskModalForColumn(columnButton.dataset.column);
      }
    });
  }

  // Zeigt in jeder Spalte ohne Karte den Hinweis "No tasks ...".
  const renderEmptyStateForColumns = () => {
    columns.forEach((column) => {
      // Inhaltsbereich der Spalte.
      const content = column.querySelector(".board-main-column-content");
      // Gibt es mindestens eine Karte?
      const hasTaskCard = content ? content.querySelector(".board-card--task") : false;
      if (hasTaskCard) return;

      // Hinweis-Element erzeugen.
      const emptyState = document.createElement("p");
      emptyState.className = "board-empty-state";
      emptyState.textContent = getEmptyColumnMessage(column.dataset.column || "");
      emptyState.setAttribute("aria-label", emptyState.textContent);

      // In den Inhaltsbereich einfügen, sonst direkt in die Spalte.
      if (content) {
        content.appendChild(emptyState);
      } else {
        column.appendChild(emptyState);
      }
    });
  };

  // Zeigt "Keine Ergebnisse gefunden", wenn die Suche nichts findet.
  const renderSearchEmptyState = () => {
    if (!boardMainContainer) return;

    // Gesamtes Board leeren.
    boardMainContainer.innerHTML = "";

    // Hinweis-Element erzeugen.
    const emptyState = document.createElement("p");
    emptyState.className = "board-search-empty-state";
    emptyState.textContent = "Keine Ergebnisse gefunden";
    emptyState.setAttribute("aria-label", emptyState.textContent);

    // Hinweis ins Board einfügen.
    boardMainContainer.appendChild(emptyState);
  };

  // Erzeugt den Kopf einer Spalte: Überschrift + "+"-Button.
  const createColumnHeader = (columnId) => {
    // Container für den Kopf.
    const header = document.createElement("div");
    header.className = "board-main-column-header";

    // Spaltenüberschrift (z. B. "To do").
    const title = document.createElement("h2");
    title.className = "board-main-column-title";
    title.textContent = getColumnLabel(columnId);

    // "+"-Button zum Hinzufügen einer Task direkt in diese Spalte.
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "board-main-column-add-button";
    // Spalten-id merken -> wird beim Klick ausgelesen.
    addButton.dataset.column = columnId;
    addButton.setAttribute("aria-label", `Add ${getColumnLabel(columnId)}`);
    addButton.textContent = "+";

    // Überschrift und Button in den Kopf einfügen.
    header.appendChild(title);
    header.appendChild(addButton);

    return header;
  };

  // Erzeugt den leeren Inhaltsbereich einer Spalte (hier kommen die Karten rein).
  const createColumnContent = () => {
    const content = document.createElement("div");
    content.className = "board-main-column-content";
    return content;
  };

  // Rendert das komplette Board neu (Spalten leeren, Karten einsortieren).
  const renderBoardState = () => {
    // Jede Spalte leeren und Kopf + Inhaltsbereich neu aufbauen.
    columns.forEach((column) => {
      column.innerHTML = "";

      const header = createColumnHeader(column.dataset.column || "");
      const content = createColumnContent();

      column.appendChild(header);
      column.appendChild(content);
    });

    // Keine Task-Daten -> nur Leer-Hinweise anzeigen.
    if (!Array.isArray(tasks)) {
      renderEmptyStateForColumns();
      return;
    }

    // Suchbegriff klein geschrieben und ohne Leerzeichen am Rand.
    const searchTerm = currentBoardSearchQuery.trim().toLowerCase();
    // Bei Suchbegriff nur Tasks, deren Titel oder Beschreibung ihn enthält; sonst alle.
    const visibleTasks = searchTerm
      ? tasks.filter((task) => {
          const title = String(task.title || "").toLowerCase();
          const description = String(task.description || "").toLowerCase();
          return title.includes(searchTerm) || description.includes(searchTerm);
        })
      : tasks;

    // Suche ohne Treffer -> "Keine Ergebnisse gefunden" anzeigen.
    if (searchTerm && visibleTasks.length === 0) {
      renderSearchEmptyState();
      return;
    }

    // Jede sichtbare Task in ihre Spalte einsortieren.
    visibleTasks.forEach((task) => {
      // Ziel-Spalte aus dem Board-Zustand (Fallback "todo").
      const targetColumnId = boardState[task.id] || "todo";
      // Passendes Spalten-Element finden.
      const column = columns.find((item) => item.dataset.column === targetColumnId);

      if (!column) return;

      // Inhaltsbereich der Spalte.
      const content = column.querySelector(".board-main-column-content");
      if (!content) return;

      // HTML-String der Karte (templates.js) in ein echtes Element umwandeln.
      const wrapper = document.createElement("div");
      wrapper.innerHTML = renderTaskCard(task);
      const card = wrapper.firstElementChild;

      if (!card) return;

      // Drag-Events anhängen und Karte in die Spalte einfügen.
      bindCardDragEvents(card, draggedCardRef);
      content.appendChild(card);
    });

    // Leere Spalten mit Hinweis füllen.
    renderEmptyStateForColumns();
  };

  // Hebt eine Spalte als Ablageziel hervor (oder entfernt die Hervorhebung).
  const setDropTargetState = (column, isActive) => {
    column.classList.toggle("is-drop-target", isActive);
  };

  // Drop-Events für jede Spalte (als on...-Property, damit beim erneuten Aufruf nichts doppelt hängt).
  columns.forEach((column) => {
    // Karte wird über die Spalte gezogen.
    column.ondragover = (event) => {
      if (!draggedCardRef.value) return;

      // preventDefault erlaubt das Ablegen.
      event.preventDefault();
      setDropTargetState(column, true);
    };

    // Karte verlässt die Spalte -> Hervorhebung entfernen.
    column.ondragleave = () => {
      setDropTargetState(column, false);
    };

    // Karte wird in der Spalte losgelassen.
    column.ondrop = (event) => {
      event.preventDefault();

      if (!draggedCardRef.value) return;

      // Ziel-Spalte, gezogene Karte und deren Task-id ermitteln.
      const targetColumnId = column.dataset.column;
      const draggedCard = draggedCardRef.value;
      const draggedTaskId = draggedCard.dataset.cardId;

      // Task verschieben und speichern; bei Fehler abbrechen.
      if (!moveBoardTask(draggedTaskId, targetColumnId)) return;
      // Lokalen Zustand aktualisieren und neu rendern.
      boardState[draggedTaskId] = targetColumnId;
      renderBoardState();
      setDropTargetState(column, false);
    };
  });

  // Bei jeder Eingabe im Suchfeld Suchbegriff merken und Board neu rendern.
  if (searchInput) {
    searchInput.oninput = () => {
      currentBoardSearchQuery = searchInput.value || "";
      renderBoardState();
    };
  }

  // Beim (erneuten) Aufbau den aktuellen Wert im Suchfeld übernehmen.
  if (searchInput) {
    currentBoardSearchQuery = searchInput.value || currentBoardSearchQuery;
  }

  // Erstes Rendern des Boards.
  renderBoardState();
}

/**
 * Initialisiert den Add-/Edit-Task-Dialog im Board:
 * Öffnen/Schließen, Formular-Validierung, Erstellen neuer Tasks
 * und Speichern bearbeiteter Tasks.
 *
 * @returns {void}
 */
function initAddTaskModal() {
  // Buttons und Container des Dialogs aus board-layout.html.
  const openButton = document.getElementById("board-open-add-task-modal");
  const closeButton = document.getElementById("board-task-close-button");
  const cancelButton = document.getElementById("board-task-cancel-button");
  const modal = document.getElementById("board-add-task-modal");
  const form = document.getElementById("board-task-form");
  const saveButton = document.getElementById("board-task-save-button");
  const dialogTitle = document.getElementById("board-task-dialog-title");

  // Eingabefelder des Formulars.
  const titleInput = document.getElementById("board-task-title");
  const descriptionInput = document.getElementById("board-task-description");
  const dateInput = document.getElementById("board-task-date");
  const priorityInput = document.getElementById("board-task-priority");
  const assignedInput = document.getElementById("board-task-assigned");
  const categoryInput = document.getElementById("board-task-category");
  const subtaskInput = document.getElementById("board-task-subtask");
  // "+"-Buttons im Spalten-Header, die den Dialog für eine bestimmte Spalte öffnen.
  const headerButtons = Array.from(document.querySelectorAll(".board-header-column button[data-column]"));

  // id der Task, die gerade bearbeitet wird (null = neue Task anlegen).
  let editingTaskId = null;
  // Spalte, in die eine neue Task kommt.
  let defaultStatus = "todo";

  // Setzt den Dialog auf "Add Task" zurück und leert das Formular.
  const resetModalState = () => {
    editingTaskId = null;
    defaultStatus = "todo";
    if (dialogTitle) dialogTitle.textContent = "Add Task";
    if (saveButton) saveButton.textContent = "Create Task";
    form.reset();
    // Button bleibt gesperrt, bis das Formular gültig ist.
    saveButton.disabled = true;
    modal.dataset.status = "todo";
  };

  // Öffnet den Dialog für eine neue Task in "To do".
  const openModal = () => {
    resetModalState();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  };

  // Öffnet den Dialog für eine neue Task in einer bestimmten Spalte.
  const openModalForColumn = (status) => {
    resetModalState();
    defaultStatus = status || "todo";
    // Ziel-Spalte am Dialog merken (wird beim Speichern gelesen).
    modal.dataset.status = defaultStatus;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  };

  // Schließt den Dialog und setzt ihn zurück.
  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    resetModalState();
  };

  // Öffnet den Dialog im Bearbeiten-Modus und füllt die Felder mit den Task-Daten.
  const openEditModal = (task) => {
    if (!task) return;

    // Merken, welche Task bearbeitet wird.
    editingTaskId = task.id;
    // Texte auf "Edit" umstellen.
    if (dialogTitle) dialogTitle.textContent = "Edit Task";
    if (saveButton) saveButton.textContent = "Save changes";

    // Felder mit den vorhandenen Werten befüllen.
    titleInput.value = task.title || "";
    descriptionInput.value = task.description || "";
    dateInput.value = task.dueDate || "";
    priorityInput.value = task.priority || "Medium";

    // In der Mehrfachauswahl die zugewiesenen Kontakte markieren.
    Array.from(assignedInput.options).forEach((option) => {
      option.selected = Array.isArray(task.assignedTo) && task.assignedTo.includes(option.value);
    });

    categoryInput.value = task.category || "";
    // Subtasks als kommagetrennten Text ins Feld schreiben.
    if (subtaskInput) {
      subtaskInput.value = Array.isArray(task.subtasks) ? task.subtasks.map((subtask) => subtask.label).join(", ") : "";
    }

    // Speichern-Button je nach Gültigkeit freigeben und Dialog öffnen.
    updateSaveButtonState();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  };

  // Wandelt "a, b, c" in [{label: "a", done: false}, ...] um.
  const parseSubtasks = (value) => {
    if (!value) return [];

    return value
      // An Kommas trennen.
      .split(",")
      // Leerzeichen entfernen.
      .map((item) => item.trim())
      // Leere Einträge entfernen.
      .filter(Boolean)
      // In Subtask-Objekte umwandeln.
      .map((label) => ({ label, done: false }));
  };

  // Liefert die Werte (Initialen) aller ausgewählten Kontakte.
  const getSelectedAssignedContacts = () => {
    if (!assignedInput) return [];
    return Array.from(assignedInput.selectedOptions)
      .map((option) => option.value)
      .filter(Boolean);
  };

  // Formular ist gültig, wenn alle Pflichtfelder ausgefüllt sind und mind. ein Kontakt gewählt ist.
  const isFormValid = () => {
    return titleInput.value.trim() !== "" &&
      descriptionInput.value.trim() !== "" &&
      dateInput.value.trim() !== "" &&
      priorityInput.value !== "" &&
      getSelectedAssignedContacts().length > 0 &&
      categoryInput.value !== "";
  };

  // Speichern-Button sperren, solange geladen wird oder das Formular ungültig ist.
  const updateSaveButtonState = () => {
    if (!saveButton) return;
    const isLoading = saveButton.dataset.loading === "true";
    saveButton.disabled = isLoading || !isFormValid();
  };

  // Bei jeder Änderung eines Pflichtfeldes den Button-Zustand prüfen.
  [titleInput, descriptionInput, dateInput, priorityInput, assignedInput, categoryInput].forEach((field) => {
    if (!field) return;
    field.addEventListener("input", updateSaveButtonState);
    field.addEventListener("change", updateSaveButtonState);
  });

  // "Add task"-Button öffnet, X und Cancel schließen den Dialog.
  openButton.addEventListener("click", openModal);
  closeButton.addEventListener("click", closeModal);
  cancelButton.addEventListener("click", closeModal);

  // Klick auf den dunklen Hintergrund (außerhalb des Dialogs) schließt ihn.
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  // Klick auf "Create Task" / "Save changes".
  saveButton.addEventListener("click", () => {
    // Doppelklick während des Speicherns oder ungültiges Formular -> nichts tun.
    if (saveButton.dataset.loading === "true" || !isFormValid()) return;

    // Ladezustand setzen und Text anpassen.
    saveButton.dataset.loading = "true";
    saveButton.disabled = true;
    saveButton.textContent = editingTaskId ? "Saving..." : "Creating...";

    // Kurze Verzögerung simuliert das Speichern.
    window.setTimeout(() => {
      // Ladezustand beenden.
      saveButton.dataset.loading = "false";
      // ---- Bearbeiten einer vorhandenen Task ----
      if (editingTaskId) {
        // Task-Objekt suchen.
        const task = Array.isArray(tasks) ? tasks.find((item) => item.id === editingTaskId) : null;
        if (task) {
          // Alle Werte aus dem Formular übernehmen.
          task.title = titleInput.value.trim();
          task.description = descriptionInput.value.trim();
          task.dueDate = dateInput.value;
          task.priority = priorityInput.value;
          // Farbe je Priorität: Urgent rot, Medium orange, Low grün.
          task.priorityColor = priorityInput.value === "Urgent" ? "#f66a5f" : priorityInput.value === "Medium" ? "#f9a35c" : "#5bc0be";
          task.category = categoryInput.value;
          // Farbe je Kategorie: Technical Task türkis, User Story blau.
          task.categoryColor = categoryInput.value === "Technical Task" ? "#2bc7b7" : "#2d8cff";
          task.assignedTo = getSelectedAssignedContacts();
          task.subtasks = parseSubtasks(subtaskInput.value);
        }

        // Board neu rendern und Dialog schließen.
        initBoardLayout();
        closeModal();
        return;
      }

      // ---- Neue Task anlegen ----
      const newTask = {
        // Eindeutige id über den aktuellen Zeitstempel.
        id: `task-${Date.now()}`,
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
        dueDate: dateInput.value,
        priority: priorityInput.value,
        priorityColor: priorityInput.value === "Urgent" ? "#f66a5f" : priorityInput.value === "Medium" ? "#f9a35c" : "#5bc0be",
        category: categoryInput.value,
        categoryColor: categoryInput.value === "Technical Task" ? "#2bc7b7" : "#2d8cff",
        // Ziel-Spalte: am Dialog gespeicherte Spalte, sonst "todo".
        status: modal.dataset.status || defaultStatus || "todo",
        assignedTo: getSelectedAssignedContacts(),
        subtasks: parseSubtasks(subtaskInput.value),
        progress: 0,
        badge: categoryInput.value
      };

      // Neue Task vorne in die Liste einfügen.
      tasks.unshift(newTask);
      // Spaltenzuordnung der neuen Task im localStorage speichern.
      const boardState = loadBoardState();
      boardState[newTask.id] = newTask.status;
      window.localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(boardState));
      // Board neu rendern und Dialog schließen.
      initBoardLayout();
      closeModal();
    }, 300);
  });

  // "+"-Buttons im Spalten-Header öffnen den Dialog für ihre Spalte.
  headerButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openModalForColumn(button.dataset.column);
    });
  });

  // Funktionen global verfügbar machen, damit initBoardLayout() und initTaskDetailModal() sie aufrufen können.
  window.openBoardTaskEditModal = openEditModal;
  window.openBoardTaskModalForColumn = openModalForColumn;
  window.closeBoardTaskModal = closeModal;
}

/**
 * Initialisiert den Detail-Dialog einer Task: öffnen per Klick auf die
 * Beschreibung, Subtasks abhaken, Task löschen oder bearbeiten.
 *
 * @returns {void}
 */
function initTaskDetailModal() {
  // Board-Container, Detail-Dialog und dessen Inhaltsbereich.
  const boardMainContainer = document.querySelector(".board-main-container");
  const detailModal = document.getElementById("board-task-detail-modal");
  const detailRoot = document.getElementById("board-task-detail-root");

  // Fehlt eines davon -> nicht auf der Board-Seite.
  if (!boardMainContainer || !detailModal || !detailRoot) return;

  // Sucht eine Task anhand ihrer id.
  const getTaskById = (taskId) => {
    if (!taskId || !Array.isArray(tasks)) return null;
    return tasks.find((task) => task.id === taskId) || null;
  };

  // Aktualisiert Titel, Beschreibung und Fortschritt der kleinen Karte, ohne das Board neu zu rendern.
  const syncCardContent = (task) => {
    if (!task) return;

    // Karte der Task im Board finden.
    const card = boardMainContainer.querySelector(`.board-card--task[data-card-id="${task.id}"]`);
    if (!card) return;

    // Elemente innerhalb der Karte.
    const title = card.querySelector(".board-card-title");
    const description = card.querySelector(".board-card-description");
    const progressBar = card.querySelector(".board-progress-bar span");
    const progressLabel = card.querySelector(".board-progress-label");

    // Texte aktualisieren.
    if (title) title.textContent = task.title;
    if (description) description.textContent = task.description;

    // Fortschritt wie in renderTaskCard() (templates.js) berechnen.
    const taskSubtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    const doneSubtasks = taskSubtasks.filter((subtask) => subtask.done).length;
    const totalSubtasks = taskSubtasks.length;
    const progressWidth = totalSubtasks
      ? Math.round((doneSubtasks / totalSubtasks) * 100)
      : Math.max(0, Math.min(100, task.progress || 0));

    // Balkenbreite und Beschriftung setzen.
    if (progressBar) progressBar.style.width = `${progressWidth}%`;
    if (progressLabel) {
      progressLabel.textContent = totalSubtasks
        ? `${doneSubtasks}/${totalSubtasks} Subtasks`
        : `${Math.round(progressWidth)}%`;
    }
  };

  // Löscht eine Task aus den Daten, dem localStorage und dem Board.
  const deleteTask = (taskId) => {
    // Position der Task in der Liste.
    const taskIndex = Array.isArray(tasks) ? tasks.findIndex((task) => task.id === taskId) : -1;
    if (taskIndex === -1) return;

    // Task aus dem Array entfernen.
    tasks.splice(taskIndex, 1);

    // Eintrag aus dem gespeicherten Board-Zustand entfernen.
    const boardState = loadBoardState();
    delete boardState[taskId];
    window.localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(boardState));

    // Karte aus dem DOM entfernen.
    const card = boardMainContainer.querySelector(`.board-card--task[data-card-id="${taskId}"]`);
    if (card) card.remove();

    // Board neu rendern (z. B. für "No tasks"-Hinweise).
    initBoardLayout();
  };

  // Öffnet den Detail-Dialog für eine Task.
  const openDetailModal = (task) => {
    if (!task) return;

    // Detail-HTML aus templates.js einfügen.
    detailRoot.innerHTML = renderTaskDetail(task);
    // Task-id merken (für Delete/Edit/Subtasks).
    detailRoot.dataset.taskId = task.id;
    // Dialog anzeigen.
    detailModal.classList.add("is-open");
    detailModal.setAttribute("aria-hidden", "false");

    // X-Button im Detail schließt den Dialog.
    const closeButton = detailRoot.querySelector(".board-detail-close");
    if (closeButton) {
      closeButton.addEventListener("click", closeDetailModal);
    }
  };

  // Schließt den Detail-Dialog und leert ihn.
  const closeDetailModal = () => {
    detailModal.classList.remove("is-open");
    detailModal.setAttribute("aria-hidden", "true");
    detailRoot.innerHTML = "";
    detailRoot.removeAttribute("data-task-id");
  };

  // Klicks auf Delete/Edit im Detail-Dialog (Event-Delegation über data-action).
  detailRoot.addEventListener("click", (event) => {
    // Button mit data-action suchen.
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;

    // Aktuelle Task holen.
    const taskId = detailRoot.dataset.taskId;
    const task = getTaskById(taskId);
    if (!task) return;

    // Delete: nach Bestätigung löschen und Dialog schließen.
    if (actionButton.dataset.action === "delete-task") {
      const shouldDelete = window.confirm("Delete this task?");
      if (!shouldDelete) return;

      deleteTask(taskId);
      closeDetailModal();
      return;
    }

    // Edit: Detail schließen und Bearbeiten-Dialog öffnen (aus initAddTaskModal).
    if (actionButton.dataset.action === "edit-task") {
      closeDetailModal();
      if (typeof window.openBoardTaskEditModal === "function") {
        window.openBoardTaskEditModal(task);
      }
    }
  });

  // Subtask-Checkbox im Detail-Dialog an-/abgehakt.
  detailRoot.addEventListener("change", (event) => {
    // Nur Subtask-Checkboxen beachten.
    const checkbox = event.target.closest(".board-detail-subtask input[type='checkbox']");
    if (!checkbox) return;

    // Aktuelle Task mit Subtasks holen.
    const taskId = detailRoot.dataset.taskId;
    const task = getTaskById(taskId);
    if (!task || !Array.isArray(task.subtasks)) return;

    // Index der Subtask aus data-subtask-index (templates.js).
    const subtaskIndex = Number(checkbox.dataset.subtaskIndex);
    if (!Number.isInteger(subtaskIndex) || !task.subtasks[subtaskIndex]) return;

    // Erledigt-Status speichern und Karte im Board aktualisieren.
    task.subtasks[subtaskIndex].done = checkbox.checked;
    syncCardContent(task);
  });

  // Klick auf die Beschreibung einer Karte öffnet den Detail-Dialog.
  boardMainContainer.addEventListener("click", (event) => {
    const description = event.target.closest(".board-card-description");
    if (!description) return;

    // Zugehörige Karte.
    const card = description.closest(".board-card--task");
    if (!card) return;

    // Task anhand der data-card-id finden.
    const taskId = card.dataset.cardId;
    const task = Array.isArray(tasks) ? tasks.find((item) => item.id === taskId) : null;

    if (!task) return;

    openDetailModal(task);
  });

  // Klick auf den dunklen Hintergrund schließt den Detail-Dialog.
  detailModal.addEventListener("click", (event) => {
    if (event.target === detailModal) {
      closeDetailModal();
    }
  });

  // Escape-Taste schließt den Detail-Dialog, wenn er offen ist.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && detailModal.classList.contains("is-open")) {
      closeDetailModal();
    }
  });
}

// Startpunkt: Sobald das HTML geladen ist, alle Board-Bereiche initialisieren.
document.addEventListener("DOMContentLoaded", () => {
  // Mobile Navigation passend zur Bildschirmbreite einstellen.
  syncBoardMobileNavigation();
  // Board mit Karten rendern.
  initBoardLayout();
  // "Move to"-Menü für kleine Bildschirme.
  initBoardMoveMenu();
  // Add-/Edit-Task-Dialog.
  initAddTaskModal();
  // Task-Detail-Dialog.
  initTaskDetailModal();
});

// Bei Größenänderung des Fensters die mobile Navigation anpassen.
window.addEventListener("resize", syncBoardMobileNavigation);
