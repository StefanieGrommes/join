window.addEventListener("load", summaryInit, true);

function summaryInit() {
    init();
    showCurrentDayTime();
    showSummaryName();
    showCurrentDate();
}

const daytimeContainer = document.getElementById("daytime");

function showCurrentDayTime() {
    daytimeContainer.textContent = getCurrentDaytime();
}

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

function showCurrentDate() {
    document.getElementById("current-date").textContent = new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });
}

function getCurrentDaytime() {
    const now = new Date();
    const hours = now.getHours();
    if (hours >= 4 && hours < 12) {
        return "Good Morning,";
    } else if (hours >= 12 && hours < 18) {
        return "Good Afternoon,";
    } else {
        return "Good Evening,";
    }
}

const taskBoxes = document.querySelectorAll(".grey-boxes-task");

taskBoxes.forEach((box) => {
    box.addEventListener("click", goToBoard);
    box.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            goToBoard();
        }
    });
});

function goToBoard() {
    window.location.href = "board-layout.html";
}


