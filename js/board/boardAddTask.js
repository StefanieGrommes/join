const boardTaskModal = document.getElementById ("board-add-task-modal");
const boardTaskForm = document.querySelector("#board-add-task-modal .add-task-form");

/**
 * Opens tha add task overlay on board.
 * @returns {void}
 */
function openBoardTaskModal(){
boardTaskModal.classList.add("is-open");
boardTaskModal.setAttribute("aria-hidden", "false");
}

/**
 * Close the add task overlay and clears the form.
 * @returns {void}
 */
function closeBoardTaskModal(){
boardTaskModal.classList.remove("is-open");
boardTaskModal.setAttribute("aria-hidden", "true");
boardTaskForm.reset();
}

/**
 * Connects all buttons and events of the board and task overlay
 * @returns {void}
 */
function initBoardAddTask() {
if (!boardTaskModal || !boardTaskForm) return;
document.getElementById("board-open-add-task-modal").addEventListener("click", openBoardTaskModal);
document.getElementById("board-task-close-button").addEventListener("click", closeBoardTaskModal)
boardTaskForm.querySelector(".btn-clear").addEventListener("click", closeBoardTaskModal);
boardTaskModal.addEventListener("click", closeOnBackdropClick);
boardTaskForm.addEventListener("submit", handleBoardTaskSubmit);
initColumnAddButtons();
}

/**
 * Close the overlay when the dark area around it is clicked
 * @param {MouseEvent} event - The click event.
 * @returns {void}
 */
function closeOnBackdropClick(event){
if (event.target === boardTaskModal) closeBoardTaskModal();
}

/**
 * Close the overlay and redraws the board after a task was created.
 * @returns {void}
 */
function handleBoardTaskSubmit(){
setTimeout(() =>{
    closeBoardTaskModal();
    initBoardLayout();
}, 0);
}

/**
 * Lets the plus buttons of the board columns open the overlay.
 * @returns {void}
 */
function initColumnAddButtons(){
    let buttons = document.querySelectorAll(".board-header-column button[data-column]");
    for (let button of buttons){
        button.addEventListener("click", openBoardTaskModal);
    }
}




