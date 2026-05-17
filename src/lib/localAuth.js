/**
 * Local authentication using localStorage (standalone mode)
 */

const USERS_KEY = "ecc_users";
const SESSION_KEY = "ecc_session";

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); }
  catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function hashPassword(password) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export const LocalAuth = {
  async register(username, password) {
    const users = loadUsers();
    if (users.find(u => u.username === username)) {
      throw new Error("Username already exists");
    }
    const hash = await hashPassword(password);
    const user = { id: crypto.randomUUID(), username, passwordHash: hash, created_date: new Date().toISOString() };
    users.push(user);
    saveUsers(users);
    return user;
  },

  async login(username, password) {
    const users = loadUsers();
    const user = users.find(u => u.username === username);
    if (!user) throw new Error("User not found");
    const hash = await hashPassword(password);
    if (hash !== user.passwordHash) throw new Error("Incorrect password");
    const session = { userId: user.id, username: user.username, token: crypto.randomUUID() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async guestLogin() {
    const session = { userId: `guest-${crypto.randomUUID()}`, username: "guest", token: crypto.randomUUID(), guest: true };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
    catch { return null; }
  },

  isLoggedIn() {
    return !!this.getSession();
  }
};