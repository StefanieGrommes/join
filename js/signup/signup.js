
/**
 * Checks whether the signup name contains at least two characters.
 * @param {string} value - The entered name.
 * @returns {boolean} Whether the name is valid.
 */
function isValidSignupName(value) {
  return value.trim().length >= 2;
}

/**
 * Checks whether the email address has a valid format.
 * @param {string} value - The entered email address.
 * @returns {boolean} Whether the email is valid.
 */
function isValidSignupEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Checks the password length and letter case requirements.
 * @param {string} value - The entered password.
 * @returns {boolean} Whether the password is valid.
 */
function isValidSignupPassword(value) {
  return value.length >= 8 && /\p{Lu}/u.test(value) && /\p{Ll}/u.test(value);
}

let signupEmailMessage = "";

/**
 * Collects all active signup feedback messages.
 * @returns {string[]} The current feedback messages.
 */
function getSignupFeedbackMessages() {
  const password = document.getElementById("signup-password");
  const confirmation = document.getElementById("signup-confirm-password");
  const missing = getMissingPasswordRules(password?.value || "");
  const mismatch = confirmation?.value && confirmation.value !== password?.value;
  const messages = [];
  if (signupEmailMessage) messages.push(signupEmailMessage);
  if (missing.length && password.value) messages.push(`Password needs: ${missing.join(", ")}.`);
  if (mismatch) messages.push("Passwords don't match. Please try again.");
  return messages;
}

/**
 * Updates accessibility validation states for signup fields.
 * @returns {void}
 */
function updateSignupAriaState() {
  const email = document.getElementById("signup-email");
  const password = document.getElementById("signup-password");
  const confirmation = document.getElementById("signup-confirm-password");
  if (email) email.setAttribute("aria-invalid", String(!!signupEmailMessage));
  if (password) password.setAttribute("aria-invalid", String(!!password.value && !isValidSignupPassword(password.value)));
  if (confirmation) confirmation.setAttribute("aria-invalid", String(!!confirmation.value && confirmation.value !== password?.value));
}

/**
 * Renders signup feedback and updates accessibility states.
 * @returns {void}
 */
function renderSignupFeedback() {
  const box = document.getElementById("signup-feedback");
  const lines = getSignupFeedbackMessages().map((message) => {
    const line = document.createElement("p");
    line.textContent = message;
    return line;
  });
  if (box) box.replaceChildren(...lines);
  updateSignupAriaState();
}

/**
 * Validates the email field when it loses focus.
 * @returns {void}
 */
function validateSignupEmailOnBlur() {
  const email = document.getElementById("signup-email");
  if (!email) return;
  signupEmailMessage = getEmailError(email.value);
  renderSignupFeedback();
}

/**
 * Registers the signup email blur listener.
 * @returns {void}
 */
function bindSignupEmailBlur() {
  document.getElementById("signup-email")
    ?.addEventListener("blur", validateSignupEmailOnBlur);
}

/**
 * Returns the password requirements that are not yet satisfied.
 * @param {string} value - The entered password.
 * @returns {string[]} The missing password requirements.
 */
function getMissingPasswordRules(value) {
  const missing = [];
  if (value.length < 8) missing.push("at least 8 characters");
  if (!/\p{Lu}/u.test(value)) missing.push("an uppercase letter");
  if (!/\p{Ll}/u.test(value)) missing.push("a lowercase letter");
  return missing;
}

/**
 * Returns a specific validation error for an email address.
 * @param {string} value - The entered email address.
 * @returns {string} The error message or an empty string.
 */
function getEmailError(value) {
  const email = value.trim();
  if (!email) return "";
  if (/\s/.test(email)) return "Email must not contain spaces.";
  if (!email.includes("@")) return "Email is missing an @ sign.";
  if (email.split("@").length > 2) return "Email must contain only one @ sign.";
  const [local, domain] = email.split("@");
  if (!local) return "Email is missing text before the @ sign.";
  if (!domain) return "Email is missing a domain after the @ sign.";
  if (!domain.includes(".")) return "Email domain is missing a dot, e.g. example.com.";
  if (domain.startsWith(".")) return "Email domain must not start with a dot.";
  if (!/\.[^.]+$/.test(domain)) return "Email is missing an ending after the dot, e.g. .com.";
  return isValidSignupEmail(email) ? "" : "Please enter a valid email address.";
}

/**
 * Checks whether a signup field contains a valid value.
 * @param {HTMLInputElement} field - The field to validate.
 * @param {HTMLFormElement} form - The signup form.
 * @returns {boolean} Whether the field is valid.
 */
function isSignupFieldValid(field, form) {
  const value = field.value;
  const validators = {
    "signup-name": isValidSignupName,
    "signup-email": isValidSignupEmail,
    "signup-password": isValidSignupPassword
  };
  if (field.id === "signup-confirm-password") {
    return value.length >= 8 && value === form.querySelector("#signup-password")?.value;
  }
  return validators[field.id] ? validators[field.id](value) : true;
}

/**
 * Checks whether all required signup fields are valid.
 * @param {HTMLFormElement} form - The signup form.
 * @returns {boolean} Whether all fields are valid.
 */
function areSignupFieldsValid(form) {
  const selectors = ["#signup-name", "#signup-email", "#signup-password", "#signup-confirm-password"];
  return selectors.every((selector) => {
    const field = form.querySelector(selector);
    return !!field && isSignupFieldValid(field, form);
  });
}

/**
 * Updates signup feedback and the submit button state.
 * @param {HTMLFormElement} form - The signup form.
 * @param {HTMLInputElement} policyCheckbox - The privacy checkbox.
 * @param {HTMLButtonElement} signupButton - The submit button.
 * @returns {void}
 */
function updateSignupButtonState(form, policyCheckbox, signupButton) {
  renderSignupFeedback();
  signupButton.disabled = !(areSignupFieldsValid(form) && policyCheckbox.checked);
}

/**
 * Registers input and checkbox listeners for signup validation.
 * @returns {void}
 */
function setupPrivacyCheckboxGate() {
  const policyCheckbox = document.querySelector("#privacy-policy-checkbox");
  const signupButton = document.querySelector("#signup-submit-button");
  const form = document.querySelector("#signup-form");
  if (!policyCheckbox || !signupButton || !form) return;
  const update = () => updateSignupButtonState(form, policyCheckbox, signupButton);
  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", update);
    input.addEventListener("blur", update);
  });
  policyCheckbox.addEventListener("change", update);
  update();
}

/**
 * Validates all required signup fields and the privacy checkbox.
 * @returns {boolean} Whether the complete form is valid.
 */
function validateSignupForm() {
  const form = document.querySelector("#signup-form");
  const policyCheckbox = document.querySelector("#privacy-policy-checkbox");
  return !!form && !!policyCheckbox && areSignupFieldsValid(form) && policyCheckbox.checked;
}

/**
 * Displays the signup success overlay and schedules redirection.
 * @returns {void}
 */
function showSignupSuccess() {
  const overlay = document.getElementById("signup-success-overlay");
  if (!overlay) return;
  overlay.hidden = false;
  overlay.querySelector(".signup-success-message").textContent = "You Signed Up successfully";
  window.setTimeout(redirectAfterSignup, 2000);
}

/**
 * Redirects the user to the summary page after signup.
 * @returns {void}
 */
function redirectAfterSignup() {
  window.location.href = "./summary.html";
}

/**
 * Completes the demo signup and displays the success overlay.
 * @param {HTMLFormElement} form - The signup form.
 * @param {HTMLButtonElement} signupButton - The submit button.
 * @returns {void}
 */
function completeSignup(form, signupButton) {
  const name = form.querySelector("#signup-name").value.trim();
  window.sessionStorage.setItem("join-demo-name", name);
  window.sessionStorage.setItem("join-session-mode", "demo");
  signupButton.textContent = "Signed up";
  showSignupSuccess();
}

/**
 * Handles signup form submission and validates the entered data.
 * @param {SubmitEvent} event - The form submission event.
 * @returns {void}
 */
function handleSignupSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const signupButton = document.querySelector("#signup-submit-button");
  if (!validateSignupForm() || !signupButton) {
    if (signupButton) signupButton.disabled = true;
    return;
  }
  signupButton.disabled = true;
  signupButton.textContent = "Signing up...";
  form.inert = true;
  window.setTimeout(() => completeSignup(form, signupButton), 700);
}

/**
 * Initializes the signup page and its form validation.
 * @returns {void}
 */
function initSignupPage() {
  document.querySelector(".signup-page")?.classList.add("ready");
  const form = document.querySelector("#signup-form");
  if (form) {
    form.noValidate = true;
    form.addEventListener("submit", handleSignupSubmit);
  }
  setupPrivacyCheckboxGate();
  bindSignupEmailBlur();
}

window.addEventListener("DOMContentLoaded", initSignupPage);
