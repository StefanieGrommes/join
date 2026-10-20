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
      const content = column.querySelector(".board-main-column-content");
      const hasTaskCard = content ? content.querySelector(".board-card--task") : false;
      if (hasTaskCard) return;

      const emptyState = document.createElement("p");
      emptyState.className = "board-empty-state";
      emptyState.textContent = getEmptyColumnMessage(column.dataset.column || "");
      emptyState.setAttribute("aria-label", emptyState.textContent);

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

    // Spalten nur ausblenden, nicht löschen.
    columns.forEach((column) => {
      column.style.display = "none";
    });

    const emptyState = document.createElement("p");
    emptyState.className = "board-search-empty-state";
    emptyState.textContent = "Keine Ergebnisse gefunden";
    emptyState.setAttribute("aria-label", emptyState.textContent);

    boardMainContainer.appendChild(emptyState);
  };

  // Erzeugt den Kopf einer Spalte: Überschrift + "+"-Button.
    const createColumnHeader = (columnId) => {
    const header = document.createElement("div");
    header.className = "board-main-column-header";

    const title = document.createElement("h2");
    title.className = "board-main-column-title";
    title.textContent = getColumnLabel(columnId);

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "board-main-column-add-button";
    addButton.dataset.column = columnId;
    addButton.setAttribute("aria-label", `Add ${getColumnLabel(columnId)}`);
    addButton.textContent = "+";

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
    // Alten Leer-Hinweis der Suche entfernen.
    const searchEmpty = boardMainContainer && boardMainContainer.querySelector(".board-search-empty-state");
    if (searchEmpty) searchEmpty.remove();

    // Spalten wieder einblenden.
    columns.forEach((column) => {
      column.style.display = "";
    });

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
      const targetColumnId = boardState[task.id] || "todo";
      const column = columns.find((item) => item.dataset.column === targetColumnId);
      if (!column) return;

      const content = column.querySelector(".board-main-column-content");
      if (!content) return;

      const wrapper = document.createElement("div");
      wrapper.innerHTML = renderTaskCard(task);
      const card = wrapper.firstElementChild;
      if (!card) return;

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


const addTaskModal = document.getElementById("board-add-task-modal");
const addTaskForm = document.getElementById("board-task-form");
const addTaskSaveButton = document.getElementById("board-task-save-button");
const addTaskClearButton = document.getElementById("board-task-clear-button");
const addTaskCloseButton = document.getElementById("board-task-close-button");
const addTaskOpenButton = document.getElementById("board-open-add-task-modal");
const addTaskDialogTitle = document.getElementById("board-task-dialog-title");
const addTaskTitleInput = document.getElementById("taskTitle");
const addTaskDescriptionInput = document.getElementById("taskDescription");
const addTaskDateInput = document.getElementById("taskDueDate");
const addTaskCategoryInput = document.getElementById("taskCategory");
const addTaskHeaderButtons = Array.from(document.querySelectorAll(".board-header-column button[data-column]"));
const ADD_TASK_PRIORITY_CLASSES = { Urgent: "priority-urgent", Medium: "priority-medium", Low: "priority-low" };
const ADD_TASK_PRIORITY_COLORS = { Urgent: "#f66a5f", Medium: "#f9a35c", Low: "#5bc0be" };
const ADD_TASK_CATEGORY_COLORS = { "Technical Task": "#2bc7b7", "User Story": "#2d8cff" };
let addTaskEditingId = null;
let addTaskDefaultStatus = "todo";

// ---------- Priorität ----------
function getAddTaskPriority() {
  const active = addTaskForm.querySelector(".priority-btn.priority-active");
  if (!active) return "Medium";
  return Object.keys(ADD_TASK_PRIORITY_CLASSES)
    .find((key) => active.classList.contains(ADD_TASK_PRIORITY_CLASSES[key])) || "Medium";
}

function setAddTaskPriority(value) {
  const cssClass = ADD_TASK_PRIORITY_CLASSES[value] || ADD_TASK_PRIORITY_CLASSES.Medium;
  changePriority(addTaskForm.querySelector(`.${cssClass}`));
}

// ---------- Formulardaten lesen ----------
function getSelectedAssignedContacts() {
  return Array.from(document.querySelectorAll("#assigned-to-list .contact-option.selected"))
    .map((option) => option.querySelector(".contact-avatar").textContent.trim());
}

function readAddTaskSubtasks(previous = []) {
  saveSubtask(); // noch nicht bestätigten Text im Subtask-Feld übernehmen
  return Array.from(subTaskList.querySelectorAll(".subtask-text")).map((el) => {
    const label = el.textContent.trim();
    const old = previous.find((subtask) => subtask.label === label);
    return { label, done: old ? Boolean(old.done) : false };
  });
}

function buildAddTaskData() {
  const priority = getAddTaskPriority();
  const category = addTaskCategoryInput.value;
  return {
    title: addTaskTitleInput.value.trim(),
    description: addTaskDescriptionInput.value.trim(),
    dueDate: addTaskDateInput.value,
    priority,
    priorityColor: ADD_TASK_PRIORITY_COLORS[priority] || ADD_TASK_PRIORITY_COLORS.Low,
    category,
    categoryColor: ADD_TASK_CATEGORY_COLORS[category] || ADD_TASK_CATEGORY_COLORS["User Story"],
    assignedTo: getSelectedAssignedContacts()
  };
}

// ---------- Validierung ----------
function clearAddTaskErrors() {
  addTaskForm.querySelectorAll(".input-error").forEach((el) => el.classList.remove("input-error"));
  addTaskForm.querySelectorAll(".field-error").forEach((el) => { el.textContent = ""; });
}

function clearAddTaskFieldError(field) {
  field.classList.remove("input-error");
  const error = field.closest(".form-field").querySelector(".field-error");
  if (error) error.textContent = "";
}

function setAddTaskError(field, message) {
  field.classList.add("input-error");
  const error = field.closest(".form-field").querySelector(".field-error");
  if (error) error.textContent = message;
}

function validateAddTaskForm() {
  clearAddTaskErrors();
  const required = [addTaskTitleInput, addTaskDateInput, addTaskCategoryInput];
  const missing = required.filter((field) => !field.value.trim());
  missing.forEach((field) => setAddTaskError(field, "This field is required"));
  return missing.length === 0;
}

function bindAddTaskFieldReset() {
  [addTaskTitleInput, addTaskDateInput, addTaskCategoryInput].forEach((field) => {
    field.addEventListener("input", () => clearAddTaskFieldError(field));
  });
}

// ---------- Zurücksetzen, Öffnen, Schließen ----------
function setAddTaskSaveLabel(text) {
  addTaskSaveButton.firstChild.textContent = text;
}

function resetAddTaskForm() {
  addTaskForm.reset();
  list.innerHTML = "";
  list.style.display = "none";
  document.getElementById("assigned-to-dropdown").classList.remove("open");
  document.getElementById("assigned-avatars").innerHTML = "";
  subTaskList.innerHTML = "";
  showSubtaskActions();
  setAddTaskPriority("Medium");
  clearAddTaskErrors();
}

function resetAddTaskState() {
  addTaskEditingId = null;
  addTaskDefaultStatus = "todo";
  addTaskDialogTitle.textContent = "Add Task";
  setAddTaskSaveLabel("Create Task ");
  addTaskModal.dataset.status = "todo";
  resetAddTaskForm();
}

function showAddTaskModal() {
  addTaskModal.classList.add("is-open");
  addTaskModal.setAttribute("aria-hidden", "false");
}

function openAddTaskModal() {
  resetAddTaskState();
  showAddTaskModal();
}

function openAddTaskModalForColumn(status) {
  resetAddTaskState();
  addTaskDefaultStatus = status || "todo";
  addTaskModal.dataset.status = addTaskDefaultStatus;
  showAddTaskModal();
}

function closeAddTaskModal() {
  addTaskModal.classList.remove("is-open");
  addTaskModal.setAttribute("aria-hidden", "true");
  resetAddTaskState();
}

// ---------- Bearbeiten ----------
function fillAddTaskForm(task) {
  addTaskTitleInput.value = task.title || "";
  addTaskDescriptionInput.value = task.description || "";
  addTaskDateInput.value = task.dueDate || "";
  addTaskCategoryInput.value = task.category || "";
  setAddTaskPriority(task.priority || "Medium");
}

function fillAddTaskContacts(assigned) {
  renderContactOptions(getSessionData("session-contacts"));
  list.querySelectorAll(".contact-option").forEach((option) => {
    const initials = option.querySelector(".contact-avatar").textContent.trim();
    if (assigned.includes(initials)) toggleContactSelection(option);
  });
  renderAssignedAvatars();
}

function fillAddTaskSubtasks(subtasks) {
  subtasks.forEach((subtask) => {
    subTaskList.insertAdjacentHTML("beforeend", getSubtaskItemTemplate(subtask.label));
  });
}

function openAddTaskEditModal(task) {
  if (!task) return;
  resetAddTaskState();
  addTaskEditingId = task.id;
  addTaskDialogTitle.textContent = "Edit Task";
  setAddTaskSaveLabel("Save changes ");
  fillAddTaskForm(task);
  fillAddTaskContacts(Array.isArray(task.assignedTo) ? task.assignedTo : []);
  fillAddTaskSubtasks(Array.isArray(task.subtasks) ? task.subtasks : []);
  showAddTaskModal();
}

// ---------- Speichern ----------
function updateAddTask() {
  const task = Array.isArray(tasks) ? tasks.find((item) => item.id === addTaskEditingId) : null;
  if (!task) return;
  Object.assign(task, buildAddTaskData(), { subtasks: readAddTaskSubtasks(task.subtasks) });
}

function storeAddTaskStatus(task) {
  const boardState = loadBoardState();
  boardState[task.id] = task.status;
  window.localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(boardState));
}

function createAddTask() {
  const newTask = {
    ...buildAddTaskData(),
    id: `task-${Date.now()}`,
    status: addTaskModal.dataset.status || addTaskDefaultStatus || "todo",
    subtasks: readAddTaskSubtasks(),
    progress: 0
  };
  newTask.badge = newTask.category;
  tasks.unshift(newTask);
  storeAddTaskStatus(newTask);
}

function saveAddTask() {
  if (!validateAddTaskForm()) return;
  if (addTaskEditingId) updateAddTask();
  else createAddTask();
  initBoardLayout();
  closeAddTaskModal();
}

// ---------- Initialisierung ----------
function bindAddTaskHeaderButtons() {
  addTaskHeaderButtons.forEach((button) => {
    button.addEventListener("click", () => openAddTaskModalForColumn(button.dataset.column));
  });
}

function exposeAddTaskModalApi() {
  window.openBoardTaskEditModal = openAddTaskEditModal;
  window.openBoardTaskModalForColumn = openAddTaskModalForColumn;
  window.closeBoardTaskModal = closeAddTaskModal;
}

/**
 * Initialisiert den Add-/Edit-Task-Dialog im Board:
 * Öffnen/Schließen, Formular-Validierung, Erstellen neuer Tasks
 * und Speichern bearbeiteter Tasks.
 *
 * @returns {void}
 */
function initAddTaskModal() {
  bindAddTaskFieldReset();
  bindAddTaskHeaderButtons();
  addTaskForm.addEventListener("submit", (event) => { event.preventDefault(); saveAddTask(); });
  addTaskOpenButton.addEventListener("click", openAddTaskModal);
  addTaskCloseButton.addEventListener("click", closeAddTaskModal);
  addTaskClearButton.addEventListener("click", resetAddTaskForm);
  addTaskModal.addEventListener("click", (event) => {
    if (event.target === addTaskModal) closeAddTaskModal();
  });
  exposeAddTaskModalApi();
}

function initTaskDetailModal() {
  const boardMainContainer = document.querySelector(".board-main-container");
  const detailModal = document.getElementById("board-task-detail-modal");
  const detailRoot = document.getElementById("board-task-detail-root");
  if (!boardMainContainer || !detailModal || !detailRoot) return;

  const getTaskById = (taskId) => {
    if (!taskId || !Array.isArray(tasks)) return null;
    return tasks.find((task) => task.id === taskId) || null;
  };

  const syncCardContent = (task) => {
    if (!task) return;
    const card = boardMainContainer.querySelector(`.board-card--task[data-card-id="${task.id}"]`);
    if (!card) return;

    const title = card.querySelector(".board-card-title");
    const description = card.querySelector(".board-card-description");
    const progressBar = card.querySelector(".board-progress-bar span");
    const progressLabel = card.querySelector(".board-progress-label");
    if (title) title.textContent = task.title;
    if (description) description.textContent = task.description;

    const taskSubtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    const doneSubtasks = taskSubtasks.filter((subtask) => subtask.done).length;
    const totalSubtasks = taskSubtasks.length;
    const progressWidth = totalSubtasks
      ? Math.round((doneSubtasks / totalSubtasks) * 100)
      : Math.max(0, Math.min(100, task.progress || 0));

    if (progressBar) progressBar.style.width = `${progressWidth}%`;
    if (progressLabel) {
      progressLabel.textContent = totalSubtasks
        ? `${doneSubtasks}/${totalSubtasks} Subtasks`
        : `${Math.round(progressWidth)}%`;
    }
  };

  const deleteTask = (taskId) => {
    const taskIndex = Array.isArray(tasks) ? tasks.findIndex((task) => task.id === taskId) : -1;
    if (taskIndex === -1) return;
    tasks.splice(taskIndex, 1);

    const boardState = loadBoardState();
    delete boardState[taskId];
    window.localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(boardState));

    const card = boardMainContainer.querySelector(`.board-card--task[data-card-id="${taskId}"]`);
    if (card) card.remove();
    initBoardLayout();
  };

  const closeDetailModal = () => {
    detailModal.classList.remove("is-open");
    detailModal.setAttribute("aria-hidden", "true");
    detailRoot.innerHTML = "";
    detailRoot.removeAttribute("data-task-id");
  };

  const openDetailModal = (task) => {
    if (!task) return;
    detailRoot.innerHTML = renderTaskDetail(task);
    detailRoot.dataset.taskId = task.id;
    detailModal.classList.add("is-open");
    detailModal.setAttribute("aria-hidden", "false");

    const closeButton = detailRoot.querySelector(".board-detail-close");
    if (closeButton) closeButton.addEventListener("click", closeDetailModal);
  };

  detailRoot.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;

    const taskId = detailRoot.dataset.taskId;
    const task = getTaskById(taskId);
    if (!task) return;

    if (actionButton.dataset.action === "delete-task") {
      if (!window.confirm("Delete this task?")) return;
      deleteTask(taskId);
      closeDetailModal();
      return;
    }

    if (actionButton.dataset.action === "edit-task") {
      closeDetailModal();
      if (typeof window.openBoardTaskEditModal === "function") {
        window.openBoardTaskEditModal(task);
      }
    }
  });

  detailRoot.addEventListener("change", (event) => {
    const checkbox = event.target.closest(".board-detail-subtask input[type='checkbox']");
    if (!checkbox) return;

    const task = getTaskById(detailRoot.dataset.taskId);
    if (!task || !Array.isArray(task.subtasks)) return;

    const subtaskIndex = Number(checkbox.dataset.subtaskIndex);
    if (!Number.isInteger(subtaskIndex) || !task.subtasks[subtaskIndex]) return;

    task.subtasks[subtaskIndex].done = checkbox.checked;
    syncCardContent(task);
  });
boardMainContainer.addEventListener("click", (event) => {
  // Klicks auf den Move-Button (Mobile) nicht als Karten-Klick werten.
  if (event.target.closest(".board-card-move-button")) return;

  const card = event.target.closest(".board-card--task");
  if (!card) return;

  openDetailModal(getTaskById(card.dataset.cardId));
});

  detailModal.addEventListener("click", (event) => {
    if (event.target === detailModal) closeDetailModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && detailModal.classList.contains("is-open")) {
      closeDetailModal();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  syncBoardMobileNavigation();
  initBoardLayout();
  initBoardMoveMenu();
  initAddTaskModal();
  initTaskDetailModal();
});

window.addEventListener("resize", syncBoardMobileNavigation);