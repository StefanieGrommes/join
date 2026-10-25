const contactFieldRules = [
  { key: "name", check: isValidName, message: "Please enter first and last name" },
  { key: "email", check: isValidEmail, message: "Please enter a valid email address." },
  { key: "phone", check: isValidPhoneNr, message: "Please enter a valid phone number." },
];

function showDialog() {
  const dialog = document.querySelector("dialog");
  if (dialog) dialog.showModal();
}

function resetDialogContent() {
  document.querySelector(".add-contact-form").reset();
  document.getElementById("dialogHeadline").textContent = "Add contact";
  document.getElementById("dialogSubline").style.display = "";
  document.getElementById("submitBtnText").textContent = "Create contact";
  document.getElementById("dialogAvatar").innerHTML =
    `<img src="../assets/contact-guest-img.svg" alt="Guest Image" />`;
}

function closeDialog() {
  const dialog = document.querySelector("dialog");
  if (dialog) dialog.close();
  editingContactId = null;
  resetDialogContent();
}

function getToastElement(input) {
  const toastId =
    input && input.dataset.toastId ? input.dataset.toastId : "toast-wrapper-mail";
  return document.getElementById(toastId) || document.getElementById("toast-wrapper-mail");
}

function hideToast(toast) {
  toast.classList.remove("show");
  toast.textContent = "";
}

function showToastMessage(message, input = null) {
  const toast = getToastElement(input);
  if (!toast) return;
  if (toast.dataset.timeoutId) clearTimeout(Number(toast.dataset.timeoutId));
  toast.textContent = message;
  toast.classList.add("show");
  toast.dataset.timeoutId = String(setTimeout(() => hideToast(toast), 4000));
}

function isValidName(value) {
  return value.trim().length >= 2 && value.trim().split(" ").length >= 2;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhoneNr(phoneNr) {
  const cleanPhoneNr = phoneNr.replace(/\s+/g, "").replace(/[+()\-]/g, "");
  return cleanPhoneNr.length >= 9 && /^\d+$/.test(cleanPhoneNr);
}

function getContactFieldRule(input) {
  const placeholder = (input.placeholder || "").toLowerCase();
  return contactFieldRules.find((rule) => placeholder.includes(rule.key));
}

function isFieldValid(input) {
  const rule = getContactFieldRule(input);
  return rule ? rule.check(input.value.trim()) : true;
}

function setFieldInvalidState(input, isInvalid) {
  input.setAttribute("aria-invalid", String(isInvalid));
  input.classList.toggle("is-invalid", isInvalid);
}

function validateContactField(input) {
  if (!input) return true;
  const rule = getContactFieldRule(input);
  const isValid = rule ? rule.check(input.value.trim()) : true;
  setFieldInvalidState(input, !isValid);
  if (!isValid) showToastMessage(rule.message, input);
  return isValid;
}

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

function handleContactSubmit(event, form, fields, updateSubmitButtonState) {
  event.preventDefault();
  if (!fields.every((field) => validateContactField(field))) {
    updateSubmitButtonState();
    return;
  }
  if (editingContactId) {
    saveEditedContact(form);
  } else {
    addNewContact(form);
  }
}

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
  form.addEventListener("submit", (event) =>
    handleContactSubmit(event, form, fields, updateSubmitButtonState),
  );
  updateSubmitButtonState();
}

initAddContactForm();
