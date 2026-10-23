const BASE_URL = "https://join--testuser-default-rtdb.europe-west1.firebasedatabase.app/";
const profileButtonSelector = ".profile-initials-btn, .board-mobile-profile-button";

let profileMenuElement = null;
let profileMenuButtons = [];
let activeProfileButton = null;

/**
 * Starts every Join page: checks the session, loads header and footer and the session data.
 * @returns {Promise<void>}
 */
async function init() {
    await fetchFooterHeader();
    await replaceNavLinksWithLogin();
    await renderMobilePolicyNavFooter();
    initNavbarButtonsBackground();
    await initSessionData();
    if (typeof renderContactList === "function") renderContactList(getSessionData("session-contacts"));
}

/**
 * Checks whether the current page can be opened without a session.
 * @returns {boolean} True for login, signup and legal pages.
 */
function isPublicJoinPage() {
    const page = window.location.pathname.split("/").pop();
    return ["", "index.html", "signup.html", "privacy-notice.html", "legal-notice.html"].includes(page);
}

/**
 * Checks whether a guest or demo session is active.
 * @returns {boolean} True if the user is logged in as guest or demo user.
 */
function hasJoinSession() {
    const mode = window.localStorage.getItem("join-session-mode");
    return mode === "guest" || (mode === "demo" && Boolean(window.localStorage.getItem("join-demo-name")));
}

/**
 * Replaces the navigation links with a single "Log In" link when no session is active.
 * The original list items are hidden, the list itself stays.
 * @returns {Promise<void>}
 */
async function replaceNavLinksWithLogin() {
    if (hasJoinSession()) return;
    const navList = document.querySelector(".nav-links");
    if (!navList) return;
    navList.querySelectorAll("li").forEach((item) => {
        item.style.display = "none";
    });
    const response = await fetch("../templates/loginNavLink.txt");
    navList.insertAdjacentHTML("beforeend", await response.text());
}

/**
 * Hides the profile buttons when no guest or demo session is active.
 * @returns {void}
 */
function hideProfileButtonsWithoutSession() {
    if (hasJoinSession()) return;
    document.querySelectorAll(".profile-initials-btn").forEach((button) => {
        button.style.display = "none";
    });
}

/**
 * Loads an HTML template file and inserts its content into the body.
 * @param {string} path - Path of the template file.
 * @param {InsertPosition} position - Where to insert, e.g. "afterbegin" or "beforeend".
 * @returns {Promise<void>}
 */
async function insertTemplate(path, position) {
    const response = await fetch(path);
    const html = await response.text();
    document.body.insertAdjacentHTML(position, html);
}

/**
 * Fetches the header and footer templates and inserts them into the page.
 * @returns {Promise<void>}
 */
async function fetchFooterHeader() {
    await insertTemplate("../templates/header.txt", "afterbegin");
    hideProfileButtonsWithoutSession();
    updateSessionHeader();
    initProfileMenu();
    await insertTemplate("../templates/footer.txt", "beforeend");
}

/**
 * Connects the profile circles with the shared desktop and mobile menu.
 * @returns {void}
 */
function initProfileMenu() {
    const menu = document.getElementById("profile-menu");
    if (!menu || menu.dataset.initialized) return;
    menu.dataset.initialized = "true";
    profileMenuElement = menu;
    profileMenuButtons = Array.from(document.querySelectorAll(profileButtonSelector));
    const logoutButton = menu.querySelector("#logout-button");
    if (logoutButton) logoutButton.addEventListener("click", logoutJoinSession);
    profileMenuButtons.forEach(setupProfileButton);
    bindProfileMenuCloseEvents();
}

/**
 * Prepares one profile button: accessibility attributes and click handler.
 * @param {HTMLButtonElement} button - The profile button.
 * @returns {void}
 */
function setupProfileButton(button) {
    button.type = "button";
    if (!button.hasAttribute("aria-label")) button.setAttribute("aria-label", "Profile");
    button.setAttribute("aria-controls", profileMenuElement.id);
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", () => toggleProfileMenu(button));
}

/**
 * Closes the profile menu and optionally restores the focus to its button.
 * @param {boolean} [restoreFocus=false] - Whether to focus the button again.
 * @returns {void}
 */
function closeProfileMenu(restoreFocus = false) {
    profileMenuElement.hidden = true;
    if (activeProfileButton) {
        activeProfileButton.setAttribute("aria-expanded", "false");
        if (restoreFocus) activeProfileButton.focus();
    }
    activeProfileButton = null;
}

/**
 * Opens the profile menu for a button or closes it if it is already open for this button.
 * @param {HTMLButtonElement} button - The clicked profile button.
 * @returns {void}
 */
function toggleProfileMenu(button) {
    const wasOpen = activeProfileButton === button;
    closeProfileMenu();
    if (wasOpen) return;
    activeProfileButton = button;
    profileMenuElement.hidden = false;
    button.setAttribute("aria-expanded", "true");
    positionProfileMenu(button);
    profileMenuElement.querySelector("a").focus();
}

/**
 * Places the profile menu below its button and keeps it inside the viewport.
 * @param {HTMLButtonElement} button - The profile button.
 * @returns {void}
 */
function positionProfileMenu(button) {
    const rect = button.getBoundingClientRect();
    const menu = profileMenuElement;
    const maxLeft = window.innerWidth - menu.offsetWidth - 8;
    const maxTop = window.innerHeight - menu.offsetHeight - 8;
    menu.style.left = `${Math.max(8, Math.min(rect.right - menu.offsetWidth, maxLeft))}px`;
    menu.style.top = `${Math.max(8, Math.min(rect.bottom + 8, maxTop))}px`;
}

/**
 * Checks whether an element belongs to the profile menu or one of its buttons.
 * @param {EventTarget} target - The element to check.
 * @returns {boolean} True if the element is part of the profile menu area.
 */
function isInsideProfileMenu(target) {
    const isInMenu = profileMenuElement.contains(target);
    return isInMenu || profileMenuButtons.some((button) => button.contains(target));
}

/**
 * Closes the profile menu when the user clicks or focuses something outside of it.
 * @param {Event} event - The click or focusin event.
 * @returns {void}
 */
function handleProfileOutsideEvent(event) {
    if (!isInsideProfileMenu(event.target)) closeProfileMenu();
}

/**
 * Closes the profile menu when Escape is pressed.
 * @param {KeyboardEvent} event - The keydown event.
 * @returns {void}
 */
function handleProfileMenuKeydown(event) {
    if (profileMenuElement.hidden || event.key !== "Escape") return;
    event.preventDefault();
    closeProfileMenu(true);
}

/**
 * Registers all events that close the profile menu.
 * @returns {void}
 */
function bindProfileMenuCloseEvents() {
    document.addEventListener("click", handleProfileOutsideEvent);
    document.addEventListener("focusin", handleProfileOutsideEvent);
    document.addEventListener("keydown", handleProfileMenuKeydown);
    window.addEventListener("resize", () => closeProfileMenu());
    document.addEventListener("scroll", () => closeProfileMenu(), true);
}

/**
 * Removes the session data and returns to the login page.
 * @returns {void}
 */
function logoutJoinSession() {
    ["join-session-mode", "join-demo-name", "join-user-email", "join-profile-color"]
        .forEach((key) => window.localStorage.removeItem(key));
    ["session-initialized", "session-contacts", "session-tasks"]
        .forEach((key) => window.sessionStorage.removeItem(key));
    window.location.replace("../index.html");
}

function createRandomProfileColor() {
    const profileColors = ["#2563EB", "#7C3AED", "#0F766E", "#BE123C", "#4338CA", "#047857", "#A16207", "#6D28D9"];
    return profileColors[Math.floor(Math.random() * profileColors.length)];
}

/**
 * Shows guest or demo initials in the existing profile circles.
 * @returns {void}
 */
function updateSessionHeader() {
    const mode = window.localStorage.getItem("join-session-mode");
    const name = window.localStorage.getItem("join-demo-name");
    if (mode !== "guest" && (mode !== "demo" || !name)) return;
    const initials = mode === "guest" ? "G" : getDemoInitials(name);
    const label = mode === "guest" ? "Guest profile" : `${name} (profile)`;
    // Keep one profile color for the whole session.
    let color = window.localStorage.getItem("join-profile-color");
    if (!color) {
        color = createRandomProfileColor();
        window.localStorage.setItem("join-profile-color", color);
    }
    document.querySelectorAll(profileButtonSelector)
        .forEach((button) => showProfileInitials(button, initials, label, color));
}

/**
 * Determines up to two initials from the demo display name.
 * @param {string} name - The entered display name.
 * @returns {string} The initials for the profile circle.
 */
function getDemoInitials(name) {
    const parts = name.trim().split(/\s+/);
    const selected = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
    return selected.map((part) => Array.from(part)[0]).join("").toUpperCase();
}

/**
 * Creates the SVG text element that shows the initials inside the profile circle.
 * @param {string} initials - The visible initials.
 * @returns {SVGTextElement} The text element.
 */
function createInitialsElement(initials) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const attributes = {x: "28", y: "28", "text-anchor": "middle", "dominant-baseline": "central", fill: "#FFFFFF", "font-size": "20", "font-weight": "700", "font-family": "Inter, sans-serif", class: "guest-profile-initial"};
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    element.textContent = initials;
    return element;
}

/**
 * Adds the initials to the profile circle of a button.
 * @param {HTMLButtonElement} button - The profile button.
 * @param {string} initials - The visible initials.
 * @param {string} label - The accessible profile name.
 * @param {string} color - The session profile color.
 * @returns {void}
 */
function showProfileInitials(button, initials, label, color) {
    const svg = button.querySelector("svg");
    if (!svg || svg.querySelector(".guest-profile-initial")) return;
    const circle = svg.querySelector("circle");
    if (circle) {
        circle.setAttribute("fill", color);
        circle.setAttribute("stroke", "#000000");
        circle.setAttribute("stroke-width", "3");
    }
    svg.appendChild(createInitialsElement(initials));
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
}

/**
 * Marks the navigation button of the current page as active.
 * @returns {void}
 */
function initNavbarButtonsBackground() {
    const links = document.querySelectorAll(".nav-btn a");
    const currentPage = window.location.pathname.split("/").pop();
    links.forEach((link) => {
        const linkPage = link.getAttribute("href").split("/").pop();
        if (currentPage === linkPage) link.closest(".nav-btn").classList.add("is-active");
    });
}

/**
 * Inserts the mobile navigation footer on the privacy and legal notice pages.
 * @returns {Promise<void>}
 */
async function renderMobilePolicyNavFooter() {
    const container = document.getElementById("nav-footer-mobile");
    const currentPage = window.location.pathname.split("/").pop();
    if (!container || !["privacy-notice.html", "legal-notice.html"].includes(currentPage)) return;
    const response = await fetch("../templates/mobileNavFooterPolicy.txt");
    container.innerHTML = await response.text();
}

/**
 * Loads contacts and tasks from the database into the session storage once per session.
 * @returns {Promise<void>}
 */
async function initSessionData() {
    if (sessionStorage.getItem("session-initialized")) return;
    const { userArray, taskArray } = await fetchTemplateData();
    if (!userArray) return;
    sessionStorage.setItem("session-contacts", JSON.stringify(Object.values(userArray || {})));
    sessionStorage.setItem("session-tasks", JSON.stringify(Object.values(taskArray || {})));
    sessionStorage.setItem("session-initialized", "true");
}

/**
 * Fetches contacts and tasks from the Firebase database.
 * @returns {Promise<{userArray: Object, taskArray: Object}>} The raw contacts and tasks.
 */
async function fetchTemplateData() {
    const response = await fetch(BASE_URL + ".json");
    const data = await response.json();
    return { userArray: data.contacts, taskArray: data.tasks };
}

/**
 * Reads a list from the session storage.
 * @param {string} key - The session storage key.
 * @returns {Object[]} The stored list or an empty array.
 */
function getSessionData(key) {
    return JSON.parse(sessionStorage.getItem(key) || "[]");
}

/**
 * Writes a list to the session storage.
 * @param {string} key - The session storage key.
 * @param {Object[]} items - The list to store.
 * @returns {void}
 */
function saveSessionData(key, items) {
    sessionStorage.setItem(key, JSON.stringify(items));
}

/**
 * Sorts the contacts alphabetically by first name (sorts the given array in place).
 * @param {Object[]} userArray - The contacts.
 * @returns {Object[]} The sorted contacts.
 */
function createAlphabeticalList(userArray) {
    return userArray.sort((a, b) => a.firstName.localeCompare(b.firstName));
}

/**
 * Sorts the tasks by their state (sorts the given array in place).
 * @param {Object[]} taskArray - The tasks.
 * @returns {Object[]} The sorted tasks.
 */
function sortTasks(taskArray) {
    return taskArray.sort((a, b) => a.state.localeCompare(b.state));
}

/**
 * Sends data to the Firebase database.
 * @param {string} [path=""] - Path inside the database.
 * @param {Object} [data={}] - The data to send.
 * @returns {Promise<Object>} The response of the database.
 */
async function postData(path = "", data = {}) {
    const response = await fetch(BASE_URL + path + ".json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return response.json();
}

/**
 * Redirects to the login page if the current page needs a session and none is active.
 * @returns {void}
 */
function redirectWithoutSession() {
    if (isPublicJoinPage() || hasJoinSession()) return;
    window.location.replace("../index.html");
}

redirectWithoutSession();
window.addEventListener("pageshow", redirectWithoutSession);
window.addEventListener("storage", redirectWithoutSession);
