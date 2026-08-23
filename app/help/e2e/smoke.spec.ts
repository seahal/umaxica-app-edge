import { expect, test } from '@playwright/test';

/*
 * That `/` answers 200 is asserted in `api/standard-contract.hurl`. What is
 * checked here is the thing a status line cannot show: that the served HTML
 * parses, renders, and exposes its heading and shell landmarks to the
 * accessibility tree under a real engine.
 */

test('renders this unit’s content surface inside the shell', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'お困りごとの解決をお手伝いします' }),
  ).toBeVisible();

  // The shell around it: brand link in the banner, footer utility navigation.
  await expect(page.getByRole('banner').getByRole('link', { name: 'UMAXICA' })).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'ユーティリティナビゲーション' }),
  ).toBeVisible();
});
