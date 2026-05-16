const STORAGE_KEY = "ecc_toolkit_history";

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function save(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const HistoryStore = {
  // type: "encrypt" | "decrypt" | "sign" | "verify" | "keygen" | "keyimport"
  add(entry) {
    const items = load();
    items.unshift({ id: `h_${Date.now()}_${Math.random().toString(36).slice(2)}`, timestamp: new Date().toISOString(), ...entry });
    save(items);
  },

  list() {
    return load();
  },

  delete(id) {
    save(load().filter((h) => h.id !== id));
  },

  clear() {
    save([]);
  },
};