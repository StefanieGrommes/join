// Signup-Seite: Intro-Overlay wird nach kurzer Zeit ausgeblendet.
function initSignupPage() {
  const intro = document.querySelector(".app-intro");
  const page = document.querySelector(".signup-page");

  if (!intro || !page) return;

  setTimeout(() => {
    intro.classList.add("hidden");
    page.classList.add("ready");
  }, 1200);
}

window.addEventListener("DOMContentLoaded", initSignupPage);
