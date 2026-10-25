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
 * Returns the id of the column a task is shown in.
 *
 * @param {Object} task - The task.
 * @returns {string} A valid column id, "todo" if the task has no valid mapping.
 */
function getTaskColumnId(task) {
  return stateToColumn[task.state] || "todo";
}

const stateToColumn = {
  todo: "todo",
  inprogres: "in-progress",
  awaitfeedback: "await-feedback",
  done: "done",
};
const columnToState = {
  "todo": "todo",
  "in-progress": "inprogres",
  "await-feedback": "awaitfeedback",
  "done": "done",
};

/**
 * Returns all tasks from the session storage.
 * @returns {Object[]} The tasks.
 */
function getTasks() {
  return getSessionData("session-tasks");
}

/**
 * Saves the task list to the session storage.
 * @param {Object[]} items - The tasks.
 * @returns {void}
 */
function saveTasks(items) {
  saveSessionData("session-tasks", items);
}

/**
 * Finds a task by its id.
 * @param {string} taskId - Id of the task.
 * @returns {Object|null} The task or null.
 */
function getTaskById(taskId) {
  return getTasks().find((task) => task.id === taskId) || null;
}

/**
 * Replaces a task in the session storage and writes it to the firebase.
 * @param {Object} task - The changed task.
 * @returns {void}
 */
function updateTask(task) {
  saveTasks(getTasks().map((item) => (item.id === task.id ? task : item)));
  putData("tasks/" + task.id, task).catch(console.error);
}

/**
 * Moves a task to another column and persists the change.
 * @param {string} taskId - Id of the task.
 * @param {string} columnId - Id of the target column.
 * @returns {boolean} True on success.
 */
function moveBoardTask(taskId, columnId) {
  const task = getTaskById(taskId);
  if (!task || !columnIds.includes(columnId)) return false;
  task.state = columnToState[columnId];
  updateTask(task);
  return true;
}