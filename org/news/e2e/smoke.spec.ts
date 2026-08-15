import { expect, test } from '@playwright/test';

test('renders this unit’s content surface inside the shell', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);

  await expect(page.getByRole('heading', { name: '最新のお知らせをお届けします' })).toBeVisible();

  // The shell around it: brand link in the banner, footer utility navigation.
  await expect(page.getByRole('banner').getByRole('link', { name: 'UMAXICA' })).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'ユーティリティナビゲーション' }),
  ).toBeVisible();
});
