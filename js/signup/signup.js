let signupEmailMessage = "";

let signupSubmitMessage = "";

function isValidSignupName(value) {
  return value.trim().length >= 2;
}

function isValidSignupEmail(value) {
  return /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value.trim());
}

function isValidSignupPassword(value) {
  return value.length >= 8 && /\p{Lu}/u.test(value) && /\p{Ll}/u.test(value);
}

function getMissingPasswordRules(value) {
  const missing = [];
  if (value.length < 8) missing.push("at least 8 characters");
  if (!/\p{Lu}/u.test(value)) missing.push("an uppercase letter");
  if (!/\p{Ll}/u.test(value)) missing.push("a lowercase letter");
  return missing;
}

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

function validateSignupEmailOnBlur() {
  const email = document.getElementById("signup-email");
  signupEmailMessage = email.dataset.touched ? getEmailError(email.value) : "";
  renderSignupFeedback();
}

function getSignupRequiredMessages() {
  return Array.from(document.querySelectorAll("#signup-form .field input"))
    .filter((field) => field.dataset.touched && !field.value.trim())
    .map((field) => `${field.getAttribute("aria-label")} is required.`);
}

function getSignupValue(form, selector) {
  return form.querySelector(selector)?.value || "";
}

function isSignupConfirmationValid(form) {
  const confirmation = getSignupValue(form, "#signup-confirm-password");
  return confirmation.length >= 8 && confirmation === getSignupValue(form, "#signup-password");
}

function isSignupFieldValid(field, form) {
  if (field.id === "signup-name") return isValidSignupName(field.value);
  if (field.id === "signup-email") return isValidSignupEmail(field.value);
  if (field.id === "signup-password") return isValidSignupPassword(field.value);
  if (field.id === "signup-confirm-password") return isSignupConfirmationValid(form);
  return true;
}

function areSignupFieldsValid(form) {
  const ids = ["#signup-name", "#signup-email", "#signup-password", "#signup-confirm-password"];
  return ids
    .map((id) => form.querySelector(id))
    .every((field) => field && isSignupFieldValid(field, form));
}

function updateSignupButtonState(form, policyCheckbox, signupButton) {
  renderSignupFeedback();
  signupButton.disabled = !(areSignupFieldsValid(form) && policyCheckbox.checked);
}

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

function setupPrivacyCheckboxGate() {
  const policyCheckbox = document.querySelector("#privacy-policy-checkbox");
  const signupButton = document.querySelector("#signup-submit-button");
  const form = document.querySelector("#signup-form");
  if (!policyCheckbox || !signupButton || !form) return;
  const update = () => updateSignupButtonState(form, policyCheckbox, signupButton);
  form.querySelectorAll("input").forEach((input) => bindSignupInput(input, update));
  policyCheckbox.addEventListener("change", update);
  update();
}

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

function redirectAfterSignup() {
  window.location.href = "./summary.html";
}

function showSignupSuccess() {
  const overlay = document.getElementById("signup-success-overlay");
  overlay.hidden = false;
  overlay.querySelector(".signup-success-message").textContent = "You Signed Up successfully";
  window.setTimeout(redirectAfterSignup, 2000);
}

function readSignupAccount(form) {
  return {
    name: getSignupValue(form, "#signup-name"),
    email: getSignupValue(form, "#signup-email"),
    password: getSignupValue(form, "#signup-password"),
  };
}

async function saveSignupAccount(form) {
  try {
    const result = await registerJoinUser(readSignupAccount(form));
    if (result.ok) saveJoinUserSession(result.user);
    return result.ok ? result : { ok: false, message: "This email is already registered. Please log in." };
  } catch (error) {
    return { ok: false, message: "Signup failed. Please check your connection and try again." };
  }
}

function setSignupBusy(form, signupButton, isBusy) {
  form.inert = isBusy;
  signupButton.disabled = isBusy;
  signupButton.textContent = isBusy ? "Signing up..." : "Sign up";
}

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
