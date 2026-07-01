<div align="center">

<h1>🎵 AudioBulk.com</h1>
<p><strong>71 browser-local tools for audio, video, AI writing, and marketing — no uploads, no servers, no paywalls.</strong></p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev)
[![FFmpeg.wasm](https://img.shields.io/badge/FFmpeg-WASM-green?logo=ffmpeg)](https://ffmpegwasm.netlify.app)
[![PWA](https://img.shields.io/badge/PWA-ready-purple)](https://web.dev/progressive-web-apps/)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/audiobulk.com)

**[🌐 Live Site](https://audiobulk.com)** · **[📋 All Tools](#-tools)**

</div>

---

## What is AudioBulk?

AudioBulk is a **100% client-side** multi-tool platform. Every tool runs inside your browser using WebAssembly — your files never leave your device. There is no backend, no database, no file upload endpoint, and no paywall.

| Claim | How it's enforced |
|-------|-------------------|
| 🔒 No file uploads | All processing runs in FFmpeg.wasm (browser MEMFS) |
| 🚫 No sign-up | Zero authentication layer in the entire codebase |
| 💸 100% free | Static PWA — hosting cost is zero |
| 📴 Works offline | Service worker caches all media tools |

---

## 🛠 Tools

<details>
<summary><strong>🎵 Audio Tools (14)</strong></summary>

| Tool | Description |
|------|-------------|
| Bulk Audio Converter | Convert MP3, WAV, AAC, FLAC, OGG, M4A in bulk |
| Bulk Audio Compressor | Reduce audio file size without re-encoding |
| Bulk Volume Changer | Boost or cut volume across multiple files |
| Bulk Speed Changer | Speed up or slow down audio (0.25x – 4x) |
| Audio Equalizer | Bass boost, treble, voice enhance, radio effect presets |
| Pitch Shifter | Shift pitch up/down in semitones |
| Vocal Remover | Center-channel extraction to remove or isolate vocals |
| Audio Trimmer | Trim audio with sub-second precision |
| Text to Speech | Browser-native TTS with voice/rate/pitch control |
| Voice Recorder | Record from microphone, download as WAV |
| GIF to Video | Convert animated GIFs to MP4 |
| First & Last Frame Extractor | Extract first/last frames from video as JPEG |
| Video to Audio | Extract audio from any video file |
| Bulk Video to Audio | Batch extract audio from multiple videos |

</details>

<details>
<summary><strong>🎬 Video Tools (12)</strong></summary>

| Tool | Description |
|------|-------------|
| Bulk Video Converter | Convert to MP4, WebM, AVI in bulk |
| Bulk Video Compressor | Compress 4K/HD video locally |
| Video Trimmer | Trim with frame-precise start/end times |
| Video Frame Extractor | Extract frames as JPEG/PNG at custom intervals |
| Video to GIF | Convert video clips to animated GIF |
| GIF Maker | Create GIFs from image sequences |
| GIF Editor | Edit existing GIFs (crop, speed, resize) |
| GIF Compressor | Reduce GIF file size |
| Video Resizer | Resize to any resolution with aspect ratio control |
| Video Cropper | Crop video to a custom bounding box |
| Video Muter | Strip all audio tracks from a video |
| Video Speed Changer | Speed/slow video with audio pitch correction |

</details>

<details>
<summary><strong>🤖 AI Writing Tools (30)</strong></summary>

Powered by [OpenRouter](https://openrouter.ai) — bring your own free API key.

Creative: AI Character Generator, AI Story Generator, Story Rewriter, Story Outline, Story Plot, Chapter Generator, Lyrics Generator, Poem Generator, Dialogue Generator, Dialogue Enhancer, Continue Writing, Story Summarizer

World-building: World Building Generator, Country Maker, Planet Generator, Faction Generator, Fantasy Currency Generator, Quest Generator, Boss Generator, Spell Generator, Superpower Generator, Character Outfit, Romantic Scenario, Artifact Generator

YouTube & Marketing: YouTube Video Ideas, YouTube Description Generator, YouTube Channel Name, TV Show Generator, Newsletter Generator, Book Title Generator

</details>

<details>
<summary><strong>📊 Marketing & Calculator Tools (10)</strong></summary>

| Tool | Description |
|------|-------------|
| Meta Ad Preview | Live Facebook/Instagram ad preview with character limit enforcement |
| Ad Cost & ROI Calculator | CTR, CPC, CPM, CPA, ROI from campaign data |
| Creative Capacity Calculator | Designer team output and cost-per-creative estimate |
| ChatGPT Ad Prompts | Pre-built prompt library for AI ad generation |
| FB Emoji Hub | Browse and copy Facebook-compatible emoji |
| AI Naming for Ads | Generate product/brand names for ad campaigns |
| FAQ Generator | AI-powered FAQ generation |
| Text Rephraser | AI paraphrase and rewrite |
| AI Character Generator | Character sheets for brand personas |
| Text Similarity Checker | Compare two text blocks for similarity |

</details>

<details>
<summary><strong>🔧 Developer & Utility Tools (5)</strong></summary>

| Tool | Description |
|------|-------------|
| JSON / SQL Formatter | Format, validate, and convert JSON to SQL INSERT statements |
| Word Counter | Word, character, sentence, and reading-time stats |
| Password Generator | Cryptographically secure, no modulo bias (`crypto.getRandomValues`) |
| Color Picker | Visual HSL/RGB/HEX color picker with palette export |
| Image Splitter | Split images into a grid (for Instagram carousel posts) |

</details>

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 8 |
| Media processing | FFmpeg.wasm 0.12 |
| AI | OpenRouter API (user-supplied key) |
| Styling | TailwindCSS 4 + DaisyUI 5 |
| Animations | Framer Motion 12 |
| PWA | vite-plugin-pwa + Workbox |
| Routing | React Router 7 |
| Deployment | Vercel (static, edge CDN) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Local Development

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/audiobulk.com.git
cd audiobulk.com

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open `http://localhost:5173`.

### AI Tools Setup (optional)
AI writing tools require a free [OpenRouter](https://openrouter.io) API key.

**Option A — Settings UI (recommended):** Click the ⚙️ Settings icon in the app and paste your key. It's stored in `localStorage` only — never sent anywhere except directly to OpenRouter.

**Option B — Environment variable:**
```bash
cp .env.example .env
# Edit .env and add your key
```

### Production Build

```bash
npm run build
# Output is in dist/ — deploy as a static site
```

---

## ☁️ One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/audiobulk.com)

> **Important:** The `vercel.json` in this repo sets the required `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless` headers. These are mandatory for FFmpeg.wasm (`SharedArrayBuffer`). Do not remove them.

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first.

```bash
# Fork the repo, then:
git checkout -b feature/my-new-tool
# Make your changes
git commit -m "feat: add [tool name]"
git push origin feature/my-new-tool
# Open a PR
```

---

## 📄 License

[MIT](./LICENSE) © 2026 AudioBulk
