// Checks the 8 audio file tools in a real browser (ffmpeg.wasm) and inspects every output with ffprobe,
// plus the smart notes and the noise-removal / loudness accuracy.
// Run: node tests/verify/audio-tools.mjs   (app on :4173, fixtures built)
import fs from 'fs';
import { fixture, probe, meanVolume, loudness, startBrowser, runBulk, sidewaysScroll, makeReporter } from './lib.mjs';

const { report, done } = makeReporter();
const MUSIC = fixture('music.wav');
const inDur = probe(MUSIC).dur, inSize = fs.statSync(MUSIC).size, inVol = meanVolume(MUSIC);

const browser = await startBrowser();
const page = await (await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 950 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));

async function check(name, run) {
  try { const [ok, msg] = await run(); report(ok, name, msg); } catch (e) { report(false, name, 'ERROR ' + e.message.split('\n')[0]); }
  if (await sidewaysScroll(page).catch(() => false)) report(false, `${name} layout`, 'page scrolls sideways');
}
const same = (p) => Math.abs(p.dur - inDur) < 0.15;

await check('Bulk Audio Converter', async () => { const { saved } = await runBulk(page, 'bulk-audio-converter', MUSIC); const p = probe(saved); return [p.a && same(p), `${p.ac} ${p.dur.toFixed(2)}s`]; });
await check('Converter note (96 kbps source)', async () => {
  await page.goto('http://localhost:4173/tools/bulk-audio-converter', { waitUntil: 'networkidle' });
  await page.locator('input[type=range]').first().fill('3');
  await page.locator('input[type=file]').first().setInputFiles(fixture('music96.mp3')); await page.waitForTimeout(1200);
  const note = (await page.locator('main li p.mt-1\\.5').allInnerTexts()).join(' ');
  return [/96 kbps/.test(note), note];
});
await check('Audio Compressor', async () => { const { saved } = await runBulk(page, 'bulk-audio-compressor', MUSIC); const p = probe(saved); return [p.a && fs.statSync(saved).size < inSize / 3, `${(p.size / 1024).toFixed(0)} KB (was ${(inSize / 1024).toFixed(0)} KB)`]; });
await check('Video to Audio', async () => { const { saved } = await runBulk(page, 'bulk-video-to-audio', fixture('clip.mp4')); const p = probe(saved); return [p.a && !p.v, `${p.ac} video=${p.v}`]; });
await check('Audio Speed Changer (1.5×)', async () => { const { saved } = await runBulk(page, 'bulk-audio-speed', MUSIC); const p = probe(saved); return [Math.abs(p.dur - inDur / 1.5) < 0.1, `${inDur.toFixed(2)}s → ${p.dur.toFixed(2)}s`]; });
await check('Volume Changer (same loudness)', async () => { const { saved } = await runBulk(page, 'bulk-audio-volume', MUSIC); const l = loudness(saved); return [Math.abs(l + 16) < 1, `${loudness(MUSIC).toFixed(1)} → ${l.toFixed(1)} LUFS (target −16)`]; });
await check('Vocal Remover', async () => { const { saved } = await runBulk(page, 'vocal-remover', MUSIC); const p = probe(saved); return [p.a && same(p), `${p.ac} ${p.dur.toFixed(2)}s`]; });
await check('Vocal Remover note (mono)', async () => {
  await page.goto('http://localhost:4173/tools/vocal-remover', { waitUntil: 'networkidle' });
  await page.locator('input[type=file]').first().setInputFiles(fixture('mono.wav')); await page.waitForTimeout(1200);
  const note = (await page.locator('main li p.mt-1\\.5').allInnerTexts()).join(' ');
  return [/mono/i.test(note), note];
});
await check('Pitch Shifter (+3, same length)', async () => { const { saved } = await runBulk(page, 'pitch-shifter', MUSIC); const p = probe(saved); return [same(p), `${inDur.toFixed(2)}s → ${p.dur.toFixed(2)}s`]; });
await check('Audio Equalizer', async () => { const { saved } = await runBulk(page, 'audio-equalizer', MUSIC); const p = probe(saved); return [p.a && same(p) && meanVolume(saved) !== inVol, `${p.ac} ${p.dur.toFixed(2)}s`]; });
await check('Remove background noise', async () => {
  const { saved } = await runBulk(page, 'audio-equalizer', fixture('noisy.wav'), { prep: (p) => p.getByText('Remove background noise', { exact: true }).click() });
  const p = probe(saved);
  return [p.a && p.channels === 1 && Math.abs(p.dur - 6) < 0.2, `${p.ac} mono=${p.channels === 1} ${p.dur.toFixed(2)}s`];
});

report(errors.length === 0, 'Page errors', errors.length ? errors.join(' || ') : 'none');
await browser.close();
done();
