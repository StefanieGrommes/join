
/**
 * Checks whether the contact belongs to the logged-in account.
 * @param {string} id - The contact id.
 * @returns {boolean} True for the own contact.
 */
function isOwnContact(id) {
  return id === window.localStorage.getItem("join-contact-id");
}


/**
 * Finds the database key under which a contact is stored (key and id can differ).
 * @param {string} id - The contact id.
 * @returns {Promise<string>} The key, falls back to the id.
 */
async function findContactKey(id) {
  const response = await fetch(BASE_URL + "contacts.json");
  const list = (await response.json()) || {};
  return Object.keys(list).find((key) => list[key] && list[key].id === id) ?? id;
}

/**
 * Finds the user key of the logged-in account and checks for an email conflict.
 * @param {Object} contact - The edited own contact.
 * @returns {Promise<{key: string|null, conflict: boolean}>} The user key and conflict state.
 */
async function findOwnUserKey(contact) {
  const response = await fetch(BASE_URL + "users.json");
  const users = (await response.json()) || {};
  const email = contact.email.trim().toLowerCase();
  const keys = Object.keys(users).filter((key) => users[key]);
  const conflict = keys.some((key) =>
    users[key].contactId !== contact.id && String(users[key].email).toLowerCase() === email);
  const key = keys.find((k) => users[k].contactId === contact.id) ?? null;
  return { key, conflict };
}

/**
 * Writes name and email of the edited own contact to the account and the session.
 * @param {Object} contact - The edited own contact.
 * @param {string} userKey - Database key of the account.
 * @returns {Promise<void>}
 */
async function updateOwnAccount(contact, userKey) {
  const name = `${contact.firstName} ${contact.lastName}`.trim();
  await putData(`users/${userKey}/name`, name);
  await putData(`users/${userKey}/email`, contact.email);
  window.localStorage.setItem("join-demo-name", name);
  window.localStorage.setItem("join-user-email", contact.email);
  refreshSessionHeader();
}

/**
 * Returns the name to display for a contact, with " (me)" for the own contact.
 * @param {Object} contact - Contact with id, firstName and lastName.
 * @returns {string} The display name.
 */
function getContactDisplayName(contact) {
  const name = `${contact.firstName} ${contact.lastName}`;
  return isOwnContact(contact.id) ? `${name} (me)` : name;
}

/**
 * Creates the own contact from the session data if it is missing in the list.
 * @returns {Promise<void>}
 */
async function ensureOwnContact() {
  const id = window.localStorage.getItem("join-contact-id");
  if (!id || allContacts.some((c) => c.id === id)) return;
  const parts = (window.localStorage.getItem("join-demo-name") || "").trim().split(/\s+/);
  const email = window.localStorage.getItem("join-user-email") || "";
  const contact = { id, firstName: parts[0], lastName: parts.slice(1).join(" "), email, phone: "" };
  await putData("contacts/" + id, contact);
  allContacts.push(contact);
}