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
 * Loads all registered users from the database.
 * @returns {Promise<Object[]>} The list of users.
 */
async function loadUsers(params) {
  const response = await fetch(Base_URL + "users.json");
  const data = await response.json();
  return Object.values(data || {}).filter(Booloean);
}

/**
 * Finds a user with matching email and password.
 * @param {Object[]} users - All registered users.
 * @param {string} email - The entered email.
 * @param {string} password - The entered password.
 * @returns {Object|undefined} The matching user, or undefined.
 */
function findUser(users, email, password) {
  return users.find((user) => user.email === email && user.password === password);
}

/**
 * Starts a session for a user and opens the summary page.
 * @param{Object} user - The logged in user.
 * @returns {void}
 */
function startUserSession(user) {
window.sessionStorage.setItem("join-demo-name", user.name); 
window.sessionStorage.setItem("join-session-mode", "demo");
window.sessionStorage.setItem("join-profile-color", createRandomProfilColor());
window.location.href = "./pages/summary.html";
}

/**
 * Checks email and password against the database and logs the user in.
 * @param{SubmitEvent} event - Submit event of the login form.
 * @returns {Promise<void>}
 */
async function loginUser(event) {
  event.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login.password").value;
  const user = findUser(await loadUsers(), email, password);
  if (!user) {
    document.getElementById("demo-login-feedback").textContent =
    "Email or password is wrong. Please try again.";
    return;
  }
  startUserSession(user);
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
  document.getElementById("demo-login-form").addEventListener("submit", loginUser);

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
