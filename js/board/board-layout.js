// ==========================================
// BOARD LOGIC / LAYOUT-LOGIK
// ==========================================
// Diese Datei steuert das Board-Verhalten:
// - Aufgaben aus db.js laden
// - initial nur in To-do rendern
// - Karten flexibel zwischen Spalten verschieben
// - Add-Task-Dialog öffnen und speichern
// - Zustand im LocalStorage persistieren
// ==========================================

const BOARD_STORAGE_KEY = "join-board-layout-state";
let currentBoardSearchQuery = "";

function syncBoardMobileNavigation() {
  const boardTopNav = document.querySelector(".board-mobile-top-nav");
  const boardFooterNav = document.querySelector(".board-mobile-footer-nav");
  const genericHeader = document.querySelector(".nav-mobile");
  const genericFooter = document.querySelector(".nav-footer-mobile");

  const isMobile = window.innerWidth <= 768;

  if (boardTopNav) {
    boardTopNav.style.display = isMobile ? "flex" : "";
    boardTopNav.style.width = isMobile ? "100vw" : "";
    boardTopNav.style.maxWidth = isMobile ? "100vw" : "";
    boardTopNav.style.minHeight = isMobile ? "64px" : "";
    boardTopNav.style.padding = isMobile ? "12px 14px" : "";
    boardTopNav.style.position = isMobile ? "fixed" : "";
    boardTopNav.style.top = isMobile ? "0" : "";
    boardTopNav.style.left = isMobile ? "0" : "";
    boardTopNav.style.right = isMobile ? "0" : "";
    boardTopNav.style.gridArea = isMobile ? "auto" : "";
  }

  if (boardFooterNav) {
    boardFooterNav.style.display = isMobile ? "flex" : "";
    boardFooterNav.style.width = isMobile ? "100vw" : "";
    boardFooterNav.style.maxWidth = isMobile ? "100vw" : "";
    boardFooterNav.style.minHeight = isMobile ? "0" : "";
    boardFooterNav.style.padding = isMobile ? "0" : "";
    boardFooterNav.style.position = isMobile ? "fixed" : "";
    boardFooterNav.style.left = isMobile ? "0" : "";
    boardFooterNav.style.right = isMobile ? "0" : "";
    boardFooterNav.style.bottom = isMobile ? "0" : "";
    boardFooterNav.style.zIndex = isMobile ? "8" : "";
    boardFooterNav.style.gridArea = isMobile ? "auto" : "";
    boardFooterNav.style.background = isMobile ? "var(--sidebar-bg)" : "";
    boardFooterNav.style.boxShadow = isMobile ? "0 -4px 12px rgba(15, 23, 42, 0.18)" : "";
  }

  if (genericHeader) {
    genericHeader.style.display = isMobile ? "none" : "";
  }

  if (genericFooter) {
    genericFooter.style.display = isMobile ? "none" : "";
  }
}

/**
 * Liefert den leeren Hinweistext passend zur Spalte.
 *
 * @param {string} columnId - Der Spalten-Schluessel aus data-column.
 * @returns {string} Hinweistext fuer leere Spalten.
 */
function getEmptyColumnMessage(columnId) {
  const messageMap = {
    "todo": "No tasks To do",
    "in-progress": "No tasks In progress",
    "await-feedback": "No tasks Await feedback",
    "done": "No tasks Done"
  };

  return messageMap[columnId] || "No tasks";
}

/**
 * Liefert die sichtbare Spaltenbezeichnung fuer die Board-Ansicht.
 *
 * @param {string} columnId - Der technische Spalten-Schluessel.
 * @returns {string} Angezeigter Titel der Spalte.
 */
function getColumnLabel(columnId) {
  const labelMap = {
    "todo": "To do",
    "in-progress": "In progress",
    "await-feedback": "Await feedback",
    "done": "Done"
  };

  return labelMap[columnId] || "Board";
}

// ===============================
// Board-Zustand aus LocalStorage laden
// Wenn noch kein Zustand gespeichert ist, werden alle Aufgaben standardmäßig in "todo" gesetzt.
// ===============================
function loadBoardState() {
  try {
    const storedState = window.localStorage.getItem(BOARD_STORAGE_KEY);
    return storedState ? JSON.parse(storedState) : {};
  } catch {
    return {};
  }
}

function getDefaultBoardState() {
  if (!Array.isArray(tasks)) return {};

  return tasks.reduce((state, task) => {
    state[task.id] = "todo";
    return state;
  }, {});
}

// ===============================
// Drag & Drop für eine einzelne Karte
// ===============================
function bindCardDragEvents(card, draggedCardRef) {
  if (!card) return;

  card.addEventListener("dragstart", () => {
    draggedCardRef.value = card;
    card.classList.add("is-dragging");
    card.setAttribute("data-dragging", "true");
  });

  card.addEventListener("dragend", () => {
    draggedCardRef.value = null;
    card.classList.remove("is-dragging");
    card.removeAttribute("data-dragging");
    document.querySelectorAll(".board-main-column").forEach((column) => {
      column.classList.remove("is-drop-target");
    });
  });
}

// ===============================
// Initialisierung des Boards
// ===============================
function initBoardLayout() {
  const columns = Array.from(document.querySelectorAll(".board-main-column"));
  const searchInput = document.querySelector(".board-search-field input");
  const boardMainContainer = document.querySelector(".board-main-container");

  if (!columns.length) return;

  const defaultState = getDefaultBoardState();
  const savedState = loadBoardState();
  const boardState = { ...defaultState, ...savedState };
  const draggedCardRef = { value: null };

  if (boardMainContainer && !boardMainContainer.dataset.columnButtonDelegation) {
    boardMainContainer.dataset.columnButtonDelegation = "true";
    boardMainContainer.addEventListener("click", (event) => {
      const columnButton = event.target.closest(".board-main-column-add-button[data-column]");
      if (!columnButton) return;

      if (typeof window.openBoardTaskModalForColumn === "function") {
        window.openBoardTaskModalForColumn(columnButton.dataset.column);
      }
    });
  }

  /**
   * Rendert den leeren Zustand fuer Spalten ohne Karten.
   *
   * @returns {void}
   */
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

  /**
   * Rendert einen Hinweis, wenn die Suche keine Treffer liefert.
   *
   * @returns {void}
   */
  const renderSearchEmptyState = () => {
    if (!boardMainContainer) return;

    boardMainContainer.innerHTML = "";

    const emptyState = document.createElement("p");
    emptyState.className = "board-search-empty-state";
    emptyState.textContent = "Keine Ergebnisse gefunden";
    emptyState.setAttribute("aria-label", emptyState.textContent);

    boardMainContainer.appendChild(emptyState);
  };

  /**
   * Baut die mobile Spaltenueberschrift mit Plus-Button.
   *
   * @param {string} columnId - Der technische Spalten-Schluessel.
   * @returns {HTMLElement} Kopfbereich der Spalte.
   */
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

  /**
   * Baut den Container fuer die Karten innerhalb einer Spalte.
   *
   * @returns {HTMLElement} Karten-Container der Spalte.
   */
  const createColumnContent = () => {
    const content = document.createElement("div");
    content.className = "board-main-column-content";
    return content;
  };

  // ===============================
  // Board rendern
  // Jede Aufgabe wird anhand ihres Saved-State in die passende Spalte gesetzt.
  // Wenn noch kein Status existiert, landet sie in "todo".
  // ===============================
  const renderBoardState = () => {
    columns.forEach((column) => {
      column.innerHTML = "";

      const header = createColumnHeader(column.dataset.column || "");
      const content = createColumnContent();

      column.appendChild(header);
      column.appendChild(content);
    });

    if (!Array.isArray(tasks)) {
      renderEmptyStateForColumns();
      return;
    }

    const searchTerm = currentBoardSearchQuery.trim().toLowerCase();
    const visibleTasks = searchTerm
      ? tasks.filter((task) => {
          const title = String(task.title || "").toLowerCase();
          const description = String(task.description || "").toLowerCase();
          return title.includes(searchTerm) || description.includes(searchTerm);
        })
      : tasks;

    if (searchTerm && visibleTasks.length === 0) {
      renderSearchEmptyState();
      return;
    }

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

    renderEmptyStateForColumns();
  };

  // ===============================
  // Zustand speichern
  // ===============================
  const saveBoardState = () => {
    window.localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(boardState));
  };

  // ===============================
  // Drop-Ziel visuell markieren
  // ===============================
  const setDropTargetState = (column, isActive) => {
    column.classList.toggle("is-drop-target", isActive);
  };

  columns.forEach((column) => {
    column.addEventListener("dragover", (event) => {
      if (!draggedCardRef.value) return;
      event.preventDefault();
      setDropTargetState(column, true);
    });

    column.addEventListener("dragleave", () => {
      setDropTargetState(column, false);
    });

    column.addEventListener("drop", (event) => {
      event.preventDefault();

      if (!draggedCardRef.value) return;

      const targetColumnId = column.dataset.column;
      const draggedCard = draggedCardRef.value;
      const draggedTaskId = draggedCard.dataset.cardId;

      boardState[draggedTaskId] = targetColumnId;

      const draggedTask = tasks.find((task) => task.id === draggedTaskId);
      if (draggedTask) {
        draggedTask.status = targetColumnId;
      }

      saveBoardState();
      renderBoardState();
      setDropTargetState(column, false);
    });
  });

  if (searchInput && !searchInput.dataset.searchInitialized) {
    searchInput.dataset.searchInitialized = "true";
    searchInput.addEventListener("input", () => {
      currentBoardSearchQuery = searchInput.value || "";
      renderBoardState();
    });
  }

  if (searchInput) {
    currentBoardSearchQuery = searchInput.value || currentBoardSearchQuery;
  }

  renderBoardState();
}

// ===============================
// Add-Task-Modal-Steuerung
// Dieses Modal öffnet sich beim Klick auf den Button
// und bleibt leer, bis alle Pflichtfelder ausgefüllt sind.
// ===============================
function initAddTaskModal() {
  const openButton = document.getElementById("board-open-add-task-modal");
  const closeButton = document.getElementById("board-task-close-button");
  const cancelButton = document.getElementById("board-task-cancel-button");
  const modal = document.getElementById("board-add-task-modal");
  const form = document.getElementById("board-task-form");
  const saveButton = document.getElementById("board-task-save-button");
  const dialogTitle = document.getElementById("board-task-dialog-title");

  const titleInput = document.getElementById("board-task-title");
  const descriptionInput = document.getElementById("board-task-description");
  const dateInput = document.getElementById("board-task-date");
  const priorityInput = document.getElementById("board-task-priority");
  const assignedInput = document.getElementById("board-task-assigned");
  const categoryInput = document.getElementById("board-task-category");
  const subtaskInput = document.getElementById("board-task-subtask");
  const headerButtons = Array.from(document.querySelectorAll(".board-header-column button[data-column]"));

  let editingTaskId = null;
  let defaultStatus = "todo";

  const resetModalState = () => {
    editingTaskId = null;
    defaultStatus = "todo";
    if (dialogTitle) dialogTitle.textContent = "Add Task";
    if (saveButton) saveButton.textContent = "Create Task";
    form.reset();
    saveButton.disabled = true;
    modal.dataset.status = "todo";
  };

  const openModal = () => {
    resetModalState();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  };

  /**
   * Oeffnet das Add-Task-Modal mit vorgewähltem Status.
   *
   * @param {string} status - Zielspalte fuer den neuen Task.
   * @returns {void}
   */
  const openModalForColumn = (status) => {
    resetModalState();
    defaultStatus = status || "todo";
    modal.dataset.status = defaultStatus;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    resetModalState();
  };

  /**
   * Oeffnet das vorhandene Add-Task-Modal im Bearbeitungsmodus.
   *
   * @param {object} task - Die Task mit den vorhandenen Werten.
   * @returns {void}
   */
  const openEditModal = (task) => {
    if (!task) return;

    editingTaskId = task.id;
    if (dialogTitle) dialogTitle.textContent = "Edit Task";
    if (saveButton) saveButton.textContent = "Save changes";

    titleInput.value = task.title || "";
    descriptionInput.value = task.description || "";
    dateInput.value = task.dueDate || "";
    priorityInput.value = task.priority || "Medium";

    Array.from(assignedInput.options).forEach((option) => {
      option.selected = Array.isArray(task.assignedTo) && task.assignedTo.includes(option.value);
    });

    categoryInput.value = task.category || "";
    if (subtaskInput) {
      subtaskInput.value = Array.isArray(task.subtasks) ? task.subtasks.map((subtask) => subtask.label).join(", ") : "";
    }

    updateSaveButtonState();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  };

  const parseSubtasks = (value) => {
    if (!value) return [];

    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((label) => ({ label, done: false }));
  };

  const getSelectedAssignedContacts = () => {
    if (!assignedInput) return [];
    return Array.from(assignedInput.selectedOptions)
      .map((option) => option.value)
      .filter(Boolean);
  };

  const isFormValid = () => {
    return titleInput.value.trim() !== "" &&
      descriptionInput.value.trim() !== "" &&
      dateInput.value.trim() !== "" &&
      priorityInput.value !== "" &&
      getSelectedAssignedContacts().length > 0 &&
      categoryInput.value !== "";
  };

  const updateSaveButtonState = () => {
    if (!saveButton) return;
    const isLoading = saveButton.dataset.loading === "true";
    saveButton.disabled = isLoading || !isFormValid();
  };

  [titleInput, descriptionInput, dateInput, priorityInput, assignedInput, categoryInput].forEach((field) => {
    if (!field) return;
    field.addEventListener("input", updateSaveButtonState);
    field.addEventListener("change", updateSaveButtonState);
  });

  openButton.addEventListener("click", openModal);
  closeButton.addEventListener("click", closeModal);
  cancelButton.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  saveButton.addEventListener("click", () => {
    if (!isFormValid()) return;

    saveButton.dataset.loading = "true";
    saveButton.disabled = true;
    saveButton.textContent = editingTaskId ? "Saving..." : "Creating...";

    window.setTimeout(() => {
      if (editingTaskId) {
        const task = Array.isArray(tasks) ? tasks.find((item) => item.id === editingTaskId) : null;
        if (task) {
          task.title = titleInput.value.trim();
          task.description = descriptionInput.value.trim();
          task.dueDate = dateInput.value;
          task.priority = priorityInput.value;
          task.priorityColor = priorityInput.value === "Urgent" ? "#f66a5f" : priorityInput.value === "Medium" ? "#f9a35c" : "#5bc0be";
          task.category = categoryInput.value;
          task.categoryColor = categoryInput.value === "Technical Task" ? "#2bc7b7" : "#2d8cff";
          task.assignedTo = getSelectedAssignedContacts();
          task.subtasks = parseSubtasks(subtaskInput.value);
        }

        initBoardLayout();
        closeModal();
        return;
      }

      const newTask = {
        id: `task-${Date.now()}`,
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
        dueDate: dateInput.value,
        priority: priorityInput.value,
        priorityColor: priorityInput.value === "Urgent" ? "#f66a5f" : priorityInput.value === "Medium" ? "#f9a35c" : "#5bc0be",
        category: categoryInput.value,
        categoryColor: categoryInput.value === "Technical Task" ? "#2bc7b7" : "#2d8cff",
        status: modal.dataset.status || defaultStatus || "todo",
        assignedTo: getSelectedAssignedContacts(),
        subtasks: parseSubtasks(subtaskInput.value),
        progress: 0,
        badge: categoryInput.value
      };

      tasks.unshift(newTask);
      const boardState = loadBoardState();
      boardState[newTask.id] = newTask.status;
      window.localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(boardState));
      initBoardLayout();
      closeModal();
    }, 300);
  });

  headerButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openModalForColumn(button.dataset.column);
    });
  });

  window.openBoardTaskEditModal = openEditModal;
  window.openBoardTaskModalForColumn = openModalForColumn;
  window.closeBoardTaskModal = closeModal;
}

/**
 * Initialisiert das Detail-Modal fuer Board-Karten.
 * Das Modal wird nur geoeffnet, wenn auf die Aufgabenbeschreibung geklickt wird.
 *
 * @returns {void}
 */
function initTaskDetailModal() {
  const boardMainContainer = document.querySelector(".board-main-container");
  const detailModal = document.getElementById("board-task-detail-modal");
  const detailRoot = document.getElementById("board-task-detail-root");

  if (!boardMainContainer || !detailModal || !detailRoot) return;

  /**
   * Liefert ein Task-Objekt anhand der ID.
   *
   * @param {string} taskId - Die eindeutige Task-ID.
   * @returns {object|null} Gefundene Task oder null.
   */
  const getTaskById = (taskId) => {
    if (!taskId || !Array.isArray(tasks)) return null;
    return tasks.find((task) => task.id === taskId) || null;
  };

  /**
   * Aktualisiert den Karteninhalt im Board nach Edit/Subtask-Aenderungen.
   *
   * @param {object} task - Das geaenderte Task-Objekt.
   * @returns {void}
   */
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

  /**
   * Entfernt eine Task aus Daten, Board-Zustand und DOM.
   *
   * @param {string} taskId - Die zu loeschende Task-ID.
   * @returns {void}
   */
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

  /**
   * Oeffnet das Detail-Modal und rendert die grosse Kartenansicht.
   *
   * @param {object} task - Das Task-Objekt aus der Datenbank.
   * @returns {void}
   */
  const openDetailModal = (task) => {
    if (!task) return;

    detailRoot.innerHTML = renderTaskDetail(task);
    detailRoot.dataset.taskId = task.id;
    detailModal.classList.add("is-open");
    detailModal.setAttribute("aria-hidden", "false");

    const closeButton = detailRoot.querySelector(".board-detail-close");
    if (closeButton) {
      closeButton.addEventListener("click", closeDetailModal);
    }
  };

  /**
   * Schliesst das Detail-Modal und entfernt den Karteninhalt.
   *
   * @returns {void}
   */
  const closeDetailModal = () => {
    detailModal.classList.remove("is-open");
    detailModal.setAttribute("aria-hidden", "true");
    detailRoot.innerHTML = "";
    detailRoot.removeAttribute("data-task-id");
  };

  detailRoot.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;

    const taskId = detailRoot.dataset.taskId;
    const task = getTaskById(taskId);
    if (!task) return;

    if (actionButton.dataset.action === "delete-task") {
      const shouldDelete = window.confirm("Delete this task?");
      if (!shouldDelete) return;

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

    const taskId = detailRoot.dataset.taskId;
    const task = getTaskById(taskId);
    if (!task || !Array.isArray(task.subtasks)) return;

    const subtaskIndex = Number(checkbox.dataset.subtaskIndex);
    if (!Number.isInteger(subtaskIndex) || !task.subtasks[subtaskIndex]) return;

    task.subtasks[subtaskIndex].done = checkbox.checked;
    syncCardContent(task);
  });

  boardMainContainer.addEventListener("click", (event) => {
    const description = event.target.closest(".board-card-description");
    if (!description) return;

    const card = description.closest(".board-card--task");
    if (!card) return;

    const taskId = card.dataset.cardId;
    const task = Array.isArray(tasks) ? tasks.find((item) => item.id === taskId) : null;

    if (!task) return;

    openDetailModal(task);
  });

  detailModal.addEventListener("click", (event) => {
    if (event.target === detailModal) {
      closeDetailModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && detailModal.classList.contains("is-open")) {
      closeDetailModal();
    }
  });
}

// ===============================
// Initiales Booten der Seite
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  syncBoardMobileNavigation();
  initBoardLayout();
  initAddTaskModal();
  initTaskDetailModal();
});

window.addEventListener("resize", syncBoardMobileNavigation);
