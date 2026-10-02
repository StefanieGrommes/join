/**
 * Leitet von der Login-Seite auf die Signup-Seite weiter.
 *
 * @returns {void}
 */
function redirectToSignupPage() {
  window.location.href = "./pages/signup.html";
}

/**
 * Initialisiert die Login-Seite, blendet das Intro aus und verdrahtet die Signup-Buttons.
 *
 * @returns {void}
 */
function initLoginPage() {
  const intro = document.querySelector(".app-intro");
  const page = document.querySelector(".login-page");
  const signupButtons = document.querySelectorAll(".top-link");

  signupButtons.forEach((button) => {
    button.addEventListener("click", redirectToSignupPage);
  });

  if (!intro || !page) return;

  setTimeout(() => {
    intro.classList.add("hidden");
    page.classList.add("ready");
  }, 1200);
}

window.addEventListener("DOMContentLoaded", initLoginPage);
