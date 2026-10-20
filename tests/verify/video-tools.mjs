// Checks all 9 video tools in a real browser (ffmpeg.wasm) and inspects every output with ffprobe.
// Also checks the layout with many results (long 4K video) on desktop and phone.
// Run: node tests/verify/video-tools.mjs   (app on :4173, fixtures built)
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { BASE, OUT, FFMPEG, fixture, probe, unzip, startBrowser, runBulk, sidewaysScroll, makeReporter } from './lib.mjs';

const { report, done } = makeReporter();
const HD = fixture('hd.mp4');
const HD_SIZE = fs.statSync(HD).size;
const fmt = (p) => `${p.vc} ${p.w}x${p.h} sound=${p.a} ${p.dur.toFixed(2)}s`;

const browser = await startBrowser();
const page = await (await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 950 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));

async function check(name, run) {
  try { const [ok, msg] = await run(); report(ok, name, msg); } catch (e) { report(false, name, 'ERROR ' + e.message.split('\n')[0]); }
  if (await sidewaysScroll(page).catch(() => false)) report(false, `${name} layout`, 'page scrolls sideways');
}

// --- File tools (BulkTool) ---
await check('Bulk Video Converter', async () => { const { saved } = await runBulk(page, 'bulk-video-converter', HD); const p = probe(saved); return [p.v && p.a && p.w === 1280 && Math.abs(p.dur - 10) < 0.2, fmt(p)]; });
await check('Video Compressor', async () => { const { saved } = await runBulk(page, 'bulk-video-compressor', HD); const p = probe(saved); return [p.v && p.a && p.size < HD_SIZE, `${fmt(p)} ${(p.size / 1e6).toFixed(2)} MB (was ${(HD_SIZE / 1e6).toFixed(2)})`]; });
await check('Video Resizer (480p)', async () => { const { saved } = await runBulk(page, 'video-resizer', HD, { prep: (p) => p.getByText('480p', { exact: true }).first().click() }); const p = probe(saved); return [p.w === 854 && p.h === 480 && p.a, fmt(p)]; });
await check('Video Cropper (vertical)', async () => { const { saved } = await runBulk(page, 'video-cropper', HD, { prep: (p) => p.getByText(/^Vertical/).first().click() }); const p = probe(saved); return [p.h === 720 && p.w < 420 && p.w % 2 === 0 && p.a, fmt(p)]; });
await check('Video Muter', async () => { const { saved } = await runBulk(page, 'video-muter', HD); const p = probe(saved); return [p.v && !p.a && p.w === 1280 && Math.abs(p.dur - 10) < 0.2, fmt(p)]; });
await check('Frame Extractor (MP4)', async () => { const { saved } = await runBulk(page, 'video-frame-extractor', HD); const n = unzip(saved, 'frames-mp4').length; return [n === 5, `${n} pictures (expect 5)`]; });
await check('Frame Extractor (AVI fallback)', async () => { const { saved } = await runBulk(page, 'video-frame-extractor', fixture('old.avi')); const n = unzip(saved, 'frames-avi').length; return [n === 3, `${n} pictures (expect 3)`]; });
await check('First & Last Frame', async () => {
  const { saved } = await runBulk(page, 'first-last-frame-extractor', HD);
  const [first, last] = unzip(saved, 'first-last');
  const ref = path.join(OUT, 'ref_last.png');
  spawnSync(FFMPEG, ['-y', '-v', 'error', '-sseof', '-0.5', '-i', HD, '-update', '1', ref]);
  const psnr = +(/average:([\d.inf]+)/.exec(spawnSync(FFMPEG, ['-i', last, '-i', ref, '-lavfi', 'psnr', '-f', 'null', '-'], { encoding: 'utf8' }).stderr)?.[1] ?? 0);
  return [!!first && psnr > 24, `2 pictures, last frame matches the real last frame (PSNR ${psnr.toFixed(1)} dB, need > 24)`];
});

// --- Many results: the long 4K video (37 pictures) must give ONE tidy row, desktop and phone ---
for (const [label, viewport] of [['desktop', { width: 1440, height: 950 }], ['phone', { width: 390, height: 844 }]]) {
  await check(`Many results row (${label})`, async () => {
    const ctx = await browser.newContext({ acceptDownloads: true, viewport, isMobile: label === 'phone', hasTouch: label === 'phone' });
    const p = await ctx.newPage();
    try {
      await p.goto(`${BASE}/tools/video-frame-extractor`, { waitUntil: 'networkidle' });
      await p.locator('input[type=file]').first().setInputFiles(fixture('long4k.mp4'));
      await p.waitForTimeout(1500);
      await p.getByRole('button', { name: / 1 file/ }).first().click();
      await p.getByRole('button', { name: /Download all/ }).first().waitFor({ timeout: 300000 });
      // The file row (the numbered steps are list items too, so target the file list).
      const row = p.locator('main ul.divide-y > li').first();
      const rowButtons = await row.getByRole('button', { name: /Download|\(\.zip\)|^JPG$/ }).count();
      const label37 = (await row.innerText()).match(/\d+ pictures \(\.zip\)/)?.[0];
      await row.getByRole('button', { name: 'View' }).click();
      await p.waitForTimeout(500);
      const more = (await row.innerText()).match(/\+\d+ more in the download/)?.[0];
      const sideways = await sidewaysScroll(p);
      await p.screenshot({ path: path.join(OUT, `many-results-${label}.png`), fullPage: false });
      return [rowButtons === 1 && !sideways && !!label37, `row download buttons: ${rowButtons} ("${label37}"), gallery: "${more}", sideways scroll: ${sideways}`];
    } finally { await ctx.close(); }
  });
}

// --- One-video tools (ToolFrame) ---
await check('Video Trimmer (2.5 → 7 s)', async () => {
  await page.goto(`${BASE}/tools/video-trimmer`, { waitUntil: 'networkidle' });
  await page.locator('input[type=file]').first().setInputFiles(HD);
  await page.locator('video').first().waitFor({ timeout: 20000 }); await page.waitForTimeout(1500);
  await page.getByLabel(/start/i).first().fill('0:02.5');
  await page.getByLabel(/end/i).first().fill('0:07');
  await page.keyboard.press('Tab');
  await page.getByRole('button', { name: /Cut video/i }).first().click();
  const dl = page.getByRole('button', { name: /Download/i }).first(); await dl.waitFor({ timeout: 300000 });
  const [d] = await Promise.all([page.waitForEvent('download'), dl.click()]);
  const f = path.join(OUT, `trimmer__${d.suggestedFilename()}`); await d.saveAs(f); const p = probe(f);
  return [p.v && p.a && Math.abs(p.dur - 4.5) < 0.25, `${fmt(p)} (expect 4.5 s with picture and sound)`];
});
await check('Watermark Remover', async () => {
  await page.goto(`${BASE}/tools/watermark-remover`, { waitUntil: 'networkidle' });
  await page.locator('input[type=file]').first().setInputFiles(HD);
  const cv = page.locator('main canvas').first(); await cv.waitFor({ timeout: 20000 }); await page.waitForTimeout(1500);
  const bb = await cv.boundingBox();
  await page.mouse.move(bb.x + bb.width * 0.78, bb.y + bb.height * 0.06); await page.mouse.down();
  await page.mouse.move(bb.x + bb.width * 0.94, bb.y + bb.height * 0.17, { steps: 8 }); await page.mouse.up();
  await page.getByRole('button', { name: /Remove watermark/i }).first().click();
  const link = page.getByRole('link', { name: /Download MP4/i }); await link.waitFor({ timeout: 300000 });
  const [d] = await Promise.all([page.waitForEvent('download'), link.click()]);
  const f = path.join(OUT, `watermark__${d.suggestedFilename()}`); await d.saveAs(f); const p = probe(f);
  return [p.v && p.a && p.w === 1280 && Math.abs(p.dur - 10) < 0.2, fmt(p)];
});

report(errors.length === 0, 'Page errors', errors.length ? errors.join(' || ') : 'none');
await browser.close();
done();
