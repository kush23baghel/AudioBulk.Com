// One job list for the whole site, outside any page, so a job keeps running when you open
// another tool and is still there when you come back. Kept in memory until the tab closes.
//
// Every tool's files live under its page path: { tools: { [path]: [item, …] } }.
// item: { id, file, name, size, status, progress, errorMsg, info, outputs: [{ url, name, size, downloaded }] }
// status: pending (added) | queued (waiting its turn) | processing | done | error
//
// One file is processed at a time across the whole site: every tool shares one ffmpeg engine,
// and its progress events are global, so two jobs at once would mix up their progress bars.
import { useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { terminateFFmpeg } from './ffmpeg';

const MAX_SIZE = 500 * 1024 * 1024; // browser processing limit per file

// Safari / COOP / COEP environment check
const isWASMReady = typeof SharedArrayBuffer !== 'undefined' && typeof window !== 'undefined' && window.crossOriginIsolated;

let state = { tools: {} };
const listeners = new Set();
const runQueue = []; // [{ path, id, processFile, forceAll }]
let current = null; // the job running now: { path, id, aborted }
const reading = new Set(); // item ids whose file details are being read

const emit = () => listeners.forEach((l) => l());
const itemsOf = (path) => state.tools[path] || [];
function setItems(path, fn) {
  state = { ...state, tools: { ...state.tools, [path]: fn(itemsOf(path)) } };
  updateLeaveWarning();
  emit();
}
const patchItem = (path, id, patch) => setItems(path, (items) => items.map((it) => (it.id === id ? { ...it, ...(typeof patch === 'function' ? patch(it) : patch) } : it)));
const revoke = (outputs = []) => outputs.forEach((o) => { try { URL.revokeObjectURL(o.url); } catch { /* ignore */ } });

// ---------- leave warning: only when closing the tab would lose something ----------

const allItems = () => Object.values(state.tools).flat();
const losesWork = () => allItems().some((it) => it.status === 'queued' || it.status === 'processing' || (it.outputs || []).some((o) => !o.downloaded));
const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
let warning = false;
function updateLeaveWarning() {
  const need = losesWork();
  if (need === warning || typeof window === 'undefined') return;
  warning = need;
  if (need) window.addEventListener('beforeunload', onBeforeUnload);
  else window.removeEventListener('beforeunload', onBeforeUnload);
}

// ---------- actions ----------

export const jobStore = {
  get: () => state,
  subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },

  addFiles(path, files) {
    const added = Array.from(files).map((file) => {
      const tooLarge = file.size > MAX_SIZE;
      const empty = file.size === 0;
      return {
        id: Math.random().toString(36).slice(2, 9),
        file,
        name: file.name,
        size: file.size,
        status: tooLarge || empty ? 'error' : 'pending',
        progress: 0,
        errorMsg: tooLarge ? 'File size exceeds browser processing limit (500MB)' : empty ? 'File is empty (0 bytes) and cannot be processed' : '',
        info: null,
        outputs: [],
      };
    });
    setItems(path, (items) => [...items, ...added]);
  },

  // Reads each file's details once, even if the page is opened again later.
  readInfos(path, readInfo) {
    itemsOf(path).filter((it) => !it.info && !reading.has(it.id)).forEach(async (it) => {
      reading.add(it.id);
      const info = await readInfo(it.file).catch(() => ({ ok: false }));
      reading.delete(it.id);
      patchItem(path, it.id, { info });
    });
  },

  removeFile(path, id) {
    if (current && current.path === path && current.id === id) stopCurrent();
    dropQueued((j) => j.path === path && j.id === id);
    setItems(path, (items) => {
      revoke(items.find((it) => it.id === id)?.outputs);
      return items.filter((it) => it.id !== id);
    });
  },

  // "Stop and clear" / "Start over": only this tool's files. Other tools' jobs keep going.
  clear(path) {
    if (current && current.path === path) stopCurrent();
    dropQueued((j) => j.path === path);
    setItems(path, (items) => { items.forEach((it) => revoke(it.outputs)); return []; });
  },

  // processFile(file, onProgress, info) → { blob, name, extra? }. It was made with the settings
  // chosen when Start was pressed, so it keeps working after the page is closed.
  run(path, processFile, forceAll = false) {
    const picked = itemsOf(path).filter((it) => (forceAll ? it.status !== 'error' && it.status !== 'queued' && it.status !== 'processing' : it.status === 'pending'));
    if (!picked.length) return;
    const ids = new Set(picked.map((it) => it.id));
    setItems(path, (items) => items.map((it) => (ids.has(it.id) ? { ...it, status: 'queued', progress: 0 } : it)));
    picked.forEach((it) => runQueue.push({ path, id: it.id, processFile, forceAll }));
    pump();
  },

  markDownloaded(path, urls) {
    const set = new Set(urls);
    setItems(path, (items) => items.map((it) => ({ ...it, outputs: (it.outputs || []).map((o) => (set.has(o.url) ? { ...o, downloaded: true } : o)) })));
  },
};

// Stop the job that's running now: shut the engine (even mid-download) and free the queue.
function stopCurrent() {
  current.aborted = true;
  current.release();
  terminateFFmpeg();
}

function dropQueued(match) {
  for (let i = runQueue.length - 1; i >= 0; i--) if (match(runQueue[i])) runQueue.splice(i, 1);
}

// ---------- the one worker loop ----------

let pumping = false;
async function pump() {
  if (pumping) return;
  pumping = true;
  while (runQueue.length) {
    const job = runQueue.shift();
    const item = itemsOf(job.path).find((it) => it.id === job.id);
    if (!item || item.status !== 'queued') continue;
    // A stopped job lets go of the queue at once, whatever state it's in (e.g. its engine was still
    // downloading), so it can never hold up another tool's files.
    let release;
    const released = new Promise((r) => { release = r; });
    current = { path: job.path, id: job.id, aborted: false, release };
    await Promise.race([runOne(job, item, current), released]);
    current = null;
  }
  pumping = false;
}

// Moved from the old per-page processQueue (src/hooks/useBulkProcessor.js), unchanged in behaviour.
async function runOne(job, item, me) {
  const { path, id, processFile, forceAll } = job;
  patchItem(path, id, { status: 'processing', progress: 0 });
  try {
    if (!isWASMReady) throw new Error("Browser doesn't support required features (SharedArrayBuffer). Use Chrome/Edge.");

    const result = await processFile(item.file, (percent) => {
      if (me.aborted) throw new Error('Aborted');
      patchItem(path, id, { progress: Math.min(100, Math.round(percent)) });
    }, item.info || { ok: false });
    if (me.aborted) return;

    // Never hand people an empty file and call it done.
    if (!result?.blob?.size) throw new Error('Something went wrong and the result came out empty. Please try again, or try a different file.');

    const outputs = [result, ...(Array.isArray(result.extra) ? result.extra : [])].map((res) => {
      const dot = res.name.lastIndexOf('.');
      const base = dot === -1 ? res.name : res.name.slice(0, dot);
      const ext = dot === -1 ? '' : res.name.slice(dot);
      const name = base.endsWith('_audiobulk') ? res.name : `${base}_audiobulk${ext}`;
      return { url: URL.createObjectURL(res.blob), name, size: res.blob.size, downloaded: false };
    });

    // A re-run with new settings replaces the old outputs instead of stacking duplicates.
    patchItem(path, id, (it) => {
      if (forceAll) revoke(it.outputs);
      return { status: 'done', progress: 100, outputs: forceAll ? outputs : [...(it.outputs || []), ...outputs] };
    });
  } catch (err) {
    if (me.aborted || err.message === 'Aborted') return;
    console.error(`Error processing file ${item.name}:`, err);
    if (err.message?.includes('FFmpeg') || err.message?.includes('wasm') || err.message?.includes('fetch')) {
      toast.error('Failed to load processing engine. The CDN (unpkg.com) might be down or blocked. Please check your internet connection.');
    }
    patchItem(path, id, { status: 'error', progress: 0, errorMsg: err.message || 'Processing failed' });
  }
}

// ---------- React hooks ----------

const EMPTY = [];
export function useToolJobs(path) {
  return useSyncExternalStore(jobStore.subscribe, () => state.tools[path] || EMPTY, () => EMPTY);
}

// For the header chip: what is running, what is waiting, what is ready to download.
let summaryCache = { key: '', value: null };
function summary() {
  const tools = Object.entries(state.tools).filter(([, items]) => items.length);
  const running = tools.flatMap(([path, items]) => items.filter((it) => it.status === 'processing').map((it) => ({ path, progress: it.progress })))[0] || null;
  const waiting = allItems().filter((it) => it.status === 'queued').length;
  const ready = allItems().flatMap((it) => it.outputs || []).filter((o) => !o.downloaded).length;
  const keptBytes = allItems().flatMap((it) => it.outputs || []).reduce((n, o) => n + (o.size || 0), 0);
  const perTool = tools.map(([path, items]) => ({
    path,
    working: items.some((it) => it.status === 'queued' || it.status === 'processing'),
    done: items.filter((it) => it.status === 'done').length,
    total: items.length,
  }));
  const value = { running, waiting, ready, keptBytes, perTool };
  const key = JSON.stringify(value);
  if (key !== summaryCache.key) summaryCache = { key, value };
  return summaryCache.value;
}
export function useJobsSummary() {
  return useSyncExternalStore(jobStore.subscribe, summary, summary);
}
