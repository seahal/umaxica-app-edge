import { expect, test } from '@playwright/test';

/*
 * That `/health` answers, and with what, is asserted in
 * `api/standard-contract.hurl`. What is checked here is the thing a status line
 * cannot show: that the served HTML parses, renders, and exposes its landmarks
 * and links to the accessibility tree under a real engine.
 */

test('serves the real local Edge application', async ({ page }) => {
  await page.goto('/');

  /*
   * The brand is a LINK in the banner, not a heading. `app-chrome.tsx` says so
   * in as many words — "Brand is a link to this edition's homepage, not an
   * `<h1>`: the `<h1>` belongs to the page, inside `<main>`" — and this spec
   * asserted `getByRole('heading', { name: 'UMAXICA' })` until now, which had
   * been failing since the shell adopted that rule. Nothing caught it because
   * no CI job runs Playwright. Asserting the roles the shell actually claims is
   * what makes this a contract rather than a snapshot.
   */
  await expect(page.getByRole('banner').getByRole('link', { name: 'UMAXICA' })).toBeVisible();
  await expect(page.getByRole('main').getByRole('heading').first()).toBeVisible();
});

test('navigates through the primary application navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '探索' }).click();
  await expect(page).toHaveURL(/\/explore$/u);
  await expect(page.getByRole('heading', { name: '探索' })).toBeVisible();
});
