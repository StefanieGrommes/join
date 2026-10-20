/**
 * Hides the intro animation and reveals the login page.
 * @returns {void}
 */
function finishLoginIntro() {
  document.querySelector(".app-intro")?.classList.add("hidden");
  document.querySelector(".login-page")?.classList.add("ready");
}

/**
 * Redirects the user to the signup page.
 * @returns {void}
 */
function redirectToSignupPage() {
  window.location.href = "./pages/signup.html";
}

/**
 * Logs in as a guest and redirects to the summary page.
 * @returns {void}
 */
function loginAsGuest() {
  window.sessionStorage.removeItem("join-demo-name");
  window.sessionStorage.setItem("join-session-mode", "guest");
  const guestButton = document.getElementById("guest-login-button");
  if (guestButton) guestButton.disabled = true;
  window.location.href = "./pages/summary.html";
}

/**
 * Logs in a demo user after validating the entered name.
 * @param {SubmitEvent} event - The login form submission event.
 * @returns {void}
 */
function loginAsDemoUser(event) {
  event.preventDefault();
  const input = document.getElementById("demo-login-name");
  const name = input.value.trim();
  input.setAttribute("aria-invalid", String(!name));
  if (!name) return showDemoLoginError(input);
  window.sessionStorage.setItem("join-demo-name", name);
  window.sessionStorage.setItem("join-session-mode", "demo");
  window.location.href = "./pages/summary.html";
}

/**
 * Displays an error when the demo name is missing.
 * @param {HTMLInputElement} input - The demo name input.
 * @returns {void}
 */
function showDemoLoginError(input) {
  const feedback = document.getElementById("demo-login-feedback");
  if (feedback) {
    feedback.textContent = "Please enter your name. This is a demo without password verification.";
  }
  input.focus();
}

/**
 * Registers event listeners for the login page.
 * @returns {void}
 */
function initLoginPage() {
  const intro = document.querySelector(".app-intro");
  const page = document.querySelector(".login-page");
  if (!intro || !page) return;
  initLoginEventListeners();
  window.setTimeout(finishLoginIntro, 1200);
  window.addEventListener("pagehide", finishLoginIntro);
}

/**
 * Registers click and submit handlers for login controls.
 * @returns {void}
 */
function initLoginEventListeners() {
  document.querySelectorAll(".top-link").forEach((button) =>
    button.addEventListener("click", redirectToSignupPage)
  );
  document.getElementById("guest-login-button")
    ?.addEventListener("click", loginAsGuest);
  document.getElementById("demo-login-form")
    ?.addEventListener("submit", loginAsDemoUser);
}

window.addEventListener("DOMContentLoaded", initLoginPage);