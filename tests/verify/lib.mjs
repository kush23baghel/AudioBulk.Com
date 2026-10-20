// Shared helpers for the browser verification scripts in tests/verify/.
// Needs: the app running (`npm run build && npm run preview`, port 4173) and ffmpeg + ffprobe
// (set FFMPEG_DIR, else C:/FFmpeg/bin, else whatever is on PATH).
import fs from 'fs';
import path from 'path';
import { execFileSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const FIXTURES = path.join(HERE, '.fixtures');
export const OUT = path.join(HERE, '.out');
export const BASE = process.env.VERIFY_BASE_URL || 'http://localhost:4173';

const dir = process.env.FFMPEG_DIR || (fs.existsSync('C:/FFmpeg/bin/ffmpeg.exe') ? 'C:/FFmpeg/bin' : '');
export const FFMPEG = dir ? path.join(dir, 'ffmpeg') : 'ffmpeg';
export const FFPROBE = dir ? path.join(dir, 'ffprobe') : 'ffprobe';

export const fixture = (name) => path.join(FIXTURES, name);
export const ffmpeg = (args) => execFileSync(FFMPEG, ['-y', '-v', 'error', ...args], { stdio: 'inherit' });

export function probe(file) {
  const j = JSON.parse(execFileSync(FFPROBE, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]).toString());
  const v = j.streams.find((s) => s.codec_type === 'video' && s.disposition?.attached_pic !== 1);
  const a = j.streams.find((s) => s.codec_type === 'audio');
  return { dur: +j.format.duration, w: v?.width, h: v?.height, vc: v?.codec_name, ac: a?.codec_name, a: !!a, v: !!v, channels: a?.channels, size: fs.statSync(file).size };
}

export const meanVolume = (file) => +(/mean_volume:\s*(-?[\d.]+)/.exec(spawnSync(FFMPEG, ['-i', file, '-af', 'volumedetect', '-vn', '-f', 'null', '-'], { encoding: 'utf8' }).stderr)?.[1]);

export function loudness(file) {
  const err = spawnSync(FFMPEG, ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=framelog=quiet', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  return +(/I:\s+(-?[\d.]+) LUFS/.exec(err.split('Summary:')[1] || '')?.[1]);
}

export function unzip(zip, name) {
  const to = path.join(OUT, name); fs.rmSync(to, { recursive: true, force: true }); fs.mkdirSync(to, { recursive: true });
  execFileSync('tar', ['-xf', zip, '-C', to]);
  return fs.readdirSync(to).map((f) => path.join(to, f)).sort();
}

export async function startBrowser() {
  if (!fs.existsSync(FIXTURES)) throw new Error('No test files yet. Run: node tests/verify/fixtures.mjs');
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
  try { await fetch(BASE); } catch { throw new Error(`The app isn't running at ${BASE}. Run: npm run build && npm run preview`); }
  const browser = await chromium.launch();
  return browser;
}

// True if the page can be scrolled sideways (a layout bug at that width).
export const sidewaysScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);

// Runs a BulkTool page: add files, press the main button, download the result. Returns the saved path.
export async function runBulk(page, tool, files, { prep, timeout = 300000 } = {}) {
  await page.goto(`${BASE}/tools/${tool}`, { waitUntil: 'networkidle' });
  if (prep) await prep(page);
  await page.locator('input[type=file]').first().setInputFiles(files);
  await page.waitForTimeout(1200);
  const note = (await page.locator('main li p.mt-1\\.5').allInnerTexts()).join(' | ');
  await page.getByRole('button', { name: / \d+ files?/ }).first().click();
  const dl = page.getByRole('button', { name: /^Download$|Download all/ }).first();
  await Promise.race([
    dl.waitFor({ timeout }),
    page.getByText("Didn't work").first().waitFor({ timeout }).then(async () => {
      throw new Error('tool said: ' + (await page.locator('main li p.text-bad').first().innerText().catch(() => "Didn't work")));
    }),
  ]);
  const [d] = await Promise.all([page.waitForEvent('download'), dl.click()]);
  const saved = path.join(OUT, `${tool}__${d.suggestedFilename()}`);
  await d.saveAs(saved);
  return { saved, note };
}

export function makeReporter() {
  let fails = 0;
  const report = (ok, name, msg) => { if (!ok) fails++; console.log(`${ok ? 'OK ' : 'BAD'} ${name.padEnd(34)} ${msg}`); };
  return { report, done: () => { console.log(fails ? `\n${fails} check(s) FAILED` : '\nAll checks passed'); process.exitCode = fails ? 1 : 0; } };
}
