const columnIds = ["todo", "in-progress", "await-feedback", "done"];
const columnLabels = {
  "todo": "To do",
  "in-progress": "In progress",
  "await-feedback": "Await feedback",
  "done": "Done"
};

function getEmptyColumnMessage(columnId) {
  const label = columnLabels[columnId];
  return label ? `No tasks ${label}` : "No tasks";
}

function getColumnLabel(columnId) {
  return columnLabels[columnId] || "Board";
}


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

function getTasks() {
  return getSessionData("session-tasks");
}

function saveTasks(items) {
  saveSessionData("session-tasks", items);
}

function getTaskById(taskId) {
  return getTasks().find((task) => task.id === taskId) || null;
}

function updateTask(task) {
  saveTasks(getTasks().map((item) => (item.id === task.id ? task : item)));
  putData("tasks/" + task.id, task).catch(console.error);
}

function moveBoardTask(taskId, columnId) {
  const task = getTaskById(taskId);
  if (!task || !columnIds.includes(columnId)) return false;
  task.state = columnToState[columnId];
  updateTask(task);
  return true;
}