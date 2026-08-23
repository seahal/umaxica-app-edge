import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetEnv, setEnv, setEnvShouldThrow } from './__mocks__/cloudflare-workers';
import { handlers } from './utils/routes';

const GET = handlers.health;

/*
 * The unified health entry point: Edge's own state and Rails' liveness in one
 * document, answering 200 only when both halves are ok.
 *
 * This file replaced `test/rails-health-route.test.ts`, deleted along with the
 * `/rails-health` route it covered. It is byte-identical across all fifteen
 * frames, like the route it tests. `app/docs` is the first frame to leave that
 * family, so the assertions below are unchanged and only the way the environment
 * is installed differs: `cloudflare:workers` exposes a plain `env` object where
 * OpenNext exposed a `getCloudflareContext()` call that could throw.
 */

const REVISION = { id: 'rev-id', tag: 'rev-tag', timestamp: 'built-at' };

function railsAnswers(response: Response) {
  const fetch = vi.fn(() => Promise.resolve(response));
  setEnv({ REVISION, UMAXICA_APPS_EDGE_CF_WORKERS_VPC: { fetch } });
  return fetch;
}

function railsRejects(error: unknown) {
  const fetch = vi.fn(() => Promise.reject(error));
  setEnv({ REVISION, UMAXICA_APPS_EDGE_CF_WORKERS_VPC: { fetch } });
  return fetch;
}

function noTransport() {
  setEnv({ REVISION });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  resetEnv();
});

describe('health route: both halves ok', () => {
  it('answers 200 with the Edge revision and the Rails liveness report', async () => {
    const fetch = railsAnswers(new Response('{}', { status: 200 }));

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store, no-cache, must-revalidate');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    await expect(response.json()).resolves.toEqual({
      status: 'ok',
      timestamp: '2024-01-01T00:00:00.000Z',
      edge: { status: 'ok', version: REVISION },
      rails: { liveness: { kind: 'ok', status: 200, latency_ms: 0 } },
    });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('probes Rails once, at the unprefixed liveness path, over the VPC binding', async () => {
    const fetch = railsAnswers(new Response('{}', { status: 200 }));

    await GET();

    expect(fetch).toHaveBeenCalledOnce();
    const [url] = fetch.mock.calls[0] as unknown as [string];
    expect(new URL(url).pathname).toBe('/health/liveness.json');
  });

  it('still answers 200 when the revision binding is absent', async () => {
    const fetch = vi.fn(() => Promise.resolve(new Response('{}', { status: 200 })));
    setEnv({ UMAXICA_APPS_EDGE_CF_WORKERS_VPC: { fetch } });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: 'ok',
      // All three fields are undefined, so JSON serialization drops them.
      edge: { status: 'ok', version: {} },
    });
  });
});

describe('health route: Rails half unhealthy', () => {
  it('answers 503 when Rails returns an HTTP error, reporting only the status', async () => {
    railsAnswers(new Response('rails stack trace', { status: 503 }));

    const response = await GET();
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(JSON.parse(body)).toEqual({
      status: 'error',
      timestamp: '2024-01-01T00:00:00.000Z',
      edge: { status: 'ok', version: REVISION },
      rails: { liveness: { kind: 'http-error', status: 503, latency_ms: 0 } },
    });
    expect(body).not.toContain('rails stack trace');
  });

  it('answers 503 when the VPC binding fetch rejects, without the exception text', async () => {
    railsRejects(new Error('connect ECONNREFUSED core.app.localhost:3000'));

    const response = await GET();
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(JSON.parse(body).rails).toEqual({ liveness: { kind: 'unreachable', latency_ms: 0 } });
    expect(body).not.toContain('ECONNREFUSED');
    expect(body).not.toContain('core.app.localhost');
  });

  it('answers 503 for the Workers VPC ProxyError 500 without echoing the code', async () => {
    // Workers VPC does not throw when the origin is unreachable; it answers a
    // text/plain 500 carrying `ProxyError: <code>`. `rails-client.ts` claims
    // that as `unreachable` rather than reporting it as a Rails 500.
    railsAnswers(
      new Response('ProxyError: connection_refused', {
        status: 500,
        headers: { 'content-type': 'text/plain' },
      }),
    );

    const response = await GET();
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(JSON.parse(body).rails).toEqual({ liveness: { kind: 'unreachable', latency_ms: 0 } });
    expect(body).not.toContain('ProxyError');
  });

  it('answers 503 with not-configured when no transport exists', async () => {
    noTransport();

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      status: 'error',
      edge: { status: 'ok' },
      rails: { liveness: { kind: 'not-configured', latency_ms: 0 } },
    });
  });

  it('reports not-configured rather than failing when the Cloudflare context is unavailable', async () => {
    // `getRailsClient()` reads the context and can throw. That is "no
    // transport", not an Edge fault, so it must not be allowed to escape.
    setEnvShouldThrow(true);

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      edge: { status: 'error' },
      rails: { liveness: { kind: 'not-configured', latency_ms: 0 } },
    });
  });
});

describe('health route: Edge half unhealthy', () => {
  it('answers 503 and still reports the Rails half when timestamp generation fails', async () => {
    railsAnswers(new Response('{}', { status: 200 }));
    vi.spyOn(Date.prototype, 'toISOString').mockImplementationOnce(() => {
      throw new Error('Date error');
    });

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      status: 'error',
      timestamp: expect.any(String),
      edge: { status: 'error' },
      // The Edge half failing must not hide a healthy Rails half.
      rails: { liveness: { kind: 'ok', status: 200, latency_ms: 0 } },
    });
  });

  it('falls back to an HTTP-date timestamp when ISO generation keeps failing', async () => {
    railsAnswers(new Response('{}', { status: 200 }));
    vi.spyOn(Date.prototype, 'toISOString').mockImplementation(() => {
      throw new Error('Date error');
    });

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      status: 'error',
      timestamp: 'Mon, 01 Jan 2024 00:00:00 GMT',
      edge: { status: 'error' },
    });
  });
});

describe('health route: information disclosure', () => {
  const MARKERS = [
    'session=abc123',
    'Bearer token-value',
    'csrf-token-value',
    '019f5fe0-287f-7040-9f2f-036cb5b21df7',
    'core.app.localhost',
    'ProxyError: dns_error',
  ];

  it.each(MARKERS)('never appears in the response body: %s', async (marker) => {
    // Reached through every channel a caller controls or an upstream supplies:
    // a Rails body, a Rails error body, and a thrown transport error.
    for (const setup of [
      () => railsAnswers(new Response(marker, { status: 200 })),
      () => railsAnswers(new Response(marker, { status: 500 })),
      () =>
        railsAnswers(
          new Response(marker, { status: 500, headers: { 'content-type': 'text/plain' } }),
        ),
      () => railsRejects(new Error(marker)),
    ]) {
      setup();
      const body = await (await GET()).text();
      expect(body).not.toContain(marker);
    }
  });

  it('never carries an errorMessage field on any path', async () => {
    for (const setup of [
      () => railsRejects(new Error('boom')),
      () => railsAnswers(new Response('boom', { status: 500 })),
      () => noTransport(),
    ]) {
      setup();
      const body = await (await GET()).text();
      expect(body).not.toContain('errorMessage');
      expect(body).not.toContain('reason');
    }
  });
});
