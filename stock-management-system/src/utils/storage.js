const PREFIX = 'gevite_';

export const storage = {
  get: (key, fallback = null) => {
    try {
      const item = localStorage.getItem(PREFIX + key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage error:', e);
    }
  },
  remove: (key) => {
    localStorage.removeItem(PREFIX + key);
  },
  clear: () => {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k));
  },
};

export const sessionStore = {
  get: (key, fallback = null) => {
    try {
      const item = sessionStorage.getItem(PREFIX + key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (key, value) => {
    try {
      sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error('Session storage error:', e);
    }
  },
  remove: (key) => {
    sessionStorage.removeItem(PREFIX + key);
  },
};
