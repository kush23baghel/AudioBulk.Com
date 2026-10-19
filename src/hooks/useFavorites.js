import { useCallback } from 'react';
import { createLocalStore, useStore } from '../lib/localStore';

// Tool ids the visitor starred. Saved only in this browser.
const favoritesStore = createLocalStore('audiobulk_favorites', [], Array.isArray);

export default function useFavorites() {
  const favorites = useStore(favoritesStore);
  const isFavorite = useCallback((id) => favorites.includes(id), [favorites]);
  const toggleFavorite = useCallback((id) => {
    favoritesStore.set((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }, []);
  return { favorites, isFavorite, toggleFavorite };
}
