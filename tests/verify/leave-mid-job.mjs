// A1: a job keeps running when you switch tools, and comes back with its settings and results.
// Run: node tests/verify/leave-mid-job.mjs   (app on :4173, test files from fixtures.mjs)
import path from 'path';
import { BASE, OUT, fixture, probe, startBrowser, makeReporter } from './lib.mjs';

const { report, done } = makeReporter();
const browser = await startBrowser();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, acceptDownloads: true });
const LONG = fixture('long4k.mp4'); // 74 s of 4K: still running when we switch tools
const SHORT = fixture('clip.mp4');
const COMPRESSOR = '/tools/bulk-video-compressor';
const CONVERTER = '/tools/bulk-video-converter';

const newPage = async () => {
  const page = await ctx.newPage();
  page.setDefaultTimeout(60000); // long waits are given explicitly below
  page.dialogs = [];
  page.on('dialog', async (d) => { page.dialogs.push(d.type()); await d.accept(); });
  return page;
};
const chip = (page) => page.getByRole('button', { name: /^Your jobs/ });
const startButton = (page) => page.getByRole('button', { name: / \d+ files?/ }).first();
// Click an in-site link the normal way (the app's own router handles it, no page load). Done through
// the page because Playwright's own click waited forever on a scrolled page with smooth scrolling.
const goTo = async (page, href) => {
  const before = await page.locator('main h1').first().innerText();
  await page.evaluate((h) => [...document.querySelectorAll(`a[href="${h}"]`)].find((a) => a.offsetParent)?.click(), href);
  await page.waitForURL('**' + href, { timeout: 10000 });
  // The address changes before the new page is on screen: wait until its title replaces the old one.
  await page.waitForFunction((old) => {
    const h1s = document.querySelectorAll('main h1');
    return h1s.length === 1 && h1s[0].innerText !== old;
  }, before, { timeout: 15000 });
};
const addAndStart = async (page, file) => {
  await page.locator('input[type=file]').first().setInputFiles(file);
  await page.waitForTimeout(1500);
  await startButton(page).click();
};
const download = async (page, name) => {
  const [d] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /^Download$|Download all/ }).first().click()]);
  const saved = path.join(OUT, `a1-${name}-${d.suggestedFilename()}`);
  await d.saveAs(saved);
  return saved;
};
const pct = async (page) => Number(((await chip(page).innerText().catch(() => '')).match(/(\d+)%/) || [])[1] ?? NaN);
const check = async (name, fn) => {
  try { const [ok, msg] = await fn(); report(ok, name, msg); } catch (e) { report(false, name, 'ERROR ' + e.message.split('\n')[0]); }
};

const page = await newPage();

// 1. Start a long job with a NON-default setting, then click another tool.
await check('1. Job keeps running after switching tools', async () => {
  await page.goto(BASE + COMPRESSOR, { waitUntil: 'networkidle' });
  await page.getByText('Make it 480p', { exact: true }).click();
  await addAndStart(page, LONG);
  await page.waitForTimeout(4000);
  await goTo(page, CONVERTER);
  await page.waitForURL('**' + CONVERTER);
  await chip(page).waitFor({ timeout: 10000 });
  const a = await pct(page);
  // A 74 s 4K video moves about 1% every few seconds, so allow up to a minute for the number to move.
  const t0 = Date.now();
  let b = a;
  while (b <= a && Date.now() - t0 < 60000) { await page.waitForTimeout(2000); b = await pct(page); }
  return [b > a, `header chip shows ${a}% → ${b}% after ${Math.round((Date.now() - t0) / 1000)} s, on another tool`];
});

// 2. A job on a second tool waits for the first, then runs by itself.
await check('2. Second tool waits its turn, then finishes', async () => {
  await addAndStart(page, SHORT);
  const waiting = await page.getByText(/Waiting for another job/).first().isVisible({ timeout: 5000 }).catch(() => false);
  await page.getByRole('button', { name: /^Download$/ }).first().waitFor({ timeout: 300000 });
  return [waiting, `showed "Waiting for another job" first: ${waiting}; then finished on its own`];
});

// 3. Come back through the chip: result is there, and so is the setting.
await check('3. Come back: result + same setting', async () => {
  await chip(page).click();
  await page.getByRole('dialog', { name: 'Your jobs' }).getByRole('link', { name: /Video Compressor/ }).click();
  await page.waitForURL('**' + COMPRESSOR);
  const kept = await page.getByRole('radio', { name: 'Make it 480p' }).isChecked();
  const saved = await download(page, 'compressor');
  const p = probe(saved);
  return [kept && p.h === 480 && p.v, `480p still selected: ${kept}; result ${p.w}×${p.h}, ${(p.size / 1e6).toFixed(1)} MB`];
});

// 4. Leaving the site warns only when work would be lost.
await check('4a. Switching tools never warned', async () => [page.dialogs.length === 0, `dialogs while switching: ${page.dialogs.length}`]);
await check('4b. Closing with an undownloaded result warns', async () => {
  await page.close({ runBeforeUnload: true });
  await new Promise((r) => setTimeout(r, 1500));
  return [page.dialogs.includes('beforeunload'), `dialogs: ${page.dialogs.join(', ') || 'none'} (the Converter result was not downloaded)`];
});
await check('4c. Closing with nothing pending does not warn', async () => {
  const fresh = await newPage();
  await fresh.goto(BASE + CONVERTER, { waitUntil: 'networkidle' });
  await fresh.close({ runBeforeUnload: true });
  await new Promise((r) => setTimeout(r, 1500));
  return [fresh.dialogs.length === 0, `dialogs: ${fresh.dialogs.join(', ') || 'none'}`];
});

// 5. Stop on one tool doesn't touch another tool's job.
await check('5. Stop is per tool', async () => {
  const p5 = await newPage();
  const shot = (n) => p5.screenshot({ path: path.join(OUT, `a1-step5-${n}.png`) }).catch(() => {});
  await p5.goto(BASE + COMPRESSOR, { waitUntil: 'networkidle' });
  await addAndStart(p5, LONG);
  await p5.waitForTimeout(3000);
  await shot('a-started');
  await goTo(p5, CONVERTER);
  await p5.locator('input[type=file]').first().setInputFiles(SHORT);
  await p5.waitForTimeout(1500);
  await shot('b0-converter-file-added');
  await startButton(p5).click({ timeout: 15000 });
  await shot('b-converter-queued');
  await goTo(p5, COMPRESSOR);
  await shot('c-back-on-compressor');
  await p5.getByRole('button', { name: /Stop and clear/ }).click();
  const gone = (await p5.locator('main').innerText()).includes('long4k') === false;
  // The other tool's job must start and finish on its own: the chip turns to "1 file ready".
  const finished = await chip(p5).filter({ hasText: /1 file ready/ }).waitFor({ timeout: 120000 }).then(() => true, () => false);
  await goTo(p5, CONVERTER);
  const doneHere = await p5.getByText('Done', { exact: true }).first().isVisible().catch(() => false);
  await shot('d-converter-after-stop');
  await p5.close();
  return [gone && finished && doneHere, `compressor job cleared: ${gone}; converter job finished by itself: ${finished}; shown as Done on its page: ${doneHere}`];
});

// 6. Browser-engine tools too (Video to GIF runs without ffmpeg).
await check('6. Video to GIF keeps running across a switch', async () => {
  const p6 = await newPage();
  await p6.goto(BASE + '/tools/video-to-gif', { waitUntil: 'networkidle' });
  await addAndStart(p6, fixture('hd.mp4'));
  await p6.waitForTimeout(1500);
  await goTo(p6, '/tools/gif-editor');
  await chip(p6).filter({ hasText: /ready/ }).waitFor({ timeout: 120000 });
  await chip(p6).click();
  await p6.getByRole('dialog', { name: 'Your jobs' }).getByRole('link', { name: /Video to GIF/ }).click();
  const saved = await download(p6, 'gif');
  const p = probe(saved);
  await p6.close();
  return [p.w === 480 && p.v, `GIF ${p.w}×${p.h}, ${(p.size / 1024).toFixed(0)} KB`];
});

// 7. Phone width: the chip fits and nothing scrolls sideways.
await check('7. Phone: chip fits, no sideways scroll', async () => {
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await phone.goto(BASE + '/tools/video-to-gif', { waitUntil: 'networkidle' });
  await addAndStart(phone, fixture('hd.mp4'));
  await chip(phone).waitFor({ timeout: 15000 });
  const box = await chip(phone).boundingBox();
  const sideways = await phone.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  await phone.screenshot({ path: path.join(OUT, 'a1-phone.png') });
  await phone.close();
  return [!sideways && box && box.x + box.width <= 390, `chip at x=${Math.round(box?.x)}–${Math.round(box?.x + box?.width)} of 390 px; sideways scroll: ${sideways}`];
});

await browser.close();
done();
