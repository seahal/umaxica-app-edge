import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApexApp } from '../src/create-apex-app';

const service = 'com';

afterEach(() => vi.restoreAllMocks());

/*
 * What `/offline` and the 404 page actually serve is asserted over real HTTP in
 * `api/status-surfaces.hurl`. What remains here is the one status surface no
 * HTTP client can reach: the 500 page, which needs a route that throws.
 *
 * `app.request()` is the driver, not the subject — the assertion is on the
 * error boundary's choice of affordance, and reaching it requires injecting a
 * failing handler that the deployed app deliberately does not have.
 */
describe('apex 5xx surface', () => {
  it('uses the 5xx reload affordance on unexpected errors', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const app = createApexApp(
      (routes) => {
        routes.get('/boom', () => {
          throw new Error('hidden');
        });
      },
      { service },
    );
    const response = await app.request('/boom');
    expect(response.status).toBe(500);
    await expect(response.text()).resolves.toContain('再読み込み');
    expect(consoleError).toHaveBeenCalled();
  });
});
