import { expect, test } from '@playwright/test';

test('renders the local API health page', async ({ page }) => {
  const response = await page.goto('/health');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'status' })).toBeVisible();
});

test('renders the local about page', async ({ page }) => {
  const response = await page.goto('/about');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'About this site.' })).toBeVisible();
});
