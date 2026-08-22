import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET } from '../src/app/health.json/route';

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('info identity route', () => {
  it('reports the answering frame without reflecting the request host', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    const response = await GET();
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    await expect(response.json()).resolves.toMatchObject({
      status: 'OK',
      service: 'app',
      frame: 'info',
      environment: 'test',
    });
  });

  it('reports a null environment when NODE_ENV is absent', async () => {
    const previous = process.env.NODE_ENV;
    Reflect.deleteProperty(process.env, 'NODE_ENV');
    try {
      const response = await GET();
      await expect(response.json()).resolves.toMatchObject({
        service: 'app',
        environment: null,
      });
    } finally {
      // Written back through `Reflect.set` for the same reason it was removed
      // through `Reflect.deleteProperty`: the Wrangler-generated
      // `NodeJS.ProcessEnv` narrows `NODE_ENV` to the literal declared in
      // wrangler.jsonc, so a plain assignment is a type error.
      if (previous !== undefined) Reflect.set(process.env, 'NODE_ENV', previous);
    }
  });
});
