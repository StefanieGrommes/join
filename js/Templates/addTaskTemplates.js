async function initAddTask(){
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
  if (!list.children.length) {
    renderContactOptions(getSessionData("session-contacts"));
  }
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

function getAvatarTemplate(initials, avatarColor) {
  return `<span class="contact-avatar" style="background-color: ${avatarColor}">${initials}</span>`;
}

function getFullUserName(contact) {
return `${contact.firstName} ${contact.lastName}`;
}

function getUserInitials(contact){
  if (!contact.firstName  || !contact.lastName) return "";
  return (contact.firstName.charAt(0) + contact.lastName.charAt(0)).toUpperCase();
}

/**
 * Returns the HTML for one contact entry in the assigned-to dropdown.
 * @param {Object} contact - Contact with initials and name.
 * @returns {string} HTML string of the list item
 */
function getContactOptionTemplate(contact) {
  return`
    <li class="contact-option">
    <div class="name-and-initials">
      <span class="contact-avatar" style="background-color: ${getContactColor(contact.id)}">${getUserInitials(contact)}</span>
      <span class="contact-name">${getFullUserName(contact)}</span>
      </div>
      <button class="checked-btn" type="button">
      <img src="../assets/checkbox.svg" alt="checkbox" data-checked="false"/>
      </button>
    </li>`
}

const list = document.getElementById("assigned-to-list");
list.addEventListener("click", (event) => {
  const option = event.target.closest(".contact-option");
  if (option) toggleContactSelection(option);
});

function toggleContactSelection(option) {
  const checkboxImg = option.querySelector("img[data-checked]");
  if (checkboxImg.dataset.checked === "true"){
    option.classList.remove("selected");
    checkboxImg.src = "../assets/checkbox.svg";
    checkboxImg.dataset.checked = "false";
  } else {
  checkboxImg.src="../assets/checkbox-checked.svg";
  checkboxImg.dataset.checked = "true";
  option.classList.add("selected")
  }
}

function renderContactOptions(userArray){
  list.innerHTML = "";
  userArray.forEach((contact) => {
    list.insertAdjacentHTML("beforeend",getContactOptionTemplate(contact))
  });
}

const priorityBtns = document.getElementsByClassName("priority-btn");
for (let i = 0; i < priorityBtns.length; i++) {
  priorityBtns[i].addEventListener("click", () => changePriority(priorityBtns[i]));
}

function changePriority(thisBtn){
  for (let i = 0; i < priorityBtns.length; i++) {
    priorityBtns[i].classList.remove("priority-active");
     const priorityBtnsSvg = priorityBtns[i].querySelector("svg");
  priorityBtnsSvg.classList.remove("priority-active-svg");
  }
  thisBtn.classList.add("priority-active");
  const thisBtnSvg = thisBtn.querySelector("svg");
  thisBtnSvg.classList.add("priority-active-svg");
}

function getTodaysDate(){
  const taskDate = document.getElementById("taskDueDate");
  const today = new Date().toISOString().split("T")[0];
  taskDate.setAttribute("min", today);
}

const subtaskInput = document.getElementById("subtaskInput");

function showSubtaskActions(){
  const subtaskActions = document.querySelector(".subtask-actions");
  subtaskActions.style.visibility = subtaskInput.value.trim().length > 0 ? "visible" : "hidden";
}

const subTaskList = document.querySelector(".subtask-list");

function saveSubtask(){
  const text = subtaskInput.value.trim();
  if (!text) return;
  subTaskList.insertAdjacentHTML("beforeend", getSubtaskItemTemplate(text));
  subtaskInput.value = "";
  showSubtaskActions();
}

function getSubtaskItemTemplate(text) {
  return  `<li class="subtask-list-item">
                              <span class="subtask-text">${text}</span>
                              <div class="subtask-list-buttons">
                              <button type="button" class="edit-subtask-item-btn"><img src="../assets/edit-subtask.png" alt="edit subtask item"></button>
                              <span class="action-divider"></span>
                              <button type="button" class="delete-subtask-item-btn"><img src="../assets/delete-subtask.png" alt="delete subtask item"> </button>
                              </div> </li>`
}

/**
 * adds event-listener to the subTaskList Item and decides which action is used based on the clicked element
 *
 */
subtaskInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  saveSubtask();
});

subTaskList.addEventListener("click", (event) => {
  const item  = event.target.closest(".subtask-list-item"); //findet das Element, oder Elternelement, das zu dem Item gehört, auf das geklickt wurde
  if (!item || item.classList.contains("editing")) return;
  if (event.target.closest(".delete-subtask-item-btn")) {
    item.remove();
    return;
  } else {
  startEditSubtask(item);
  }
});

function startEditSubtask(item) {
  const span = item.querySelector(".subtask-text");
  const input = document.createElement("input");
  input.type = "text";
  input.classList.add("subtask-edit-input");
  input.value = span.textContent;
  span.replaceWith(input);
  item.classList.add("editing");
  input.focus(); // setzt den Cursor auf das Input Feld
  input.addEventListener("blur", () => finishEditSubtask(item, input));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {event.preventDefault(); input.blur();
    }
  });
}

function finishEditSubtask(item, input) {
  if (!item.classList.contains("editing")) return;
  item.classList.remove("editing");
  const newText = input.value.trim();
  if(!newText) {
    item.remove();
    return;
  } else {
    const span = document.createElement("span");
    span.classList.add("subtask-text");
    span.textContent = newText;
    input.replaceWith(span);
  }
}

function rejectSubtask(){
  subtaskInput.value = "";
  showSubtaskActions();
}
/*
function getDueDate(){

}

*/