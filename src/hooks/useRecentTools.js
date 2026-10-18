import { useState, useCallback } from 'react';

const RECENT_TOOLS_KEY = 'audiobulk_recent_tools';
const MAX_RECENT = 6;

export default function useRecentTools() {
  // Read once during initialisation instead of in a mount effect: no extra render,
  // and no flash of an empty "Recently Used" row on load.
  const [recentTools, setRecentTools] = useState(() => {
    try {
      const stored = localStorage.getItem(RECENT_TOOLS_KEY);
      const parsed = stored ? JSON.parse(stored) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to load recent tools:', e);
      return [];
    }
  });

  const addRecentTool = useCallback((tool) => {
    setRecentTools(prev => {
      // Remove if already exists to move it to front
      const filtered = prev.filter(t => t.path !== tool.path);
      const updated = [tool, ...filtered].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save recent tools:', e);
      }
      return updated;
    });
  }, []);

  return { recentTools, addRecentTool };
}
