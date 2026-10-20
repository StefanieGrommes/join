/**
 * Initializes the summary page after all resources have loaded.
 * @returns {void}
 */
function summaryInit() {
  init();
  showCurrentDayTime();
  initTaskBoxListeners();
}

window.addEventListener("load", summaryInit, true);

/**
 * Displays the appropriate greeting based on the current time.
 * @returns {void}
 */
function showCurrentDayTime() {
  const daytimeContainer = document.getElementById("daytime");
  if (daytimeContainer) daytimeContainer.textContent = getCurrentDaytime();
}

/**
 * Returns a greeting based on the current local hour.
 * @returns {string} The appropriate greeting.
 */
function getCurrentDaytime() {
  const hours = new Date().getHours();
  if (hours >= 4 && hours < 12) return "Good Morning,";
  if (hours >= 12 && hours < 18) return "Good Afternoon,";
  return "Good Evening,";
}

/**
 * Registers click and keyboard listeners for task summary boxes.
 * @returns {void}
 */
function initTaskBoxListeners() {
  document.querySelectorAll(".grey-boxes-task").forEach((box) => {
    box.addEventListener("click", goToBoard);
    box.addEventListener("keydown", handleTaskBoxKeydown);
  });
}

/**
 * Handles keyboard activation of a task summary box.
 * @param {KeyboardEvent} event - The keyboard event.
 * @returns {void}
 */
function handleTaskBoxKeydown(event) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  goToBoard();
}

/**
 * Redirects the user to the board page.
 * @returns {void}
 */
function goToBoard() {
  window.location.href = "board-layout.html";
}
