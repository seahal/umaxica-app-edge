import { describe, expect, it } from 'vitest';

import { createApexApp } from '../src/create-apex-app';

describe('revision binding', () => {
  it('returns every value supplied by Workers version metadata', async () => {
    const app = createApexApp(() => undefined, { service: 'dev' });

    // A real HTTP client cannot inject a Workers binding, so app.request() is
    // used only as the driver for this binding-to-response mapping.
    const response = await app.request(
      '/revision',
      {},
      {
        CF_VERSION_METADATA: {
          id: 'version-id',
          tag: 'release-tag',
          timestamp: '2026-08-29T16:00:00.000Z',
        },
      },
    );

    await expect(response.json()).resolves.toEqual({
      id: 'version-id',
      tag: 'release-tag',
      timestamp: '2026-08-29T16:00:00.000Z',
    });
  });

  it('uses null for metadata fields the binding omits', async () => {
    const app = createApexApp(() => undefined, { service: 'dev' });
    const response = await app.request('/revision', {}, { CF_VERSION_METADATA: {} });

    await expect(response.json()).resolves.toEqual({ id: null, tag: null, timestamp: null });
  });

  /*
   * No binding at all, which is what `app.request()` hands the app and what a
   * deployment without `version_metadata` would too. The route has to answer
   * the same three nulls rather than throwing on the missing binding.
   */
  it('answers with nulls when the binding is absent entirely', async () => {
    const app = createApexApp(() => undefined, { service: 'dev' });
    const response = await app.request('/revision');

    await expect(response.json()).resolves.toEqual({ id: null, tag: null, timestamp: null });
  });
});
