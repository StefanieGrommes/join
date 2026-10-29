const form = document.getElementById("add-task-form");
const taskTitleInput = document.getElementById("task-title");
const taskCategory = document.getElementById("task-category");
const errorMessage = document.getElementById("error-message");
const dueDate = document.getElementById("taskDueDate");
const errorMessageArray = [];
let editingTaskId = null;
let newTaskState = "todo";

form.addEventListener("submit", handleTaskFormSubmit);

/**
 * Loads the session data (contacts and tasks) for the add-task page.
 * @returns {Promise<void>}
 */
async function initAddTask() {
  await initSessionData();
}

/**
 * Collects the error messages of the required task fields.
 * @returns {string[]} The messages, empty if all fields are valid.
 */
function getTaskFormErrors() {
  const errors = [];
  if (taskTitleInput.value.trim().length <= 2) {
    errors.push("The title must be at least 3 characters!");
  }
  if (taskCategory.value === "none") errors.push("Please enter a task category!");
  if (dueDate.value === "") errors.push("Please enter a due date!");
  return errors;
}

/**
 * Checks if the required fields are valid and shows error message if not.
 * Prevents the form from submitting if the fields do not pass the test.
 * @param {SubmitEvent} event - The submit event of the task form.
 * @returns {Promise<void>}
 */
async function handleTaskFormSubmit(event) {
  event.preventDefault();
  errorMessageArray.length = 0;
  errorMessageArray.push(...getTaskFormErrors());
  errorMessage.innerText = errorMessageArray.join(" , ");
  if (errorMessageArray.length > 0) return;
  await submitForm();
}

/**
 * Returns the priority of the active priority button.
 * @returns {string} "urgent", "medium" or "low".
 */
function getSelectedPriority() {
  const btn = document.querySelector(".priority-btn.priority-active");
  return btn.classList.contains("priority-urgent") ? "urgent"
    : btn.classList.contains("priority-low") ? "low" : "medium";
}

/**
 * Returns the selected contacts in the assigned-to dropdown.
 * @returns {{id: string}[]} The selected contacts as id objects.
 */
function getAssignedContactIds() {
  return Array.from(document.querySelectorAll(".contact-option.selected")).map(
    (option) => ({ id: option.dataset.contactId }),
  );
}

/**
 * Reads the subtasks and keeps the done state of unchanged labels.
 * @param {{label: string, done: boolean}[]} [previous=[]] - Subtasks of the edited task.
 * @returns {{label: string, done: boolean}[]} The subtasks.
 */
function getSubtasks(previous = []) {
  saveSubtask();
  return Array.from(subTaskList.querySelectorAll(".subtask-text")).map((el) => {
    const label = el.textContent.trim();
    const old = previous.find((subtask) => subtask.label === label);
    return { label, done: old ? Boolean(old.done) : false };
  });
}

/**
 * Saves the task form: updates the session data and the database, then resets the form.
 * @returns {Promise<void>}
 */
async function submitForm() {
  const all = getSessionData("session-tasks");
  const existing = editingTaskId ? all.find((t) => t.id === editingTaskId) : null;
  const task = buildTaskFromForm(existing);
  saveSessionData("session-tasks", upsertTask(all, task));
  await putData("tasks/" + task.id, task);
  resetForm();
  if (!existing) showTaskAddedOverlay();
  if (typeof onTaskSaved === "function") onTaskSaved();
}

/**
 * Shows the "Task added to board" overlay and redirects to the board after 1.5 seconds.
 * @returns {void}
 */
function showTaskAddedOverlay() {
  const overlay = document.getElementById("task-added-overlay");
  if (!overlay) return;
  overlay.classList.add("visible");
  const isBoard = window.location.pathname.endsWith("board-layout.html");
  window.setTimeout(() => {
    if (isBoard) overlay.classList.remove("visible");
    else window.location.href = "./board-layout.html";
  }, 1500);
}

/**
 * Builds the task object from the form fields.
 * @param {Object|null} existing - The task that is edited, or null for a new task.
 * @returns {Object} The task.
 */
function buildTaskFromForm(existing) {
  return {
    id: existing ? existing.id : String(Date.now()),
    title: taskTitleInput.value.trim(),
    state: existing ? existing.state : newTaskState,
    description: document.getElementById("task-description").value.trim(),
    dueDate: dueDate.value,
    priority: getSelectedPriority(),
    assignedTo: getAssignedContactIds(),
    category: taskCategory.value,
    subtasks: getSubtasks(existing ? existing.subtasks : []),
  };
}

/**
 * Replaces the task with the same id or appends it if it is new.
 * @param {Object[]} tasks - The current tasks.
 * @param {Object} task - The saved task.
 * @returns {Object[]} The updated list.
 */
function upsertTask(tasks, task) {
  const isEdit = tasks.some((t) => t.id === task.id);
  return isEdit ? tasks.map((t) => (t.id === task.id ? task : t)) : [...tasks, task];
}

/**
 * Resets the whole add-task form including priority, contacts and subtasks.
 * @returns {void}
 */
function resetForm() {
  form.reset();
  errorMessageArray.length = 0;
  errorMessage.innerText = "";
  subTaskList.innerHTML = "";
  showSubtaskActions();
  resetPriority();
  resetAssignedContacts();
}

/**
 * Deselects all contacts and clears the avatars.
 * @returns {void}
 */
function resetAssignedContacts() {
  list.innerHTML = "";
  document.getElementById("assigned-avatars").innerHTML = "";
}
