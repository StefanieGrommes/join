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

const priorityBtn = document.getElementsByClassName("priority-btn");
for (let i = 0; i < priorityBtn.length; i++) {
  priorityBtn[i].addEventListener("click", () => changePriority(priorityBtn[i]));
}

function changePriority(thisBtn){
  for (let i = 0; i < priorityBtn.length; i++) {
    priorityBtn[i].classList.remove("priority-active");
     const priorityBtnsSvg = priorityBtn[i].querySelector("svg");
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
  subTaskList.innerHTML += `<li class="subtask-list-item">
                              <span>${subtaskInput.value}</span>
                              <div class="subtask-list-buttons">
                              <button type="button" onclick="editSubtaskListItem()"><img src="../assets/edit-subtask.png" alt="edit subtask item"></button>
                              <span class="action-divider"></span>
                              <button type="button" onclick="deleteSubtaskListItem()"><img src="../assets/delete-subtask.png" alt="delete subtask item"> </button>
                              </div> </li>`
  subtaskInput.value = "";
  showSubtaskActions();
}

function rejectSubtask(){
  subtaskInput.value = "";
}

function getDueDate(){

}

