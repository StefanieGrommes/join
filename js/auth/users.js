/**
 * Loads a list (e.g. "users" or "contacts") from the database.
 * @param {string} path - Path of the list inside the database.
 * @returns {Promise<Object>} The raw list, an empty object if it does not exist yet.
 */
async function fetchJoinList(path) {
  const response = await fetch(BASE_URL + path + ".json");
  if (!response.ok) throw new Error(`${path} could not be loaded.`);
  return (await response.json()) || {};
}

/**
 * Saves the account and contact together, without partially completing signup.
 * @param {Object} data - Database paths and records to update atomically.
 * @returns {Promise<Object>} The saved records.
 */
async function saveJoinRegistration(data) {
  const response = await fetch(BASE_URL + ".json", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("The account and contact could not be saved.");
  return response.json();
}

/**
 * Returns the next free array index of a database list.
 * @param {Object} list - The raw list from the database.
 * @returns {number} The next free index.
 */
function getNextJoinListIndex(list) {
  const indexes = Object.keys(list).map(Number).filter(Number.isInteger);
  return indexes.length ? Math.max(...indexes) + 1 : 0;
}

/**
 * Returns all existing entries of a raw database list.
 * @param {Object} list - The raw list from the database.
 * @returns {Object[]} The entries without empty slots.
 */
function getJoinListEntries(list) {
  return Object.values(list).filter(Boolean);
}

/**
 * Normalizes an email address for comparisons.
 * @param {string} email - The entered email.
 * @returns {string} The trimmed email in lower case.
 */
function normalizeJoinEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * Finds a user with the given email address.
 * @param {Object[]} users - All registered users.
 * @param {string} email - The email to search for.
 * @returns {Object|undefined} The matching user.
 */
function findJoinUserByEmail(users, email) {
  return users.find((user) => normalizeJoinEmail(user.email) === normalizeJoinEmail(email));
}

/**
 * Splits a full name into first and last name.
 * @param {string} name - The full name.
 * @returns {{firstName: string, lastName: string}} The name parts.
 */
function splitJoinName(name) {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/**
 * Returns the next free contact id as a string.
 * @param {Object[]} contacts - All existing contacts.
 * @returns {string} The next contact id.
 */
function getNextJoinContactId(contacts) {
  const ids = contacts.map((contact) => Number(contact.id)).filter(Number.isFinite);
  return String(ids.length ? Math.max(...ids) + 1 : 1);
}

/**
 * Prepares a contact for the shared list without saving it separately.
 * @param {string} name - Full name of the new user.
 * @param {string} email - Email of the new user.
 * @returns {Promise<{index: number, contact: Object}>} Contact and database index.
 */
async function prepareJoinUserContact(name, email) {
  const list = await fetchJoinList("contacts");
  const id = getNextJoinContactId(getJoinListEntries(list));
  const contact = { id, ...splitJoinName(name), email, phone: "" };
  return { index: getNextJoinListIndex(list), contact };
}

/**
 * Registers a new user: checks the email, creates the own contact and stores the user.
 * The password is stored as plain string (no Firebase Authentication, not secure).
 * @param {{name: string, email: string, password: string}} account - The signup data.
 * @returns {Promise<{ok: boolean, user?: Object}>} ok is false if the email already exists.
 */
async function registerJoinUser(account) {
  const users = await fetchJoinList("users");
  const email = normalizeJoinEmail(account.email);
  if (findJoinUserByEmail(getJoinListEntries(users), email)) return { ok: false };
  const name = account.name.trim();
  const { index, contact } = await prepareJoinUserContact(name, email);
  const user = { name, email, password: account.password, contactId: contact.id };
  await saveJoinRegistration({
    [`users/${getNextJoinListIndex(users)}`]: user,
    [`contacts/${index}`]: contact,
  });
  return { ok: true, user };
}

/**
 * Finds the user whose email and password match the login data.
 * @param {string} email - The entered email.
 * @param {string} password - The entered password.
 * @returns {Promise<Object|null>} The user or null if the data is wrong.
 */
async function findJoinLoginUser(email, password) {
  const users = getJoinListEntries(await fetchJoinList("users"));
  const user = findJoinUserByEmail(users, email);
  return user && user.password === password ? user : null;
}

/**
 * Stores the account session shared by login and successful registration.
 * @param {Object} user - The registered account, without persisting its password locally.
 * @returns {void}
 */
function saveJoinUserSession(user) {
  ["session-initialized", "session-contacts", "session-tasks"]
    .forEach((key) => window.localStorage.removeItem(key));
  window.localStorage.setItem("join-demo-name", user.name);
  window.localStorage.setItem("join-user-email", user.email);
  window.localStorage.setItem("join-profile-color", createRandomProfileColor());
  window.localStorage.setItem("join-session-mode", "demo");
}
