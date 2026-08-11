// @vitest-environment node
//
// This file exercises `Request`/`Headers` Cookie/Set-Cookie forwarding.
// happy-dom's Fetch implementation (the repo-wide default environment)
// enforces the browser forbidden-header-name list and silently drops a
// `Cookie` header at `Request` construction time, which would make this
// file's cookie-forwarding assertions pass or fail for the wrong reason.
// Node's own (undici) `Request`/`Headers` do not apply that browser-only
// restriction and match the real Cloudflare Workers (workerd) runtime this
// code actually runs on — this override does not touch `vitest.config.ts`.
import { afterEach, describe, expect, it, vi } from 'vitest';

const { nextFetch } = vi.hoisted(() => ({ nextFetch: vi.fn() }));

vi.mock('../src/lib/next-handler', () => ({
  default: { fetch: nextFetch },
}));

vi.mock('../src/lib/health-request', () => ({
  sanitizeHealthRequest: (request: Request) => request,
}));

import worker from '../src/worker';

function makeEnv(vpc?: { fetch: (request: Request) => Promise<Response> }): CloudflareEnv {
  return {
    UMAXICA_APPS_EDGE_CF_WORKERS_VPC: vpc,
  } as unknown as CloudflareEnv;
}

const ctx = {
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
} as unknown as ExecutionContext;

describe('org/core worker.ts dispatch', () => {
  afterEach(() => {
    nextFetch.mockReset();
  });

  it('strips the Cookie header entirely before calling handler.fetch for a NEXT-owned request', async () => {
    nextFetch.mockResolvedValue(new Response('ok', { status: 200 }));

    const request = new Request('https://jp.umaxica.org/', {
      headers: { cookie: 'a=1; b=2' },
    });

    const response = await worker.fetch(request, makeEnv(), ctx);

    expect(nextFetch).toHaveBeenCalledTimes(1);
    const forwardedRequest = nextFetch.mock.calls[0]?.[0] as Request;
    expect(forwardedRequest.headers.get('cookie')).toBeNull();
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
  });

  it('strips every Set-Cookie header from the Next.js response before it reaches the caller', async () => {
    const nextHeaders = new Headers();
    nextHeaders.append('set-cookie', 'a=1; Path=/');
    nextHeaders.append('set-cookie', 'b=2; Path=/');
    nextFetch.mockResolvedValue(new Response('ok', { status: 200, headers: nextHeaders }));

    const request = new Request('https://jp.umaxica.org/');
    const response = await worker.fetch(request, makeEnv(), ctx);

    expect(response.headers.get('set-cookie')).toBeNull();
    expect(response.headers.getSetCookie?.() ?? []).toHaveLength(0);
  });

  it('dispatches a RAILS-owned request directly to Rails, never calling handler.fetch, preserving Cookie/CSRF/path/query', async () => {
    const railsFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));

    const request = new Request('https://jp.umaxica.org/api/v0/session?foo=bar', {
      headers: {
        cookie: 'session=abc',
        'x-csrf-token': 'token-123',
      },
    });

    const response = await worker.fetch(request, makeEnv({ fetch: railsFetch }), ctx);

    expect(nextFetch).not.toHaveBeenCalled();
    expect(railsFetch).toHaveBeenCalledTimes(1);
    const railsRequest = railsFetch.mock.calls[0]?.[0] as Request;
    expect(railsRequest.headers.get('cookie')).toBe('session=abc');
    expect(railsRequest.headers.get('x-csrf-token')).toBe('token-123');
    const railsUrl = new URL(railsRequest.url);
    expect(railsUrl.pathname).toBe('/api/v0/session');
    expect(railsUrl.searchParams.get('foo')).toBe('bar');
    expect(response.status).toBe(200);
  });

  it('returns 429 before Rails dispatch when the rate limiter rejects the request', async () => {
    const railsFetch = vi.fn().mockResolvedValue(new Response('{}'));
    const env = {
      ...makeEnv({ fetch: railsFetch }),
      RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: false }) },
    } as unknown as CloudflareEnv;
    const response = await worker.fetch(
      new Request('https://jp.umaxica.org/api/v0/session'),
      env,
      ctx,
    );
    expect(response.status).toBe(429);
    expect(railsFetch).not.toHaveBeenCalled();
  });

  it('sends /oidc/callback straight to Rails with the query string unchanged and passes through Set-Cookie/redirect unchanged', async () => {
    const railsHeaders = new Headers({
      location: 'https://jp.umaxica.org/',
      'set-cookie': 'sess=xyz',
    });
    const railsFetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 302, headers: railsHeaders }));

    const request = new Request('https://jp.umaxica.org/oidc/callback?code=abc&state=def');
    const response = await worker.fetch(request, makeEnv({ fetch: railsFetch }), ctx);

    expect(nextFetch).not.toHaveBeenCalled();
    const railsRequest = railsFetch.mock.calls[0]?.[0] as Request;
    const railsUrl = new URL(railsRequest.url);
    expect(railsUrl.searchParams.get('code')).toBe('abc');
    expect(railsUrl.searchParams.get('state')).toBe('def');
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://jp.umaxica.org/');
    expect(response.headers.get('set-cookie')).toBe('sess=xyz');
  });

  it('returns a RAILS-owned 404 unchanged, without falling through to Next.js', async () => {
    const railsFetch = vi.fn().mockResolvedValue(new Response('not found', { status: 404 }));
    const request = new Request('https://jp.umaxica.org/api/v0/does-not-exist');

    const response = await worker.fetch(request, makeEnv({ fetch: railsFetch }), ctx);

    expect(nextFetch).not.toHaveBeenCalled();
    expect(response.status).toBe(404);
  });

  it('returns a RAILS-owned 405 unchanged, without falling through to Next.js', async () => {
    const railsFetch = vi
      .fn()
      .mockResolvedValue(new Response('method not allowed', { status: 405 }));
    const request = new Request('https://jp.umaxica.org/web/v0/thing', { method: 'DELETE' });

    const response = await worker.fetch(request, makeEnv({ fetch: railsFetch }), ctx);

    expect(nextFetch).not.toHaveBeenCalled();
    expect(response.status).toBe(405);
  });

  it('keeps a Next.js 404 a Next.js 404, without retrying against Rails', async () => {
    const railsFetch = vi.fn();
    nextFetch.mockResolvedValue(new Response('not found', { status: 404 }));

    const request = new Request('https://jp.umaxica.org/this-page-does-not-exist');
    const response = await worker.fetch(request, makeEnv({ fetch: railsFetch }), ctx);

    expect(railsFetch).not.toHaveBeenCalled();
    expect(nextFetch).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(404);
  });

  it('blocks /health/liveness.json from reaching either Rails or Next.js', async () => {
    const railsFetch = vi.fn();
    const request = new Request('https://jp.umaxica.org/health/liveness.json');

    const response = await worker.fetch(request, makeEnv({ fetch: railsFetch }), ctx);

    expect(railsFetch).not.toHaveBeenCalled();
    expect(nextFetch).not.toHaveBeenCalled();
    expect(response.status).toBe(404);
  });

  it('leaves the existing /health Route Handler reachable through Next.js (not blocked)', async () => {
    nextFetch.mockResolvedValue(new Response('{"status":"ok"}', { status: 200 }));
    const request = new Request('https://jp.umaxica.org/health');

    const response = await worker.fetch(request, makeEnv(), ctx);

    expect(nextFetch).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
  });

  it('forwards a non-GET RAILS-owned request with a body without corruption or buffering', async () => {
    const railsFetch = vi.fn().mockResolvedValue(new Response('created', { status: 201 }));
    const request = new Request('https://jp.umaxica.org/api/v0/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hello: 'world' }),
    });

    const response = await worker.fetch(request, makeEnv({ fetch: railsFetch }), ctx);

    expect(nextFetch).not.toHaveBeenCalled();
    const railsRequest = railsFetch.mock.calls[0]?.[0] as Request;
    expect(railsRequest.method).toBe('POST');
    expect(railsRequest.body).not.toBeNull();
    await expect(railsRequest.json()).resolves.toEqual({ hello: 'world' });
    expect(response.status).toBe(201);
  });

  it('fails closed with 503 when the Rails VPC binding is absent, without falling back to Next.js', async () => {
    const request = new Request('https://jp.umaxica.org/api/v0/session');

    const response = await worker.fetch(request, makeEnv(undefined), ctx);

    expect(nextFetch).not.toHaveBeenCalled();
    expect(response.status).toBe(503);
  });
});
