import { expect, test } from '@playwright/test';

/*
 * Browser-only behaviour around the standard URL contract.
 *
 * The contract itself — which paths answer, with which status and which
 * Content-Type — moved to `api/standard-contract.hurl`. It never needed a
 * browser, and running it here meant starting Chromium to read nine status
 * lines. What is left is what only a browser can tell us: that the service
 * worker registers and activates.
 */

test('links the manifest and registers the service worker', async ({ page }) => {
  await page.goto('/about');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    '/manifest.webmanifest',
  );
  const scriptURL = await page.evaluate(
    async () => (await navigator.serviceWorker.ready).active?.scriptURL,
  );
  expect(scriptURL).toContain('/service-worker.js');
});
