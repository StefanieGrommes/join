/**
 * Initialisiert die Signup-Seite ohne Intro-Animation.
 *
 * @returns {void}
 */
function initSignupPage() {
  const page = document.querySelector(".signup-page");

  if (page) {
    page.classList.add("ready");
  }

  setupPrivacyCheckboxGate();
}

/**
 * Aktiviert den Sign-up-Button nur, wenn die Datenschutzerklaerung akzeptiert wurde.
 *
 * @returns {void}
 */
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
