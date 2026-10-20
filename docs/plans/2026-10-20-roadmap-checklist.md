# Roadmap: build what people want, one step at a time
Status: Approved (2026-10-20). A1 done 2026-10-21. Work goes top to bottom. Each item gets its own plan doc + a verify script before it's built.

Why: see [competitor-research](2026-10-20-competitor-research.md).
- **#1 complaint everywhere:** "said free, then asked for money".
- **Most-wanted missing jobs:** subtitles, compress-to-size, silence cutting, vertical Shorts, voice clean-up, audio cutter, HEIC→JPG.
- **Creative AI generators:** show no demand.
- **Mid-job loss:** we (and competitors) lose your job when you switch tools.

## Part A: foundation (every tool benefits)
- [x] **A1. Jobs keep running when you switch tools.**
  - A shared job store (`src/lib/jobStore.js`) replaces the per-page list in `useBulkProcessor`.
  - A header chip "1 job running · 40%" shows the job; finished files wait there.
  - The video engine stops only on Stop or Clear.
  - The leave warning appears only when closing the tab would lose work.
- [ ] **A2. "Send to another tool"** on every result, with no re-picking.
- [ ] **A3. Clear failure messages:** unreadable files detected before starting, "try Chrome" advice, memory warnings for very large files.
- [ ] **A4. Say "Really free" clearly:**
  - A trust row: "No sign-up · No watermark · No limits · Files never leave your device".
  - Rewritten home headline.
  - A "How can this be free?" answer.
  - Proof: "Works offline once loaded".

## Part B: new tools (in this order)
- [ ] **B1. Compress to a size:** Discord 10 MB, WhatsApp 16 MB, email 25 MB, or custom. The result is checked and retried if still too big.
- [ ] **B2. Audio cutter:** waveform with set start and set end.
- [ ] **B3. Silence cutter,** audio and video, many files at once. Settings: threshold, minimum gap, pause to keep.
- [ ] **B4. Clean up voice:** RNNoise + even loudness in one step, no limits.
- [ ] **B5. Vertical video for Shorts/Reels/TikTok:**
  - Crop, or blurred-background fit.
  - 9:16, 1:1 or 4:5.
  - Many files at once.
  - Safe-zone overlay.
- [ ] **B6. Auto subtitles (Whisper in the browser):**
  - SRT/VTT download, or burned into the video.
  - Languages.
  - Word-by-word style.
- [ ] **B7. HEIC → JPG,** many at once, with an option to remove photo location.

## Part C: AI tools rethink
- [ ] **C1. Audit the 32 AI tools:** keep, merge, replace or remove, each with evidence. The user approves before changes. Removed tools redirect, so no broken links.
  - Candidates to add: "Make it sound human" rewriter, YouTube title tester, ad pre-flight checker.
- [ ] **C2. Build the approved replacements** on `promptKit` + `aiOutput`.

## Part D: finish
- [ ] **D1. Re-order the home page and menus by demand,** and update the tool lists and counts.
- [ ] **D2. Phase 7 cleanup, then ship** (only on "ship it").

## Later / maybe
- PDF tools without upload.
- Screen region → GIF.
- Shift subtitle timing.
- Batch photo watermark.
- Audio + picture → video.
- Dark mode.
- MCP server.

## Rules for every step
- Plan doc first.
- A verify script in `tests/verify/` that checks real output files.
- `npm run lint`, `npm run build`, `npx playwright test`, and a phone-width check.
- Results recorded.
- Commit to `redesign`; the user reviews before the next step.
