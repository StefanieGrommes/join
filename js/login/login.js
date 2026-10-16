// ==========================================
// LOGIN-SEITE (index.html)
// ==========================================
// Steuert das Start-Intro (Logo-Animation), den Gast-Login,
// den Demo-Login per Name und die Weiterleitung zur Signup-Seite.
// ==========================================

/**
 * Beendet das Intro: blendet die Logo-Animation aus und zeigt die Login-Seite an.
 */
function finishLoginIntro() {
  // Intro-Container (.app-intro) per CSS-Klasse "hidden" verstecken.
  document.querySelector(".app-intro").classList.add("hidden");
  // Login-Bereich (.login-page) per CSS-Klasse "ready" sichtbar machen.
  document.querySelector(".login-page").classList.add("ready");
}











/**
 * Leitet den Nutzer zur Registrierungsseite (pages/signup.html) weiter.
 */
function redirectToSignupPage() {
  // Browser auf die Signup-Seite schicken.
  window.location.href = "./pages/signup.html";
}











/**
 * Meldet den Nutzer als Gast an und öffnet die Summary-Seite.

 */
function loginAsGuest() {

  // Evtl. alten Demo-Namen aus einer früheren Sitzung entfernen.
  window.sessionStorage.removeItem("join-demo-name");
  // Sitzungsmodus "guest" speichern -> wird in init.js (updateSessionHeader) für die Initialen "G" gelesen.
  window.sessionStorage.setItem("join-session-mode", "guest");
  // Gast-Button deaktivieren, damit nicht doppelt geklickt wird.
  document.getElementById("guest-login-button").disabled = true;
  // Weiter zur Summary-Seite.
  window.location.href = "./pages/summary.html";
}














/**
 * Demo-Login: liest den eingegebenen Namen, speichert ihn in der Session
 * und leitet zur Summary-Seite weiter. Es gibt keine echte Passwortprüfung.
 *
 * @param {SubmitEvent} event - Das Submit-Event des Demo-Login-Formulars.
 */
function loginAsDemoUser(event) {

  // Standard-Formularversand (Seiten-Reload) verhindern.
  event.preventDefault();
  // Eingabefeld für den Namen holen.
  const input = document.getElementById("demo-login-name");
  // Namen ohne Leerzeichen am Anfang/Ende auslesen.
  const name = input.value.trim();
  // Für Screenreader markieren, ob das Feld ungültig (leer) ist.
  input.setAttribute("aria-invalid", String(!name));
  // Kein Name eingegeben -> Fehlermeldung anzeigen und abbrechen.
  if (!name) {
    // Fehlertext in das Feedback-Element unter dem Formular schreiben.
    document.getElementById("demo-login-feedback").textContent = "Please enter your name. This is a demo without password verification.";
    // Fokus zurück ins Eingabefeld setzen.
    input.focus();
    // Funktion beenden, keine Weiterleitung.
    return;
  }

  // Namen in der Session speichern -> init.js baut daraus die Initialen im Header.
  window.sessionStorage.setItem("join-demo-name", name);
  // Sitzungsmodus "demo" speichern.
  window.sessionStorage.setItem("join-session-mode", "demo");
  // Weiter zur Summary-Seite.
  window.location.href = "./pages/summary.html";
}

















/**
 * Initialisiert die Login-Seite: hängt alle Event-Listener an
 * und startet das Intro bei jedem Laden.
 */
function initLoginPage() {
  // Intro-Container mit dem animierten Logo.
  const intro = document.querySelector(".app-intro");
  // Eigentliche Login-Seite.
  const page = document.querySelector(".login-page");
  // Alle "Sign up"-Links/Buttons oben rechts (Desktop + Mobile).
  const signupButtons = document.querySelectorAll(".top-link");

  // Jeder Sign-up-Button leitet bei Klick zur Signup-Seite weiter.
  signupButtons.forEach((button) => {
    button.addEventListener("click", redirectToSignupPage);
  });
  // Klick auf "Guest Log in" -> loginAsGuest().
  document.getElementById("guest-login-button").addEventListener("click", loginAsGuest);
  // Absenden des Demo-Formulars -> loginAsDemoUser().
  document.getElementById("demo-login-form").addEventListener("submit", loginAsDemoUser);

  // Ohne Intro- oder Login-Container gibt es nichts zu animieren.
  if (!intro || !page) return;

  // Intro bei jedem Laden nach 1,2 Sekunden beenden.
  window.setTimeout(finishLoginIntro, 1200);

  // Beim Verlassen der Seite das Intro beenden, damit beim Zurück-Navigieren
  // (Browser-Cache) nicht wieder die Animation hängen bleibt.
  window.addEventListener("pagehide", finishLoginIntro);
}

// Sobald das HTML geladen ist, die Login-Seite initialisieren.
window.addEventListener("DOMContentLoaded", initLoginPage);
