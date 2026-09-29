// Signup-Seite: Intro-Overlay wird nach kurzer Zeit ausgeblendet.
function initSignupPage() {
  const intro = document.querySelector(".app-intro");
  const page = document.querySelector(".signup-page");

  if (!intro || !page) return;

  setTimeout(() => {
    intro.classList.add("hidden");
    page.classList.add("ready");
  }, 1200);

  setupPrivacyCheckboxGate();
}

// Aktiviert den Sign-up-Button nur, wenn die Datenschutzerklaerung akzeptiert wurde.
function setupPrivacyCheckboxGate() {
  const policyCheckbox = document.querySelector("#privacy-policy-checkbox");
  const signupButton = document.querySelector("#signup-submit-button");

  if (!policyCheckbox || !signupButton) return;

  const updateButtonState = () => {
    signupButton.disabled = !policyCheckbox.checked;
  };

  updateButtonState();
  policyCheckbox.addEventListener("change", updateButtonState);
}

window.addEventListener("DOMContentLoaded", initSignupPage);
