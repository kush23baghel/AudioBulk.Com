import { useState, useCallback, useRef, useEffect } from 'react';
import { terminateFFmpeg } from '../lib/ffmpeg';
import { toast } from 'sonner';

// Safari / COOP / COEP environment check
const isWASMReady = typeof SharedArrayBuffer !== 'undefined' && window.crossOriginIsolated;

export default function useBulkProcessor() {
  const [queue, setQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const abortControllerRef = useRef(null);
  const createdUrlsRef = useRef(new Set());

  // Revoke all created URLs and abort processing on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      terminateFFmpeg();
      
      createdUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          console.error('Failed to revoke URL on unmount:', e);
        }
      });
      createdUrlsRef.current.clear();
    };
  }, []);

  // Add files to the processing queue with a 500MB size limit check
  const addFiles = useCallback((incomingFiles) => {
    const newItems = Array.from(incomingFiles).map((file) => {
      const isTooLarge = file.size > 500 * 1024 * 1024; // 500MB limit
      const isEmpty = file.size === 0;
      
      let errorMsg = '';
      if (isTooLarge) errorMsg = 'File size exceeds browser processing limit (500MB)';
      if (isEmpty) errorMsg = 'File is empty (0 bytes) and cannot be processed';

      return {
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: file.size,
        status: (isTooLarge || isEmpty) ? 'error' : 'pending',
        progress: 0,
        errorMsg: errorMsg,
        outputs: [], // Array of { url, name }
      };
    });
    setQueue((prev) => [...prev, ...newItems]);
  }, []);

  // Remove a file from the queue and revoke its output URLs
  const removeFile = useCallback((id) => {
    setQueue((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item && item.outputs) {
        item.outputs.forEach((out) => {
          if (out.url) {
            URL.revokeObjectURL(out.url);
            createdUrlsRef.current.delete(out.url);
          }
        });
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  // Clear the entire queue and terminate FFmpeg immediately if running
  const clearQueue = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Explicitly terminate FFmpeg to free up CPU and avoid locked threads
    terminateFFmpeg();

    setQueue((prev) => {
      prev.forEach((item) => {
        if (item.outputs) {
          item.outputs.forEach((out) => {
            if (out.url) {
              URL.revokeObjectURL(out.url);
              createdUrlsRef.current.delete(out.url);
            }
          });
        }
      });
      return [];
    });
    setIsProcessing(false);
  }, []);

  // Run the batch processing sequentially
  const processQueue = useCallback(async (processFileFn, forceAll = false) => {
    if (isProcessing || queue.length === 0) return;
    setIsProcessing(true);

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Filter to get files that need processing based on forceAll, excluding already failed/large files
    const pendingItems = forceAll 
      ? queue.filter(item => item.status !== 'error') 
      : queue.filter(item => item.status === 'pending');
    
    for (const item of pendingItems) {
      if (signal.aborted) {
        terminateFFmpeg();
        break;
      }

      // Update item status to processing
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'processing', progress: 0 } : q))
      );

      try {
        if (!isWASMReady) {
          throw new Error("Browser doesn't support required features (SharedArrayBuffer). Use Chrome/Edge.");
        }

        // Run custom converter function
        const result = await processFileFn(item.file, (percent) => {
          if (signal.aborted) throw new Error("Aborted");
          // Progress callback
          setQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, progress: Math.min(100, Math.round(percent)) } : q))
          );
        });

        if (signal.aborted) {
          terminateFFmpeg();
          break;
        }

        // Process primary blob and any extra blobs
        const outputsToAdd = [];
        const processBlobResult = (res) => {
          let outputName = res.name;
          const extIndex = res.name.lastIndexOf('.');
          if (extIndex !== -1) {
            const base = res.name.substring(0, extIndex);
            const ext = res.name.substring(extIndex);
            if (!base.endsWith('_audiobulk')) outputName = `${base}_audiobulk${ext}`;
          } else {
            if (!res.name.endsWith('_audiobulk')) outputName = `${res.name}_audiobulk`;
          }
          const outputUrl = URL.createObjectURL(res.blob);
          createdUrlsRef.current.add(outputUrl);
          outputsToAdd.push({ url: outputUrl, name: outputName });
        };

        processBlobResult(result);
        if (result.extra && Array.isArray(result.extra)) {
          result.extra.forEach(processBlobResult);
        }

        // Update item status to done with output urls appended to outputs array
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'done',
                  progress: 100,
                  outputs: [...(q.outputs || []), ...outputsToAdd],
                }
              : q
          )
        );
      } catch (err) {
        if (err.message === "Aborted" || signal.aborted) {
          terminateFFmpeg();
          break;
        }
        
        console.error(`Error processing file ${item.name}:`, err);
        
        // Show global toast if it's a WASM load error
        if (err.message?.includes('FFmpeg') || err.message?.includes('wasm') || err.message?.includes('fetch')) {
          toast.error("Failed to load processing engine. The CDN (unpkg.com) might be down or blocked. Please check your internet connection.");
        }

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: 'error', progress: 0, errorMsg: err.message || 'Processing failed' }
              : q
          )
        );
      }
    }

    if (!signal.aborted) {
      setIsProcessing(false);
    }
  }, [queue, isProcessing]);

  // Overall process progress percentage
  const totalFiles = queue.length;
  const processedFiles = queue.filter((item) => item.status === 'done').length;
  const overallProgress = totalFiles > 0 ? Math.round((processedFiles / totalFiles) * 100) : 0;

  return {
    queue,
    isProcessing,
    overallProgress,
    addFiles,
    removeFile,
    clearQueue,
    processQueue,
  };
}

