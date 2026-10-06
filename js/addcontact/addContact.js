/**
 * Öffnet den Dialog zum Hinzufügen eines Kontakts.
 *
 * @returns {void}
 */
function showDialog() {
  const dialog = document.querySelector("dialog");
  if (dialog) {
    dialog.showModal();
  }
}

/**
 * Schließt den Dialog zum Hinzufügen eines Kontakts.
 *
 * @returns {void}
 */
function closeDialog() {
  const dialog = document.querySelector("dialog");
  if (dialog) {
    dialog.close();
  }
}

/**
 * Zeigt eine Fehlermeldung im passenden Toast-Bereich an.
 *
 * @param {string} message - Die Anzeigemeldung.
 * @param {HTMLInputElement|null} [input=null] - Das betroffene Feld.
 * @returns {void}
 */
function showToastMessage(message, input = null) {
  const toastId = input && input.dataset.toastId ? input.dataset.toastId : "toast-wrapper-mail";
  const toast = document.getElementById(toastId) || document.getElementById("toast-wrapper-mail");

  if (!toast) return;

  if (toast.dataset.timeoutId) {
    clearTimeout(Number(toast.dataset.timeoutId));
  }

  toast.textContent = message;
  toast.classList.add("show");

  const timeoutId = setTimeout(() => {
    toast.classList.remove("show");
    toast.textContent = "";
  }, 4000);

  toast.dataset.timeoutId = String(timeoutId);
}

/**
 * Prüft den Namen auf gültige Länge.
 *
 * @param {string} value - Der eingegebene Name.
 * @returns {boolean} True, wenn der Name gültig ist.
 */
function isValidName(value) {
  return value.trim().length >= 2;
}

/**
 * Prüft, ob eine E-Mail-Adresse gültig ist.
 *
 * @param {string} value - Die eingegebene E-Mail.
 * @returns {boolean} True, wenn die E-Mail gültig ist.
 */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Prüft, ob eine Telefonnummer gültig ist.
 *
 * @param {string} phoneNr - Die eingegebene Telefonnummer.
 * @returns {boolean} True, wenn die Telefonnummer gültig ist.
 */
function isValidPhoneNr(phoneNr) {
  const cleanPhoneNr = phoneNr.replace(/\s+/g, "").replace(/[+()\-]/g, "");
  return cleanPhoneNr.length >= 9 && /^\d+$/.test(cleanPhoneNr);
}

/**
 * Validiert ein Formularfeld und setzt den Fehlerzustand.
 *
 * @param {HTMLInputElement|null} input - Das zu prüfende Feld.
 * @returns {boolean} True, wenn das Feld gültig ist.
 */
function validateContactField(input) {
  if (!input) return true;

  const value = input.value.trim();
  const placeholder = (input.placeholder || "").toLowerCase();

  if (placeholder.includes("name")) {
    const isValid = isValidName(value);
    input.setAttribute("aria-invalid", String(!isValid));
    input.classList.toggle("is-invalid", !isValid);
    if (!isValid) {
      showToastMessage("Please enter a valid name with at least 2 characters.", input);
    }
    return isValid;
  }

  if (placeholder.includes("email")) {
    const isValid = isValidEmail(value);
    input.setAttribute("aria-invalid", String(!isValid));
    input.classList.toggle("is-invalid", !isValid);
    if (!isValid) {
      showToastMessage("Please enter a valid email address.", input);
    }
    return isValid;
  }

  if (placeholder.includes("phone")) {
    const isValid = isValidPhoneNr(value);
    input.setAttribute("aria-invalid", String(!isValid));
    input.classList.toggle("is-invalid", !isValid);
    if (!isValid) {
      showToastMessage("Please enter a valid phone number.", input);
    }
    return isValid;
  }

  input.setAttribute("aria-invalid", "false");
  input.classList.remove("is-invalid");
  return true;
}

/**
 * Initialisiert das Kontaktformular mit benutzerdefinierter Validierung.
 *
 * @returns {void}
 */
function initAddContactForm() {
  const form = document.querySelector(".add-contact-form");
  if (!form) return;

  form.noValidate = true;

  const fields = Array.from(form.querySelectorAll("input"));
  const submitButton = form.querySelector(".create-contact-btn");

  const isFormValid = () => fields.every((field) => validateContactField(field));

  const updateSubmitButtonState = () => {
    if (!submitButton) return;
    submitButton.disabled = !isFormValid();
  };

  fields.forEach((field) => {
    field.setAttribute("aria-invalid", "false");
    field.classList.remove("is-invalid");

    field.addEventListener("blur", () => {
      validateContactField(field);
      updateSubmitButtonState();
    });

    field.addEventListener("input", () => {
      if (field.classList.contains("is-invalid")) {
        validateContactField(field);
      }
      updateSubmitButtonState();
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const isValid = fields.every((field) => validateContactField(field));
    if (!isValid) {
      updateSubmitButtonState();
      return;
    }

    if (!submitButton) return;

    submitButton.disabled = true;
    submitButton.textContent = "Saving...";

    setTimeout(() => {
      submitButton.disabled = false;
      submitButton.textContent = "Create contact";
      form.reset();
      fields.forEach((field) => {
        field.setAttribute("aria-invalid", "false");
        field.classList.remove("is-invalid");
      });
    }, 600);
  });

  updateSubmitButtonState();
}

initAddContactForm();
