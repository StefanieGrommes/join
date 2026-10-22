const boardStorageKey = "join-board-layout-state";
const tasksStorageKey = "join-board-tasks";
const columnIds = ["todo", "in-progress", "await-feedback", "done"];
const columnLabels = {
  "todo": "To do",
  "in-progress": "In progress",
  "await-feedback": "Await feedback",
  "done": "Done"
};

/**
 * Returns the placeholder text for an empty column.
 *
 * @param {string} columnId - Id of the column, e.g. "todo".
 * @returns {string} Text such as "No tasks To do".
 */
function getEmptyColumnMessage(columnId) {
  const label = columnLabels[columnId];
  return label ? `No tasks ${label}` : "No tasks";
}

/**
 * Returns the visible heading of a column.
 *
 * @param {string} columnId - Id of the column.
 * @returns {string} Column name such as "In progress".
 */
function getColumnLabel(columnId) {
  return columnLabels[columnId] || "Board";
}

/**
 * Loads the saved task-to-column mapping from localStorage.
 *
 * @returns {Object<string, string>} Object { taskId: columnId } or an empty object.
 */
function loadBoardState() {
  try {
    const storedState = window.localStorage.getItem(boardStorageKey);
    return storedState ? JSON.parse(storedState) : {};
  } catch {
    return {};
  }
}

/**
 * Saves the task-to-column mapping to localStorage.
 *
 * @param {Object<string, string>} state - Object { taskId: columnId }.
 * @returns {void}
 */
function saveBoardState(state) {
  window.localStorage.setItem(boardStorageKey, JSON.stringify(state));
}

/**
 * Creates the default mapping in which every task is in "todo".
 *
 * @returns {Object<string, string>} Object { taskId: "todo" }.
 */
function getDefaultBoardState() {
  if (!Array.isArray(tasks)) return {};
  return tasks.reduce((state, task) => {
    state[task.id] = "todo";
    return state;
  }, {});
}

/**
 * Merges the default mapping with the saved mapping.
 *
 * @returns {Object<string, string>} Object { taskId: columnId }.
 */
function getBoardState() {
  return { ...getDefaultBoardState(), ...loadBoardState() };
}

/**
 * Finds a task by its id.
 *
 * @param {string} taskId - Id of the task.
 * @returns {Object|null} The task or null if it does not exist.
 */
function getTaskById(taskId) {
  if (!taskId || !Array.isArray(tasks)) return null;
  return tasks.find((task) => task.id === taskId) || null;
}

/**
 * Moves a task to another column and persists the change.
 *
 * @param {string} taskId - Id of the task.
 * @param {string} columnId - Id of the target column.
 * @returns {boolean} True on success, false if the task or column does not exist.
 */
function moveBoardTask(taskId, columnId) {
  const task = getTaskById(taskId);
  if (!task || !columnIds.includes(columnId)) {
    console.error("Cannot move task: task or target column not found.", { taskId, columnId });
    return false;
  }
  saveBoardState({ ...getBoardState(), [taskId]: columnId });
  task.status = columnId;
  saveTasks();
  return true;
}

/**
 * Reads the stored task list from localStorage.
 *
 * @returns {Object[]|null} The stored tasks or null if nothing valid is stored.
 */
function loadStoredTasks() {
  try {
    const storedTasks = JSON.parse(window.localStorage.getItem(tasksStorageKey));
    return Array.isArray(storedTasks) ? storedTasks : null;
  } catch {
    return null;
  }
}

/**
 * Saves the current task list to localStorage so that board and summary share it.
 *
 * @returns {void}
 */
function saveTasks() {
  window.localStorage.setItem(tasksStorageKey, JSON.stringify(tasks));
}

/**
 * Replaces the content of the global task list with the stored tasks, if any exist.
 * Without stored tasks the default tasks from app-data.js stay untouched.
 *
 * @returns {void}
 */
function restoreStoredTasks() {
  const storedTasks = loadStoredTasks();
  if (storedTasks) tasks.splice(0, tasks.length, ...storedTasks);
}

/**
 * Returns the id of the column a task is shown in.
 *
 * @param {Object} task - The task.
 * @param {Object<string, string>} boardState - Mapping { taskId: columnId }.
 * @returns {string} A valid column id, "todo" if the task has no valid mapping.
 */
function getTaskColumnId(task, boardState) {
  const columnId = boardState[task.id];
  return columnIds.includes(columnId) ? columnId : "todo";
}
