import { test, expect } from '@playwright/test';
import { toolsList, toolCategories } from './helpers.js';

// Expected tool counts per category, derived from the data itself so the test can't
// silently drift — it also independently asserts the hard-coded total below.
const EXPECTED_COUNTS = Object.fromEntries(
  toolCategories.map((cat) => [
    cat.id,
    toolsList.filter((t) => t.categoryId === cat.id).length,
  ]),
);

test('home page renders hero and navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1').first()).toBeVisible();
  await expect(page).toHaveTitle(/AudioBulk/i);
});

test('static pages render', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();

  await page.goto('/terms');
  await expect(page.locator('h1').first()).toBeVisible();
});

test('unknown routes render a real 404, not Home', async ({ page }) => {
  await page.goto('/this-route-does-not-exist-xyz');
  await expect(page.getByText('404', { exact: false })).toBeVisible();
  await expect(page).toHaveTitle(/Not Found/i);
  // noindex must be present so search engines don't index broken URLs.
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
});

test.describe('All Tools directory filtering', () => {
  test('total tool count is 70', () => {
    const sum = Object.values(EXPECTED_COUNTS).reduce((a, b) => a + b, 0);
    expect(sum).toBe(70);
    expect(toolsList.length).toBe(70);
  });

  test('unfiltered view reports all 70 tools', async ({ page }) => {
    await page.goto('/all-tools');
    await expect(page.getByText(/^70 tools/)).toBeVisible();
  });

  for (const cat of toolCategories) {
    test(`?cat=${cat.id} reports ${EXPECTED_COUNTS[cat.id]} tools`, async ({ page }) => {
      await page.goto(`/all-tools?cat=${cat.id}`);
      // The subtitle "<n> tools · ..." reflects the full filtered set (before the
      // "Show More" pagination), so it's a reliable count assertion.
      await expect(page.getByText(new RegExp(`^${EXPECTED_COUNTS[cat.id]} tools`))).toBeVisible();
    });
  }
});

test.describe('Command palette (Ctrl+K)', () => {
  test('opens, filters, and navigates to a tool', async ({ page }) => {
    await page.goto('/');
    // Wait for hydration so the keydown listener is attached, and focus the document.
    await expect(page.locator('h1').first()).toBeVisible();
    // Focus the page by clicking plain text (the middle of the page can be the hero search button).
    await page.locator('h1').first().click();
    await page.keyboard.press('Control+k');

    const search = page.getByPlaceholder(/What do you want to do/i);
    await expect(search).toBeVisible();

    await search.fill('character counter');
    const result = page.getByRole('button', { name: /Character Counter/i }).first();
    await expect(result).toBeVisible();
    await result.click();

    await expect(page).toHaveURL(/\/tools\/word-counter$/);
  });

  test('Escape closes the palette', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
    await page.locator('h1').first().click();
    await page.keyboard.press('Control+k');
    await expect(page.getByPlaceholder(/What do you want to do/i)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByPlaceholder(/What do you want to do/i)).toBeHidden();
  });
});

test('recently used tools persist across reload', async ({ page }) => {
  // Seed the same localStorage key the app writes (see src/hooks/useRecentTools.js).
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem(
      'audiobulk_recent_tools',
      JSON.stringify([{ name: 'Word Counter', path: '/tools/word-counter', category: 'Utilities & Text' }]),
    );
  });
  await page.reload();
  await expect(page.getByText(/Recently Used/i)).toBeVisible();
});
