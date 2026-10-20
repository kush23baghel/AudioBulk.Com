// Checks the 5 GIF tools in a real browser and proves the GIFs are right:
// size, frame count, length (ffprobe), and that the pictures match the source (PSNR, frame by frame).
// Run: node tests/verify/gif-tools.mjs   (app on :4173, test files from fixtures.mjs)
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { BASE, OUT, FFMPEG, FFPROBE, fixture, ffmpeg, startBrowser, runBulk, sidewaysScroll, makeReporter } from './lib.mjs';

// ---- test files (made once) ----
const GIF = fixture('test.gif'); // 400×225, 10 fps, 4 s, from the moving test video
const STICKER = fixture('sticker.gif'); // 160×160 circle on a see-through background, 2 s
const PICS = [1, 2, 3].map((n) => fixture(`pic${n}.png`));
if (!fs.existsSync(GIF)) ffmpeg(['-t', '4', '-i', fixture('hd.mp4'), '-filter_complex', 'fps=10,scale=400:-1,split[a][b];[a]palettegen[p];[b][p]paletteuse', GIF]);
if (!fs.existsSync(STICKER)) ffmpeg(['-f', 'lavfi', '-i', "testsrc2=s=160x160:d=2:r=10,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lt(hypot(X-80,Y-80),60),255,0)'", '-filter_complex', 'split[a][b];[a]palettegen=reserve_transparent=1[p];[b][p]paletteuse=alpha_threshold=128', STICKER]);
PICS.forEach((p, i) => { if (!fs.existsSync(p)) ffmpeg(['-f', 'lavfi', '-i', `testsrc2=s=${[640, 400, 300][i]}x${[360, 400, 500][i]}:d=1`, '-frames:v', '1', p]); });

// ---- helpers ----
function info(file) {
  const j = JSON.parse(spawnSync(FFPROBE, ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', file], { encoding: 'utf8' }).stdout);
  const v = j.streams.find((s) => s.codec_type === 'video');
  return { w: v.width, h: v.height, frames: +v.nb_read_frames, dur: +j.format.duration, codec: v.codec_name, size: fs.statSync(file).size };
}
// Every frame as RGBA (ffmpeg's own GIF decoder: also proves our files decode correctly elsewhere).
function frames(file, w, h, filter) {
  const args = ['-v', 'error', '-i', file, ...(filter ? ['-vf', filter] : []), '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'];
  const buf = spawnSync(FFMPEG, args, { maxBuffer: 1 << 30 }).stdout;
  const size = w * h * 4;
  return Array.from({ length: Math.floor(buf.length / size) }, (_, i) => buf.subarray(i * size, (i + 1) * size));
}
function psnr(a, b) {
  let se = 0;
  let n = 0;
  for (let p = 0; p < a.length; p += 4) {
    if (a[p + 3] < 128 || b[p + 3] < 128) continue;
    for (let c = 0; c < 3; c++) { const d = a[p + c] - b[p + c]; se += d * d; }
    n += 3;
  }
  return n ? 10 * Math.log10((255 * 255) / (se / n || 1e-9)) : 99;
}
const avgPsnr = (xs, ys) => { const n = Math.min(xs.length, ys.length); let s = 0; for (let i = 0; i < n; i++) s += psnr(xs[i], ys[i]); return s / n; };
const kb = (b) => `${Math.round(b / 1024)} KB`;
const fmt = (i) => `${i.w}×${i.h}, ${i.frames} frames, ${i.dur.toFixed(2)} s, ${kb(i.size)}`;

const { report, done } = makeReporter();
const browser = await startBrowser();
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
page.setDefaultTimeout(300000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));
const check = async (name, fn) => {
  const t0 = Date.now();
  try { const [ok, msg] = await fn(); report(ok, name, `${msg} (${((Date.now() - t0) / 1000).toFixed(1)}s)`); }
  catch (e) { report(false, name, 'ERROR ' + e.message.split('\n')[0]); }
};
const src = info(GIF);
const srcFrames = frames(GIF, src.w, src.h);

await check('Video to GIF (MP4, browser engine)', async () => {
  const { saved } = await runBulk(page, 'video-to-gif', fixture('hd.mp4'));
  const i = info(saved);
  // Browsers read HD video colours as BT.709, so the reference does too (ffmpeg's default is the SD standard).
  const ref = frames(fixture('hd.mp4'), 480, 270, 'trim=0:5,fps=15,scale=480:270:in_color_matrix=bt709');
  const out = frames(saved, 480, 270);
  const each = out.map((f, k) => psnr(f, ref[k]));
  const q = each.reduce((a, b) => a + b, 0) / each.length;
  const worst = Math.min(...each);
  return [i.w === 480 && i.h === 270 && i.frames === 75 && Math.abs(i.dur - 5) < 0.06 && q > 27 && worst > 25, `${fmt(i)}, matches the video at ${q.toFixed(1)} dB (worst frame ${worst.toFixed(1)})`];
});
await check('Video to GIF (AVI → ffmpeg fallback)', async () => {
  const { saved } = await runBulk(page, 'video-to-gif', fixture('old.avi'));
  const i = info(saved);
  return [i.w === 480 && i.frames >= 70 && Math.abs(i.dur - 5) < 0.2, fmt(i)];
});
await check('GIF Editor: resize to 320', async () => {
  const { saved } = await runBulk(page, 'gif-editor', GIF, { prep: (p) => p.getByText('320 wide').click() });
  const i = info(saved);
  const q = avgPsnr(frames(saved, 320, 180), frames(GIF, 320, 180, 'scale=320:180'));
  return [i.w === 320 && i.h === 180 && i.frames === src.frames && Math.abs(i.dur - src.dur) < 0.06 && q > 26, `${fmt(i)}, matches at ${q.toFixed(1)} dB`];
});
await check('GIF Editor: 2× speed', async () => {
  const { saved } = await runBulk(page, 'gif-editor', GIF, { prep: async (p) => { await p.getByText('Speed', { exact: true }).click(); await p.getByText(/Twice as fast/).click(); } });
  const i = info(saved);
  return [Math.abs(i.dur - src.dur / 2) < 0.06 && i.frames === src.frames, `${fmt(i)} (was ${src.dur.toFixed(2)} s)`];
});
await check('GIF Editor: reverse', async () => {
  const { saved } = await runBulk(page, 'gif-editor', GIF, { prep: (p) => p.getByText('Reverse', { exact: true }).click() });
  const i = info(saved);
  const out = frames(saved, i.w, i.h);
  const q = avgPsnr(out, [...srcFrames].reverse());
  return [i.frames === src.frames && q > 30, `${fmt(i)}, matches the source played backwards at ${q.toFixed(1)} dB`];
});
await check('GIF Editor: crop to square', async () => {
  const { saved } = await runBulk(page, 'gif-editor', GIF, { prep: (p) => p.getByText('Crop to square').click() });
  const i = info(saved);
  const q = avgPsnr(frames(saved, 225, 225), frames(GIF, 225, 225, 'crop=225:225:87:0')); // centre: (400 − 225) / 2 = 87.5 → 87
  return [i.w === 225 && i.h === 225 && q > 30, `${fmt(i)}, middle matches at ${q.toFixed(1)} dB`];
});
await check('GIF Editor: transparent sticker keeps see-through', async () => {
  const { saved } = await runBulk(page, 'gif-editor', STICKER, { prep: (p) => p.getByText('Reverse', { exact: true }).click() });
  const i = info(saved);
  const f = frames(saved, i.w, i.h)[0];
  let clear = 0;
  for (let p = 3; p < f.length; p += 4) if (f[p] === 0) clear++;
  const centre = f[(80 * 160 + 80) * 4 + 3];
  return [clear > 160 * 160 * 0.3 && centre === 255, `${fmt(i)}, ${Math.round((clear / (160 * 160)) * 100)}% see-through, centre solid`];
});
await check('GIF Compressor (128 colors)', async () => {
  const { saved } = await runBulk(page, 'gif-compressor', GIF);
  const i = info(saved);
  const q = avgPsnr(frames(saved, i.w, i.h), srcFrames);
  return [i.size < src.size && i.frames === src.frames && q > 24, `${kb(i.size)} (was ${kb(src.size)}, ${Math.round((1 - i.size / src.size) * 100)}% smaller), still looks right at ${q.toFixed(1)} dB`];
});
await check('GIF Compressor (320 wide, 64 colors)', async () => {
  const { saved } = await runBulk(page, 'gif-compressor', GIF, { prep: async (p) => { await p.getByText(/Few colors \(64\)/).click(); await p.getByText('Up to 320 wide').click(); } });
  const i = info(saved);
  return [i.size < src.size / 2 && i.w === 320, `${fmt(i)} (was ${kb(src.size)})`];
});
await check('GIF to Video (ffmpeg, MP4)', async () => {
  const { saved } = await runBulk(page, 'gif-to-video', GIF);
  const i = info(saved);
  return [i.codec === 'h264' && Math.abs(i.dur - src.dur) < 0.2 && i.w === 400, fmt(i) + ' ' + i.codec];
});
await check('GIF Maker (3 pictures, 0.5 s each)', async () => {
  await page.goto(`${BASE}/tools/gif-maker`, { waitUntil: 'networkidle' });
  await page.locator('input[type=file]').setInputFiles(PICS);
  await page.getByRole('button', { name: 'Make GIF' }).click();
  const dl = page.getByRole('button', { name: 'Download' });
  await dl.waitFor();
  const [d] = await Promise.all([page.waitForEvent('download'), dl.click()]);
  const saved = path.join(OUT, 'gif-maker.gif');
  await d.saveAs(saved);
  const i = info(saved);
  const q = psnr(frames(saved, 480, 270)[0], frames(PICS[0], 480, 270, 'scale=480:270')[0]);
  return [i.w === 480 && i.h === 270 && i.frames === 3 && Math.abs(i.dur - 1.5) < 0.06 && q > 26, `${fmt(i)}, first picture matches at ${q.toFixed(1)} dB`];
});

const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
for (const t of ['video-to-gif', 'gif-editor', 'gif-compressor', 'gif-maker']) {
  await phone.goto(`${BASE}/tools/${t}`, { waitUntil: 'networkidle' });
  report(!(await sidewaysScroll(phone)), `Phone layout: ${t}`, 'no sideways scroll');
}
report(errors.length === 0, 'Page errors', errors.length ? errors.join(' || ') : 'none');
await browser.close();
done();
