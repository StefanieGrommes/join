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

  if (!columns.length) return;

  const defaultState = getDefaultBoardState();
  const savedState = loadBoardState();
  const boardState = { ...defaultState, ...savedState };
  const draggedCardRef = { value: null };

  // ===============================
  // Board rendern
  // Jede Aufgabe wird anhand ihres Saved-State in die passende Spalte gesetzt.
  // Wenn noch kein Status existiert, landet sie in "todo".
  // ===============================
  const renderBoardState = () => {
    columns.forEach((column) => {
      column.innerHTML = "";
    });

    if (!Array.isArray(tasks)) return;

    tasks.forEach((task) => {
      const targetColumnId = boardState[task.id] || "todo";
      const column = columns.find((item) => item.dataset.column === targetColumnId);

      if (!column) return;

      const wrapper = document.createElement("div");
      wrapper.innerHTML = renderTaskCard(task);
      const card = wrapper.firstElementChild;

      if (!card) return;

      bindCardDragEvents(card, draggedCardRef);
      column.appendChild(card);
    });
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

  const titleInput = document.getElementById("board-task-title");
  const descriptionInput = document.getElementById("board-task-description");
  const dateInput = document.getElementById("board-task-date");
  const priorityInput = document.getElementById("board-task-priority");
  const assignedInput = document.getElementById("board-task-assigned");
  const categoryInput = document.getElementById("board-task-category");

  const openModal = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    form.reset();
    saveButton.disabled = true;
  };

  const isFormValid = () => {
    return titleInput.value.trim() !== "" &&
      descriptionInput.value.trim() !== "" &&
      dateInput.value.trim() !== "" &&
      priorityInput.value !== "" &&
      assignedInput.value !== "" &&
      categoryInput.value !== "";
  };

  const updateSaveButtonState = () => {
    saveButton.disabled = !isFormValid();
  };

  [titleInput, descriptionInput, dateInput, priorityInput, assignedInput, categoryInput].forEach((field) => {
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

    const newTask = {
      id: `task-${Date.now()}`,
      title: titleInput.value.trim(),
      description: descriptionInput.value.trim(),
      dueDate: dateInput.value,
      priority: priorityInput.value,
      priorityColor: priorityInput.value === "Urgent" ? "#f66a5f" : priorityInput.value === "Medium" ? "#f9a35c" : "#5bc0be",
      category: categoryInput.value,
      categoryColor: categoryInput.value === "Technical Task" ? "#2bc7b7" : "#2d8cff",
      status: "todo",
      assignedTo: [assignedInput.value],
      subtasks: [{ label: "New subtask", done: false }],
      progress: 0,
      badge: categoryInput.value
    };

    tasks.unshift(newTask);
    const boardState = loadBoardState();
    boardState[newTask.id] = "todo";
    window.localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(boardState));
    initBoardLayout();
    closeModal();
  });
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
   * Oeffnet das Detail-Modal und rendert die grosse Kartenansicht.
   *
   * @param {object} task - Das Task-Objekt aus der Datenbank.
   * @returns {void}
   */
  const openDetailModal = (task) => {
    if (!task) return;

    detailRoot.innerHTML = renderTaskDetail(task);
    detailModal.classList.add("is-open");
    detailModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const closeButton = detailRoot.querySelector(".board-detail-close");
    if (closeButton) {
      closeButton.addEventListener("click", closeDetailModal);
    }
  };

  /**
   * Schliesst das Detail-Modal und gibt Scrollen wieder frei.
   *
   * @returns {void}
   */
  const closeDetailModal = () => {
    detailModal.classList.remove("is-open");
    detailModal.setAttribute("aria-hidden", "true");
    detailRoot.innerHTML = "";
    document.body.style.overflow = "";
  };

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
  initBoardLayout();
  initAddTaskModal();
  initTaskDetailModal();
});
