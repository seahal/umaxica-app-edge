import { expect, test } from '@playwright/test';

test('serves the standard URL contract', async ({ request }) => {
  const expected = [
    ['/robots.txt', 200],
    ['/sitemap.xml', 200],
    ['/favicon.ico', 200],
    ['/manifest.webmanifest', 200],
    ['/service-worker.js', 200],
    ['/offline', 200],
    ['/health', 200],
    ['/revision', 200],
    ['/__definitely_not_found__', 404],
  ] as const;
  for (const [path, status] of expected) {
    const response = await request.get(path, { failOnStatusCode: false });
    expect(response.status(), path).toBe(status);
  }
  expect((await request.get('/robots.txt')).headers()['content-type']).toContain('text/plain');
  expect((await request.get('/sitemap.xml')).headers()['content-type']).toContain('xml');
  expect((await request.get('/manifest.webmanifest')).headers()['content-type']).toContain('json');
  expect((await request.get('/service-worker.js')).headers()['content-type']).toContain(
    'javascript',
  );
});

test('links the manifest and registers the service worker', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    '/manifest.webmanifest',
  );
  const scriptURL = await page.evaluate(
    async () => (await navigator.serviceWorker.ready).active?.scriptURL,
  );
  expect(scriptURL).toContain('/service-worker.js');
});
