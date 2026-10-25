const list = document.getElementById("assigned-to-list");
const priorityBtns = document.getElementsByClassName("priority-btn");
const subtaskInput = document.getElementById("subtaskInput");
const subTaskList = document.querySelector(".subtask-list");
let editingTaskId = null;
let newTaskState = "todo";

async function initAddTask() {
  await initSessionData();
}

function toggleContactList() {
  const dropdown = document.getElementById("assigned-to-dropdown");
  if (dropdown.classList.contains("open")) {
    dropdown.classList.remove("open");
    list.style.display = "none";
    renderAssignedAvatars();
    return;
  }
  if (!list.children.length) renderContactOptions(getSessionData("session-contacts"));
  dropdown.classList.add("open");
  list.style.display = "block";
}

function renderAssignedAvatars() {
  const container = document.getElementById("assigned-avatars");
  const selectedOptions = document.querySelectorAll(".contact-option.selected");
  container.innerHTML = "";
  selectedOptions.forEach((option) => {
    const avatar = option.querySelector(".contact-avatar");
    const initials = avatar.textContent;
    const avatarColor = avatar.style.backgroundColor;
    container.insertAdjacentHTML("beforeend", getAvatarTemplate(initials, avatarColor));
  });
}

function getFullUserName(contact) {
  return `${contact.firstName} ${contact.lastName}`;
}

function getUserInitials(contact) {
  if (!contact.firstName || !contact.lastName) return "";
  return (contact.firstName.charAt(0) + contact.lastName.charAt(0)).toUpperCase();
}

function toggleContactSelection(option) {
  const checkboxImg = option.querySelector("img[data-checked]");
  if (checkboxImg.dataset.checked === "true") {
    option.classList.remove("selected");
    checkboxImg.src = "../assets/checkbox.svg";
    checkboxImg.dataset.checked = "false";
    return;
  }
  checkboxImg.src = "../assets/checkbox-checked.svg";
  checkboxImg.dataset.checked = "true";
  option.classList.add("selected");
}

function renderContactOptions(userArray) {
  list.innerHTML = "";
  userArray.forEach((contact) => {
    list.insertAdjacentHTML("beforeend", getContactOptionTemplate(contact));
  });
}

function changePriority(thisBtn) {
  for (let i = 0; i < priorityBtns.length; i++) {
    priorityBtns[i].classList.remove("priority-active");
    priorityBtns[i].querySelector("svg").classList.remove("priority-active-svg");
  }
  thisBtn.classList.add("priority-active");
  thisBtn.querySelector("svg").classList.add("priority-active-svg");
}

function getTodaysDate() {
  const taskDate = document.getElementById("taskDueDate");
  const today = new Date().toISOString().split("T")[0];
  taskDate.setAttribute("min", today);
}

function showSubtaskActions() {
  const subtaskActions = document.querySelector(".subtask-actions");
  subtaskActions.style.visibility = subtaskInput.value.trim().length > 0 ? "visible" : "hidden";
}

function saveSubtask() {
  const text = subtaskInput.value.trim();
  if (!text) return;
  subTaskList.insertAdjacentHTML("beforeend", getSubtaskItemTemplate(text));
  subtaskInput.value = "";
  showSubtaskActions();
}

function rejectSubtask() {
  subtaskInput.value = "";
  showSubtaskActions();
}

function createSubtaskEditInput(text) {
  const input = document.createElement("input");
  input.type = "text";
  input.classList.add("subtask-edit-input");
  input.value = text;
  return input;
}

function startEditSubtask(item) {
  const span = item.querySelector(".subtask-text");
  const input = createSubtaskEditInput(span.textContent);
  span.replaceWith(input);
  item.classList.add("editing");
  input.focus();
  input.addEventListener("blur", () => finishEditSubtask(item, input));
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    input.blur();
  });
}

function finishEditSubtask(item, input) {
  if (!item.classList.contains("editing")) return;
  item.classList.remove("editing");
  const newText = input.value.trim();
  if (!newText) {
    item.remove();
    return;
  }
  const span = document.createElement("span");
  span.classList.add("subtask-text");
  span.textContent = newText;
  input.replaceWith(span);
}

list.addEventListener("click", (event) => {
  const option = event.target.closest(".contact-option");
  if (option) toggleContactSelection(option);
});

for (let i = 0; i < priorityBtns.length; i++) {
  priorityBtns[i].addEventListener("click", () => changePriority(priorityBtns[i]));
}

subtaskInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  saveSubtask();
});

subTaskList.addEventListener("click", (event) => {
  const item = event.target.closest(".subtask-list-item");
  if (!item || item.classList.contains("editing")) return;
  if (event.target.closest(".delete-subtask-item-btn")) {
    item.remove();
    return;
  }
  startEditSubtask(item);
});

const form = document.getElementById("add-task-form");
const taskTitleInput = document.getElementById("task-title");
const taskCategory = document.getElementById("task-category");
const errorMessage = document.getElementById("error-message");
const dueDate = document.getElementById("taskDueDate");
const errorMessageArray = [];

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorMessageArray.length = 0;
    errorMessage.innerText = "";
    if (taskTitleInput.value.trim().length <= 2) {
      errorMessageArray.push("The title must be at least 3 characters!");
    }
    if (taskCategory.value === "none") {
      errorMessageArray.push("Please enter a task category!");
    }
    if (dueDate.value === ""){
        errorMessageArray.push("Please enter a due date!");
    }
    if (errorMessageArray.length > 0) {
      event.preventDefault();
      errorMessage.innerText = errorMessageArray.join (' , ');
      return;
    }
    await submitForm();
    })

function getSelectedPriority() {
  const btn = document.querySelector(".priority-btn.priority-active");
  return btn.classList.contains("priority-urgent") ? "urgent"
    : btn.classList.contains("priority-low") ? "low" : "medium";
}

function getAssignedContactIds() {
  return Array.from(document.querySelectorAll(".contact-option.selected")).map(
    (option) => ({ id: option.dataset.contactId }),
  );
}

function getSubtasks(previous = []) {
  saveSubtask();
  return Array.from(subTaskList.querySelectorAll(".subtask-text")).map((el) => {
    const label = el.textContent.trim();
    const old = previous.find((subtask) => subtask.label === label);
    return { label, done: old ? Boolean(old.done) : false };
  });
}

async function submitForm() {
  const all = getSessionData("session-tasks");
  const existing = editingTaskId ? all.find((t) => t.id === editingTaskId) : null;
  const task = {
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
  saveSessionData(
    "session-tasks",
    existing ? all.map((t) => (t.id === task.id ? task : t)) : [...all, task],
  );
  await putData("tasks/" + task.id, task);
  resetForm();
  if (typeof onTaskSaved === "function") onTaskSaved();
}

list.style.display = "none";
document.getElementById("assigned-to-dropdown").classList.remove("open");

function resetForm() {
  form.reset();
  errorMessageArray.length = 0;
  errorMessage.innerText = "";
  subTaskList.innerHTML = "";
  showSubtaskActions();
  resetPriority();
  resetAssignedContacts();
}

function resetPriority() {
  changePriority(document.querySelector(".priority-medium"));
}

function resetAssignedContacts() {
  list.innerHTML = "";
  document.getElementById("assigned-avatars").innerHTML = "";
}


