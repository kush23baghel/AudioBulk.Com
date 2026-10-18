import { test, expect } from '@playwright/test';

// Guards the production hardening: cross-origin isolation (required for ffmpeg.wasm),
// the PWA manifest, and service-worker registration. These only hold on the built
// preview server, which is what the suite runs against.

test('root response carries cross-origin isolation headers', async ({ page }) => {
  const response = await page.goto('/');
  const headers = response?.headers() || {};
  expect(headers['cross-origin-opener-policy']).toBe('same-origin');
  expect(headers['cross-origin-embedder-policy']).toBe('credentialless');
});

test('page is cross-origin isolated (SharedArrayBuffer available)', async ({ page }) => {
  await page.goto('/');
  const isolated = await page.evaluate(() => window.crossOriginIsolated);
  expect(isolated).toBe(true);
});

test('PWA manifest is linked and served', async ({ page }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();

  const res = await page.request.get(href);
  expect(res.ok()).toBeTruthy();
  const manifest = await res.json();
  expect(manifest.name || manifest.short_name).toBeTruthy();
  expect(Array.isArray(manifest.icons) && manifest.icons.length).toBeTruthy();
});

test('robots.txt and sitemap.xml are served', async ({ page }) => {
  const robots = await page.request.get('/robots.txt');
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toMatch(/sitemap\.xml/i);

  const sitemap = await page.request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  const xml = await sitemap.text();
  expect(xml).toContain('<urlset');
  expect(xml).toContain('/tools/');
});

test('service worker registers on the built app', async ({ page }) => {
  await page.goto('/');
  const registered = await page
    .waitForFunction(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration();
      return !!reg;
    }, null, { timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  expect(registered).toBe(true);
});
