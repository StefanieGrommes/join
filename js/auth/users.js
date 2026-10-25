async function fetchJoinList(path) {
  const response = await fetch(BASE_URL + path + ".json");
  if (!response.ok) throw new Error(`${path} could not be loaded.`);
  return (await response.json()) || {};
}

async function saveJoinRegistration(data) {
  const response = await fetch(BASE_URL + ".json", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("The account and contact could not be saved.");
  return response.json();
}

function getNextJoinListIndex(list) {
  const indexes = Object.keys(list).map(Number).filter(Number.isInteger);
  return indexes.length ? Math.max(...indexes) + 1 : 0;
}

function getJoinListEntries(list) {
  return Object.values(list).filter(Boolean);
}

function normalizeJoinEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function findJoinUserByEmail(users, email) {
  return users.find((user) => normalizeJoinEmail(user.email) === normalizeJoinEmail(email));
}

function splitJoinName(name) {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function getNextJoinContactId(contacts) {
  const ids = contacts.map((contact) => Number(contact.id)).filter(Number.isFinite);
  return String(ids.length ? Math.max(...ids) + 1 : 1);
}

async function prepareJoinUserContact(name, email) {
  const list = await fetchJoinList("contacts");
  const id = getNextJoinContactId(getJoinListEntries(list));
  const contact = { id, ...splitJoinName(name), email, phone: "" };
  return { index: getNextJoinListIndex(list), contact };
}

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

async function findJoinLoginUser(email, password) {
  const users = getJoinListEntries(await fetchJoinList("users"));
  const user = findJoinUserByEmail(users, email);
  return user && user.password === password ? user : null;
}

function saveJoinUserSession(user) {
  ["session-initialized", "session-contacts", "session-tasks"]
    .forEach((key) => window.sessionStorage.removeItem(key));
  window.localStorage.setItem("join-demo-name", user.name);
  window.localStorage.setItem("join-user-email", user.email);
  window.localStorage.setItem("join-profile-color", createRandomProfileColor());
  window.localStorage.setItem("join-session-mode", "demo");
}
