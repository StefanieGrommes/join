let profileMenuElement = null;
let profileMenuButtons = [];
let activeProfileButton = null;

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
