/**
 * LocalStorage-based key pair store (replaces Base44 entities)
 */

const STORAGE_KEY = "ecc_keypairs";

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveAll(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const KeyStore = {
  list(sortBy = "-created_date") {
    const items = loadAll();
    if (sortBy === "-created_date") {
      items.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
    return items;
  },

  create(data) {
    const items = loadAll();
    // Ensure name exists and enforce max length (12 chars)
    const MAX_NAME = 12;
    let rawName = (data.name || "Imported Key").toString();
    // normalize whitespace
    rawName = rawName.trim();
    const exists = (n) => items.some((it) => it.name === n);

    // If name is unique and within limit, use it (possibly truncated)
    if (!rawName) rawName = "Imported Key";
    // Start with base (no suffix)
    let base = rawName;
    // We'll try to produce a final `name` <= MAX_NAME characters
    const makeCandidate = (b, i) => {
      if (!i) return b.length <= MAX_NAME ? b : b.slice(0, MAX_NAME);
      const suffix = `(${i})`;
      const allowedBase = Math.max(0, MAX_NAME - suffix.length);
      const truncatedBase = b.slice(0, allowedBase);
      return `${truncatedBase}${suffix}`;
    };

    let name = makeCandidate(base, 0);
    if (exists(name)) {
      let i = 1;
      while (true) {
        const candidate = makeCandidate(base, i);
        if (!exists(candidate)) { name = candidate; break; }
        i++;
        if (i > 9999) { // fallback to a random id truncated
          name = makeCandidate(base + crypto.randomUUID().slice(0, 6), 0).slice(0, MAX_NAME);
          break;
        }
      }
    }
    const newItem = {
      ...data,
      name,
      id: crypto.randomUUID(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };
    items.push(newItem);
    saveAll(items);
    return newItem;
  },

  delete(id) {
    const items = loadAll().filter((k) => k.id !== id);
    saveAll(items);
  },
};