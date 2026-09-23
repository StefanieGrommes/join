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

const joinDb = {
  contacts,
  tasks,
  infoPages,
  navigationItems,
  footerNavigationItems,
  boardColumns
};
