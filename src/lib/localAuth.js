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
    const user = {
      id: crypto.randomUUID(),
      username,
      passwordHash: hash,
      role: 'user',
      displayName: username,
      created_date: new Date().toISOString()
    };
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

// Additional helper methods
LocalAuth.getUsers = function() {
  return loadUsers();
};

LocalAuth.getUserById = function(id) {
  const users = loadUsers();
  return users.find(u => u.id === id) || null;
};

LocalAuth.updateUser = async function(id, updates) {
  const users = loadUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('User not found');
  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);
  return users[idx];
};

LocalAuth.setUserRole = async function(id, role) {
  return await this.updateUser(id, { role });
};

LocalAuth.deleteUser = async function(id) {
  let users = loadUsers();
  users = users.filter(u => u.id !== id);
  saveUsers(users);
};

LocalAuth.clearAll = function() {
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem(SESSION_KEY);
};

LocalAuth.logout = function() {
  const session = this.getSession();
  // If session is a guest session, attempt to remove any transient guest user record
  try {
    if (session && session.guest && session.userId) {
      // deleteUser is safe if the id does not exist
      this.deleteUser(session.userId).catch(() => {});
    }
  } catch (e) {
    // ignore
  }
  localStorage.removeItem(SESSION_KEY);
};

LocalAuth.getCurrentUser = function() {
  const session = this.getSession();
  if (!session) return null;
  return this.getUserById(session.userId);
};

LocalAuth.isAuthorized = function(allowedRoles) {
  if (!allowedRoles) return true;
  const user = this.getCurrentUser();
  if (!user) return false;
  if (Array.isArray(allowedRoles)) return allowedRoles.includes(user.role);
  return user.role === allowedRoles;
};

// Export a user's profile as JSON (suitable for transfer between devices).
LocalAuth.exportUserById = function(id) {
  const user = this.getUserById(id);
  if (!user) throw new Error('User not found');
  // Only export non-sensitive fields plus passwordHash (so user can import elsewhere)
  const payload = {
    version: 1,
    user: {
      id: user.id,
      username: user.username,
      passwordHash: user.passwordHash,
      role: user.role,
      displayName: user.displayName,
      created_date: user.created_date,
    }
  };
  return JSON.stringify(payload);
};

LocalAuth.exportCurrentUser = function() {
  const session = this.getSession();
  if (!session) throw new Error('No active session');
  return this.exportUserById(session.userId);
};

// Import a user payload exported via exportUserById. By default will not overwrite existing usernames.
LocalAuth.importUserFromJSON = function(jsonString, options = { overwrite: false }) {
  let obj;
  try { obj = JSON.parse(jsonString); } catch (e) { throw new Error('Invalid JSON'); }
  if (!obj || !obj.user || !obj.user.username) throw new Error('Invalid payload');
  const users = loadUsers();
  const existing = users.find(u => u.username === obj.user.username);
  if (existing && !options.overwrite) {
    throw new Error('A user with that username already exists');
  }
  const userToSave = {
    id: obj.user.id || crypto.randomUUID(),
    username: obj.user.username,
    passwordHash: obj.user.passwordHash || '',
    role: obj.user.role || 'user',
    displayName: obj.user.displayName || obj.user.username,
    created_date: obj.user.created_date || new Date().toISOString()
  };
  if (existing) {
    const idx = users.findIndex(u => u.username === existing.username);
    users[idx] = { ...users[idx], ...userToSave };
  } else {
    users.push(userToSave);
  }
  saveUsers(users);
  return userToSave;
};