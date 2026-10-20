// A tool page's view of the shared job list (src/lib/jobStore.js). The jobs themselves live outside
// the page, so leaving the page no longer stops or loses them.
import { useCallback } from 'react';
import { jobStore, useToolJobs } from '../lib/jobStore';

export default function useBulkProcessor(path) {
  const queue = useToolJobs(path);
  const isProcessing = queue.some((it) => it.status === 'queued' || it.status === 'processing');

  const addFiles = useCallback((files) => jobStore.addFiles(path, files), [path]);
  const removeFile = useCallback((id) => jobStore.removeFile(path, id), [path]);
  const clearQueue = useCallback(() => jobStore.clear(path), [path]);
  // processFile(file, onProgress, info) → { blob, name, extra? }
  const processQueue = useCallback((processFile, forceAll = false) => jobStore.run(path, processFile, forceAll), [path]);
  const markDownloaded = useCallback((urls) => jobStore.markDownloaded(path, urls), [path]);

  return { queue, isProcessing, addFiles, removeFile, clearQueue, processQueue, markDownloaded };
}
