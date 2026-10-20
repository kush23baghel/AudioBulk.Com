# Rebuild the remaining 52 tools (phases 4–6)
Status: Done

## Goal
Every one of the 52 tools still on the old dark design:
- **Looks like the rest of the site:** the new light "Quiet tool" design.
- **Is easy to follow:** plain English and numbered steps.
- **Makes sense:** real logic that does something useful.
- **Checks input first:** it warns when something won't work.

The user tests in the browser; I check lint and build, plus a quick sanity run of each tool's logic.

## Why
The user wants every tool usable and sensible. Today 52 tools are old dark pages, and two of them are fake "AI" (FAQ Generator shuffles templates; Text Rephraser swaps random words). The AI pages are 30 copy-pasted files with known bugs (empty answers, no time limit).

## The 52 tools
- **GIF & images (8):**
  - BulkTool: Video to GIF, GIF to Video, GIF Compressor, GIF Editor, GIF Maker.
  - ToolFrame: Image Splitter, Color Picker, Image Color Adjuster.
- **AI writing (32):** the 26 AI writing tools, 4 marketing AI tools (YouTube Video Ideas, YouTube Description Writer, YouTube Channel Names, Newsletter Writer), plus FAQ Generator and Text Rephraser (made into real AI).
- **Marketing & everyday, non-AI (12):** Facebook & Instagram Ad Preview, Ad Name Builder, Design Team Calculator, Facebook Emoji Picker, Ad Cost Calculator, ChatGPT Ad Prompts, Word & Character Counter, Emoji Picker, JSON & SQL Formatter, Password Generator, Text Similarity Checker, UUID Generator.

## Steps
1. **AI engine (me):**
   - `src/lib/openrouter.js`: turn model "thinking" off, raise the answer length, retry once if the answer is empty, and make the time limit always apply.
   - New `src/ui/AiTool.jsx`, one page for all 32 AI tools:
     - Inputs: a "Describe what you want" box with an example, plus optional choice chips (length, tone…).
     - Result: Generate, a result card, Copy, and "Try again".
     - No key yet: a friendly "Add your free AI key" card.
   - Routes: each AI tool's route renders `<AiTool id="…" />`. The 30 copy-pasted files and the 2 fake ones are deleted.
2. **AI content (1 sub-agent):** `src/data/aiTools.js` gives each of the 32 tools a plain title and intro, a system prompt that produces a well-structured answer, a placeholder, an example, option chips that change the prompt, and 3 FAQs.
3. **GIF & images (2 sub-agents)** and **marketing & everyday (2 sub-agents)**, one file per tool:
   - Rebuild on BulkTool or ToolFrame with the controls in `src/ui/controls.jsx`.
   - Real logic and `inspect` notes, as in the audio and video tools.
   - Make sure the behaviour `tests/e2e/tools.spec.js` relies on still works: Word Counter's "Words" value, Text Similarity's 100%/0%, and UUID count.
4. **Routes, tips, tests (me):**
   - Move routes into the new shell.
   - Add right-sidebar tips for each category.
   - Update the e2e tests if text changed.
5. **Check (me):**
   - Lint and build.
   - `npx playwright test` (every page loads with no errors).
   - A quick logic run of the AI engine using the user's key.

## Later (separate plan, after this one)
Competitor research: find the free-tool sites with big audiences, see which tools are in demand, remove or swap tools nobody uses, and add the in-demand ones.

## Verification
- [ ] `npm run lint`, `npm run build`, `npx playwright test` pass
- [ ] No page in the app still uses the old dark classes (`glass-card`, `fa-`, `btn `): grep check
- [ ] AI engine: one real generation per option set with the user's key returns non-empty text

## Results (2026-10-20)
- [x] All 52 rebuilt. The 32 AI tools now run on one page (`src/ui/AiTool.jsx` + `src/data/aiTools.js`), and the 32 copy-pasted/fake files are deleted. Every route uses the new shell; the old dark Layout has no routes left (deleted in Phase 7).
- [x] AI engine (`src/lib/openrouter.js`):
  - "Thinking" is off. `reasoning: {enabled:false}` was tested against the user's model first.
  - Answers can be longer: 1600 tokens.
  - An empty answer is retried once.
  - A 60 s time limit always applies.
  - Error messages are plain (bad key, no credit, rate limit).
- [x] `tests/verify/ai-tools.mjs` with the user's key: Poem, FAQ Generator, Text Rephraser, Boss & Villain (the one that used to come back empty) and YouTube Video Ideas all returned real text in 5–14 s. No page errors.
- [x] No old dark classes left in `src/pages` or `src/ui` (grep).
- [x] Lint clean, build OK, `npx playwright test` 101 passed. `ai.spec` result selector updated to `main .overflow-y-auto`, because the sidebars scroll too.
- Browser testing of the GIF, image, marketing and everyday tools: **done by the user**, as agreed.
