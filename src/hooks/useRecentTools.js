import { useState, useEffect, useCallback } from 'react';

const RECENT_TOOLS_KEY = 'audiobulk_recent_tools';
const MAX_RECENT = 6;

export default function useRecentTools() {
  const [recentTools, setRecentTools] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_TOOLS_KEY);
      if (stored) setRecentTools(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load recent tools:', e);
    }
  }, []);

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
