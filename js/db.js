// ==========================================
// DATA LAYER / DATENLAYER
// ==========================================
// Diese Datei bleibt als zentrale Zugriffsschicht bestehen.
// Die echten Daten liegen in den separaten Dateien unter script/data/.
// Dadurch bleibt die Architektur sauber getrennt:
// - contacts.js = Kontakte
// - app-data.js = Info-Seiten, Tasks, Navigation, Board-Spalten
// - db.js = Zugriffsbundle für die App
// ==========================================

// Zentrales Objekt, das alle Datensätze bündelt.
// Andere Dateien (z. B. templates.js) greifen über joinDb.xyz darauf zu,
// falls die globale Variable nicht direkt verfügbar ist.
const joinDb = {
  // Kontaktliste aus js/data/contacts.js.
  contacts,
  // Aufgaben (Tasks) für das Board aus js/data/app-data.js.
  tasks,
  // Texte für Help, Privacy Policy und Legal Notice aus app-data.js.
  infoPages,
  // Einträge der Seiten-Navigation (Sidebar) aus app-data.js.
  navigationItems,
  // Links im Sidebar-Footer aus app-data.js.
  footerNavigationItems,
  // Definition der vier Board-Spalten aus app-data.js.
  boardColumns
};
