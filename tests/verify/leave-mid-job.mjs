// What happens to a running job when you click another tool? (AudioBulk, local build)
// Start compressing a long 4K video, switch tools mid-job, come back, and start a new job elsewhere.
// Run: node tests/verify/leave-mid-job.mjs   (app on :4173)
import { BASE, fixture, startBrowser, makeReporter } from './lib.mjs';

const { report, done } = makeReporter();
const browser = await startBrowser();
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const dialogs = [];
page.on('dialog', async (d) => { dialogs.push(d.type() + ': ' + d.message()); await d.accept(); });
const log = (...a) => console.log('   ', ...a);

await page.goto(`${BASE}/tools/bulk-video-compressor`, { waitUntil: 'networkidle' });
await page.evaluate(() => { window.__sameDocument = true; });
await page.locator('input[type=file]').first().setInputFiles(fixture('long4k.mp4'));
await page.waitForTimeout(1500);
await page.getByRole('button', { name: / \d+ files?/ }).first().click();
await page.waitForTimeout(8000);
const progressBefore = await page.locator('main').innerText().then((t) => (t.match(/\d+%/) || ['?'])[0]);
log('Compressing a 74 s 4K video. After 8 s it shows', progressBefore);

// Click another tool in the left menu, mid-job.
await page.locator('a[href="/tools/bulk-video-converter"]:visible').first().click();
await page.waitForTimeout(1500);
const same = await page.evaluate(() => window.__sameDocument === true);
log('After clicking "Video Converter": url', page.url().replace(BASE, ''), '| page reloaded?', !same, '| leave warning?', dialogs.length ? dialogs.join(' / ') : 'none');

// Start a small job on the new tool: does it wait for the hidden old job?
await page.locator('input[type=file]').first().setInputFiles(fixture('clip.mp4'));
await page.waitForTimeout(1200);
const t0 = Date.now();
await page.getByRole('button', { name: / \d+ files?/ }).first().click();
await page.getByRole('button', { name: /^Download$|Download all/ }).first().waitFor({ timeout: 600000 });
const waited = (Date.now() - t0) / 1000;
log(`A 4 s clip took ${waited.toFixed(0)} s to convert (alone it takes ~2-3 s).`);

// Come back: is the old job or its result still there?
await page.goBack();
await page.waitForTimeout(1500);
const back = await page.locator('main').innerText();
const kept = /long4k/.test(back);
log('Back on the compressor: old file still listed?', kept);

report(true, 'Observed (see lines above)', `warning=${dialogs.length > 0}, reload=${!same}, oldJobVisible=${kept}, newJobWait=${waited.toFixed(0)}s`);
await browser.close();
done();
