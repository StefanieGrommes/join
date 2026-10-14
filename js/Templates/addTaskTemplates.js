/**
 * Returns the HTML for one contact entry in the assigned-to dropdown.
 * @param {Object} contact - Contact with initials and name.
 * @returns {string} HTML string of the list item
 */
function getContactOptionTemplate(contact) {
  return /* HTML */ `
    <li class="contact-option">
      <span class="contact-avatar">${contact.initials}</span>
      <span class="contact-name">${contact.name}</span>
      <img src="../assets/checkbox.svg" alt="" />
    </li>
  `;
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

subTaskList.addEventListener("click", (event) => {
  const item  = event.target.closest(".subtask-list-item"); //findet das Element, oder Elternelement, das zu dem Item gehört, auf das geklickt wurde
  if (!item || item.classList.contains("editing")) return;
  if (event.target.closest(".delete-submask-item-btn")) {
    item.remove();
    return;
  } else {
  startEditSubtask(item);
  }
});



function rejectSubtask() {
  subtaskInput.value = "";
}



function startEditSubtask(item) {
  if (item.classList.contains("editing")) return;
  const text = item.querySelector(".subtask-text").textContent;
  item.classList.add("editing");
  item.innerHTML = getSubtaskEditTemplate(text);
  item.querySelector("input").focus;

  subTaskList.innerHTML += `<div class="subtask-list-item-wrapper">
                              <input type="text" id="subtask-list-item" value="${subtaskInput.value}">
                              <div class="subtask-list-buttons">
                              <button type="button"><img src="../assets/delete-subtask.png" alt="delete subtask item"> </button>
                              <span class="action-divider"></span>
                              <button type="button"><img src="../assets/edit-subtask.png" alt="edit subtask item"></button>
                              </div>
                            </div>`

}

/*
const editSubtaskItemBtns = document.getElementsByClassName("edit-subtask-item-btn");
for (let i = 0; i < editSubtaskItemBtns.length; i++) {
  editSubtaskItemBtns[i].addEventListener("click",() => editSubtaskListItem(editSubtaskItemBtns[i]));
}

const deleteSubtaskItemBtns = document.getElementsByClassName("delete-subtask-item-btn");
for (let i = 0; i < deleteSubtaskItemBtns.length; i++) {
  deleteSubtaskItemBtns[i].addEventListener("click", () => deleteSubtaskListItem(deleteSubtaskItemBtns[i]));
}

function deleteSubtaskListItem(thisBtn){
  subtaskInput.value = "";
}


function getDueDate(){

}

*/