# A1: Jobs keep running when you switch tools
Status: Done (built and verified 2026-10-21)

## Context
**The problem.** Our competitor test (`tests/verify/leave-mid-job.mjs`) showed that when you start a job and click another tool, AudioBulk silently throws the job away. Coming back shows an empty page, with no warning. The cause:
- `src/hooks/useBulkProcessor.js` keeps the job list inside the page (`useState`).
- When the page closes, it aborts and calls `terminateFFmpeg()`.

The competitors lose the job too (they reload the page and work on their servers). Our site never reloads and never uploads, so we can do better.

**This is step A1 of the approved roadmap** (`docs/plans/2026-10-20-roadmap-checklist.md`).

**The goal:**
- A job keeps running while you use other tools.
- A header chip shows progress and finished files.
- Coming back shows the job, with **the same settings you picked**.
- The tab warns before closing only if work would be lost.

## What has to move out of the page (found in the code)
Three things live inside each tool page today and are lost when you leave:
1. **The job list** (`queue`, `isProcessing`) in `useBulkProcessor.js`.
2. **Each file's details** (`infos`, `infoByFile`, read by `readInfo`) in `src/ui/BulkTool.jsx` lines 52–62.
3. **The tool's settings** (`useState` in each of the 19 BulkTool pages, e.g. `VideoToGif.jsx` start/length/width/fps).

If only the job list moved, coming back would show default settings that don't match the running job.

## Design

### 1. `src/lib/jobStore.js` (new): one job store for the whole site
- **Lives outside React**, in the same pattern as `src/lib/localStore.js`: `get` / `subscribe`, used through `useSyncExternalStore`. It is in memory only: kept until the tab closes, never saved to disk.
- **State:** `{ tools: { [path]: { items: [...] } } }`.
  - Each item: `{ id, file, name, size, status, progress, errorMsg, info, outputs: [{ url, name, size, downloaded }] }`.
  - Statuses: `pending` | `queued` | `processing` | `done` | `error`.
- **One worker loop for the whole site, one file at a time** (FIFO). This matters because:
  - all tools share one ffmpeg.wasm instance
  - ffmpeg progress events are global, so two jobs running at once would mix up their progress bars
- **Actions:**
  - `addFiles(path, files)`: same 500 MB and empty-file checks as today.
  - `setInfo(path, id, info)`.
  - `run(path, processFile, forceAll)`: marks the tool's items `queued` and adds `{ path, id, processFile }` to the global queue. `processFile` is captured with the settings in effect when Start was pressed, so it keeps working after the page closes.
  - `removeFile(path, id)`.
  - `stop(path)` (also used by Clear): removes that tool's waiting items. If the running item belongs to this tool, it aborts and calls `terminateFFmpeg()`. **No other tool's job is touched.**
  - `markDownloaded(path, urls)`.
- **The processing loop is moved as-is** from today's `processQueue` (`useBulkProcessor.js` lines 103–217):
  - the `isWASMReady` check
  - the empty-result guard
  - the `_audiobulk` naming
  - `extra` outputs
  - `forceAll` replacing old outputs
  - the toast on engine-load failure
- **It stores `size` on each output** for the memory note.
- **Leave warning:** the store watches itself. While anything is `queued` or `processing`, or any output has `downloaded: false`, it adds one `beforeunload` listener; otherwise it removes it. **Moving between tools inside the site never warns**, because nothing is lost.
- **Selectors:**
  - `useToolJobs(path)`: the items for one tool.
  - `useJobsSummary()`: running tool and %, number waiting, number of files ready but not downloaded, total output size.

### 2. `src/hooks/useBulkProcessor.js` becomes a thin wrapper
- `useBulkProcessor(path)` returns the same shape as today (`queue`, `isProcessing`, `addFiles`, `removeFile`, `clearQueue`, `processQueue`), backed by `jobStore`. So `BulkTool` changes very little.
- `isProcessing` = any item of this tool is `queued` or `processing`.
- **The unmount cleanup is deleted**: no abort and no `terminateFFmpeg()` on leaving.

### 3. `src/ui/BulkTool.jsx`
- Calls `useBulkProcessor(path)`.
- **File details come from the store:**
  - The effect reads info only for items that have no `info` yet and haven't started reading. It tracks the "already reading" ids in a module-level Set inside `jobStore`, so a remounted page doesn't read again.
  - It saves the result with `jobStore.setInfo`.
  - `run()` passes `item.info` as the third argument, as today.
- **Downloads call `markDownloaded`:** both the "Download" / "Download all (.zip)" button and the per-file buttons in `FileList`.
- **New messages:**
  - When this tool's files are `queued` behind another tool: "Waiting: another tool is finishing a job first. Yours starts right after."
  - Memory note when the total kept output is over 1 GB: "You're keeping X GB of finished files in this tab. Download them and press 'Start over' to free memory." Nothing is deleted automatically.
- **Small honest line** under the lock line: "Finished files stay here until you close this tab."

### 4. `src/ui/FileList.jsx`
- **A `queued` row state:** "Waiting for another job…", with no progress bar and the remove button still allowed.
- **The per-file download buttons** (lines ~116 and ~127) call an `onDownloaded(urls)` prop.

### 5. `src/ui/JobsChip.jsx` (new), placed in the `src/ui/Shell.jsx` header next to Search
- **Hidden** when there are no jobs and no undownloaded files.
- **While working:** spinner + "Video Compressor · 40%" (+ "· 2 waiting").
- **When done:** "3 files ready".
- **Click → a small panel** listing each tool that has jobs (name from `toolsList`, status, a link to the tool page). It uses the existing `Dialog`/popover styling; on phones the chip shows only the icon and count.
- **Accessible:** `aria-live="polite"` for status changes, and keyboard openable.

### 6. Settings survive leaving: `src/hooks/useToolState.js` (new)
- `useToolState(key, initial)`: a drop-in for `useState` for **settings only**. It keys by `location.pathname + key` in a module-level map (same subscribe pattern), and lasts until the tab closes. Settings are not saved across visits; that's a later choice.
- **Mechanical swap in the 19 BulkTool pages:** settings `useState(...)` → `useToolState('name', ...)`. UI-only state (previews, open panels) stays `useState`.
- **Representative pages:**
  - `VideoToGif.jsx` (start, length, width, fps)
  - `BulkVideoCompressor.jsx`
  - `GifEditor.jsx` (action, width, speed)
  - `VideoTrimmer.jsx` (start/end only)
- Because settings now persist, the `inspect` notes and the locked step fieldset show what the running job actually uses.

### Not in A1 (later steps)
- GifMaker, TextToSpeech, VoiceRecorder and the AI page keep their own state for now. They move to the store in a later step, so an AI answer survives switching tools too.
- "Send to another tool" is A2, and builds on this store.

## Files
- **New:** `src/lib/jobStore.js`, `src/hooks/useToolState.js`, `src/ui/JobsChip.jsx`
- **Changed:**
  - `src/hooks/useBulkProcessor.js`, `src/ui/BulkTool.jsx`, `src/ui/FileList.jsx`, `src/ui/Shell.jsx`
  - the 19 BulkTool pages in `src/pages/tools/` (settings swap only)
- **Docs and tests:**
  - `docs/plans/2026-10-2x-A1-jobs-keep-running.md` (the plan doc required before building)
  - `docs/plans/README.md` index
  - `tests/verify/leave-mid-job.mjs` rewritten as pass/fail checks

## Reuse
- **Store pattern:** `src/lib/localStore.js` (`createLocalStore`, `useStore`).
- **Processing loop:** moved, not rewritten, from `src/hooks/useBulkProcessor.js`.
- **Engine:** `terminateFFmpeg` / `getFFmpeg` in `src/lib/ffmpeg.js` (unchanged).
- **Downloads:** `downloadFiles` (`src/lib/download.js`) and `saveAs`, as today.
- **Tool names and paths for the chip:** `toolsList` (`src/data/tools.js`).
- **UI parts:** `Button`, `Card`, `Dialog` from `src/ui/`.

## Verification
Write `tests/verify/leave-mid-job.mjs` first; it must FAIL on today's code and PASS after. Run it against `npx vite preview --port 4173` (`npm run build` first). Every check prints OK/BAD with numbers:
1. **Keeps running:**
   - On the Video Compressor, pick a **non-default** setting, add `hd.mp4`, press start.
   - Click the Video Converter link mid-job.
   - Check the header chip appears with a % that rises over 3 s.
2. **Queues behind:** on the Converter, add `clip.mp4` and start. Its row shows "Waiting…" while the Compressor job runs, then finishes by itself.
3. **Come back:**
   - Click the chip → open the Compressor.
   - Check the file shows Done, and the non-default setting is still selected.
   - Download works and ffprobe confirms a valid, smaller video.
4. **Leave warning:**
   - With undownloaded files, `page.close({ runBeforeUnload: true })` raises a `beforeunload` dialog.
   - After downloading everything with nothing running, a fresh page closes with no dialog.
   - Switching tools never raises a dialog.
5. **Stop is per tool:** start a job on tool A and queue one on tool B, then press "Stop and clear" on A. A's job is gone, and B's starts and finishes.
6. **Browser-engine tools too:** Video to GIF keeps running across a tool switch and finishes with a valid GIF.

Regression and layout checks:
- `node tests/verify/video-tools.mjs`, `audio-tools.mjs`, `gif-tools.mjs` all still pass.
- `npm run lint`, `npm run build`, `npx playwright test` (101 tests).
- Phone width (390 px): the chip fits, with no sideways scroll.

Record the results in the A1 plan doc, commit to `redesign`, and stop for the user's review before A2.


## Results (2026-10-21)
**Test first:** `tests/verify/leave-mid-job.mjs` on the OLD code failed checks 1, 2, 3 and 4b. The job was lost, the second job never finished, coming back was empty, and there was no warning on close. On the new code, **8/8 pass**:

| Check | Result |
|---|---|
| 1. Keeps running on another tool | chip 0% → 1–5% within 2–14 s |
| 2. Second tool waits its turn | showed "Waiting for another job…", then finished by itself |
| 3. Come back | 480p setting still selected; result 854×480, 3.0 MB (ffprobe) |
| 4a/4b/4c. Leave warning | none while switching tools; warns on close with an undownloaded file; no warning when nothing is pending |
| 5. Stop is per tool | compressor stopped; the converter's waiting job then finished on its own |
| 6. Video to GIF across a switch | GIF 480×270, 1,082 KB |
| 7. Phone 390 px | chip at 256–326 px, no sideways scroll |

**Real bug found by check 5 and fixed:**
- **The bug:** Stop pressed while the video engine (~30 MB) was still downloading did nothing. The "stopped" 4K job then ran for minutes and blocked every other tool's queue.
- **Fix in `src/lib/ffmpeg.js`:** Stop now also cancels an engine that is still downloading or starting. An old failed load can no longer wipe a newer one.
- **Fix in `src/lib/jobStore.js`:** a stopped job releases the queue immediately.

**Test-side issues found while debugging (not site bugs):**
- My 6-second window was too short for a slow 4K job.
- Playwright couldn't click links on the scrolled page with smooth scrolling. The test now clicks the link through the page itself.
- Files were added before the new page had appeared.
- The left menu looked wrong in one screenshot. With real mouse clicks it highlights correctly (checked: click, second click, Back).

**Regression:** `video-tools.mjs`, `audio-tools.mjs`, `gif-tools.mjs` all pass. `npm run lint` is clean. `npx playwright test` has 101 passed.

**Not covered yet (later step, as planned):**
- Video Trimmer, GIF Maker, Text to Speech, Voice Recorder and the AI pages still keep their own state. Leaving them mid-job still loses the job.
- Finished files live in the tab's memory: closing the tab clears them, and the close warning says so.
