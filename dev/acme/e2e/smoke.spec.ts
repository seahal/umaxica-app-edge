import { expect, test } from '@playwright/test';

test('serves the real local ACME Edge surface', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('body')).toBeVisible();
});
