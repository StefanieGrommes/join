const BASE_URL = "https://join--testuser-default-rtdb.europe-west1.firebasedatabase.app/";
const profileButtonSelector = ".profile-initials-btn, .board-mobile-profile-button";

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
  if (document.getElementById("contactListWrapper")) {
    await loadContacts();
  }
}

/**
 * Checks whether the current page can be opened without a session.
 * @returns {boolean} True for login, signup and legal pages.
 */
function isPublicJoinPage() {
  const page = window.location.pathname.split("/").pop();
  return ["", "index.html", "signup.html", "privacy-notice.html", "legal-notice.html"].includes(
    page,
  );
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
 * Removes the session data and returns to the login page.
 * @returns {void}
 */
function logoutJoinSession() {
    ["join-session-mode", "join-demo-name", "join-user-email", "join-profile-color"]
        .forEach((key) => window.localStorage.removeItem(key));
    ["session-initialized", "session-contacts", "session-tasks"]
        .forEach((key) => window.localStorage.removeItem(key));
    window.location.replace("../index.html");
}

/**
 * Picks a random color for the profile circle.
 * @returns {string} A hex color code.
 */
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
  return selected
    .map((part) => Array.from(part)[0])
    .join("")
    .toUpperCase();
}

const initialsAttributes = {
  x: "28",
  y: "28",
  "text-anchor": "middle",
  "dominant-baseline": "central",
  fill: "#FFFFFF",
  "font-size": "20",
  "font-weight": "700",
  "font-family": "Inter, sans-serif",
  class: "guest-profile-initial",
};

/**
 * Creates the SVG text element that shows the initials inside the profile circle.
 * @param {string} initials - The visible initials.
 * @returns {SVGTextElement} The text element.
 */
function createInitialsElement(initials) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", "text");
  Object.entries(initialsAttributes).forEach(([name, value]) => element.setAttribute(name, value));
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
  if (!container || !["privacy-notice.html", "legal-notice.html"].includes(currentPage))
    return;
  const response = await fetch("../templates/mobileNavFooterPolicy.txt");
  container.innerHTML = await response.text();
}

/**
 * Converts the raw firebase tasks into a list and uses the firebase key as id.
 * Subtask strings are converted to {label, done} objects.
 * @param {Object|Array} obj - The raw tasks from firebase.
 * @returns {Object[]} The tasks with id.
 */
function withId(obj) {
  return Object.entries(obj || {})
    .filter(([, item]) => item)
    .map(([key, item]) => ({
      ...item,
      id: key,
      subtasks: (item.subtasks || []).map((s) =>
        typeof s === "string" ? { label: s, done: false } : s,
      ),
    }));
}

/**
 * Loads contacts and tasks into localStorage until the next login or logout.
 * @returns {Promise<void>}
 */
async function initSessionData() {
  if (window.localStorage.getItem("session-initialized")) return;
  const { userArray, taskArray } = await fetchTemplateData();
  if (!userArray) return;
  window.localStorage.setItem("session-contacts", JSON.stringify(Object.values(userArray || {}).filter(Boolean)));
  window.localStorage.setItem("session-tasks", JSON.stringify(withId(taskArray)));
  window.localStorage.setItem("session-initialized", "true");
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
 * Reads a cached list from localStorage.
 * @param {string} key - The localStorage key.
 * @returns {Object[]} The stored list or an empty array.
 */
function getSessionData(key) {
  return JSON.parse(window.localStorage.getItem(key) || "[]");
}

/**
 * Writes a cached list to localStorage.
 * @param {string} key - The localStorage key.
 * @param {Object[]} items - The list to store.
 * @returns {void}
 */
function saveSessionData(key, items) {
  window.localStorage.setItem(key, JSON.stringify(items));
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
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * Writes data to a fixed path in the Firebase database.
 * @param {string} [path=""] - Path inside the database, e.g. "contacts/5"
 * @param {Object} [data={}] - The data to send.
 * @returns {Promise<Object>} The response of the database.
 */
async function putData(path = "", data = {}) {
  const response = await fetch(BASE_URL + path + ".json", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * Delete data at a fixed path in the Firebase database.
 * @param {string} [path=""] - Path inside the database, e.g. "contacts/5"
 * @returns {Promise<Object>} The response of the database.
 */
async function deleteData(path = "") {
  const response = await fetch(BASE_URL + path + ".json", {
    method: "Delete",
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
