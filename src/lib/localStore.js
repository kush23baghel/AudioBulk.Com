// A tiny value saved in localStorage that every component sees at once (useSyncExternalStore),
// so the sidebars and the page stay in sync. Storage can be blocked; then it just lives in memory.
import { useSyncExternalStore } from 'react';

export function createLocalStore(key, fallback, isValid = () => true) {
  let value = fallback;
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed !== null && isValid(parsed)) value = parsed;
  } catch { /* blocked or corrupt storage: keep the fallback */ }

  const listeners = new Set();
  const store = {
    get: () => value,
    set(next) {
      value = typeof next === 'function' ? next(value) : next;
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return store;
}

export function useStore(store) {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
