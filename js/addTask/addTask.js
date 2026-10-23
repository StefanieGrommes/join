const list = document.getElementById("assigned-to-list");
const priorityBtns = document.getElementsByClassName("priority-btn");
const subtaskInput = document.getElementById("subtaskInput");
const subTaskList = document.querySelector(".subtask-list");

/**
 * Loads the session data (contacts and tasks) for the add-task page.
 * @returns {Promise<void>}
 */
async function initAddTask() {
  await initSessionData();
}

/**
 * Opens or closes the assigned-to dropdown. On close the selected avatars are rendered.
 * @returns {void}
 */
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

/**
 * Renders the avatars of all selected contacts below the dropdown.
 * @returns {void}
 */
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

/**
 * Returns the full name of a contact.
 * @param {{firstName: string, lastName: string}} contact - The contact.
 * @returns {string} First and last name separated by a space.
 */
function getFullUserName(contact) {
  return `${contact.firstName} ${contact.lastName}`;
}

/**
 * Returns the initials of a contact in upper case.
 * @param {{firstName: string, lastName: string}} contact - The contact.
 * @returns {string} Two initials, or an empty string if a name is missing.
 */
function getUserInitials(contact) {
  if (!contact.firstName || !contact.lastName) return "";
  return (contact.firstName.charAt(0) + contact.lastName.charAt(0)).toUpperCase();
}

/**
 * Selects or deselects a contact option in the dropdown.
 * @param {HTMLElement} option - The clicked contact option.
 * @returns {void}
 */
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

/**
 * Renders the contacts as options into the assigned-to dropdown.
 * @param {Object[]} userArray - The contacts to render.
 * @returns {void}
 */
function renderContactOptions(userArray) {
  list.innerHTML = "";
  userArray.forEach((contact) => {
    list.insertAdjacentHTML("beforeend", getContactOptionTemplate(contact));
  });
}

/**
 * Marks the clicked priority button as active and all others as inactive.
 * @param {HTMLElement} thisBtn - The clicked priority button.
 * @returns {void}
 */
function changePriority(thisBtn) {
  for (let i = 0; i < priorityBtns.length; i++) {
    priorityBtns[i].classList.remove("priority-active");
    priorityBtns[i].querySelector("svg").classList.remove("priority-active-svg");
  }
  thisBtn.classList.add("priority-active");
  thisBtn.querySelector("svg").classList.add("priority-active-svg");
}

/**
 * Sets today as the minimum selectable date of the due date field.
 * @returns {void}
 */
function getTodaysDate() {
  const taskDate = document.getElementById("taskDueDate");
  const today = new Date().toISOString().split("T")[0];
  taskDate.setAttribute("min", today);
}

/**
 * Shows the subtask action buttons only while the subtask input is not empty.
 * @returns {void}
 */
function showSubtaskActions() {
  const subtaskActions = document.querySelector(".subtask-actions");
  subtaskActions.style.visibility = subtaskInput.value.trim().length > 0 ? "visible" : "hidden";
}

/**
 * Adds the entered subtask to the subtask list and clears the input.
 * @returns {void}
 */
function saveSubtask() {
  const text = subtaskInput.value.trim();
  if (!text) return;
  subTaskList.insertAdjacentHTML("beforeend", getSubtaskItemTemplate(text));
  subtaskInput.value = "";
  showSubtaskActions();
}

/**
 * Clears the subtask input and hides the action buttons.
 * @returns {void}
 */
function rejectSubtask() {
  subtaskInput.value = "";
  showSubtaskActions();
}

/**
 * Creates the text input that replaces a subtask text while it is edited.
 * @param {string} text - Current text of the subtask.
 * @returns {HTMLInputElement} The edit input.
 */
function createSubtaskEditInput(text) {
  const input = document.createElement("input");
  input.type = "text";
  input.classList.add("subtask-edit-input");
  input.value = text;
  return input;
}

/**
 * Switches a subtask list item into edit mode.
 * @param {HTMLElement} item - The subtask list item.
 * @returns {void}
 */
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

/**
 * Ends the edit mode of a subtask. An empty text removes the subtask.
 * @param {HTMLElement} item - The subtask list item.
 * @param {HTMLInputElement} input - The edit input.
 * @returns {void}
 */
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

/**
 * Selects or deselects a contact when an option in the assigned-to dropdown is clicked.
 * @param {MouseEvent} event - The click event.
 * @returns {void}
 */
list.addEventListener("click", (event) => {
  const option = event.target.closest(".contact-option");
  if (option) toggleContactSelection(option);
});

/**
 * Registers a click handler on every priority button that activates the clicked button.
 * Each handler takes no event parameter and returns nothing.
 * @returns {void}
 */
for (let i = 0; i < priorityBtns.length; i++) {
  priorityBtns[i].addEventListener("click", () => changePriority(priorityBtns[i]));
}

/**
 * Saves the entered subtask when Enter is pressed in the subtask input.
 * Prevents the default form submission.
 * @param {KeyboardEvent} event - The keydown event.
 * @returns {void}
 */
subtaskInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  saveSubtask();
});

/**
 * Handles clicks inside the subtask list. A click on the delete button removes the
 * subtask, any other click on an item that is not being edited starts the edit mode.
 * @param {MouseEvent} event - The click event.
 * @returns {void}
 */
subTaskList.addEventListener("click", (event) => {
  const item = event.target.closest(".subtask-list-item");
  if (!item || item.classList.contains("editing")) return;
  if (event.target.closest(".delete-subtask-item-btn")) {
    item.remove();
    return;
  }
  startEditSubtask(item);
});

const form = document.getElementById("addTaskForm");
const taskTitleInput = document.getElementById("task-title");
const taskCategory = document.getElementById("task-category");
const errorMessage = document.getElementById("error-message");
const dueDate = document.getElementById("taskDueDate");
const errorMessageArray = [];

/**
 * Checks if the required fields are valid and shows error message if not.
 * Prevents the form of submitting if the fields do not pass the test.
 * @returns {void}
 */
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
 * Returns the texts of all subtasks in the list.
 * @returns {string[]} The subtask texts.
 */
function getSubtasks() {
  return Array.from(subTaskList.querySelectorAll(".subtask-text")).map((el) => el.textContent);
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
 * Builds the task object from the form and posts it to the firebase.
 * @returns {Promise<void>}
 */
async function submitForm() {
  const task = {
    title: taskTitleInput.value.trim(),
    state: "todo",
    description: document.getElementById("task-description").value.trim(),
    dueDate: dueDate.value,
    priority: getSelectedPriority(),
    assignedTo: getAssignedContactIds(),
    category: taskCategory.value,
    subtasks: getSubtasks(),
  };
  console.log(task);
  await postData("tasks", task);
  resetForm();
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
 * Sets the priority back to "medium".
 * @returns {void}
 */
function resetPriority() {
  changePriority(document.querySelector(".priority-medium"));
}

/**
 * Deselects all contacts and clears the avatars.
 * @returns {void}
 */
function resetAssignedContacts() {
  list.innerHTML = "";
  document.getElementById("assigned-avatars").innerHTML = "";
}


