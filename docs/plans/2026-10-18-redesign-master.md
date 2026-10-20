# AudioBulk redesign — full-site plan ("Quiet tool", light only)

## Context
The user approved the redesigned Bulk Audio Converter (commit `df324bf` on branch `redesign`): soft-cream page, wine `#7F011F` only on what you click, sand `#F5EBD0` for chips/highlights, plain-English text, numbered steps with settings shown before upload. Now every other page (home, directory, 69 tools, legal pages, header/footer) must move to that look, and the known tool bugs get fixed along the way. Decisions made: FAQ Generator + Text Rephraser become **real AI**; Watermark Remover gets **finished and listed** (site becomes 71 tools); the live site switches **all at once at the end** — each phase is reviewed on the Vercel preview of `redesign`, `main` is not touched until the user says "ship it".

## How the code will be organized (build once, reuse everywhere)
Today: 21 tools use the old dark `ToolPageLayout`, 30 AI pages are copy-pasted ~6 KB files, 19 utilities are one-offs, and ~66 files use FontAwesome / daisyUI / framer-motion classes.

New shape (all in `src/ui/`, extending what already exists):
- **`ToolFrame`** — extracted from `src/ui/BulkTool.jsx`: breadcrumb, eyebrow + plain-sentence title + intro, main column, "More … tools" + "Why is this free?" aside, FAQ, `SeoMeta`. Every tool page uses it.
- **`BulkTool`** (exists) — becomes `ToolFrame` + steps + files + progress + downloads. Used by all ffmpeg tools. Upgrade `FileList` to pick an icon by file type (audio / video / image / zip) instead of always the music note.
- **`AiTool`** (new) — `ToolFrame` + "Describe what you want" box + optional option chips + Generate + result card with Copy / Try again. One component for all 32 AI tools, fed by a new data file **`src/data/aiTools.js`** (per tool: system prompt, placeholder, example, options). The 30 copy-pasted files shrink to ~10 lines each or one route generated from data.
- **Utility pages** — keep their own logic, but render inside `ToolFrame` and use `Button`, `Card`, `ChoiceChips`, `QualitySlider` from `src/ui/controls.jsx`. New small blocks only when two tools need them: `TextArea`, `NumberField`, `ResultBox` (copy button), `Toggle`.
- **Icons** — swap FontAwesome strings in `src/data/tools.js` (`icon: "fa-…"`) for lucide-react names via a small map in `src/ui/icons.js`, so the FontAwesome CDN can be removed at the end.
- **Text** — `src/data/tools.js` gets plain-English `name` (short, searchable, kept for SEO) + `title` (plain sentence, e.g. "Make audio louder or quieter") + rewritten `desc`/`faqs`. URLs never change.

## Phases (each ends with: lint + build + tests green → commit → push `redesign` → user reviews preview)

**Status:** Phases 0, 1, 1.5, layout (sidebars + toggles), 2 and 2b (open-source audio upgrades, `ba8ed5e`) done. Phase 3 (video) DONE `a905589`, all 9 verified in browser. Next: Phase 4 (GIF & image). Phase 3 was run with sub-agents: shared video info + watch preview first (orchestrator), then one agent per tool (converter, compressor, resizer, cropper-fix, muter, frame-extractor-fix, first/last, trimmer-fix + start/end UI, watermark finish), then orchestrator verifies every tool in the browser with ffprobe; failures get researched (GitHub / competitors / rea) before sign-off.

**Phase 1.5 — Polish: fonts that never change, more contrast, smooth motion** (added after user review of Phase 1)
User feedback: (a) on refresh the page first shows a fallback font, then swaps; (b) colors feel dull, options need contrast; (c) hover animations on options; (d) scrolling should feel "like butter". Chosen contrast level: **Bold hover** (calm at rest, lively on hover).

*Fonts (no flash, no jump)*
- Self-host the two fonts: `npm i @fontsource-variable/figtree @fontsource-variable/bricolage-grotesque` (OFL), import them in `src/main.jsx`; drop Bricolage/Figtree from the Google Fonts `<link>` in `index.html` (old fonts stay until Phase 7).
- Preload the two latin `.woff2` files: small `transformIndexHtml` plugin in `vite.config.js` that injects `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the hashed font URLs.
- `fontaine` (unjs, MIT, build-time only) in `vite.config.js` generates metric-matched fallback faces, so even a first visit on slow internet has no visible jump.
- PWA: add `woff2` to `workbox.globPatterns` so fonts are cached and every refresh after the first is instant.
- Update `--font-display` / `--font-body` in `src/ui/tokens.css` to the variable family names.

*Contrast (Bold hover)*
- Tokens (`src/ui/tokens.css`): border `--color-line` a step darker; new `--color-sunken` (deeper cream) for section bands behind card grids; a wine-tinted shadow token.
- New `ToolCard` in `src/ui/` (replaces the duplicated card markup in `Home.jsx`, `AllTools.jsx`, `NotFound.jsx`): at rest sand icon box + clear border; on hover/keyboard focus it lifts 2px with a soft wine shadow, border turns wine, icon box fills solid wine with a cream icon, title turns wine, a small arrow slides in. Same treatment, bigger, for category cards.
- Header nav: wine underline that grows on hover and marks the current section. Buttons and chips: small press effect.

*Motion (butter-smooth, respects "reduce motion")*
- Smooth scrolling with **Lenis** (already installed, darkroomengineering/lenis) started in `src/ui/Shell.jsx`; off for touch devices (native is better) and when the OS asks for reduced motion; scrolling inside dialogs and result boxes stays native (`data-lenis-prevent`).
- Scroll reveal: sections and card grids fade/slide up ~12px once as they enter the screen, cards staggered — **framer-motion** (already installed) `whileInView` + `MotionConfig reducedMotion="user"`.
- All tools: cards animate smoothly when the filter or a category chip changes (framer-motion `layout` + `AnimatePresence`).
- Page changes: native View Transitions via React Router's `viewTransition` on links (soft cross-fade; silently skipped in browsers without support).
- Small delights: the logo's sound bars gently "play" on hover; the home tool preview ticks its files to "Done" one by one on load.
- Performance: animate only `transform`/`opacity`; remove `backdrop-blur` from the sticky header (solid cream, costly while scrolling).
- Apply the same cards/hover rules to the converter page and `ToolFrame` related-tools list.

*Verify*: Playwright with cache disabled — the first painted frame already uses Figtree (`document.fonts.check`), layout shift ≈ 0; hover screenshots of a card; scroll the All tools page while sampling frame times (no long frames); reduced-motion run shows no animation; full test suite green.

**Phase 0 — Foundation**
- Extract `ToolFrame`; file-type icons; `icons.js`; plain-text helpers.
- Header in `src/ui/Shell.jsx` gains **Search** (restyled `src/components/CommandPalette.jsx`, same Ctrl/⌘K behavior) and **AI settings** (restyled `src/components/SettingsModal.jsx`: "Your AI key", what it is, link to openrouter.ai, saved only in this browser).

**Phase 1 — Site frame pages** (move routes from old `Layout` to `Shell` in `src/App.jsx`)
- **Home** (`src/pages/Home.jsx`): hero ("Free tools for audio, video, GIFs and writing. No ads. Nothing uploaded.") + big search; category cards with real counts from `toolsList.length` (kills the 69+/70/71 mismatch); Recently used; Popular tools; "How it works" in 3 steps; "No ads, ever" strip; footer CTA. Drop the stat counters, marquee, glows, metallic button.
- **All tools** (`src/pages/AllTools.jsx`): search + category chips (ChoiceChips), clean list/grid of tools with icon, name, one-line plain description. Keep `?cat=` URLs and the counts the tests check.
- **404, Privacy, Terms**: rewritten in plain English inside the new frame.

**Phase 2 — Audio tools (13 left)** — migrate `ToolPageLayout` users to `BulkTool`, each verified with real files + ffprobe:
- Compressor, Volume, Speed, Equalizer, Video-to-Audio: restyle + plain settings (e.g. volume as "Quieter … Louder" with %).
- **Pitch Shifter fix**: keep length the same — add `atempo` correction after `asetrate` (`src/pages/tools/PitchShifter.jsx`).
- **Vocal Remover**: honest copy ("works best when the voice is in the middle of the mix"); AI upgrade (demucs-rs) noted as a later optional step.
- Voice Recorder, Text-to-Speech: custom pages inside `ToolFrame`.

**Phase 3 — Video tools**
- Converter, Compressor, Resizer, Cropper, Muter, Frame Extractor, First/Last Frame → `BulkTool`.
- **Trimmer fix**: put `-ss/-to` before `-i` (verified locally: keeps the video track). Add a video preview with "Set start here / Set end here" instead of typing `00:00:30`.
- **Frame Extractor fix**: reproduce the MP4 hang locally, fix (likely `-an` + explicit frame output), verify with MP4 and WebM.
- **Cropper check**: confirm whether "crop" is upscaling (320×240 → 1920×1080); make it really crop by aspect ratio.
- **Watermark Remover**: finish, add to `tools.js` + route, replace pixel inputs with "drag a box on the first frame".

**Phase 4 — GIF & image tools**
- Video→GIF, GIF→Video, GIF Compressor, GIF Editor, GIF Maker → `BulkTool` (GIF Maker takes images).
- Image Splitter, Image Hue Adjuster, Color Picker → `ToolFrame` + blocks.

**Phase 5 — AI writing (32 tools)**
- Build `AiTool` + `src/data/aiTools.js` (move the 30 system prompts out of their files).
- **Fix `src/lib/openrouter.js`**: turn off model "thinking" and raise `max_tokens` (empty answers seen with `deepseek-v4-flash`), retry once on empty, make the 30-second timeout actually apply when a signal is passed.
- When no key is set: friendly inline card ("Add your free AI key to use this tool" → opens Settings) instead of a red error.
- **FAQ Generator + Text Rephraser** → real AI via `AiTool`.
- Verify all 32 with the user's key (read from `.env`, never printed).

**Phase 6 — Marketing & utilities (17)**
- Word Counter, Password, UUID, JSON/SQL, Text Similarity, Emoji Picker, FB Emoji Hub, ChatGPT Ad Prompts, Meta Ad Preview, Ad Cost Calculator, Creative Calculator, AI Naming for Ads (UTM namer — rename honestly, it isn't AI) → `ToolFrame` + blocks, plain labels.

**Phase 7 — Clean-up**
- All routes now in `Shell`: delete old `Layout`, `Navbar`, `Footer`, `ToolPageLayout`, `ProcessingQueue`, `FileDropZone`, `PageTransition`; remove daisyUI, lenis, framer-motion (if unused), FontAwesome CDN, old fonts (Sora/Inter/Manrope); strip dead CSS from `src/index.css`; `index.html` drops `data-theme="night"`; PWA manifest colors → cream/wine.
- Rewrite README in plain English; update tests.

**Phase 8 — Ship**: final full check on preview → user says "ship it" → merge `redesign` into `main` → Vercel deploys → re-run the live checks.

## Rules applied in every phase
- Plain English everywhere; buttons say exactly what happens; errors say what went wrong and what to do.
- Wine only for primary actions/selected state; status always uses words + icon, not color alone.
- Phone width 390 px with no sideways scroll; visible keyboard focus; reduced-motion respected.
- Don't change URLs; don't push `main`; commit messages end with the Co-Authored-By line.

## Verification (each phase)
1. `npx eslint` on changed files + `npm run build`.
2. Playwright against `vite preview` (port 4173, has the COOP/COEP headers ffmpeg needs): every route in the phase mounts with no console errors; desktop 1366 + phone 390 screenshots; `scrollWidth > innerWidth` check.
3. Media tools: the existing real-file checker (scratchpad `verify.mjs` pattern) promoted to `tests/e2e/media-outputs.slow.spec.js` — runs each tool, downloads output, checks it with ffprobe (skips if ffprobe missing).
4. AI tools: run each with the user's key; pass = non-empty answer.
5. Update `tests/e2e/nav.spec.js` / `smoke.spec.js` (tool count 70 → 71, new text) and keep them green.
6. Push `redesign`, confirm the Vercel preview status is `success`, user reviews at `https://audiobulk-git-redesign-kushs-projects-8b562ec1.vercel.app` (behind Vercel login).

## Known follow-ups (not in this plan)
Dark mode (later, tokens already make it cheap) · AI vocal remover (demucs-rs) · AudioBulk MCP server for AI agents · revoking the old leaked GitHub token (user action).
