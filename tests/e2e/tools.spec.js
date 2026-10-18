import { test, expect } from '@playwright/test';

// Deterministic, offline tool logic (no network, no ffmpeg). These assert the actual
// computed output users see, not just that the page renders.

test('Word Counter counts words after the debounce', async ({ page }) => {
  await page.goto('/tools/word-counter');
  await page.locator('textarea').first().fill('one two three four five');

  // 400ms debounce in the component; poll rather than hard-wait.
  const wordsValue = page.getByText('Words', { exact: true }).locator('xpath=following-sibling::span[1]');
  await expect(wordsValue).toHaveText('5');
});

test('Text Similarity reports 100% for identical inputs', async ({ page }) => {
  await page.goto('/tools/text-similarity');
  const sample = 'the quick brown fox jumps over the lazy dog';
  await page.getByPlaceholder('Paste first text here...').fill(sample);
  await page.getByPlaceholder('Paste second text here...').fill(sample);

  await expect(page.locator('span.text-6xl')).toHaveText('100');
});

test('Text Similarity reports 0% for disjoint inputs', async ({ page }) => {
  await page.goto('/tools/text-similarity');
  await page.getByPlaceholder('Paste first text here...').fill('alpha beta gamma');
  await page.getByPlaceholder('Paste second text here...').fill('delta epsilon zeta');

  await expect(page.locator('span.text-6xl')).toHaveText('0');
});

test('UUID Generator produces the requested count of valid, unique v4 UUIDs', async ({ page }) => {
  await page.goto('/tools/uuid-generator');

  await page.locator('input[type="number"]').fill('7');
  await page.getByRole('button', { name: /Generate/i }).click();

  const output = page.locator('.font-mono.overflow-y-auto').first();
  await expect(output).toBeVisible();
  const text = (await output.textContent()) || '';
  const uuids = text.split('\n').map((s) => s.trim()).filter(Boolean);

  expect(uuids).toHaveLength(7);
  const v4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  for (const id of uuids) {
    expect(id, `${id} is a valid v4 UUID`).toMatch(v4);
  }
  expect(new Set(uuids).size, 'all UUIDs are unique').toBe(uuids.length);
});
