# AI tools that never give generic slop + a faster GIF engine
Status: Done

**Decisions (user, 2026-10-20):**
1. Second pass = a **"Make it better" button only**. It's not automatic.
2. Prove the prompts on the **user's model (deepseek-v4-flash) + a free model**. The default for new users = a free model that I verify works.
3. GIF to Video **keeps ffmpeg**, and this time it gets verified in the browser.

## Goal
1. **AI tools:** every one of the 32 tools gives a specific, useful, well-structured answer, every time, with **any** AI model (big or small, any provider). The same universal method applies to all of them.
2. **GIF tools:** fast and reliable in every browser, without depending on ffmpeg.wasm where a lighter, proven library does the job better.

## Why
The user asked for answers that "actually make sense, for anyone, with any AI model", and for the GIF tools (the biggest risk, since their ffmpeg commands were only tested in native ffmpeg) to use something faster or more compatible.

## Part A: universal AI method (the structured workflow)
Today each tool only *asks* the model to behave. Big models mostly comply; small or different models drift, which is where the generic slop comes from. The fix uses three layers that work with any model.

**A1. One prompt framework (`src/lib/promptKit.js`).** Each tool becomes a small *spec*; the framework builds the prompt in a fixed order:
1. **Role + goal + audience:** who it writes as, what the result is for, and who reads it.
2. **Exact output template:** required `##` headings in order, with what goes under each and how long.
3. **Specificity rules:** use concrete names, numbers, places, sensory details and examples. Every section must contain something only this input could produce.
4. **Banned list:** phrases and moves models fall back on ("In a world where…", "tapestry", "delve", "Here is…", "I hope this helps", vague adjectives, summaries of what was just said). It's shared by all tools and extendable per tool.
5. **Input handling:** the user's text goes inside `<user_input>` tags and is treated as material, never as instructions (this stops prompt injection). The answer comes back in the language of the user's text.
6. **Length budget,** stated in words per section.
7. **Silent final check:** a short checklist the model applies before answering (all headings present, nothing banned, specific). It is told to output only the final answer.

**A2. A code checker after every answer (`src/lib/aiOutput.js`).** It works with any model.
- **Cleans:** removes `<think>…</think>` blocks (reasoning models), code fences around the whole answer, opening lines like "Here is…" and closing lines like "Let me know…".
- **Checks:** required headings are present, the length is within budget, and nothing is banned.
- **Fixes:** if a check fails, it sends **one corrective follow-up** that names exactly what's wrong ("Missing sections: Weakness, Memorable Line. Rewrite in the exact format."). Then it shows the better of the two answers.

**A3. Settings per kind of tool:** creative (temperature 0.9), structured or planning (0.6), rewrite or summary (0.3), each with its own length.

**A4. A quality test you can rerun (`tests/verify/ai-quality.mjs`).** It runs all 32 tools with real keys on **two different models**: the user's model and a small free one. It reports per tool: headings present, banned phrases found, preamble found, length, and language. Pass = 32/32 on both models.

## Part B: GIF engine
| Tool | Now | New |
|---|---|---|
| Video to GIF | ffmpeg.wasm | Browser decodes the frames (`src/lib/videoFrames.js`, already proven) → **gifenc** (MIT, ~10 KB, fast palette + dithering) encodes, in a Web Worker so the page stays smooth |
| GIF Maker | ffmpeg.wasm | Canvas → **gifenc** |
| GIF Editor (resize, speed, reverse, crop) | ffmpeg.wasm | **gifuct-js** (MIT) decodes frames + delays → canvas edit → gifenc |
| GIF Compressor | ffmpeg.wasm | gifuct-js → fewer colors / smaller / drop frames → gifenc; keep the original if not smaller |
| GIF to Video | ffmpeg.wasm (H.264) | Decision 3 below |

No ffmpeg download (~30 MB) is needed for the four GIF-only tools. They're expected to be several times faster.

## Decisions for the user (asked before building)
1. **"Make it better" second pass?** A second AI call that reviews and improves the first answer. Costs ~2× time and tokens.
2. **Which models to prove it on, and the default model** for people who haven't picked one.
3. **GIF to Video:** keep ffmpeg (proven H.264 MP4 everywhere), or the browser's own encoder (WebCodecs + mp4-muxer, MIT; fast but needs a recent browser).

## Steps (after the decisions)
1. Build `promptKit.js` and `aiOutput.js`. Wire them into `AiTool.jsx` and `openrouter.js` (temperature per kind, one corrective retry).
2. Rewrite the 32 tool specs in `src/data/aiTools.js` on the framework. Each spec gets a real template, specificity rules and its own banned phrases.
3. Write `tests/verify/ai-quality.mjs` and run it on both models. Fix specs until 32/32 pass.
4. Install `gifenc` + `gifuct-js` and build `src/lib/gif.js`: encode (worker), decode, edit helpers. Rebuild the 4 (or 5) GIF tools on it.
5. Add `tests/verify/gif-tools.mjs` (real GIFs in the browser, frame count, size, delays, and "smaller than before" for the compressor) and run it.
6. Lint, build and the e2e tests. Record the results here.

## Verification
- [x] `node tests/verify/ai-quality.mjs`: 32/32 pass on both models (plus a third, small model)
- [x] `node tests/verify/ai-checker.mjs`: offline cleaner/checker tests
- [x] `node tests/verify/gif-tools.mjs`: all GIF tools pass in the browser
- [x] `node tests/verify/ai-tools.mjs`: the real AI page, including "Make it better"
- [x] lint, build, `npx playwright test`

## Results (2026-10-20)
**Bugs found along the way (all fixed):**
- The old default model (`meta-llama/llama-3-8b-instruct:free`) no longer exists on OpenRouter, so every new visitor without a chosen model got an error. The new default is `openrouter/free`, which picks whichever free model is up. Anyone who saved the dead name is moved over automatically.
- Some models refuse "thinking off" (error 400). We now ask again without that setting.
- Video to GIF showed the *previous* frame whenever a frame time fell exactly on a frame boundary (every 3rd frame at 15 fps from a 30 fps video). Fixed by seeking 1 ms later. The worst frame went from 17 dB to 29 dB.

**AI: universal method, built:**
- `src/lib/promptKit.js`: one prompt structure for every tool (ROLE, TASK, OUTPUT FORMAT, RULES, INPUT fenced as data, BEFORE YOU ANSWER self-check). It also sets temperature by kind (creative 0.85, plan 0.6, faithful 0.3).
- `src/lib/aiOutput.js`, a fixed workflow:
  - **Clean:** removes hidden thinking, a fence around the whole answer, "Here is…" openers, "Let me know…" closers and copied template brackets.
  - **Check:** required headings, exact counts, length and overused phrases.
  - **Fix:** one follow-up naming the exact problem. When length is the only problem, it sends a separate "shorten this" job instead.
  - **Keep** the better of the two answers.
  - "Make it better" button: a review-and-rewrite pass. It never swaps in a version that breaks the format.
- All 32 tools in `src/data/aiTools.js` have a kind, their own craft rules, exact labelled headings, and count checks where the visitor picks a number.
- Lessons that shaped the rules:
  - Examples written inside rules get copied word for word, so the rules now describe shapes instead of giving examples.
  - Small models can't count words, so length is also given in paragraphs.
  - Small models also can't "redo their own answer shorter", but normal models can do a separate shorten job.
- Quality runs (35 checks per model: the 32 tools + Spanish answer + Hindi answer + pasted text can't hijack the tool):

  | Model | Result |
  |---|---|
  | deepseek/deepseek-v4-flash (user's) | 35/35; 32/32 right first time |
  | nvidia/nemotron-3-super-120b-a12b:free | 35/35; 31/32 first time, 1 fixed by the follow-up |
  | nvidia/nemotron-3.5-lightning:free (small) | 34/35 hard checks; 1 answer stays longer than asked (counted as a warning: this model returns the text unchanged when asked to shorten) |

- Answers saved in `tests/verify/.out/ai/` and read by hand. They are specific: named places and people, real numbers, boss attacks with a warning sign and a counter, titles built on the book's own details.
- `ai-tools.mjs` in the real page passes on the user's model and on `openrouter/free`, including "Make it better".

**GIF engine: built, no ffmpeg for 4 of 5 tools:**
- `src/lib/gifWorker.js`: gifenc in a background worker, frames streamed one at a time. Ordered dithering, unchanged-pixel skipping, and transparency kept.
- `src/lib/gif.js`:
  - gifuct-js decoding with correct frame disposal.
  - Browser video frames.
  - `reencodeGif`: resize, square crop, speed, reverse and frame-rate limit. Frames shorter than 20 ms are joined, so speed is right in every browser.
- Video to GIF falls back to ffmpeg for formats the browser can't play (AVI test passes). GIF to Video keeps ffmpeg (user decision), now verified in the browser.
- `gif-tools.mjs`: 16/16 pass. Every output is checked with ffprobe and compared to its source picture by picture:

  | Tool | Result |
  |---|---|
  | Video to GIF | 480×270, 75 frames, 5.00 s, 29.8 dB, 6 s. 1,082 KB vs 1,126 KB from ffmpeg's own GIF |
  | Editor: resize | 34.5 dB |
  | Editor: 2× speed | exactly 2.00 s |
  | Editor: reverse | 36.9 dB against the source played backwards |
  | Editor: square | 35.9 dB |
  | Transparent sticker | stays see-through |
  | Compressor | 40% smaller at 45.5 dB; 66% smaller at 320 wide / 64 colours |
  | GIF to Video | H.264, 4.00 s |
  | GIF Maker | 3 frames, 1.50 s, 34.7 dB |

- No sideways scroll on phone, and no page errors.
- Test note: the PSNR reference for HD video uses BT.709 colours, because that is how browsers show HD video (ffmpeg's default is the older SD standard).
- Lint clean, build OK, `npx playwright test` 101 passed.
