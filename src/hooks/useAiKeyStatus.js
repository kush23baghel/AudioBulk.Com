import { useSyncExternalStore } from 'react';

// Whether an AI key is saved. Updates when Settings saves ("ai-settings-changed") or another tab changes it.
function subscribe(callback) {
  window.addEventListener('ai-settings-changed', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('ai-settings-changed', callback);
    window.removeEventListener('storage', callback);
  };
}

function hasKey() {
  try { return Boolean(localStorage.getItem('openRouterApiKey')); } catch { return false; }
}

export default function useAiKeyStatus() {
  return useSyncExternalStore(subscribe, hasKey, () => false);
}
