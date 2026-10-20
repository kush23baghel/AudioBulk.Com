# Verification scripts

These run the real tools in a real browser (the same ffmpeg.wasm visitors get) and check every
output file with `ffprobe`. They cover what the quick Playwright tests in `tests/e2e/` don't:
correct results, edge cases (long 4K video, many results, mono files, no sound, old formats),
and layout (no sideways scrolling, one tidy row per file) on desktop and phone.

## Run
```
node tests/verify/fixtures.mjs        # once: builds test files into tests/verify/.fixtures
npm run build && npm run preview      # in another terminal: the app on http://localhost:4173
node tests/verify/audio-tools.mjs     # 8 audio tools + smart notes + loudness + noise removal
node tests/verify/video-tools.mjs     # 9 video tools + many-results layout on desktop and phone
node tests/verify/gif-tools.mjs       # 5 GIF tools: size, frames, length, and picture match (PSNR) vs the source
node tests/verify/ai-checker.mjs      # AI answer cleaner/checker, offline (no key, no app needed)
node tests/verify/ai-quality.mjs      # all 32 AI tools on 2 models (key from .env); add model names to pick others
node tests/verify/ai-tools.mjs        # the real AI page in the browser, incl. "Make it better"
```
AI answers from `ai-quality.mjs` are saved in `.out/ai/<model>/` so you can read them.
Run only some tools with `TOOLS=boss-generator,poem-generator node tests/verify/ai-quality.mjs`.
Each line prints `OK` or `BAD` with the measured numbers; the script exits with 1 if anything failed.
Outputs and screenshots go to `tests/verify/.out/` (ignored by git).

Needs ffmpeg and ffprobe: set `FFMPEG_DIR`, or they're taken from `C:/FFmpeg/bin`, or from your PATH.
Point at another server with `VERIFY_BASE_URL=https://… node tests/verify/video-tools.mjs`.

## When to run
Before calling any phase or fix done (see `docs/plans/README.md`). Add a check here whenever a bug is found,
so it can't come back.
