/**
 * Prüft, ob der Name mindestens 2 Zeichen lang ist.
 *
 * @param {string} value - Eingegebener Name.
 * @returns {boolean} True, wenn der Name gültig ist.
 */
function isValidSignupName(value) {
  // Leerzeichen entfernen und Länge prüfen.
  return value.trim().length >= 2;
}


/**
 * Prüft, ob die E-Mail das Format "text@text.endung" hat.
 *
 * @param {string} value - Eingegebene E-Mail.
 * @returns {boolean} True, wenn die E-Mail gültig ist.
 */
function isValidSignupEmail(value) {

  // Regex: keine Leerzeichen, genau ein "@", danach ein Punkt mit Endung.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Prüft die Passwortregeln: mind. 8 Zeichen, ein Groß- und ein Kleinbuchstabe.
 *
 * @param {string} value - Eingegebenes Passwort.
 * @returns {boolean} True, wenn das Passwort alle Regeln erfüllt.
 */
function isValidSignupPassword(value) {

  // Unicode-Kategorien erkennen auch Buchstaben wie Ä und ü.
  return value.length >= 8 && /\p{Lu}/u.test(value) && /\p{Ll}/u.test(value);
}

/** Current email error message; only updated on blur. */
let signupEmailMessage = "";

/**
 * Collects all currently active feedback messages for the signup form.
 *
 * @returns {string[]} Messages in display order, empty if everything is valid.
 */
function getSignupFeedbackMessages() {
  const password = document.getElementById("signup-password");
  const confirmation = document.getElementById("signup-confirm-password");
  const missing = password.value.length > 0 ? getMissingPasswordRules(password.value) : [];
  const mismatch = confirmation.value.length > 0 && confirmation.value !== password.value;
  const messages = [];
  if (signupEmailMessage) messages.push(signupEmailMessage);
  if (missing.length) messages.push(`Password needs: ${missing.join(", ")}.`);
  if (mismatch) messages.push("Passwords don't match. Please try again.");
  return messages;
}

/**
 * Sets the aria-invalid state on the email, password and confirmation fields.
 *
 * @returns {void}
 */
function updateSignupAriaState() {
  const password = document.getElementById("signup-password");
  const confirmation = document.getElementById("signup-confirm-password");
  const invalidPassword = password.value.length > 0 && !isValidSignupPassword(password.value);
  const mismatch = confirmation.value.length > 0 && confirmation.value !== password.value;
  document.getElementById("signup-email").setAttribute("aria-invalid", String(signupEmailMessage !== ""));
  password.setAttribute("aria-invalid", String(invalidPassword));
  confirmation.setAttribute("aria-invalid", String(mismatch));
}

/**
 * Renders all feedback messages into the single feedback area
 * between the confirmation field and the privacy checkbox.
 *
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
 * Validates the email field and re-renders the feedback area.
 * Called when the email field loses focus.
 *
 * @returns {void}
 */
function validateSignupEmailOnBlur() {
  const email = document.getElementById("signup-email");
  signupEmailMessage = getEmailError(email.value);
  renderSignupFeedback();
}

/**
 * Attaches the blur listener to the email field.
 *
 * @returns {void}
 */
function bindSignupEmailBlur() {
  const email = document.getElementById("signup-email");
  if (email) email.addEventListener("blur", validateSignupEmailOnBlur);
}

/**
 * Liefert die noch nicht erfüllten Passwortregeln als Textliste.
 *
 * @param {string} value - Eingegebenes Passwort.
 * @returns {string[]} Fehlende Regeln, leer wenn alles erfüllt ist.
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
 *
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
 * Sperrt den Sign-up-Button, bis alle Felder gültig sind
 * und die Datenschutz-Checkbox angehakt ist.
 *
 */
function setupPrivacyCheckboxGate() {
  // Checkbox "I accept the Privacy policy".
  const policyCheckbox = document.querySelector("#privacy-policy-checkbox");
  // Sign-up-Button.
  const signupButton = document.querySelector("#signup-submit-button");
  // Gesamtes Formular.
  const form = document.querySelector("#signup-form");

  // Fehlt eines der Elemente, nichts tun (z. B. auf anderen Seiten).
  if (!policyCheckbox || !signupButton || !form) return;

  // Prüft alle Felder und schaltet den Button an/aus.
  const updateButtonState = () => {
    renderSignupFeedback();
    const fieldsValid = [
      form.querySelector("#signup-name"),
      form.querySelector("#signup-email"),
      form.querySelector("#signup-password"),
      form.querySelector("#signup-confirm-password")
    ].every((field) => {
      // Feld existiert nicht -> nicht blockieren.
      if (!field) return true;
      // Aktueller Wert des Feldes.
      const value = field.value;
      // Je nach Feld-ID die passende Prüffunktion verwenden.
      if (field.id === "signup-name") return isValidSignupName(value);
      if (field.id === "signup-email") return isValidSignupEmail(value);
      if (field.id === "signup-password") return isValidSignupPassword(value);
      // Bestätigung: mind. 8 Zeichen und identisch mit dem Passwort.
      if (field.id === "signup-confirm-password") return value.length >= 8 && value === form.querySelector("#signup-password")?.value;
      return true;
    });

    // Button nur aktiv, wenn alle Felder gültig sind UND die Checkbox angehakt ist.
    signupButton.disabled = !(fieldsValid && policyCheckbox.checked);
  };

  // Bei jeder Eingabe und beim Verlassen eines Feldes neu prüfen.
  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", updateButtonState);
    input.addEventListener("blur", updateButtonState);
  });

  // Beim An-/Abhaken der Checkbox neu prüfen.
  policyCheckbox.addEventListener("change", updateButtonState);

  // Einmal direkt beim Start prüfen (Button ist anfangs deaktiviert).
  updateButtonState();
}
/**
 * Validiert das komplette Formular vor dem Absenden.
 *
 * @returns {boolean} True, wenn alle Felder und die Checkbox gültig sind.
 */
function validateSignupForm() {
  // Formular holen; ohne Formular ist nichts gültig.
  const form = document.querySelector("#signup-form");
  if (!form) return false;

  // Alle benötigten Felder aus dem Formular holen.
  const nameInput = form.querySelector("#signup-name");
  const emailInput = form.querySelector("#signup-email");
  const passwordInput = form.querySelector("#signup-password");
  const confirmPasswordInput = form.querySelector("#signup-confirm-password");
  const policyCheckbox = document.querySelector("#privacy-policy-checkbox");

  // Liste aus Feld + Prüfergebnis ("ok"); "|| ''" schützt vor fehlenden Feldern.
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



  // Nur true, wenn jede Prüfung "ok" ist.
  return validations.every((item) => item.ok);
}


/**
 * Zeigt das Erfolgs-Overlay "You Signed Up successfully"
 * und leitet nach 2 Sekunden weiter.
 */
function showSignupSuccess() {
  // Overlay-Element aus signup.html.
  const overlay = document.getElementById("signup-success-overlay");
  // Overlay sichtbar machen.
  overlay.hidden = false;
  // Erfolgstext in das Overlay schreiben.
  overlay.querySelector(".signup-success-message").textContent = "You Signed Up successfully";
  // Nach 2 Sekunden zur Summary-Seite weiterleiten.
  window.setTimeout(redirectAfterSignup, 2000);
}


/**
 * Leitet nach erfolgreicher Registrierung zur Summary-Seite weiter.
 */
function redirectAfterSignup() {
  // Pfad relativ zu pages/signup.html -> pages/summary.html.
  window.location.href = "./summary.html";
}


/**
 * Initialisiert die Signup-Seite: blendet sie ein, übernimmt den
 * Formularversand und aktiviert die Button-Sperre.
 */
function initSignupPage() {
  const page = document.querySelector(".signup-page");

  // Seite per CSS-Klasse "ready" einblenden.
  if (page) {
    page.classList.add("ready");
  }

  // Formular und Sign-up-Button holen.
  const form = document.querySelector("#signup-form");
  const signupButton = document.querySelector("#signup-submit-button");

  if (form) {

    // Browser-eigene Validierungs-Popups abschalten, wir validieren selbst.
    form.noValidate = true;
    // Beim Absenden des Formulars ...
    form.addEventListener("submit", (event) => {
      // ... Seiten-Reload verhindern.
      event.preventDefault();

      // Formular ungültig -> Button sperren und abbrechen.
      if (!validateSignupForm()) {
        signupButton.disabled = true;
        return;
      }

      // Sicherheitshalber: ohne Button nichts weiter tun.
      if (!signupButton) return;

      // Button sperren und Ladezustand anzeigen.
      signupButton.disabled = true;
      signupButton.textContent = "Signing up...";

      // Gesamtes Formular nicht mehr bedienbar machen.
      form.inert = true;

      // Kurze Verzögerung simuliert das Speichern (kein echtes Backend).
      window.setTimeout(() => {
        // Vorhandenen Demo-Sitzungsmodus nutzen, damit der Header die Initialen anzeigt.
        const name = form.querySelector("#signup-name").value.trim();
        window.sessionStorage.setItem("join-demo-name", name);
        window.sessionStorage.setItem("join-session-mode", "demo");
        // Button-Text auf "Signed up" ändern.
        signupButton.textContent = "Signed up";
        // Erfolgs-Overlay anzeigen und danach weiterleiten.
        showSignupSuccess();
      }, 700);
    });
  }

  // Button-Sperre (Felder + Checkbox) einrichten.
  setupPrivacyCheckboxGate();
  bindSignupEmailBlur();
}

// Sobald das HTML geladen ist, die Signup-Seite initialisieren.
window.addEventListener("DOMContentLoaded", initSignupPage);
