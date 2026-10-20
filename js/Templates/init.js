
const BASE_URL = "https://join--testuser-default-rtdb.europe-west1.firebasedatabase.app/";
let activeProfileButton = null;

/**
 * Initializes shared page templates, session data, and contact rendering.
 * @returns {Promise<void>} A promise resolved after initialization.
 */
async function init() {
  await fetchFooterHeader();
  renderNavFooterMobile2();
  initNavbarButtonsBackground();
  await initSessionData();
  renderContactList(getSessionData("session-contacts"));
}

/**
 * Fetches and inserts the shared header and footer templates.
 * @returns {Promise<void>} A promise resolved after insertion.
 */
async function fetchFooterHeader() {
  await insertTemplate("../templates/header.txt", "afterbegin");
  updateSessionHeader();
  initProfileMenu();
  await insertTemplate("../templates/footer.txt", "beforeend");
}

/**
 * Fetches a template and inserts it into the document body.
 * @param {string} path - The template URL.
 * @param {InsertPosition} position - The insertion position.
 * @returns {Promise<void>} A promise resolved after insertion.
 */
async function insertTemplate(path, position) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load template: ${path}`);
  document.body.insertAdjacentHTML(position, await response.text());
}

/**
 * Initializes the shared desktop and mobile profile menu.
 * @returns {void}
 */
function initProfileMenu() {
  const menu = document.getElementById("profile-menu");
  if (!menu || menu.dataset.initialized) return;
  menu.dataset.initialized = "true";
  menu.hidden = true;
  document.querySelectorAll(".profile-initials-btn, .board-mobile-profile-button")
    .forEach((button) => configureProfileButton(button, menu));
  bindProfileMenuDismissal(menu);
}

/**
 * Configures a profile button and its click behavior.
 * @param {HTMLButtonElement} button - The profile button.
 * @param {HTMLElement} menu - The shared profile menu.
 * @returns {void}
 */
function configureProfileButton(button, menu) {
  button.type = "button";
  button.setAttribute("aria-label", button.getAttribute("aria-label") || "Profile");
  button.setAttribute("aria-controls", menu.id);
  button.setAttribute("aria-expanded", "false");
  button.addEventListener("click", () => toggleProfileMenu(button, menu));
}

/**
 * Opens or closes the profile menu for the selected button.
 * @param {HTMLButtonElement} button - The activated profile button.
 * @param {HTMLElement} menu - The shared profile menu.
 * @returns {void}
 */
function toggleProfileMenu(button, menu) {
  const wasActive = activeProfileButton === button && !menu.hidden;
  closeProfileMenu(menu);
  if (wasActive) return;
  activeProfileButton = button;
  menu.hidden = false;
  button.setAttribute("aria-expanded", "true");
  positionProfileMenu(button, menu);
  menu.querySelector("a")?.focus();
}

/**
 * Positions the profile menu within the visible viewport.
 * @param {HTMLButtonElement} button - The active profile button.
 * @param {HTMLElement} menu - The profile menu.
 * @returns {void}
 */
function positionProfileMenu(button, menu) {
  const rect = button.getBoundingClientRect();
  const maxLeft = window.innerWidth - menu.offsetWidth - 8;
  const maxTop = window.innerHeight - menu.offsetHeight - 8;
  menu.style.left = `${Math.max(8, Math.min(rect.right - menu.offsetWidth, maxLeft))}px`;
  menu.style.top = `${Math.max(8, Math.min(rect.bottom + 8, maxTop))}px`;
}

/**
 * Closes the profile menu and optionally restores focus.
 * @param {HTMLElement} menu - The profile menu.
 * @param {boolean} restoreFocus - Whether to restore button focus.
 * @returns {void}
 */
function closeProfileMenu(menu, restoreFocus = false) {
  menu.hidden = true;
  if (activeProfileButton) {
    activeProfileButton.setAttribute("aria-expanded", "false");
    if (restoreFocus) activeProfileButton.focus();
  }
  activeProfileButton = null;
}

/**
 * Registers outside-click, focus, keyboard, and viewport listeners.
 * @param {HTMLElement} menu - The profile menu.
 * @returns {void}
 */
function bindProfileMenuDismissal(menu) {
  document.addEventListener("click", (event) => {
    if (!isProfileMenuTarget(event.target, menu)) closeProfileMenu(menu);
  });
  document.addEventListener("focusin", (event) => {
    if (!isProfileMenuTarget(event.target, menu)) closeProfileMenu(menu);
  });
  document.addEventListener("keydown", (event) => handleProfileMenuKeydown(event, menu));
  window.addEventListener("resize", () => closeProfileMenu(menu));
  document.addEventListener("scroll", () => closeProfileMenu(menu), true);
}

/**
 * Checks whether an element belongs to the menu or a profile button.
 * @param {Element} target - The event target.
 * @param {HTMLElement} menu - The profile menu.
 * @returns {boolean} Whether the target belongs to the menu controls.
 */
function isProfileMenuTarget(target, menu) {
  return menu.contains(target) ||
    Array.from(document.querySelectorAll(".profile-initials-btn, .board-mobile-profile-button"))
      .some((button) => button.contains(target));
}

/**
 * Handles Escape key presses while the profile menu is open.
 * @param {KeyboardEvent} event - The keyboard event.
 * @param {HTMLElement} menu - The profile menu.
 * @returns {void}
 */
function handleProfileMenuKeydown(event, menu) {
  if (menu.hidden || event.key !== "Escape") return;
  event.preventDefault();
  closeProfileMenu(menu, true);
}

/**
 * Updates profile buttons with guest or demo user initials.
 * @returns {void}
 */
function updateSessionHeader() {
  const mode = sessionStorage.getItem("join-session-mode");
  const name = sessionStorage.getItem("join-demo-name");
  if (mode !== "guest" && (mode !== "demo" || !name)) return;
  const initials = mode === "guest" ? "G" : getDemoInitials(name);
  const label = mode === "guest" ? "Guest profile" : `${name} (demo profile)`;
  document.querySelectorAll(".profile-initials-btn, .board-mobile-profile-button")
    .forEach((button) => showProfileInitials(button, initials, label));
}

/**
 * Extracts up to two initials from a display name.
 * @param {string} name - The display name.
 * @returns {string} The uppercase initials.
 */
function getDemoInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const selected = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return selected.map((part) => Array.from(part)[0] || "").join("").toUpperCase();
}

/**
 * Adds accessible initials to an SVG profile button.
 * @param {HTMLButtonElement} button - The profile button.
 * @param {string} initials - The initials to display.
 * @param {string} label - The accessible profile label.
 * @returns {void}
 */
function showProfileInitials(button, initials, label) {
  const svg = button.querySelector("svg");
  if (!svg || svg.querySelector(".guest-profile-initial")) return;
  const initial = document.createElementNS("http://www.w3.org/2000/svg", "text");
  Object.entries(getProfileInitialAttributes()).forEach(([key, value]) => initial.setAttribute(key, value));
  initial.textContent = initials;
  svg.appendChild(initial);
  button.setAttribute("aria-label", label);
  button.setAttribute("title", label);
}

/**
 * Returns SVG attributes for the profile initials.
 * @returns {Object<string, string>} The SVG text attributes.
 */
function getProfileInitialAttributes() {
  return {
    x: "28", y: "28", "text-anchor": "middle", "dominant-baseline": "central",
    fill: "#2A3647", "font-size": "20", "font-weight": "700",
    "font-family": "Inter, sans-serif", class: "guest-profile-initial"
  };
}

/**
 * Highlights the navigation link matching the current page.
 * @returns {void}
 */
function initNavbarButtonsBackground() {
  const currentPage = window.location.pathname.split("/").pop();
  document.querySelectorAll(".nav-btn a").forEach((link) => {
    if (link.getAttribute("href")?.split("/").pop() === currentPage) {
      link.closest(".nav-btn")?.classList.add("is-active");
    }
  });
}

/**
 * Renders mobile policy navigation on privacy and legal pages.
 * @returns {void}
 */
function renderNavFooterMobile2() {
  const container = document.getElementById("nav-footer-mobile");
  const page = window.location.pathname.split("/").pop();
  if (!container || !["privacy-notice.html", "legal-notice.html"].includes(page)) return;
  container.innerHTML = displayNavFooterMobilePolicy();
}

/**
 * Returns the mobile navigation template for policy pages.
 * @returns {string} The mobile navigation HTML.
 */
function displayNavFooterMobilePolicy() {
  return `<div class="mobile-nav-btns"><div class="nav-btn"><a href="../index.html" class="nav-element mobile-design"><svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M16 24H23V6H16M14 15H5M5 15L12 8M5 15L12 22" stroke="#CDCDCD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Log In</span></a></div><div class="legal-and-policy-mobile" id="mobile-nav-btns-legal-policy"><div class="nav-btn"><a href="../pages/privacy-notice.html" class="nav-element mobile-design"><span>Privacy Policy</span></a></div><div class="nav-btn"><a href="../pages/legal-notice.html" class="nav-element mobile-design"><span>Legal Notice</span></a></div></div></div>`;
}

/**
 * Initializes contact and task data in session storage.
 * @returns {Promise<void>} A promise resolved after initialization.
 */
async function initSessionData() {
  if (sessionStorage.getItem("session-initialized")) return;
  const { userArray, taskArray } = await fetchTemplateData();
  if (!userArray) return;
  saveSessionData("session-contacts", Object.values(userArray));
  saveSessionData("session-tasks", Object.values(taskArray || {}));
  sessionStorage.setItem("session-initialized", "true");
}

/**
 * Fetches contact and task data from the configured database.
 * @returns {Promise<{userArray: Object, taskArray: Object}>} The fetched data.
 */
async function fetchTemplateData() {
  const response = await fetch(`${BASE_URL}.json`);
  if (!response.ok) throw new Error("Failed to fetch application data.");
  const data = await response.json();
  return { userArray: data.contacts, taskArray: data.tasks };
}

/**
 * Reads and parses a value from session storage.
 * @param {string} key - The storage key.
 * @returns {Array|Object} The stored value or an empty array.
 */
function getSessionData(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

/**
 * Serializes and saves data in session storage.
 * @param {string} key - The storage key.
 * @param {any} items - The data to store.
 * @returns {void}
 */
function saveSessionData(key, items) {
  sessionStorage.setItem(key, JSON.stringify(items));
}

/**
 * Sends data to the configured database endpoint.
 * @param {string} path - The database path.
 * @param {Object} data - The data to send.
 * @returns {Promise<Object>} The response data.
 */
async function postData(path = "", data = {}) {
  const response = await fetch(`${BASE_URL}${path}.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error("Failed to save application data.");
  return response.json();
}
