import { expect, test, type APIRequestContext } from '@playwright/test';

/*
 * Operational compact revision: GET /revision is text/plain, not JSON, not HTML.
 * Structured identity lives at /api/v0/revision.json (Hurl).
 */

function getRevision(request: APIRequestContext, headers?: Record<string, string>) {
  return request.get('/revision', { headers, maxRedirects: 0 });
}

test('GET /revision is compact text/plain deployment identity', async ({ request }) => {
  const response = await getRevision(request);
  expect(response.status()).toBe(200);

  const contentType = response.headers()['content-type'] ?? '';
  expect(contentType).toMatch(/^text\/plain\b/);
  expect(contentType).not.toMatch(/application\/json/);
  expect(contentType).not.toMatch(/text\/html/);

  const cacheControl = response.headers()['cache-control'] ?? '';
  expect(cacheControl).toContain('no-store');
  expect(response.headers()['x-robots-tag']).toBe('noindex, nofollow');
  expect(response.headers()['location']).toBeUndefined();
  expect(response.headers()['set-cookie']).toBeUndefined();

  const body = await response.text();
  expect(body.trim().length).toBeGreaterThan(0);
  expect(body.trim()).not.toContain(' ');
  expect(body).not.toMatch(/<!doctype|<html/i);
  expect(body).not.toMatch(/^\s*[\[{]/);
  expect(() => JSON.parse(body)).toThrow();
});

test.describe('GET /revision ignores Accept', () => {
  for (const accept of ['application/json', 'text/html', '*/*']) {
    test(`stays text/plain when Accept is ${accept}`, async ({ request }) => {
      const response = await getRevision(request, { Accept: accept });
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type'] ?? '').toMatch(/^text\/plain\b/);
      expect(response.headers()['content-type'] ?? '').not.toMatch(/application\/json/);
      expect(response.headers()['content-type'] ?? '').not.toMatch(/text\/html/);
      const body = await response.text();
      expect(() => JSON.parse(body)).toThrow();
    });
  }
});
