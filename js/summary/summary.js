const daytimeContainer = document.getElementById("daytime");
const taskBoxColumns = {
    "to-do": "todo",
    "done": "done",
    "tasks-in-progress": "in-progress",
    "awaiting-feedback": "await-feedback"
};

window.addEventListener("load", summaryInit, true);

/**
 * Initializes the summary page: session, greeting, task numbers and click events.
 *
 * @returns {void}
 */
function summaryInit() {
    init();
    restoreStoredTasks();
    showCurrentDayTime();
    showSummaryName();
    showTaskCounts();
    showUpcomingDeadline();
    bindTaskBoxes();
}

/**
 * Writes the greeting for the current time of day into the welcome message.
 *
 * @returns {void}
 */
function showCurrentDayTime() {
    daytimeContainer.textContent = getCurrentDaytime();
}

/**
 * Shows the demo user name next to the greeting. Without a name the trailing comma is removed.
 *
 * @returns {void}
 */
function showSummaryName() {
    const mode = window.sessionStorage.getItem("join-session-mode");
    const name = window.sessionStorage.getItem("join-demo-name");
    const username = document.getElementById("username");
    username.textContent = mode === "demo" && name ? name.trim() : "";
    username.hidden = !username.textContent;
    if (!username.textContent) {
        daytimeContainer.textContent = getCurrentDaytime().replace(/,$/, "");
    }
}

/**
 * Returns the greeting that matches the current hour.
 *
 * @returns {string} "Good Morning,", "Good Afternoon," or "Good Evening,".
 */
function getCurrentDaytime() {
    const hours = new Date().getHours();
    if (hours >= 4 && hours < 12) {
        return "Good Morning,";
    } else if (hours >= 12 && hours < 18) {
        return "Good Afternoon,";
    } else {
        return "Good Evening,";
    }
}

/**
 * Returns all tasks that are shown in a board column.
 *
 * @param {string} columnId - Id of the board column, e.g. "todo".
 * @returns {Object[]} The tasks of this column.
 */
function getTasksInColumn(columnId) {
    const boardState = getBoardState();
    return tasks.filter((task) => getTaskColumnId(task, boardState) === columnId);
}

/**
 * Returns all tasks with the priority "Urgent".
 *
 * @returns {Object[]} The urgent tasks.
 */
function getUrgentTasks() {
    return tasks.filter((task) => task.priority === "Urgent");
}

/**
 * Writes a number into the amount field of a summary box.
 *
 * @param {string} boxId - Id of the summary box.
 * @param {number} amount - The number to show.
 * @returns {void}
 */
function setBoxAmount(boxId, amount) {
    document.querySelector(`#${boxId} .amount-bold`).textContent = amount;
}

/**
 * Shows the number of tasks per board column in the matching boxes.
 *
 * @returns {void}
 */
function showColumnCounts() {
    Object.entries(taskBoxColumns).forEach(([boxId, columnId]) => {
        setBoxAmount(boxId, getTasksInColumn(columnId).length);
    });
}

/**
 * Shows the task numbers of all summary boxes.
 *
 * @returns {void}
 */
function showTaskCounts() {
    showColumnCounts();
    setBoxAmount("tasks-in-board", tasks.length);
    setBoxAmount("urgent-and-calendar", getUrgentTasks().length);
}

/**
 * Converts a due date string into a date. Supports "YYYY-MM-DD" (task form)
 * and "MM/DD/YYYY" (default tasks).
 *
 * @param {string} dueDate - The due date of a task.
 * @returns {Date|null} The date or null if the format is unknown.
 */
function parseDueDate(dueDate) {
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
    if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    const us = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dueDate);
    if (us) return new Date(Number(us[3]), Number(us[1]) - 1, Number(us[2]));
    return null;
}

/**
 * Returns the current day at 00:00.
 *
 * @returns {Date} Start of today.
 */
function getStartOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

/**
 * Collects the due dates of all urgent tasks that are not done and not overdue.
 *
 * @returns {Date[]} The upcoming due dates.
 */
function getUpcomingUrgentDates() {
    const boardState = getBoardState();
    const today = getStartOfToday();
    return getUrgentTasks()
        .filter((task) => getTaskColumnId(task, boardState) !== "done")
        .map((task) => parseDueDate(task.dueDate))
        .filter((date) => date && date >= today);
}

/**
 * Returns the nearest upcoming due date of the urgent tasks.
 *
 * @returns {Date|null} The nearest date or null if there is none.
 */
function getNextUrgentDeadline() {
    const dates = getUpcomingUrgentDates();
    return dates.length ? new Date(Math.min(...dates)) : null;
}

/**
 * Formats a date like "October 21, 2026".
 *
 * @param {Date|null} date - The date to format.
 * @returns {string} The formatted date or a dash if there is no date.
 */
function formatDeadline(date) {
    if (!date) return "\u2013";
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/**
 * Shows the nearest upcoming urgent due date in the urgent box.
 *
 * @returns {void}
 */
function showUpcomingDeadline() {
    const deadline = getNextUrgentDeadline();
    document.getElementById("upcoming-deadline").textContent = formatDeadline(deadline);
}

/**
 * Makes every summary box open the board on click or on Enter / Space.
 *
 * @returns {void}
 */
function bindTaskBoxes() {
    document.querySelectorAll(".grey-boxes-task").forEach((box) => {
        box.addEventListener("click", goToBoard);
        box.addEventListener("keydown", handleTaskBoxKeydown);
    });
}

/**
 * Opens the board when Enter or Space is pressed on a summary box.
 *
 * @param {KeyboardEvent} event - The keydown event.
 * @returns {void}
 */
function handleTaskBoxKeydown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    goToBoard();
}

/**
 * Navigates to the board page.
 *
 * @returns {void}
 */
function goToBoard() {
    window.location.href = "board-layout.html";
}
