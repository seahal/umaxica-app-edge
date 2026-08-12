import { expect, test } from '@playwright/test';

test('renders the local Next.js page', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Next.js on Cloudflare Workers' })).toBeVisible();
});
