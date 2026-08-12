// @vitest-environment node
//
// See `worker.test.ts` for why: happy-dom's Fetch classes drop forbidden
// headers (e.g. Cookie) at construction time, unlike Node's (undici) or
// workerd's.
import { describe, expect, it, vi } from 'vitest';
import { blockedCoreResponse, classifyCorePath, dispatchToRails } from '../src/lib/core-dispatch';

describe('org/core classifyCorePath', () => {
  it.each([
    ['/api/v0/session', 'rails'],
    ['/api/v0', 'rails'],
    ['/web/v0/thing', 'rails'],
    ['/edge/v0/thing', 'rails'],
    ['/oidc/callback', 'rails'],
    ['/oidc', 'rails'],
    ['/sign/out', 'rails'],
    ['/sign/out/complete', 'rails'],
    ['/.well-known/jwks.json', 'rails'],
    ['/csp-violation-report', 'rails'],
    ['/health', 'next'],
    ['/health/liveness.json', 'blocked'],
    ['/health/anything', 'blocked'],
    ['/', 'next'],
    ['/configuration', 'next'],
    ['/rails-health', 'next'],
    ['/apiv0-lookalike', 'next'],
  ])('classifies %s as %s', (pathname, expected) => {
    expect(classifyCorePath(pathname)).toBe(expected);
  });
});

describe('org/core blockedCoreResponse', () => {
  it('returns a 404 with noindex headers', async () => {
    const response = blockedCoreResponse();
    expect(response.status).toBe(404);
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  });
});

describe('org/core dispatchToRails', () => {
  it('returns 503 when no VPC binding is present', async () => {
    const response = await dispatchToRails(new Request('https://jp.umaxica.org/api/v0/x'), {});
    expect(response.status).toBe(503);
  });

  it('builds the Rails request against the public hostname, not a VPC routing label', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('ok'));
    await dispatchToRails(new Request('https://jp.umaxica.org/api/v0/x'), {
      UMAXICA_APPS_EDGE_CF_WORKERS_VPC: { fetch } as unknown as Fetcher,
    });
    const request = fetch.mock.calls[0]?.[0] as Request;
    expect(new URL(request.url).host).toBe('jp.umaxica.org');
  });

  it('does not add an X-Forwarded-Host header', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('ok'));
    await dispatchToRails(new Request('https://jp.umaxica.org/api/v0/x'), {
      UMAXICA_APPS_EDGE_CF_WORKERS_VPC: { fetch } as unknown as Fetcher,
    });
    const request = fetch.mock.calls[0]?.[0] as Request;
    expect(request.headers.get('x-forwarded-host')).toBeNull();
  });

  it('strips caller-controlled forwarding headers before dispatch', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('ok'));
    await dispatchToRails(
      new Request('https://jp.umaxica.org/api/v0/x', {
        headers: { forwarded: 'for=attacker', 'x-real-ip': '192.0.2.1' },
      }),
      { UMAXICA_APPS_EDGE_CF_WORKERS_VPC: { fetch } as unknown as Fetcher },
    );
    const request = fetch.mock.calls[0]?.[0] as Request;
    expect(request.headers.has('forwarded')).toBe(false);
    expect(request.headers.has('x-real-ip')).toBe(false);
  });

  it('omits duplex for a bodyless GET request', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('ok'));
    await dispatchToRails(new Request('https://jp.umaxica.org/api/v0/x'), {
      UMAXICA_APPS_EDGE_CF_WORKERS_VPC: { fetch } as unknown as Fetcher,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
