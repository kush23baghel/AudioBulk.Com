// Research: on competitor sites, what happens to a running video job when you click another tool?
// For each site: pick a video → start the job → after a few seconds click a different tool →
// record (leave warning? full page reload? bytes uploaded to their servers) → press Back → what's left?
// Screenshots: tests/verify/.out/competitors/. Sites change; selectors may need updating.
// Run: node tests/verify/competitors-leave.mjs [siteName]
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { HERE, fixture } from './lib.mjs';

const OUT = path.join(HERE, '.out', 'competitors');
fs.mkdirSync(OUT, { recursive: true });
const VIDEO = fixture('long4k.mp4'); // 18 MB, 74 s, 4K: long enough that the job is still running when we leave

const SITES = [
  {
    name: '123apps (online-video-cutter.com)',
    url: 'https://online-video-cutter.com/',
    start: (p) => p.getByRole('button', { name: 'Save' }).click(),
    leave: (p) => p.getByRole('link', { name: 'GIF Cutter' }).click(),
  },
  {
    name: 'Clideo (clideo.com)',
    url: 'https://clideo.com/cut-video',
    // Export appears before Clideo has finished taking the file ("Error: The type field is required"), so wait.
    ready: async (p) => { await p.getByRole('button', { name: 'Export' }).waitFor({ timeout: 120000 }); await p.waitForTimeout(30000); },
    start: (p) => p.getByRole('button', { name: 'Export' }).click(),
    // The editor page has no other links; a visitor would open another tool from the site.
    leave: (p) => p.goto('https://clideo.com/compress-video', { waitUntil: 'domcontentloaded' }),
    leaveNote: 'typed another Clideo tool address (the editor page has no tool links)',
  },
  {
    name: 'ezgif (ezgif.com)',
    url: 'https://ezgif.com/cut-video',
    // Their flow: "Upload video!" sends the file, then a new page with "Cut video!".
    ready: async (p) => {
      await p.locator('input[type=submit][value="Upload video!"]').click();
      await p.locator('input[type=submit][value*="Cut video" i]').waitFor({ timeout: 180000 });
    },
    start: (p) => p.locator('input[type=submit][value*="Cut video" i]').click(),
    leave: (p) => p.getByRole('link', { name: 'Video speed changer' }).first().click(),
  },
  {
    name: 'FreeConvert (freeconvert.com)',
    url: 'https://www.freeconvert.com/video-compressor',
    pick: async (p) => {
      // "Choose Files" opens a menu (Device, Dropbox, Drive…); "From Device" opens the file picker.
      await p.getByText('Choose Files', { exact: true }).first().click();
      const [chooser] = await Promise.all([p.waitForEvent('filechooser', { timeout: 20000 }), p.getByText('From Device').first().click()]);
      await chooser.setFiles(VIDEO);
    },
    ready: (p) => p.getByRole('button', { name: /Compress Now/i }).waitFor({ timeout: 60000 }),
    start: (p) => p.getByRole('button', { name: /Compress Now/i }).click(),
    leave: (p) => p.getByRole('link', { name: 'Video Converter', exact: true }).first().click(),
  },
];

// Online editors: the tool page opens an editor first, then you export.
const exportClick = async (p, first) => {
  await p.getByRole('button', { name: first }).first().click();
  await p.waitForTimeout(3000);
  // The export window's own button, if one appears (sign-up walls are reported as they are).
  const again = p.locator('[role=dialog] button, [class*=modal] button').filter({ hasText: /export|download|continue/i }).first();
  if (await again.isVisible().catch(() => false)) await again.click();
};
SITES.push(
  {
    name: 'VEED (veed.io)',
    url: 'https://www.veed.io/tools/video-cutter',
    enter: async (p) => { await p.getByRole('link', { name: 'Cut video' }).first().click(); await p.locator('input[type=file]').first().waitFor({ state: 'attached', timeout: 60000 }); },
    ready: (p) => p.waitForTimeout(45000),
    start: (p) => exportClick(p, 'Done'),
    leave: (p) => p.goto('https://www.veed.io/tools/video-compressor', { waitUntil: 'domcontentloaded' }),
    leaveNote: 'typed another VEED tool address (the editor has no tool links)',
  },
  {
    name: 'Kapwing (kapwing.com)',
    url: 'https://www.kapwing.com/tools/trim-video',
    enter: async (p) => { await p.getByText('Trim Video').first().click(); await p.locator('input[type=file]').first().waitFor({ state: 'attached', timeout: 60000 }); },
    ready: (p) => p.waitForTimeout(45000),
    start: (p) => exportClick(p, 'Export Project'),
    leave: (p) => p.goto('https://www.kapwing.com/tools/compress-video', { waitUntil: 'domcontentloaded' }),
    leaveNote: 'typed another Kapwing tool address (the editor has no tool links)',
  },
);

const only = process.argv[2];
const browser = await chromium.launch({ headless: true });
for (const site of SITES.filter((s) => !only || s.name.toLowerCase().includes(only.toLowerCase()))) {
  const slug = site.name.split(' ')[0].toLowerCase();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' });
  const page = await ctx.newPage();
  page.setDefaultTimeout(60000);
  let uploaded = 0;
  const hosts = new Set();
  const perHost = {};
  // Read every outgoing request body, pages and background workers alike: anything big is your
  // video going to their servers.
  // Two views are needed: page.route can read file bodies but misses background workers;
  // the context sees workers and the "Content-Length" each upload declares. Biggest per request wins.
  // Counted when each upload STARTS (a big upload is still running while we look).
  const counted = new Map(); // request → bytes counted so far
  const add = (r, n) => {
    const prev = counted.get(r) || 0;
    if (n <= prev) return;
    counted.set(r, n);
    const h = new URL(r.url()).hostname;
    if (process.env.SHOW_UPLOADS && n > 100000) console.log('      upload:', r.method(), h + new URL(r.url()).pathname.slice(0, 50), (n / 1e6).toFixed(2), 'MB');
    perHost[h] = (perHost[h] || 0) + n - prev;
    uploaded = Object.values(perHost).reduce((a, b) => a + b, 0);
    hosts.clear();
    Object.entries(perHost).filter(([, v]) => v > 500000).forEach(([k, v]) => hosts.add(`${k} (${(v / 1e6).toFixed(1)} MB)`));
  };
  const isUpload = (r) => ['POST', 'PUT', 'PATCH'].includes(r.method());
  await page.route('**/*', (route) => {
    const r = route.request();
    if (isUpload(r)) add(r, r.postDataBuffer()?.length || 0);
    route.continue().catch(() => {});
  });
  const wasm = new Set();
  ctx.on('response', (res) => { if (/\.wasm(\?|$)/.test(res.url()) || /application\/wasm/.test(res.headers()['content-type'] || '')) wasm.add(new URL(res.url()).pathname.split('/').pop()); });
  ctx.on('request', async (r) => {
    if (!isUpload(r)) return;
    if (process.env.SHOW_ALL) console.log('      any upload:', r.method(), new URL(r.url()).hostname + new URL(r.url()).pathname.slice(0, 50), r.postDataBuffer()?.length ?? 'body unknown');
    const headers = await r.allHeaders().catch(() => ({}));
    add(r, Math.max(r.postDataBuffer()?.length || 0, Number(headers['content-length'] || 0)));
  });
  ctx.on('websocket', (ws) => ws.on('framesent', (f) => { const n = typeof f.payload === 'string' ? f.payload.length : f.payload.length; perHost[`ws:${new URL(ws.url()).hostname}`] = (perHost[`ws:${new URL(ws.url()).hostname}`] || 0) + n; }));
  const dialogs = [];
  page.on('dialog', async (d) => { dialogs.push(`${d.type()}${d.message() ? ': ' + d.message() : ''}`); await d.accept(); });
  const say = (...a) => console.log('  ', ...a);
  console.log(`\n=== ${site.name}`);
  try {
    await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    if (site.enter) await site.enter(page);
    await (site.pick ? site.pick(page) : page.locator('input[type=file]').first().setInputFiles(VIDEO));
    await (site.ready ? site.ready(page) : page.waitForTimeout(8000));
    say(`After picking the video: ${(uploaded / 1e6).toFixed(1)} MB sent to ${[...hosts].join(', ') || 'nobody'}`);
    await site.start(page);
    await page.waitForTimeout(6000);
    await page.screenshot({ path: path.join(OUT, `${slug}-1-working.png`) });
    say(`6 s after starting: ${(uploaded / 1e6).toFixed(1)} MB sent in total to ${[...hosts].join(', ') || 'nobody'} | page: ${page.url()}`);
    say(`In-browser engine? WebAssembly files: ${[...wasm].join(', ') || 'none'} | background workers: ${page.workers().length}`);

    await page.evaluate(() => { window.__marker = 1; }).catch(() => {});
    const before = page.url();
    await site.leave(page);
    await page.waitForTimeout(5000);
    const reloaded = !(await page.evaluate(() => window.__marker === 1).catch(() => false));
    await page.screenshot({ path: path.join(OUT, `${slug}-2-other-tool.png`) });
    say(`Clicked another tool${site.leaveNote ? ` (${site.leaveNote})` : ''}: now on ${page.url()} | full page load: ${reloaded} | leave warning: ${dialogs.length ? dialogs.join(' / ') : 'none'}`);

    await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(8000);
    await page.screenshot({ path: path.join(OUT, `${slug}-3-back.png`) });
    const back = await page.evaluate(() => ({
      url: location.href,
      video: !!document.querySelector('video'),
      download: [...document.querySelectorAll('a,button')].some((b) => b.offsetParent && /download/i.test(b.innerText)),
      text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 300),
    })).catch(() => ({}));
    say(`Pressed Back: ${back.url} | video still loaded: ${back.video} | download button: ${back.download} (went back to ${back.url === before ? 'the same page' : 'a different page'})`);
    say(`Page text: "${back.text}"`);
  } catch (e) {
    say('BLOCKED/FAILED:', e.message.split('\n')[0]);
    await page.screenshot({ path: path.join(OUT, `${slug}-error.png`) }).catch(() => {});
  }
  await ctx.close();
}
await browser.close();
