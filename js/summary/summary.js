const daytimeContainer = document.getElementById("daytime");
const taskBoxColumns = {
    "to-do": "todo",
    "done": "done",
    "tasks-in-progress": "in-progress",
    "awaiting-feedback": "await-feedback"
};

window.addEventListener("load", summaryInit, true);

async function summaryInit() {
    await init();
    showCurrentDayTime();
    showSummaryName();
    showTaskCounts();
    showUpcomingDeadline();
    bindTaskBoxes();
}

function showCurrentDayTime() {
    daytimeContainer.textContent = getCurrentDaytime();
}

function showSummaryName() {
    const mode = window.localStorage.getItem("join-session-mode");
    const name = (window.localStorage.getItem("join-demo-name") || "").trim();
    const username = document.getElementById("username");
    const hasName = mode === "demo" && name !== "";
    username.textContent = hasName ? name + "!" : "";
    username.hidden = !hasName;
    daytimeContainer.textContent = hasName
        ? getCurrentDaytime()
        : getCurrentDaytime().replace(/,$/, "!");
}

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

function getTasksInColumn(columnId) {
    return getTasks().filter((task) => getTaskColumnId(task) === columnId);
}

function getUrgentTasks() {
     return getTasks().filter((task) => task.priority === "urgent");
}

function setBoxAmount(boxId, amount) {
    document.querySelector(`#${boxId} .amount-bold`).textContent = amount;
}

function showColumnCounts() {
    Object.entries(taskBoxColumns).forEach(([boxId, columnId]) => {
        setBoxAmount(boxId, getTasksInColumn(columnId).length);
    });
}

function showTaskCounts() {
    showColumnCounts();
    setBoxAmount("tasks-in-board", getTasks().length);
    setBoxAmount("urgent-and-calendar", getUrgentTasks().length);
}

function parseDueDate(dueDate) {
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
    if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    const us = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dueDate);
    if (us) return new Date(Number(us[3]), Number(us[1]) - 1, Number(us[2]));
    return null;
}

function getStartOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function getUpcomingUrgentDates() {
    const today = getStartOfToday();
    return getUrgentTasks()
        .filter((task) => getTaskColumnId(task) !== "done")
        .map((task) => parseDueDate(task.dueDate))
        .filter((date) => date && date >= today);
}

function getNextUrgentDeadline() {
    const dates = getUpcomingUrgentDates();
    return dates.length ? new Date(Math.min(...dates)) : null;
}

function formatDeadline(date) {
    if (!date) return "\u2013";
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function showUpcomingDeadline() {
    const deadline = getNextUrgentDeadline();
    document.getElementById("upcoming-deadline").textContent = formatDeadline(deadline);
}

function bindTaskBoxes() {
    document.querySelectorAll(".grey-boxes-task").forEach((box) => {
        box.addEventListener("click", goToBoard);
        box.addEventListener("keydown", handleTaskBoxKeydown);
    });
}

function handleTaskBoxKeydown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    goToBoard();
}

function goToBoard() {
    window.location.href = "board-layout.html";
}
