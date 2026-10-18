import { test, expect } from '@playwright/test';
import { toolsList, collectPageErrors } from './helpers.js';

// Data-driven sweep over every tool in the single source of truth (src/data/tools.js).
// Adding a tool there automatically adds a test here. Guarantees each of the 70 tool
// routes mounts, renders a heading, and throws no uncaught/console errors on load.

test.describe('All tool pages load without errors', () => {
  test('tool inventory matches expected count', () => {
    expect(toolsList.length).toBe(70);
  });

  for (const tool of toolsList) {
    test(`${tool.name} (${tool.path}) mounts cleanly`, async ({ page }) => {
      const errors = collectPageErrors(page);

      const response = await page.goto(tool.path, { waitUntil: 'domcontentloaded' });
      // SPA: the server always returns index.html (200) for client routes.
      expect(response?.status(), `HTTP status for ${tool.path}`).toBeLessThan(400);

      // Lazy route chunk resolves into a visible <h1> heading.
      const heading = page.locator('h1').first();
      await expect(heading, `heading on ${tool.path}`).toBeVisible();
      const headingText = (await heading.textContent())?.trim() || '';
      expect(headingText.length, `non-empty heading on ${tool.path}`).toBeGreaterThan(0);

      // The page rendered real interactive content, not an empty shell / crash boundary.
      const controls = page.locator('button, input, textarea, select, [role="button"], canvas');
      await expect
        .poll(() => controls.count(), { message: `interactive controls on ${tool.path}` })
        .toBeGreaterThan(0);

      // Give any load-time effects a tick to surface errors, then assert none.
      await page.waitForTimeout(300);
      expect(errors, `page errors on ${tool.path}`).toEqual([]);
    });
  }
});
