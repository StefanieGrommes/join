const BOARD_STORAGE_KEY = "join-board-layout-state";

function initBoardLayout() {
  const columns = Array.from(document.querySelectorAll(".board-main-column"));
  const cards = Array.from(document.querySelectorAll(".board-card"));

  if (!columns.length || !cards.length) return;

  const columnById = new Map(columns.map((column) => [column.dataset.column, column]));
  const cardById = new Map(cards.map((card) => [card.dataset.cardId, card]));
  const defaultState = {
    "todo-card": "todo",
    "in-progress-card": "in-progress",
    "await-feedback-card": "await-feedback",
    "done-card": "done",
  };
  const savedState = loadBoardState();
  const boardState = { ...defaultState, ...savedState };
  let draggedCard = null;

  const renderBoardState = () => {
    columns.forEach((column) => {
      column.innerHTML = "";
    });

    Object.entries(boardState).forEach(([cardId, columnId]) => {
      const card = cardById.get(cardId);
      const column = columnById.get(columnId);

      if (!card || !column) return;

      column.appendChild(card);
    });
  };

  const saveBoardState = () => {
    window.localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(boardState));
  };

  const setDropTargetState = (column, isActive) => {
    column.classList.toggle("is-drop-target", isActive);
  };

  cards.forEach((card) => {
    card.addEventListener("dragstart", () => {
      draggedCard = card;
      card.classList.add("is-dragging");
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("is-dragging");
      draggedCard = null;
      columns.forEach((column) => setDropTargetState(column, false));
    });
  });

  columns.forEach((column) => {
    column.addEventListener("dragover", (event) => {
      if (!draggedCard) return;
      event.preventDefault();
      setDropTargetState(column, true);
    });

    column.addEventListener("dragleave", () => {
      setDropTargetState(column, false);
    });

    column.addEventListener("drop", (event) => {
      event.preventDefault();

      if (!draggedCard) return;

      const targetColumnId = column.dataset.column;
      boardState[draggedCard.dataset.cardId] = targetColumnId;
      column.appendChild(draggedCard);
      saveBoardState();
      setDropTargetState(column, false);
    });
  });

  renderBoardState();
}

function loadBoardState() {
  try {
    const storedState = window.localStorage.getItem(BOARD_STORAGE_KEY);
    return storedState ? JSON.parse(storedState) : {};
  } catch {
    return {};
  }
}

document.addEventListener("DOMContentLoaded", initBoardLayout);
