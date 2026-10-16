const loginIntroSeenKey = "join-login-intro-seen";
const skipLoginIntro = window.sessionStorage.getItem(loginIntroSeenKey) === "true";

if (skipLoginIntro) {

  document.documentElement.classList.add("login-intro-seen");
}

function finishLoginIntro() {
  document.querySelector(".app-intro").classList.add("hidden");
  document.querySelector(".login-page").classList.add("ready");
}

function redirectToSignupPage() {
  window.location.href = "./pages/signup.html";
}

function loginAsGuest() {

  window.sessionStorage.removeItem("join-demo-name");
  window.sessionStorage.setItem("join-session-mode", "guest");
  document.getElementById("guest-login-button").disabled = true;
  window.location.href = "./pages/summary.html";
}

function loginAsDemoUser(event) {

  event.preventDefault();
  const input = document.getElementById("demo-login-name");
  const name = input.value.trim();
  input.setAttribute("aria-invalid", String(!name));
  if (!name) {
    document.getElementById("demo-login-feedback").textContent = "Please enter your name. This is a demo without password verification.";
    input.focus();
    return;
  }

  window.sessionStorage.setItem("join-demo-name", name);
  window.sessionStorage.setItem("join-session-mode", "demo");
  window.location.href = "./pages/summary.html";
}

function initLoginPage() {
  const intro = document.querySelector(".app-intro");
  const page = document.querySelector(".login-page");
  const signupButtons = document.querySelectorAll(".top-link");

  signupButtons.forEach((button) => {
    button.addEventListener("click", redirectToSignupPage);
  });
  document.getElementById("guest-login-button").addEventListener("click", loginAsGuest);
  document.getElementById("demo-login-form").addEventListener("submit", loginAsDemoUser);

  if (!intro || !page) return;

  window.sessionStorage.setItem(loginIntroSeenKey, "true");
  if (skipLoginIntro) {
    finishLoginIntro();
  } else {
    window.setTimeout(finishLoginIntro, 1200);
  }

  window.addEventListener("pagehide", finishLoginIntro);
}

window.addEventListener("DOMContentLoaded", initLoginPage);
