import { expect, test } from '@playwright/test';

test('serves the real local Edge application and health endpoint', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'UMAXICA' }).first()).toBeVisible();

  const health = await request.get('/health');
  expect(health.status()).toBe(200);
});

test('navigates through the primary application navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '探索' }).click();
  await expect(page).toHaveURL(/\/explore$/);
  await expect(page.getByRole('heading', { name: '探索' })).toBeVisible();
});
