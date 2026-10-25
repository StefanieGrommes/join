function finishLoginIntro() {
  document.querySelector(".app-intro").classList.add("hidden");
  document.querySelector(".login-page").classList.add("ready");
}

function redirectToSignupPage() {
  window.location.href = "./pages/signup.html";
}

function loginAsGuest() {
  window.localStorage.removeItem("join-demo-name");
  window.localStorage.removeItem("join-user-email");
  window.localStorage.removeItem("join-profile-color");
  window.localStorage.setItem("join-session-mode", "guest");
  window.sessionStorage.removeItem("session-initialized");
  window.sessionStorage.removeItem("session-contacts");
  window.sessionStorage.removeItem("session-tasks");
  document.getElementById("guest-login-button").disabled = true;
  window.location.href = "./pages/summary.html";
}

function showLoginError(message) {
  document.getElementById("login-feedback").textContent = message;
  ["login-email", "login-password"].forEach((id) => {
    document.getElementById(id).setAttribute("aria-invalid", "true");
  });
}

function clearLoginError() {
  document.getElementById("login-feedback").textContent = "";
  ["login-email", "login-password"].forEach((id) => {
    document.getElementById(id).setAttribute("aria-invalid", "false");
  });
}

function startUserSession(user) {
  saveJoinUserSession(user);
  window.location.href = "./pages/summary.html";
}

async function checkLoginData(email, password) {
  try {
    const user = await findJoinLoginUser(email, password);
    return { user, message: user ? "" : "Check your email and password. Please try again." };
  } catch (error) {
    return { user: null, message: "Login failed. Please check your connection and try again." };
  }
}

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

function bindLoginEvents() {
  document.querySelectorAll(".top-link").forEach((button) => {
    button.addEventListener("click", redirectToSignupPage);
  });
  document.getElementById("guest-login-button").addEventListener("click", loginAsGuest);
  const form = document.getElementById("login-form");
  form.addEventListener("submit", loginWithAccount);
  form.addEventListener("input", clearLoginError);
}

function startLoginIntro() {
  const intro = document.querySelector(".app-intro");
  const page = document.querySelector(".login-page");
  if (!intro || !page) return;
  window.setTimeout(finishLoginIntro, 1200);
  window.addEventListener("pagehide", finishLoginIntro);
}

function initLoginPage() {
  bindLoginEvents();
  startLoginIntro();
}

window.addEventListener("DOMContentLoaded", initLoginPage);
