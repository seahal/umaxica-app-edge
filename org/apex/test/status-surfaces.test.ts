import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApexApp } from '../src/create-apex-app';

const service = 'org';

afterEach(() => vi.restoreAllMocks());

describe('apex offline and not-found', () => {
  it('serves offline HTML and a 404 status page', async () => {
    const app = createApexApp(() => undefined, { service });

    const offline = await app.request('/offline');
    expect(offline.status).toBe(200);
    await expect(offline.text()).resolves.toContain('オフラインです');

    const missing = await app.request('/definitely-missing');
    expect(missing.status).toBe(404);
    await expect(missing.text()).resolves.toContain('HTTP 404');
  });

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
