import { expect, test } from '@playwright/test';

/*
 * That `/health` answers 200 with `status: "ok"` is asserted in
 * `api/standard-contract.hurl` — it needed no browser, and running it here
 * started Chromium to read one status line and one JSON key. What is left is
 * what only a browser can tell us: that the document renders and exposes its
 * heading to the accessibility tree.
 */

test('serves the real local ACME Edge surface', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Next.js environment rebuilt from scratch.' }),
  ).toBeVisible();
});
