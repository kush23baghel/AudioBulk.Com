// Checks the shared AI page with a real OpenRouter key: one generation on a few tools must return text.
// The key is read from .env (VITE_OPENROUTER_API_KEY) or OPENROUTER_API_KEY and is never printed.
// Run: node tests/verify/ai-tools.mjs   (app on :4173)
import fs from 'fs';
import path from 'path';
import { BASE, HERE, startBrowser, sidewaysScroll, makeReporter } from './lib.mjs';

const envFile = path.join(HERE, '..', '..', '.env');
const env = fs.existsSync(envFile)
  ? Object.fromEntries(fs.readFileSync(envFile, 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }))
  : {};
const KEY = process.env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || env.VITE_OPENROUTER_MODEL;
if (!KEY) { console.log('No OpenRouter key found (.env VITE_OPENROUTER_API_KEY or OPENROUTER_API_KEY). Skipping.'); process.exit(0); }

const { report, done } = makeReporter();
const browser = await startBrowser();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
await ctx.addInitScript(([k, m]) => { localStorage.setItem('openRouterApiKey', k); if (m) localStorage.setItem('openRouterModel', m); }, [KEY, MODEL]);
const page = await ctx.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));

for (const tool of ['poem-generator', 'faq-generator', 'text-rephrase', 'boss-generator', 'yt-video-ideas']) {
  try {
    await page.goto(`${BASE}/tools/${tool}`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Try an example' }).click();
    const t0 = Date.now();
    await page.getByRole('button', { name: /^Generate$/ }).click();
    await page.getByRole('button', { name: /Copy/ }).first().waitFor({ timeout: 90000 });
    const text = (await page.locator('main .overflow-y-auto').first().innerText()).trim();
    report(text.length > 40 && !(await sidewaysScroll(page)), tool, `${text.length} chars in ${((Date.now() - t0) / 1000).toFixed(0)}s: "${text.replace(/\s+/g, ' ').slice(0, 70)}…"`);
  } catch (e) {
    const err = await page.locator('[role=alert]').first().innerText().catch(() => '');
    report(false, tool, 'ERROR ' + (err || e.message.split('\n')[0]));
  }
}
// "Make it better" on the last result: a second, improved answer replaces the first.
try {
  const before = (await page.locator('main .overflow-y-auto').first().innerText()).trim();
  await page.getByRole('button', { name: 'Make it better' }).click();
  await page.getByRole('button', { name: 'Make it better' }).waitFor({ timeout: 120000 });
  const after = (await page.locator('main .overflow-y-auto').first().innerText()).trim();
  const note = await page.getByText(/Improved version|kept your current answer/).first().innerText().catch(() => '');
  report(after.length > 40 && after !== before && Boolean(note), 'Make it better', `${after.length} chars, note: "${note}"`);
} catch (e) {
  report(false, 'Make it better', 'ERROR ' + e.message.split('\n')[0]);
}
report(errors.length === 0, 'Page errors', errors.length ? errors.join(' || ') : 'none');
await browser.close();
done();
