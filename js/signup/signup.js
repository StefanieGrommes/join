function isValidSignupName(value) {
  return value.trim().length >= 2;
}

function isValidSignupEmail(value) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidSignupPassword(value) {

  return value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);
}

function updateSignupPasswordFeedback() {
  const password = document.getElementById("signup-password");
  const confirmation = document.getElementById("signup-confirm-password");
  const invalid = password.value.length > 0 && !isValidSignupPassword(password.value);
  const mismatch = confirmation.value.length > 0 && confirmation.value !== password.value;

  document.getElementById("signup-password-requirements").classList.toggle("is-invalid", invalid);
  document.getElementById("signup-password-error").textContent = mismatch ? "Passwords don't match. Please try again." : "";
  password.setAttribute("aria-invalid", String(invalid));
  confirmation.setAttribute("aria-invalid", String(mismatch));
}

function setupPrivacyCheckboxGate() {
  const policyCheckbox = document.querySelector("#privacy-policy-checkbox");
  const signupButton = document.querySelector("#signup-submit-button");
  const form = document.querySelector("#signup-form");

  if (!policyCheckbox || !signupButton || !form) return;

  const updateButtonState = () => {
    updateSignupPasswordFeedback();
    const fieldsValid = [
      form.querySelector("#signup-name"),
      form.querySelector("#signup-email"),
      form.querySelector("#signup-password"),
      form.querySelector("#signup-confirm-password")
    ].every((field) => {
      if (!field) return true;
      const value = field.value;
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

function showSignupSuccess() {
  const overlay = document.getElementById("signup-success-overlay");
  overlay.hidden = false;
  overlay.querySelector(".signup-success-message").textContent = "You Signed Up successfully";
  window.setTimeout(redirectAfterSignup, 2000);
}

function redirectAfterSignup() {
  window.location.href = "./summary.html";
}

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

      form.inert = true;

      window.setTimeout(() => {
        signupButton.textContent = "Signed up";
        showSignupSuccess();
      }, 700);
    });
  }

  setupPrivacyCheckboxGate();
}

window.addEventListener("DOMContentLoaded", initSignupPage);
