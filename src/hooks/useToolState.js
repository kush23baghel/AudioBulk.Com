// useState for a tool's SETTINGS that survives leaving the page (until the tab closes).
// A job keeps running while you use other tools; when you come back, the page shows the settings
// that job is really using, not the defaults. Keyed by page address + setting name.
import { useCallback, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';

const values = new Map();
const listeners = new Set();
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };

export default function useToolState(name, initial) {
  const key = `${useLocation().pathname}::${name}`;
  const value = useSyncExternalStore(subscribe, () => (values.has(key) ? values.get(key) : initial), () => initial);
  const setValue = useCallback((next) => {
    const prev = values.has(key) ? values.get(key) : initial;
    values.set(key, typeof next === 'function' ? next(prev) : next);
    listeners.forEach((l) => l());
  }, [key, initial]);
  return [value, setValue];
}
