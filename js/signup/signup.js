// ==========================================
// SIGNUP-SEITE (pages/signup.html)
// ==========================================
// Validiert das Registrierungsformular (Name, E-Mail, Passwort,
// Passwort-Wiederholung, Datenschutz-Checkbox), aktiviert den
// Sign-up-Button nur bei gültigen Eingaben und zeigt nach dem
// Absenden eine Erfolgsmeldung mit Weiterleitung zur Summary-Seite.
// ==========================================

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
 * Prüft die Passwortregeln: mind. 8 Zeichen, ein Groß-, ein Kleinbuchstabe und eine Ziffer.
 *
 * @param {string} value - Eingegebenes Passwort.
 * @returns {boolean} True, wenn das Passwort alle Regeln erfüllt.
 */
function isValidSignupPassword(value) {

  // Länge >= 8 UND Großbuchstabe UND Kleinbuchstabe UND Ziffer.
  return value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);
}









/**
 * Aktualisiert die sichtbaren Hinweise zum Passwort:
 * markiert unerfüllte Passwortregeln und zeigt eine Meldung,
 * wenn die Passwort-Wiederholung nicht übereinstimmt.
 */
function updateSignupPasswordFeedback() {
  // Passwortfeld.
  const password = document.getElementById("signup-password");
  // Feld "Passwort bestätigen".
  const confirmation = document.getElementById("signup-confirm-password");
  // Ungültig nur, wenn schon etwas eingegeben wurde und die Regeln nicht erfüllt sind.
  const invalid = password.value.length > 0 && !isValidSignupPassword(password.value);
  // Abweichung nur, wenn die Bestätigung schon ausgefüllt ist und nicht übereinstimmt.
  const mismatch = confirmation.value.length > 0 && confirmation.value !== password.value;

  // Anforderungs-Liste unter dem Passwort rot markieren (CSS-Klasse "is-invalid").
  document.getElementById("signup-password-requirements").classList.toggle("is-invalid", invalid);
  // Fehlermeldung bei Abweichung einblenden, sonst leeren.
  document.getElementById("signup-password-error").textContent = mismatch ? "Passwords don't match. Please try again." : "";
  // Zustand für Screenreader am Passwortfeld setzen.
  password.setAttribute("aria-invalid", String(invalid));
  // Zustand für Screenreader am Bestätigungsfeld setzen.
  confirmation.setAttribute("aria-invalid", String(mismatch));
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
    // Zuerst die Passwort-Hinweise aktualisieren.
    updateSignupPasswordFeedback();
    // Alle vier Eingabefelder durchgehen; every() ist nur true, wenn ALLE gültig sind.
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
  // Hauptcontainer der Signup-Seite.
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
        // Button-Text auf "Signed up" ändern.
        signupButton.textContent = "Signed up";
        // Erfolgs-Overlay anzeigen und danach weiterleiten.
        showSignupSuccess();
      }, 700);
    });
  }

  // Button-Sperre (Felder + Checkbox) einrichten.
  setupPrivacyCheckboxGate();
}

// Sobald das HTML geladen ist, die Signup-Seite initialisieren.
window.addEventListener("DOMContentLoaded", initSignupPage);
