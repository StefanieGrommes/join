/**
 * Öffnet den Dialog zum Hinzufügen eines Kontakts.
 *
 * @returns {void}
 */
function showDialog() {
  // Erstes <dialog>-Element der Seite holen.
  const dialog = document.querySelector("dialog");
  // Nur öffnen, wenn es existiert (als Modal mit Hintergrund).
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
  // Erstes <dialog>-Element der Seite holen.
  const dialog = document.querySelector("dialog");
  // Nur schließen, wenn es existiert.
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
  // Ziel-Toast aus data-toast-id des Feldes, sonst Standard "toast-wrapper-mail".
  const toastId = input && input.dataset.toastId ? input.dataset.toastId : "toast-wrapper-mail";
  // Toast-Element holen (Fallback siehe Zeile darunter).
  const toast = document.getElementById(toastId) || document.getElementById("toast-wrapper-mail");

  // Kein Toast-Element -> abbrechen.
  if (!toast) return;

  // Läuft noch ein alter Ausblend-Timer, diesen stoppen.
  if (toast.dataset.timeoutId) {
    clearTimeout(Number(toast.dataset.timeoutId));
  }

  // Meldung eintragen und Toast per CSS-Klasse einblenden.
  toast.textContent = message;
  toast.classList.add("show");

  // Nach 4 Sekunden wieder ausblenden und Text leeren.
  const timeoutId = setTimeout(() => {
    toast.classList.remove("show");
    toast.textContent = "";
  }, 4000);

  // Timer-id merken, damit er bei einer neuen Meldung abgebrochen werden kann.
  toast.dataset.timeoutId = String(timeoutId);
}

/**
 * Prüft den Namen auf gültige Länge.
 *
 * @param {string} value - Der eingegebene Name.
 * @returns {boolean} True, wenn der Name gültig ist.
 */
function isValidName(value) {
  // Mindestens 2 Zeichen ohne Leerzeichen am Rand.
  return value.trim().length >= 2;
}

/**
 * Prüft, ob eine E-Mail-Adresse gültig ist.
 *
 * @param {string} value - Die eingegebene E-Mail.
 * @returns {boolean} True, wenn die E-Mail gültig ist.
 */
function isValidEmail(value) {
  // Regex: Text, genau ein "@", Domain mit Punkt und Endung.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Prüft, ob eine Telefonnummer gültig ist.
 *
 * @param {string} phoneNr - Die eingegebene Telefonnummer.
 * @returns {boolean} True, wenn die Telefonnummer gültig ist.
 */
function isValidPhoneNr(phoneNr) {
  // Leerzeichen sowie + ( ) - entfernen, damit nur Ziffern übrig bleiben.
  const cleanPhoneNr = phoneNr.replace(/\s+/g, "").replace(/[+()\-]/g, "");
  // Mindestens 9 Zeichen und ausschließlich Ziffern.
  return cleanPhoneNr.length >= 9 && /^\d+$/.test(cleanPhoneNr);
}

/**
 * Validiert ein Formularfeld und setzt den Fehlerzustand.
 *
 * @param {HTMLInputElement|null} input - Das zu prüfende Feld.
 * @returns {boolean} True, wenn das Feld gültig ist.
 */
function validateContactField(input) {
  // Kein Feld -> als gültig werten.
  if (!input) return true;

  // Eingabewert ohne Leerzeichen am Rand.
  const value = input.value.trim();
  // Feldtyp wird am Platzhalter erkannt ("name", "email", "phone").
  const placeholder = (input.placeholder || "").toLowerCase();

  // Namensfeld prüfen; ungültig -> rot markieren und Toast anzeigen.
  if (placeholder.includes("name")) {
    const isValid = isValidName(value);
    input.setAttribute("aria-invalid", String(!isValid));
    input.classList.toggle("is-invalid", !isValid);
    if (!isValid) {
      showToastMessage("Please enter a valid name with at least 2 characters.", input);
    }
    return isValid;
  }

  // E-Mail-Feld prüfen; ungültig -> rot markieren und Toast anzeigen.
  if (placeholder.includes("email")) {
    const isValid = isValidEmail(value);
    input.setAttribute("aria-invalid", String(!isValid));
    input.classList.toggle("is-invalid", !isValid);
    if (!isValid) {
      showToastMessage("Please enter a valid email address.", input);
    }
    return isValid;
  }

  // Telefonfeld prüfen; ungültig -> rot markieren und Toast anzeigen.
  if (placeholder.includes("phone")) {
    const isValid = isValidPhoneNr(value);
    input.setAttribute("aria-invalid", String(!isValid));
    input.classList.toggle("is-invalid", !isValid);
    if (!isValid) {
      showToastMessage("Please enter a valid phone number.", input);
    }
    return isValid;
  }

  // Unbekanntes Feld -> Fehlerzustand entfernen, gilt als gültig.
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
  // Kontaktformular im Dialog holen; fehlt es, abbrechen.
  const form = document.querySelector(".add-contact-form");
  if (!form) return;

  // Browser-Validierungs-Popups abschalten, wir validieren selbst.
  form.noValidate = true;

  // Alle Eingabefelder (Name, E-Mail, Telefon).
  const fields = Array.from(form.querySelectorAll("input"));
  // Button "Create contact".
  const submitButton = form.querySelector(".create-contact-btn");

  // Formular gültig, wenn jedes Feld gültig ist.
  const isFormValid = () => fields.every((field) => validateContactField(field));

  // Button nur aktivieren, wenn das Formular gültig ist.
  const updateSubmitButtonState = () => {
    if (!submitButton) return;
    submitButton.disabled = !isFormValid();
  };

  // Für jedes Feld Startzustand setzen und Listener anhängen.
  fields.forEach((field) => {
    // Anfangs kein Fehlerzustand.
    field.setAttribute("aria-invalid", "false");
    field.classList.remove("is-invalid");

    // Beim Verlassen des Feldes prüfen.
    field.addEventListener("blur", () => {
      validateContactField(field);
      updateSubmitButtonState();
    });

    // Beim Tippen: nur neu prüfen, wenn das Feld schon als fehlerhaft markiert ist.
    field.addEventListener("input", () => {
      if (field.classList.contains("is-invalid")) {
        validateContactField(field);
      }
      updateSubmitButtonState();
    });
  });

  // Formular absenden.
  form.addEventListener("submit", (event) => {
    // Seiten-Reload verhindern.
    event.preventDefault();

    // Alle Felder prüfen; ungültig -> Button aktualisieren und abbrechen.
    const isValid = fields.every((field) => validateContactField(field));
    if (!isValid) {
      updateSubmitButtonState();
      return;
    }

    if (!submitButton) return;

    // Ladezustand anzeigen.
    submitButton.disabled = true;
    submitButton.textContent = "Saving...";

    // Speichern simulieren, danach Button und Formular zurücksetzen.
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

  // Button-Zustand beim Start einmal setzen.
  updateSubmitButtonState();
}

// Formular sofort beim Laden des Skripts initialisieren.
initAddContactForm();
