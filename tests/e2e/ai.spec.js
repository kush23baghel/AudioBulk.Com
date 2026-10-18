import { test, expect } from '@playwright/test';

// Representative AI generators (all 30 AI tools share the same textarea → Generate →
// .overflow-y-auto result structure, verified in the codebase). Network is always
// mocked, so these run with no real OpenRouter key and cost nothing in CI.
const SAMPLE_AI_TOOLS = [
  '/tools/ai-story-generator',
  '/tools/story-plot-generator',
  '/tools/poem-generator',
  '/tools/book-title-generator',
  '/tools/dialogue-generator',
];

const MOCK_OUTPUT = 'Mocked AI output for automated testing — a complete sentence of content.';

async function mockOpenRouter(page) {
  await page.route('https://openrouter.ai/api/v1/chat/completions', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ choices: [{ message: { content: MOCK_OUTPUT } }] }),
    }),
  );
}

test.describe('AI generators (mocked OpenRouter)', () => {
  for (const path of SAMPLE_AI_TOOLS) {
    test(`${path} generates output`, async ({ page }) => {
      // Seed a key into localStorage before app code runs.
      await page.addInitScript(() => {
        localStorage.setItem('openRouterApiKey', 'test-key-not-real');
      });
      await mockOpenRouter(page);

      await page.goto(path);

      const textarea = page.locator('textarea').first();
      await expect(textarea).toBeVisible();
      await textarea.fill('Write something short for an automated test.');

      await page.getByRole('button', { name: /Generate/i }).first().click();

      // Result appears in the scrollable result container and replaces the placeholder.
      const result = page.locator('.overflow-y-auto').first();
      await expect(result).toContainText(MOCK_OUTPUT, { timeout: 15_000 });
      await expect(result).not.toContainText('Your generated content will appear here');
    });
  }

  test('missing API key surfaces the Settings-panel error', async ({ page }) => {
    // No key seeded — the fetch must never fire; the app should short-circuit.
    let apiCalled = false;
    await page.route('https://openrouter.ai/api/v1/chat/completions', (route) => {
      apiCalled = true;
      route.fulfill({ status: 200, body: '{}' });
    });

    await page.goto('/tools/ai-story-generator');
    await page.locator('textarea').first().fill('Trigger the missing-key path.');
    await page.getByRole('button', { name: /Generate/i }).first().click();

    await expect(page.getByText(/API key is missing.*Settings/i)).toBeVisible();
    expect(apiCalled, 'no network call should happen without a key').toBe(false);
  });
});
