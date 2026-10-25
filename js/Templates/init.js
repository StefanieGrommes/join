const BASE_URL = "https://join--testuser-default-rtdb.europe-west1.firebasedatabase.app/";
const profileButtonSelector = ".profile-initials-btn, .board-mobile-profile-button";

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

function isPublicJoinPage() {
  const page = window.location.pathname.split("/").pop();
  return ["", "index.html", "signup.html", "privacy-notice.html", "legal-notice.html"].includes(
    page,
  );
}

function hasJoinSession() {
    const mode = window.localStorage.getItem("join-session-mode");
    return mode === "guest" || (mode === "demo" && Boolean(window.localStorage.getItem("join-demo-name")));
}

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

function hideProfileButtonsWithoutSession() {
  if (hasJoinSession()) return;
  document.querySelectorAll(".profile-initials-btn").forEach((button) => {
    button.style.display = "none";
  });
}

async function insertTemplate(path, position) {
  const response = await fetch(path);
  const html = await response.text();
  document.body.insertAdjacentHTML(position, html);
}

async function fetchFooterHeader() {
  await insertTemplate("../templates/header.txt", "afterbegin");
  hideProfileButtonsWithoutSession();
  updateSessionHeader();
  initProfileMenu();
  await insertTemplate("../templates/footer.txt", "beforeend");
}

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

function getDemoInitials(name) {
  const parts = name.trim().split(/\s+/);
  const selected = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return selected
    .map((part) => Array.from(part)[0])
    .join("")
    .toUpperCase();
}

function createInitialsElement(initials) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", "text");
  const attributes = {
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
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = initials;
  return element;
}

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

function initNavbarButtonsBackground() {
  const links = document.querySelectorAll(".nav-btn a");
  const currentPage = window.location.pathname.split("/").pop();
  links.forEach((link) => {
    const linkPage = link.getAttribute("href").split("/").pop();
    if (currentPage === linkPage) link.closest(".nav-btn").classList.add("is-active");
  });
}

async function renderMobilePolicyNavFooter() {
  const container = document.getElementById("nav-footer-mobile");
  const currentPage = window.location.pathname.split("/").pop();
  if (!container || !["privacy-notice.html", "legal-notice.html"].includes(currentPage))
    return;
  const response = await fetch("../templates/mobileNavFooterPolicy.txt");
  container.innerHTML = await response.text();
}

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

async function initSessionData() {
  if (sessionStorage.getItem("session-initialized")) return;
  const { userArray, taskArray } = await fetchTemplateData();
  if (!userArray) return;
  sessionStorage.setItem("session-contacts", JSON.stringify(Object.values(userArray || {}).filter(Boolean)));
  sessionStorage.setItem("session-tasks", JSON.stringify(withId(taskArray)));
  sessionStorage.setItem("session-initialized", "true");
}

async function fetchTemplateData() {
  const response = await fetch(BASE_URL + ".json");
  const data = await response.json();
  return { userArray: data.contacts, taskArray: data.tasks };
}

function getSessionData(key) {
  return JSON.parse(sessionStorage.getItem(key) || "[]");
}

function saveSessionData(key, items) {
  sessionStorage.setItem(key, JSON.stringify(items));
}

function createAlphabeticalList(userArray) {
  return userArray.sort((a, b) => a.firstName.localeCompare(b.firstName));
}

function sortTasks(taskArray) {
  return taskArray.sort((a, b) => a.state.localeCompare(b.state));
}

async function postData(path = "", data = {}) {
  const response = await fetch(BASE_URL + path + ".json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

async function putData(path = "", data = {}) {
  const response = await fetch(BASE_URL + path + ".json", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

async function deleteData(path = "") {
  const response = await fetch(BASE_URL + path + ".json", {
    method: "Delete",
  });
  return response.json();
}

function redirectWithoutSession() {
  if (isPublicJoinPage() || hasJoinSession()) return;
  window.location.replace("../index.html");
}

redirectWithoutSession();
window.addEventListener("pageshow", redirectWithoutSession);
window.addEventListener("storage", redirectWithoutSession);
