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
  window.localStorage.removeItem("join-demo-name");
  window.localStorage.removeItem("join-user-email");
  window.localStorage.removeItem("join-profile-color");
  window.localStorage.setItem("join-session-mode", "guest");
  window.localStorage.removeItem("session-initialized");
  window.localStorage.removeItem("session-contacts");
  window.localStorage.removeItem("session-tasks");
  document.getElementById("guest-login-button").disabled = true;
  window.location.href = "./pages/summary.html";
}

/**
 * Shows a login error message and marks the login fields as invalid.
 * @param {string} message - The error message.
 * @returns {void}
 */
function showLoginError(message) {
  document.getElementById("login-feedback").textContent = message;
  ["login-email", "login-password"].forEach((id) => {
    document.getElementById(id).setAttribute("aria-invalid", "true");
  });
}

/**
 * Resets the login error message and the invalid state of the fields.
 * @returns {void}
 */
function clearLoginError() {
  document.getElementById("login-feedback").textContent = "";
  ["login-email", "login-password"].forEach((id) => {
    document.getElementById(id).setAttribute("aria-invalid", "false");
  });
}

/**
 * Starts the session of a logged in user and opens the summary page.
 * The keys "join-demo-name" and mode "demo" are kept because header and summary read them.
 * @param {Object} user - The logged in user.
 * @returns {void}
 */
function startUserSession(user) {
  saveJoinUserSession(user);
  window.location.href = "./pages/summary.html";
}

/**
 * Looks up the user for the entered login data.
 * @param {string} email - The entered email.
 * @param {string} password - The entered password.
 * @returns {Promise<{user: Object|null, message: string}>} The user or an error message.
 */
async function checkLoginData(email, password) {
  try {
    const user = await findJoinLoginUser(email, password);
    return { user, message: user ? "" : "Check your email and password. Please try again." };
  } catch (error) {
    return { user: null, message: "Login failed. Please check your connection and try again." };
  }
}

/**
 * Login with email and password: checks the data against the stored accounts.
 * @param {SubmitEvent} event - Submit event of the login form.
 * @returns {Promise<void>}
 */
async function loginWithAccount(event) {
  event.preventDefault();
  const button = document.getElementById("login-submit-button");
  if (button.disabled) return;
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  if (!email || !password) return showLoginError("Please enter your email and password.");
  button.disabled = true;
  const { user, message } = await checkLoginData(email, password);
  button.disabled = false;
  if (user) return startUserSession(user);
  showLoginError(message);
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
  const form = document.getElementById("login-form");
  form.addEventListener("submit", loginWithAccount);
  form.addEventListener("input", clearLoginError);
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
