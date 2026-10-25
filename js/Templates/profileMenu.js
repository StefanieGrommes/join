let profileMenuElement = null;
let profileMenuButtons = [];
let activeProfileButton = null;

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

function setupProfileButton(button) {
  button.type = "button";
  if (!button.hasAttribute("aria-label")) button.setAttribute("aria-label", "Profile");
  button.setAttribute("aria-controls", profileMenuElement.id);
  button.setAttribute("aria-expanded", "false");
  button.addEventListener("click", () => toggleProfileMenu(button));
}

function closeProfileMenu(restoreFocus = false) {
  profileMenuElement.hidden = true;
  if (activeProfileButton) {
    activeProfileButton.setAttribute("aria-expanded", "false");
    if (restoreFocus) activeProfileButton.focus();
  }
  activeProfileButton = null;
}

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

function positionProfileMenu(button) {
  const rect = button.getBoundingClientRect();
  const menu = profileMenuElement;
  const maxLeft = window.innerWidth - menu.offsetWidth - 8;
  const maxTop = window.innerHeight - menu.offsetHeight - 8;
  menu.style.left = `${Math.max(8, Math.min(rect.right - menu.offsetWidth, maxLeft))}px`;
  menu.style.top = `${Math.max(8, Math.min(rect.bottom + 8, maxTop))}px`;
}

function isInsideProfileMenu(target) {
  const isInMenu = profileMenuElement.contains(target);
  return isInMenu || profileMenuButtons.some((button) => button.contains(target));
}

function handleProfileOutsideEvent(event) {
  if (!isInsideProfileMenu(event.target)) closeProfileMenu();
}

function handleProfileMenuKeydown(event) {
  if (profileMenuElement.hidden || event.key !== "Escape") return;
  event.preventDefault();
  closeProfileMenu(true);
}

function bindProfileMenuCloseEvents() {
  document.addEventListener("click", handleProfileOutsideEvent);
  document.addEventListener("focusin", handleProfileOutsideEvent);
  document.addEventListener("keydown", handleProfileMenuKeydown);
  window.addEventListener("resize", () => closeProfileMenu());
  document.addEventListener("scroll", () => closeProfileMenu(), true);
}
