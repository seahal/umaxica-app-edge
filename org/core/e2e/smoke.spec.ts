import { expect, test } from '@playwright/test';

test('serves the real local Edge application and health endpoint', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();

  const health = await request.get('/health');
  expect(health.status()).toBe(200);
});
