/** @type {string} Current email error message; only updated on blur. */
let signupEmailMessage = "";

/** @type {string} Error message of the last failed submit, e.g. email already registered. */
let signupSubmitMessage = "";

/**
 * Checks that the name has at least 2 characters.
 * @param {string} value - Entered name.
 * @returns {boolean} True if the name is valid.
 */
function isValidSignupName(value) {
  return value.trim().length >= 2;
}

/**
 * Checks that the email has the format "text@text.ending".
 * @param {string} value - Entered email.
 * @returns {boolean} True if the email is valid.
 */
function isValidSignupEmail(value) {
  return /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value.trim());
}

/**
 * Checks the password rules: at least 8 characters, one upper and one lower case letter.
 * @param {string} value - Entered password.
 * @returns {boolean} True if the password meets all rules.
 */
function isValidSignupPassword(value) {
  return value.length >= 8 && /\p{Lu}/u.test(value) && /\p{Ll}/u.test(value);
}

/**
 * Lists the password rules that are not fulfilled yet.
 * @param {string} value - Entered password.
 * @returns {string[]} Missing rules, empty if all are fulfilled.
 */
function getMissingPasswordRules(value) {
  const missing = [];
  if (value.length < 8) missing.push("at least 8 characters");
  if (!/\p{Lu}/u.test(value)) missing.push("an uppercase letter");
  if (!/\p{Ll}/u.test(value)) missing.push("a lowercase letter");
  return missing;
}

/**
 * Returns an error message for the given email or an empty string if it is valid.
 * @param {string} value - Entered email address.
 * @returns {string} Error message, empty if the email is valid.
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
 * Collects all currently active feedback messages for the signup form.
 * @returns {string[]} Messages in display order, empty if everything is valid.
 */
function getSignupFeedbackMessages() {
  const password = document.getElementById("signup-password");
  const confirmation = document.getElementById("signup-confirm-password");
  const missing = password.value.length > 0 ? getMissingPasswordRules(password.value) : [];
  const mismatch = confirmation.value.length > 0 && confirmation.value !== password.value;
  const messages = getSignupRequiredMessages();
  const name = document.getElementById("signup-name");
  if (name.dataset.touched && name.value.trim() && !isValidSignupName(name.value)) {
    messages.push("Name needs at least 2 characters.");
  }
  if (signupSubmitMessage) messages.push(signupSubmitMessage);
  if (signupEmailMessage) messages.push(signupEmailMessage);
  if (missing.length) messages.push(`Password needs: ${missing.join(", ")}.`);
  if (mismatch) messages.push("Passwords don't match. Please try again.");
  return messages;
}

/**
 * Sets the aria-invalid state on the email, password and confirmation fields.
 * @returns {void}
 */
function updateSignupAriaState() {
  const password = document.getElementById("signup-password");
  const confirmation = document.getElementById("signup-confirm-password");
  const invalidPassword = password.value.length > 0 && !isValidSignupPassword(password.value);
  const mismatch = confirmation.value.length > 0 && confirmation.value !== password.value;
  document.querySelectorAll("#signup-form .field input").forEach((field) => {
    const invalid = Boolean(field.dataset.touched) && !isSignupFieldValid(field, field.form);
    field.setAttribute("aria-invalid", String(invalid));
  });
  if (signupEmailMessage) document.getElementById("signup-email").setAttribute("aria-invalid", "true");
  if (invalidPassword) password.setAttribute("aria-invalid", "true");
  if (mismatch) confirmation.setAttribute("aria-invalid", "true");
}

/**
 * Renders all feedback messages into the feedback area above the privacy checkbox.
 * @returns {void}
 */
function renderSignupFeedback() {
  const box = document.getElementById("signup-feedback");
  const lines = getSignupFeedbackMessages().map((text) => {
    const line = document.createElement("p");
    line.textContent = text;
    return line;
  });
  box.replaceChildren(...lines);
  updateSignupAriaState();
}

/**
 * Validates the email field and re-renders the feedback area (called on blur).
 * @returns {void}
 */
function validateSignupEmailOnBlur() {
  const email = document.getElementById("signup-email");
  signupEmailMessage = email.dataset.touched ? getEmailError(email.value) : "";
  renderSignupFeedback();
}

/**
 * Lists required fields left empty after interaction.
 * @returns {string[]} Required-field feedback.
 */
function getSignupRequiredMessages() {
  return Array.from(document.querySelectorAll("#signup-form .field input"))
    .filter((field) => field.dataset.touched && !field.value.trim())
    .map((field) => `${field.getAttribute("aria-label")} is required.`);
}

/**
 * Reads the value of a form field, or an empty string if the field is missing.
 * @param {HTMLFormElement} form - The signup form.
 * @param {string} selector - CSS selector of the field.
 * @returns {string} The field value or an empty string.
 */
function getSignupValue(form, selector) {
  return form.querySelector(selector)?.value || "";
}

/**
 * Checks that the confirmation has at least 8 characters and equals the password.
 * @param {HTMLFormElement} form - The signup form.
 * @returns {boolean} True if the confirmation is valid.
 */
function isSignupConfirmationValid(form) {
  const confirmation = getSignupValue(form, "#signup-confirm-password");
  return confirmation.length >= 8 && confirmation === getSignupValue(form, "#signup-password");
}

/**
 * Checks whether one signup field currently holds a valid value.
 * @param {HTMLInputElement} field - The input field.
 * @param {HTMLFormElement} form - The signup form.
 * @returns {boolean} True if the field is valid.
 */
function isSignupFieldValid(field, form) {
  if (field.id === "signup-name") return isValidSignupName(field.value);
  if (field.id === "signup-email") return isValidSignupEmail(field.value);
  if (field.id === "signup-password") return isValidSignupPassword(field.value);
  if (field.id === "signup-confirm-password") return isSignupConfirmationValid(form);
  return true;
}

/**
 * Checks name, email, password and confirmation of the signup form.
 * @param {HTMLFormElement} form - The signup form.
 * @returns {boolean} True if all required fields exist and are valid.
 */
function areSignupFieldsValid(form) {
  const ids = ["#signup-name", "#signup-email", "#signup-password", "#signup-confirm-password"];
  return ids
    .map((id) => form.querySelector(id))
    .every((field) => field && isSignupFieldValid(field, form));
}

/**
 * Re-renders the feedback and enables the signup button only if the form is valid
 * and the privacy checkbox is checked.
 * @param {HTMLFormElement} form - The signup form.
 * @param {HTMLInputElement} policyCheckbox - The privacy policy checkbox.
 * @param {HTMLButtonElement} signupButton - The signup button.
 * @returns {void}
 */
function updateSignupButtonState(form, policyCheckbox, signupButton) {
  renderSignupFeedback();
  signupButton.disabled = !(areSignupFieldsValid(form) && policyCheckbox.checked);
}

/**
 * Attaches live validation and required-field feedback to one form input.
 * @param {HTMLInputElement} input - Form input.
 * @param {Function} update - Refreshes feedback and the button.
 * @returns {void}
 */
function bindSignupInput(input, update) {
  input.addEventListener("input", () => {
    signupSubmitMessage = "";
    validateSignupEmailOnBlur();
    update();
  });
  input.addEventListener("blur", () => {
    input.dataset.touched = "true";
    validateSignupEmailOnBlur();
    update();
  });
}

/**
 * Locks the signup button until all fields are valid and the privacy checkbox is checked.
 * @returns {void}
 */
function setupPrivacyCheckboxGate() {
  const policyCheckbox = document.querySelector("#privacy-policy-checkbox");
  const signupButton = document.querySelector("#signup-submit-button");
  const form = document.querySelector("#signup-form");
  if (!policyCheckbox || !signupButton || !form) return;
  /** Updates the enabled state of the signup button. @returns {void} */
  const update = () => updateSignupButtonState(form, policyCheckbox, signupButton);
  form.querySelectorAll("input").forEach((input) => bindSignupInput(input, update));
  policyCheckbox.addEventListener("change", update);
  update();
}

/**
 * Validates the complete form before it is submitted.
 * @returns {boolean} True if all fields and the checkbox are valid.
 */
function validateSignupForm() {
  const form = document.querySelector("#signup-form");
  const policyCheckbox = document.querySelector("#privacy-policy-checkbox");
  if (!form || !policyCheckbox) return false;
  return isValidSignupName(getSignupValue(form, "#signup-name"))
    && isValidSignupEmail(getSignupValue(form, "#signup-email"))
    && isValidSignupPassword(getSignupValue(form, "#signup-password"))
    && isSignupConfirmationValid(form)
    && policyCheckbox.checked;
}

/**
 * Redirects to the summary page after a successful signup.
 * @returns {void}
 */
function redirectAfterSignup() {
  window.location.href = "./summary.html";
}

/**
 * Shows the success overlay and redirects after 2 seconds.
 * @returns {void}
 */
function showSignupSuccess() {
  const overlay = document.getElementById("signup-success-overlay");
  overlay.hidden = false;
  overlay.querySelector(".signup-success-message").textContent = "You Signed Up successfully";
  window.setTimeout(redirectAfterSignup, 2000);
}

/**
 * Reads name, email and password from the signup form.
 * @param {HTMLFormElement} form - The signup form.
 * @returns {{name: string, email: string, password: string}} The signup data.
 */
function readSignupAccount(form) {
  return {
    name: getSignupValue(form, "#signup-name"),
    email: getSignupValue(form, "#signup-email"),
    password: getSignupValue(form, "#signup-password"),
  };
}

/**
 * Saves the new account in the database.
 * @param {HTMLFormElement} form - The signup form.
 * @returns {Promise<{ok: boolean, message?: string}>} The result with an error message on failure.
 */
async function saveSignupAccount(form) {
  try {
    const result = await registerJoinUser(readSignupAccount(form));
    if (result.ok) saveJoinUserSession(result.user);
    return result.ok ? result : { ok: false, message: "This email is already registered. Please log in." };
  } catch (error) {
    return { ok: false, message: "Signup failed. Please check your connection and try again." };
  }
}

/**
 * Locks or unlocks the form while the account is being saved.
 * @param {HTMLFormElement} form - The signup form.
 * @param {HTMLButtonElement} signupButton - The signup button.
 * @param {boolean} isBusy - True while saving.
 * @returns {void}
 */
function setSignupBusy(form, signupButton, isBusy) {
  form.inert = isBusy;
  signupButton.disabled = isBusy;
  signupButton.textContent = isBusy ? "Signing up..." : "Sign up";
}

/**
 * Handles the form submit: validates, saves the account and shows the result.
 * @param {SubmitEvent} event - Submit event of the signup form.
 * @param {HTMLFormElement} form - The signup form.
 * @param {HTMLButtonElement} signupButton - The signup button.
 * @returns {Promise<void>}
 */
async function handleSignupSubmit(event, form, signupButton) {
  event.preventDefault();
  if (form.inert) return;
  if (!validateSignupForm()) {
    signupButton.disabled = true;
    return;
  }
  setSignupBusy(form, signupButton, true);
  const result = await saveSignupAccount(form);
  if (result.ok) return showSignupSuccess();
  signupSubmitMessage = result.message;
  setSignupBusy(form, signupButton, false);
  renderSignupFeedback();
}

/**
 * Initializes the signup page: shows it, handles the submit and activates the button lock.
 * @returns {void}
 */
function initSignupPage() {
  const page = document.querySelector(".signup-page");
  if (page) page.classList.add("ready");
  const form = document.querySelector("#signup-form");
  const signupButton = document.querySelector("#signup-submit-button");
  if (form) {
    form.noValidate = true;
    form.addEventListener("submit", (event) => handleSignupSubmit(event, form, signupButton));
  }
  setupPrivacyCheckboxGate();
}

window.addEventListener("DOMContentLoaded", initSignupPage);
