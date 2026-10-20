# Competitor research: what happens mid-job, and what users want that nobody gives them
Status: Done. Led to the [roadmap checklist](2026-10-20-roadmap-checklist.md).

## Goal
1. **Mid-job test.** On 5 big competitor sites and on AudioBulk: start a video job (trim or compress), then click a different tool while it's running. Record exactly what happens to the job, in plain English.
2. **Demand research.** Read competitor reviews (Chrome Web Store, Trustpilot, G2, app stores) and Reddit threads in our categories. List what people ask for that the big players don't give them. Turn that into a ranked list of features or tools AudioBulk can build with open-source parts.

## Why
The user wants a business edge: copy nothing, but fix what big players ignore. They also want to know how others handle "I left the page while it was working", so AudioBulk does it better.

## Steps
1. Pick 5 popular video-trim/compress sites that work without an account.
2. For each site, use a real browser (Playwright) with a real test video:
   - Start the job, then click another tool in the site's own menu during processing.
   - Record:
     - Does the site warn before leaving?
     - Does the page fully reload or switch inside the app?
     - Does the job keep running, get lost, or come back?
     - Is the video uploaded to their server or processed in the browser?
   - Screenshots go to `tests/verify/.out/competitors/`.
3. Run the same test on AudioBulk (local build).
4. Demand research with web search: reviews and Reddit, top complaints and top wishes per category (video, audio, GIF, AI writing).
5. Write the findings here. Then recommend changes for the user to approve before anything is built.

## Verification
- Every claim about a site comes from what the browser actually did (screenshot or log), not from guessing.
- If a site blocks the test (login wall, captcha), it gets reported as blocked, not guessed.

## Results: part 1, the mid-job test (2026-10-20)
Script: `tests/verify/competitors-leave.mjs`. Test video: 18 MB, 74 s, 4K. Screenshots are in `tests/verify/.out/competitors/`.

| Site | Where the work happens | Warns before you leave? | Click another tool mid-job | Press Back |
|---|---|---|---|---|
| **123apps** (online-video-cutter.com) | **Their server.** The whole 18.2 MB went to `s97.123apps.io/vcutter/upload/flow/` the moment the file was picked, even though the page says "works in your browser". | **No** | Full page load. "Encoding 1%" is gone. | Empty start page: no file, no job, no result |
| **Clideo** | **Their server.** Upload to `cs56.clideo.com/uploader.php`, job started by `api/converter/convert`, progress polled from `api/converter/processing`. Its only WebAssembly file is `canvaskit` (drawing the screen). Upload size not measurable with our tools. | **Yes** (browser "Leave site?" box) | Full page load. "Exporting 11%" is gone from view. | Start page of the cutter, empty |
| **ezgif** | **Their server.** "Upload video!" sends the file, and it gets a server address (`ezgif-3c62….mp4`). | **No** | Full page load. **The same uploaded file is carried into the new tool** (address keeps the file id). The running cut is abandoned. | The uploaded video is still there. The cut result is not shown, so you click "Cut video!" again |
| **VEED** | **Their cloud.** 18.2 MB to `storage.googleapis.com`. WebAssembly only reads video info and draws the preview. | **Yes** | Full page load | **The cloud project comes back** with the video. But downloading needs a free account ("Sign up to download") |
| **Kapwing** | Unknown | n/a | n/a | **Blocked:** "Sign in to continue" appears as soon as you add a video |
| **FreeConvert** | Unknown | n/a | n/a | **Blocked for automated testing:** its file menu never accepted the file from the test browser (not a claim about real users) |
| **AudioBulk (us)** | **Your browser.** Nothing uploaded. | **No** | No page load (the site stays open), but leaving the page **stops the job and shuts the video engine down** (`useBulkProcessor.js`, on leaving). A new job elsewhere runs at once (4 s clip in 5 s). | Empty: the file and the job are gone |

**Plain summary:**
- Every big player that works without an account does the job **on their server**, and full page loads mean a job in progress simply disappears from your screen.
- The only ones that "remember" do it because your file **lives on their server**: ezgif keeps the upload, and VEED keeps a cloud project behind an account wall.
- Two of the four warn you (Clideo, VEED); 123apps and ezgif don't. **We don't warn either, and we throw the job away.**

**Our advantage:** the site stays open when you switch tools (no page load), and nothing is on a server. So we *can* keep a job running while you browse other tools, which none of them can do without your file on their server.

**Proposed fix, for the user to approve (separate plan before building):**
1. Jobs keep running when you switch tools. A small "1 job running · 40%" chip in the header takes you back, and finished files wait there to download.
2. A warning only when closing the tab or reloading would really lose work.
3. "Send to another tool" on every result (like ezgif's carried file, but without uploading).
4. Stop shutting the video engine down on every page change.

## Results: part 2, demand research
Six researchers run in parallel, each from a different angle. Every finding must come with a link and a real quote; anything unverified is marked as such.
1. **Review reader:** Trustpilot, G2, Capterra and Chrome Web Store reviews of 123apps, Clideo, FreeConvert, VEED, Kapwing, ezgif, CloudConvert and similar.
2. **Reddit, video/audio creators:** r/VideoEditing, r/podcasting, r/NewTubers, r/youtubers, r/editors, r/audioengineering.
3. **Reddit, "is there a tool that…":** unmet-tool requests across r/software, r/privacy, r/webdev, r/InternetIsBeautiful, r/selfhosted, r/DataHoarder.
4. **AI writing and marketing tools:** complaints about generic AI output, paywalls and credit limits; what marketers and writers ask for.
5. **Mobile app stores + creator apps:** complaints about CapCut, InShot, VN and similar (watermarks, paywalls, privacy), and what people want instead.
6. **Search demand and launches:** "alternative to X" threads, Product Hunt and Hacker News comments on browser/ffmpeg.wasm tools, trending needs (shorts, subtitles, silence removal, podcast loudness).

### What limits this research
- **Reddit was unreachable by every route:** web fetch, search, the Chrome extension, archives, and a direct request from this computer (403). Reddit blocks AI crawlers. Nothing below comes from Reddit. The user can paste threads if wanted.
- **G2, Capterra and Google Trends were blocked.** Semrush showed the Bangladesh keyword database, so the numbers show which jobs lead, not worldwide size.
- **Reviews are mostly 1-star pages,** which shows what drives people away, not what typical users think.
- **Stack Exchange questions are mostly from 2014–2021:** long-lasting needs, not new trends.
- **Sources that were read:** about 100 real pages (Trustpilot ×20+, Hacker News threads and comments, Stack Exchange, Adobe/Shotcut creator forums, App Store, news). Every quote has a link in the researchers' reports.

### Combined findings, ranked by how many independent researchers found them (out of 6)
| # | Need | Found by | Strongest evidence | AudioBulk today |
|---|---|---|---|---|
| 1 | **Really free:** no paywall or sign-up at the download button, no watermark, no subscription or credits | 5 of 6 | ~25 reviews "said free, then asked for money"; CapCut: 31% of 2,881 negative reviews about Pro/paywall; Clideo's #1 complaint is watermarks; Jasper/vidIQ/Copy.ai 1-star pages are mostly billing traps; HN criticises "100% local… asking for a login when exporting" | Already true, but **we don't say it clearly** |
| 2 | **Auto subtitles / speech to text** (SRT download, burned-in, animated word-by-word for Shorts) | 4 of 6 | "how to add subtitles to video": 33,100 searches, 13% of Clideo's traffic; offline transcription asks on Stack Exchange and HN; Shotcut users want word-by-word captions; CapCut limits free captions | **Missing** |
| 3 | **Compress to a target size** (Discord 10 MB, WhatsApp 16 MB, email 25 MB) | 4 of 6 | "A 'save as no larger than' option would be slick!"; people built single-purpose apps for it; HN praised Discord presets | Compressor has quality levels only, **no target size** |
| 4 | **Cut silence automatically / shorten pauses** (audio and video) | 3 of 6 | 6 forum threads + ~9 Adobe idea-board requests (2017–2025); batch "normalize + trim silences" asks; current fixes are command-line or $10/month | **Missing** |
| 5 | **Vertical 9:16 for Reels/Shorts** (blurred-background fill, batch) + safe-zone check | 3 of 6 | iMovie exports vertical with black bars (Apple forum); Shotcut batch reframe request; "i always lose my captions at the bottom" | Cropper has a vertical crop only (no blur fill, no safe zone) |
| 6 | **Voice clean-up with no daily limit** (noise + loudness) | 3 of 6 | Adobe Podcast free tier: "wait for 1 hour per clip", low-bitrate output; batch normalise asks | We have RNNoise + loudness, **spread over 2 tools** and not named for this job |
| 7 | **Broken exports and unclear failures** (codec, memory, stuck at 75%) | 3 of 6 | ~20 reviews "error after error"; HN: HEVC/10-bit failures, Brave memory crash | Partly: smart checks exist; no "your browser can't do this, try Chrome" or memory warnings |
| 8 | **Prove privacy, don't just claim it** (works offline, network indicator, open source) | 3 of 6 | HN launches: "no upload" alone got 1–7 points out of 25; winners (601/301/269 points) were simple and proved it; VERT was caught uploading by default. Reviews: almost no one complains about uploads | We claim it; **no proof shown** |
| 9 | **HEIC (iPhone) → JPG without the cloud** | 2 of 6 | superuser question ~170k views; VERT commenter "please add HEIC" | **Missing** |
| 10 | **Audio/MP3 cutter** and **video → MP3** as their own pages | 1 of 6 (strong numbers) | Clideo: "mp3 cutter" + "audio cutter" ~25% of traffic; FreeConvert's top keyword "video to audio" | Video→MP3 exists; **no audio cutter** |
| 11 | **AI writing: sounds human, not generic; no credits** | 2 of 6 | "Every AI writing tool we tried output generic, formulaic slop"; credits expire; BYOK praised on HN (6/10) | Fixed today (universal prompt workflow) + BYOK; **say it** |
| 12 | **Low demand: creative AI generators** (poem, lyrics, plot, world, planet, currency…), ChatGPT ad prompts, emoji pickers | 2 of 6 (absence of evidence) | No source asked for them; no search/launch evidence | 32 AI tools, most of them creative |
| 13 | **PDF tools without upload** (merge, shrink, unlock, redact) | 1 of 6 | ~6 askers, all for privacy; HN makers built tools for it | Not our niche (yet) |
| 14 | Single asks: screen-region → GIF, remove photo location (EXIF), shift subtitle timing (750k views), batch watermark photos, audio + image → video for YouTube, AI ad pre-flight checker, UTM builder, YouTube title tester | 1 each | see reports | Missing |

**Where the researchers disagreed:**
- **Privacy:** reviews barely mention it, while news (CapCut's 2025 forever-licence terms) and HN care about it. Conclusion: lead with **"really free, no wall, no watermark"**. Privacy is the proof of *why* we can be free, shown and not just claimed.

**Part 1 tie-in:** nobody (us included) keeps a job when you switch tools. That's a free win, already proposed above.

Next: the user and I design the architecture plan from this list before anything is built.
