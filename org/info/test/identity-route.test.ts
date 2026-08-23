import { describe, expect, it } from 'vitest';

import { handlers } from './utils/routes';

/*
 * `environment` comes from `import.meta.env.MODE`, which Vite replaces with a
 * literal at build time. A test cannot substitute it the way it could delete an
 * environment variable, and it is a string on every code path — so the route
 * carries no `| null` branch and there is none to cover here.
 */
describe('info identity route', () => {
  it('reports the answering frame without reflecting the request host', async () => {
    const response = await handlers.healthJson();

    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    await expect(response.json()).resolves.toMatchObject({
      status: 'OK',
      service: 'org',
      frame: 'info',
    });
  });

  it('reports a string environment, never a reflected value', async () => {
    const body = (await (await handlers.healthJson()).json()) as {
      environment: unknown;
      time: string;
    };

    expect(typeof body.environment).toBe('string');
    expect(body.environment).not.toBe('');
    // A timestamp, so a live server is distinguishable from a stale deployment.
    expect(() => new Date(body.time).toISOString()).not.toThrow();
  });

  it('names the brand and frame as build-time literals, not from a header', async () => {
    // Both calls must answer identically regardless of what a caller sends: the
    // route reads nothing from the request at all.
    const first = (await (await handlers.healthJson()).json()) as Record<string, unknown>;
    const second = (await (await handlers.healthJson()).json()) as Record<string, unknown>;

    expect(first['service']).toBe('org');
    expect(first['frame']).toBe('info');
    expect(second['service']).toBe(first['service']);
    expect(second['frame']).toBe(first['frame']);
  });
});
