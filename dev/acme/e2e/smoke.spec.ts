import { expect, test } from '@playwright/test';

test('serves the real local ACME Edge surface', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole('heading', { name: 'Next.js environment rebuilt from scratch.' }),
  ).toBeVisible();
});

test('serves the local health response', async ({ request }) => {
  const response = await request.get('/health');
  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toMatchObject({ status: 'ok' });
});
