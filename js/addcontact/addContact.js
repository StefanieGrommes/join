/**
 * Opens the contact dialog as a modal.
 * @returns {void}
 */
function showDialog() {
  const dialog = document.querySelector("dialog");
  if (dialog) dialog.showModal();
}

/**
 * Closes the contact dialog.
 * @returns {void}
 */
function closeDialog() {
  const dialog = document.querySelector("dialog");
  if (dialog) dialog.close();
}

/**
 * Displays a toast message for four seconds.
 * @param {string} message - The message to display.
 * @param {HTMLInputElement|null} [input=null] - The related input.
 * @returns {void}
 */
function showToastMessage(message, input = null) {
  const toastId = input?.dataset.toastId || "toast-wrapper-mail";
  const toast = document.getElementById(toastId)
    || document.getElementById("toast-wrapper-mail");
  if (!toast) return;
  clearTimeout(Number(toast.dataset.timeoutId));
  toast.textContent = message;
  toast.classList.add("show");
  toast.dataset.timeoutId = setTimeout(() => {
    toast.classList.remove("show");
    toast.textContent = "";
  }, 4000);
}

/**
 * Checks whether a name contains a first and last name.
 * @param {string} value - The name to validate.
 * @returns {boolean} Whether the name is valid.
 */
function isValidName(value) {
  return value.trim().split(/\s+/).filter(Boolean).length >= 2;
}

/**
 * Checks whether an email address has a valid format.
 * @param {string} value - The email address to validate.
 * @returns {boolean} Whether the email is valid.
 */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Checks whether a phone number contains at least nine digits.
 * @param {string} phoneNumber - The phone number to validate.
 * @returns {boolean} Whether the phone number is valid.
 */
function isValidPhoneNumber(phoneNumber) {
  const digits = phoneNumber.replace(/[^\d]/g, "");
  return digits.length >= 9 && /^[\d\s+()\-]+$/.test(phoneNumber);
}

/**
 * Determines the validation result based on the input placeholder.
 * @param {HTMLInputElement} input - The input to validate.
 * @returns {boolean} Whether the input value is valid.
 */
function isFieldValid(input) {
  const value = input.value.trim();
  const placeholder = (input.placeholder || "").toLowerCase();
  if (placeholder.includes("name")) return isValidName(value);
  if (placeholder.includes("email")) return isValidEmail(value);
  if (placeholder.includes("phone")) return isValidPhoneNumber(value);
  return true;
}

/**
 * Validates an input and updates its visual error state.
 * @param {HTMLInputElement|null} input - The input to validate.
 * @returns {boolean} Whether the input is valid.
 */
function validateContactField(input) {
  if (!input) return true;
  const isValid = isFieldValid(input);
  input.setAttribute("aria-invalid", String(!isValid));
  input.classList.toggle("is-invalid", !isValid);
  if (!isValid) showFieldError(input);
  return isValid;
}

/**
 * Displays the appropriate validation message for an input.
 * @param {HTMLInputElement} input - The invalid input.
 * @returns {void}
 */
function showFieldError(input) {
  const placeholder = (input.placeholder || "").toLowerCase();
  const messages = {
    name: "Please enter first and last name.",
    email: "Please enter a valid email address.",
    phone: "Please enter a valid phone number."
  };
  const key = Object.keys(messages).find((item) =>
    placeholder.includes(item)
  );
  if (key) showToastMessage(messages[key], input);
}

/**
 * Updates the contact form submit button according to field validity.
 * @param {HTMLInputElement[]} fields - The form input fields.
 * @param {HTMLButtonElement|null} submitButton - The submit button.
 * @returns {void}
 */
function updateSubmitButtonState(fields, submitButton) {
  if (submitButton) {
    submitButton.disabled = !fields.every(isFieldValid);
  }
}

/**
 * Initializes validation and submission for the contact form.
 * @returns {void}
 */
function initAddContactForm() {
  const form = document.querySelector(".add-contact-form");
  if (!form) return;
  form.noValidate = true;
  const fields = Array.from(form.querySelectorAll("input"));
  const submitButton = form.querySelector(".create-contact-btn");
  fields.forEach((field) => initContactField(field, fields, submitButton));
  form.addEventListener("submit", (event) =>
    handleContactSubmit(event, form, fields, submitButton)
  );
  updateSubmitButtonState(fields, submitButton);
}

/**
 * Registers validation listeners for a contact input.
 * @param {HTMLInputElement} field - The input to initialize.
 * @param {HTMLInputElement[]} fields - All form inputs.
 * @param {HTMLButtonElement|null} submitButton - The submit button.
 * @returns {void}
 */
function initContactField(field, fields, submitButton) {
  field.setAttribute("aria-invalid", "false");
  field.classList.remove("is-invalid");
  field.addEventListener("blur", () => validateContactField(field));
  field.addEventListener("blur", () =>
    updateSubmitButtonState(fields, submitButton)
  );
  field.addEventListener("input", () => handleContactInput(field, fields, submitButton));
}

/**
 * Revalidates an edited field and updates the submit button.
 * @param {HTMLInputElement} field - The edited input.
 * @param {HTMLInputElement[]} fields - All form inputs.
 * @param {HTMLButtonElement|null} submitButton - The submit button.
 * @returns {void}
 */
function handleContactInput(field, fields, submitButton) {
  if (field.classList.contains("is-invalid")) validateContactField(field);
  updateSubmitButtonState(fields, submitButton);
}

/**
 * Validates and submits the contact form.
 * @param {SubmitEvent} event - The form submission event.
 * @param {HTMLFormElement} form - The contact form.
 * @param {HTMLInputElement[]} fields - The form input fields.
 * @param {HTMLButtonElement|null} submitButton - The submit button.
 * @returns {void}
 */
function handleContactSubmit(event, form, fields, submitButton) {
  event.preventDefault();
  const isValid = fields.every(validateContactField);
  if (!isValid) {
    updateSubmitButtonState(fields, submitButton);
    return;
  }
  addNewContact(form);
}

initAddContactForm();