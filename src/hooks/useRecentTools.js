import { useCallback } from 'react';
import { createLocalStore, useStore } from '../lib/localStore';

const MAX_RECENT = 6;

// Shared by every component, so the sidebars update the moment a tool is opened.
const recentStore = createLocalStore('audiobulk_recent_tools', [], Array.isArray);

export default function useRecentTools() {
  const recentTools = useStore(recentStore);

  const addRecentTool = useCallback((tool) => {
    recentStore.set((prev) => [tool, ...prev.filter((t) => t.path !== tool.path)].slice(0, MAX_RECENT));
  }, []);

  return { recentTools, addRecentTool };
}
