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
    const newItem = {
      ...data,
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