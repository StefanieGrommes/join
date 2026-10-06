/**
 * Prüft, ob der eingegebene Name gültig ist.
 *
 * @param {string} value - Der Name.
 * @returns {boolean} True, wenn der Name gültig ist.
 */
function isValidSignupName(value) {
  return value.trim().length >= 2;
}

/**
 * Prüft, ob die E-Mail gültig ist.
 *
 * @param {string} value - Die E-Mail.
 * @returns {boolean} True, wenn die E-Mail gültig ist.
 */
function isValidSignupEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Prüft, ob das Passwort den Anforderungen entspricht.
 *
 * @param {string} value - Das Passwort.
 * @returns {boolean} True, wenn das Passwort gültig ist.
 */
function isValidSignupPassword(value) {
  return value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);
}

/**
 * Aktiviert den Sign-up-Button nur, wenn die Datenschutzerklaerung akzeptiert wurde.
 *
 * @returns {void}
 */
function setupPrivacyCheckboxGate() {
  const policyCheckbox = document.querySelector("#privacy-policy-checkbox");
  const signupButton = document.querySelector("#signup-submit-button");
  const form = document.querySelector("#signup-form");

  if (!policyCheckbox || !signupButton || !form) return;

  const updateButtonState = () => {
    const fieldsValid = [
      form.querySelector("#signup-name"),
      form.querySelector("#signup-email"),
      form.querySelector("#signup-password"),
      form.querySelector("#signup-confirm-password")
    ].every((field) => {
      if (!field) return true;
      const value = field.value.trim();
      if (field.id === "signup-name") return isValidSignupName(value);
      if (field.id === "signup-email") return isValidSignupEmail(value);
      if (field.id === "signup-password") return isValidSignupPassword(value);
      if (field.id === "signup-confirm-password") return value.length >= 8 && value === form.querySelector("#signup-password")?.value;
      return true;
    });

    signupButton.disabled = !(fieldsValid && policyCheckbox.checked);
  };

  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", updateButtonState);
    input.addEventListener("blur", updateButtonState);
  });

  policyCheckbox.addEventListener("change", updateButtonState);
  updateButtonState();
}

/**
 * Validiert das Signup-Formular mit eigener Logik statt HTML5-Validation.
 *
 * @returns {boolean} True, wenn das Formular gültig ist.
 */
function validateSignupForm() {
  const form = document.querySelector("#signup-form");
  if (!form) return false;

  const nameInput = form.querySelector("#signup-name");
  const emailInput = form.querySelector("#signup-email");
  const passwordInput = form.querySelector("#signup-password");
  const confirmPasswordInput = form.querySelector("#signup-confirm-password");
  const policyCheckbox = document.querySelector("#privacy-policy-checkbox");

  const validations = [
    { field: nameInput, ok: isValidSignupName(nameInput?.value || "") },
    { field: emailInput, ok: isValidSignupEmail(emailInput?.value || "") },
    { field: passwordInput, ok: isValidSignupPassword(passwordInput?.value || "") },
    {
      field: confirmPasswordInput,
      ok: !!confirmPasswordInput && confirmPasswordInput.value === passwordInput?.value && confirmPasswordInput.value.length >= 8
    },
    { field: policyCheckbox, ok: !!policyCheckbox && policyCheckbox.checked }
  ];

  return validations.every((item) => item.ok);
}

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

  const form = document.querySelector("#signup-form");
  const signupButton = document.querySelector("#signup-submit-button");

  if (form) {
    form.noValidate = true;
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!validateSignupForm()) {
        signupButton.disabled = true;
        return;
      }

      if (!signupButton) return;

      signupButton.disabled = true;
      signupButton.textContent = "Signing up...";

      window.setTimeout(() => {
        signupButton.textContent = "Signed up";
      }, 700);
    });
  }

  setupPrivacyCheckboxGate();
}

window.addEventListener("DOMContentLoaded", initSignupPage);
