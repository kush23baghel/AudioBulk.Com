# Fix: many results overflow the file row
Status: Done

## Goal
A file that produces many results (e.g. 37 pictures from a long video) shows **one** tidy row: status, a "View" gallery and **one** "Download N pictures" button. The page never scrolls sideways at any width, from 390 px phones to wide desktops.

## Why
Reported by the user on 2026-10-19 (screenshot): Video Frame Extractor on a 4K, 1:13 video (`FrameCap_Launch_v4_1080p_4K_upscaled.mp4`, 89 MB) made 37 pictures, and the file row drew 37 separate "JPG" download buttons in one line. They ran off the right edge and the whole page scrolled sideways. The Phase 3 checks only used a 10-second test clip (5 pictures), so they missed it.

## Steps
1. `src/ui/FileList.jsx`:
   - **1 result:** keep the single format chip (e.g. "MP4"), as today.
   - **2+ results:** replace the per-result chips with one button, "Download 37 pictures (.zip)" (or "files" when they aren't pictures), which zips that file's results with the existing `downloadFiles()`.
   - **Action group:** make it wrap (`flex-wrap`, `min-w-0`) so nothing can push the row wider than the card.
   - **"View" gallery:** show the first 12 pictures plus "+25 more in the download".
2. Make the verification scripts real repo files in `tests/verify/` (they lived in a temp folder before):
   - `tests/verify/fixtures.mjs`: builds the test videos and sounds with the local ffmpeg, including a **long 4K video** that produces many results.
   - `tests/verify/video-tools.mjs`: runs all 9 video tools in the browser and checks every output with ffprobe. It also checks that the **page never scrolls sideways** and that a many-results row shows **one** download button, on desktop and at 390 px phone width.
   - `tests/verify/audio-tools.mjs`: the same for the 8 audio file tools.
   - `tests/verify/README.md`: how to run them.
3. Run the checks, record the results below, commit.

## Files touched
- `src/ui/FileList.jsx`
- `tests/verify/` (new: README, fixtures, audio-tools, video-tools)
- `.gitignore` (ignore `tests/verify/.fixtures/` and `tests/verify/.out/`)
- `docs/plans/` (this plan, index)

## Verification
- [ ] `node tests/verify/video-tools.mjs`: all 9 video tools OK. Frame Extractor on the long 4K video gives many pictures, the row has exactly 1 download button, and there is no sideways scroll at 1440 px and 390 px.
- [ ] `node tests/verify/audio-tools.mjs`: all 8 audio tools OK, no sideways scroll.
- [ ] `npm run lint`, `npm run build`, `npx playwright test` pass.

## Results (2026-10-20)
- [x] `video-tools.mjs`: all 9 video tools OK. Long 4K video (3840×2160, 1:14) → 37 pictures, row shows **1** button "37 pictures (.zip)", gallery "+25 more in the download", no sideways scroll on desktop (1440 px) or phone (390 px).
- [x] Proof the check catches the bug: run against the old FileList → "37 download buttons, sideways scroll: true" (FAILED), as reported.
- [x] `audio-tools.mjs`: all 8 audio tools + notes + loudness (−26.2 → −16.0 LUFS) + noise removal OK.
- [x] lint clean, build OK, `npx playwright test` 101 passed.
