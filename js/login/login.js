/**
 * Ends the intro: hides the logo animation and shows the login page.
 * @returns {void}
 */
function finishLoginIntro() {
  document.querySelector(".app-intro").classList.add("hidden");
  document.querySelector(".login-page").classList.add("ready");
}

/**
 * Redirects the user to the signup page (pages/signup.html).
 * @returns {void}
 */
function redirectToSignupPage() {
  window.location.href = "./pages/signup.html";
}

/**
 * Logs the user in as guest, resets old session data and opens the summary page.
 * @returns {void}
 */
function loginAsGuest() {
  window.sessionStorage.removeItem("join-demo-name");
  window.sessionStorage.removeItem("join-profile-color");
  window.sessionStorage.setItem("join-session-mode", "guest");
  window.sessionStorage.removeItem("session-initialized");
  window.sessionStorage.removeItem("session-contacts");
  window.sessionStorage.removeItem("session-tasks");
  document.getElementById("guest-login-button").disabled = true;
  window.location.href = "./pages/summary.html";
}

/**
 * Shows the error message for an empty demo login name and focuses the field.
 * @param {HTMLInputElement} input - The demo login name field.
 * @returns {void}
 */
function showDemoLoginError(input) {
  const feedback = document.getElementById("demo-login-feedback");
  feedback.textContent = "Please enter your name. This is a demo without password verification.";
  input.focus();
}

/**
 * Demo login: stores the entered name in the session and opens the summary page.
 * There is no real password check.
 * @param {SubmitEvent} event - Submit event of the demo login form.
 * @returns {void}
 */
function loginAsDemoUser(event) {
  event.preventDefault();
  const input = document.getElementById("demo-login-name");
  const name = input.value.trim();
  input.setAttribute("aria-invalid", String(!name));
  if (!name) {
    showDemoLoginError(input);
    return;
  }
  window.sessionStorage.setItem("join-demo-name", name);
  window.sessionStorage.setItem("join-session-mode", "demo");
  window.sessionStorage.setItem("join-profile-color", createRandomProfileColor());
  window.location.href = "./pages/summary.html";
}

/**
 * Attaches the click and submit listeners of the login page.
 * @returns {void}
 */
function bindLoginEvents() {
  document.querySelectorAll(".top-link").forEach((button) => {
    button.addEventListener("click", redirectToSignupPage);
  });
  document.getElementById("guest-login-button").addEventListener("click", loginAsGuest);
  document.getElementById("demo-login-form").addEventListener("submit", loginAsDemoUser);
}

/**
 * Ends the intro after 1.2 seconds and also when the page is left,
 * so the animation does not hang when navigating back.
 * @returns {void}
 */
function startLoginIntro() {
  const intro = document.querySelector(".app-intro");
  const page = document.querySelector(".login-page");
  if (!intro || !page) return;
  window.setTimeout(finishLoginIntro, 1200);
  window.addEventListener("pagehide", finishLoginIntro);
}

/**
 * Initializes the login page.
 * @returns {void}
 */
function initLoginPage() {
  bindLoginEvents();
  startLoginIntro();
}

window.addEventListener("DOMContentLoaded", initLoginPage);
