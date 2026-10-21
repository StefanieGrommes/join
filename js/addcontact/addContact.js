/** @type {{key: string, check: function(string): boolean, message: string}[]} Validation rules by placeholder keyword. */
const contactFieldRules = [
  { key: "name", check: isValidName, message: "Please enter first and last name" },
  { key: "email", check: isValidEmail, message: "Please enter a valid email address." },
  { key: "phone", check: isValidPhoneNr, message: "Please enter a valid phone number." }
];

/**
 * Opens the dialog for adding a contact.
 * @returns {void}
 */
function showDialog() {
  const dialog = document.querySelector("dialog");
  if (dialog) dialog.showModal();
}

/**
 * Closes the dialog for adding a contact.
 * @returns {void}
 */
function closeDialog() {
  const dialog = document.querySelector("dialog");
  if (dialog) dialog.close();
}

/**
 * Finds the toast element belonging to a field (data-toast-id) or the default mail toast.
 * @param {HTMLInputElement|null} input - The affected field.
 * @returns {HTMLElement|null} The toast element or null.
 */
function getToastElement(input) {
  const toastId = input && input.dataset.toastId ? input.dataset.toastId : "toast-wrapper-mail";
  return document.getElementById(toastId) || document.getElementById("toast-wrapper-mail");
}

/**
 * Hides a toast and clears its text.
 * @param {HTMLElement} toast - The toast element.
 * @returns {void}
 */
function hideToast(toast) {
  toast.classList.remove("show");
  toast.textContent = "";
}

/**
 * Shows an error message in the matching toast area for 4 seconds.
 * @param {string} message - The message to display.
 * @param {HTMLInputElement|null} [input=null] - The affected field.
 * @returns {void}
 */
function showToastMessage(message, input = null) {
  const toast = getToastElement(input);
  if (!toast) return;
  if (toast.dataset.timeoutId) clearTimeout(Number(toast.dataset.timeoutId));
  toast.textContent = message;
  toast.classList.add("show");
  toast.dataset.timeoutId = String(setTimeout(() => hideToast(toast), 4000));
}

/**
 * Checks that the name consists of first and last name.
 * @param {string} value - The entered name.
 * @returns {boolean} True if the name is valid.
 */
function isValidName(value) {
  return value.trim().length >= 2 && value.trim().split(" ").length >= 2;
}

/**
 * Checks that the email address is valid.
 * @param {string} value - The entered email.
 * @returns {boolean} True if the email is valid.
 */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Checks that the phone number has at least 9 digits (spaces and + ( ) - are ignored).
 * @param {string} phoneNr - The entered phone number.
 * @returns {boolean} True if the phone number is valid.
 */
function isValidPhoneNr(phoneNr) {
  const cleanPhoneNr = phoneNr.replace(/\s+/g, "").replace(/[+()\-]/g, "");
  return cleanPhoneNr.length >= 9 && /^\d+$/.test(cleanPhoneNr);
}

/**
 * Finds the validation rule of a field by the keyword in its placeholder.
 * @param {HTMLInputElement} input - The field to check.
 * @returns {{key: string, check: function(string): boolean, message: string}|undefined} The rule or undefined.
 */
function getContactFieldRule(input) {
  const placeholder = (input.placeholder || "").toLowerCase();
  return contactFieldRules.find((rule) => placeholder.includes(rule.key));
}

/**
 * Checks a field without changing its visual state.
 * @param {HTMLInputElement} input - The field to check.
 * @returns {boolean} True if the value is valid.
 */
function isFieldValid(input) {
  const rule = getContactFieldRule(input);
  return rule ? rule.check(input.value.trim()) : true;
}

/**
 * Sets or removes the error state of a field.
 * @param {HTMLInputElement} input - The field.
 * @param {boolean} isInvalid - True to mark the field as invalid.
 * @returns {void}
 */
function setFieldInvalidState(input, isInvalid) {
  input.setAttribute("aria-invalid", String(isInvalid));
  input.classList.toggle("is-invalid", isInvalid);
}

/**
 * Validates a form field, sets its error state and shows a toast if it is invalid.
 * @param {HTMLInputElement|null} input - The field to validate.
 * @returns {boolean} True if the field is valid.
 */
function validateContactField(input) {
  if (!input) return true;
  const rule = getContactFieldRule(input);
  const isValid = rule ? rule.check(input.value.trim()) : true;
  setFieldInvalidState(input, !isValid);
  if (!isValid) showToastMessage(rule.message, input);
  return isValid;
}

/**
 * Sets the start state of a field and attaches its blur and input listeners.
 * @param {HTMLInputElement} field - The field.
 * @param {function(): void} updateSubmitButtonState - Callback that updates the submit button.
 * @returns {void}
 */
function bindContactFieldEvents(field, updateSubmitButtonState) {
  setFieldInvalidState(field, false);
  field.addEventListener("blur", () => {
    validateContactField(field);
    updateSubmitButtonState();
  });
  field.addEventListener("input", () => {
    if (field.classList.contains("is-invalid")) validateContactField(field);
    updateSubmitButtonState();
  });
}

/**
 * Handles the submit of the contact form: validates all fields and creates the contact.
 * @param {SubmitEvent} event - Submit event of the form.
 * @param {HTMLFormElement} form - The contact form.
 * @param {HTMLInputElement[]} fields - All input fields of the form.
 * @param {function(): void} updateSubmitButtonState - Callback that updates the submit button.
 * @returns {void}
 */
function handleContactSubmit(event, form, fields, updateSubmitButtonState) {
  event.preventDefault();
  if (!fields.every((field) => validateContactField(field))) {
    updateSubmitButtonState();
    return;
  }
  addNewContact(form);
}

/**
 * Initializes the contact form with custom validation.
 * @returns {void}
 */
function initAddContactForm() {
  const form = document.querySelector(".add-contact-form");
  if (!form) return;
  form.noValidate = true;
  const fields = Array.from(form.querySelectorAll("input"));
  const submitButton = form.querySelector(".create-contact-btn");
  const updateSubmitButtonState = () => {
    if (submitButton) submitButton.disabled = !fields.every((field) => isFieldValid(field));
  };
  fields.forEach((field) => bindContactFieldEvents(field, updateSubmitButtonState));
  form.addEventListener("submit", (event) => handleContactSubmit(event, form, fields, updateSubmitButtonState));
  updateSubmitButtonState();
}

initAddContactForm();
