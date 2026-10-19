import { useCallback, useSyncExternalStore } from 'react';

// True while the CSS media query matches; updates when the window is resized.
export default function useMediaQuery(query) {
  const subscribe = useCallback((callback) => {
    const mql = window.matchMedia(query);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
  }, [query]);
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}
