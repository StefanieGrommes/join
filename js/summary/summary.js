window.addEventListener("load", summaryInit, true);

function summaryInit() {
    init();
    showCurrentDayTime();
}

const daytimeContainer = document.getElementById("daytime");

function showCurrentDayTime() {
    daytimeContainer.innerHTML = getCurrentDaytime();
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


