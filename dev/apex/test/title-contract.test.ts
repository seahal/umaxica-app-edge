import { describe, expect, it, vi } from 'vitest';

import { app } from '../src/app';
import { expectTitleContract } from './utils/title-contract';

/*
 * Response assertions driven through `app.request()`. See the header of
 * `test/app.test.ts` for why this unit alone keeps them in Vitest instead of
 * moving them to an `api/*.hurl` suite.
 */

describe('dev apex HTML routes', () => {
  it('serves contract-conforming HTML on every HTML route', async () => {
    for (const path of ['/about', '/health', '/health.html']) {
      const response = await app.request(path);
      expectTitleContract(await response.text(), {
        requirePageSpecific: true,
        label: `dev apex ${path}`,
      });
    }
  });

  it('owns its 404 document rather than deferring to the platform default', async () => {
    const response = await app.request('/definitely-missing');
    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain('text/html');
    expectTitleContract(await response.text(), {
      requirePageSpecific: true,
      label: 'dev apex 404',
    });
  });

  it('owns its 500 document rather than deferring to the platform default', async () => {
    // A fresh instance: Hono seals its router once the first request is matched,
    // so the throwing route has to be registered before this app serves anything.
    vi.resetModules();
    const { app: fresh } = (await import('../src/app')) as { app: typeof app };
    fresh.get('/__contract-boom', () => {
      throw new Error('induced failure');
    });

    const response = await fresh.request('/__contract-boom');
    expect(response.status).toBe(500);
    expect(response.headers.get('content-type')).toContain('text/html');
    expectTitleContract(await response.text(), {
      requirePageSpecific: true,
      label: 'dev apex 500',
    });
  });

  it('leaves non-HTML responses untouched', async () => {
    const healthJson = await app.request('/health.json');
    expect(healthJson.headers.get('content-type')).toContain('application/json');
    expect(await healthJson.json()).not.toHaveProperty('title');
  });
});
