import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn<() => { env: Record<string, unknown> }>().mockReturnValue({
    env: {},
  }),
}));

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getRailsClient } from '../../src/lib/rails-client';

describe('com/news rails client', () => {
  afterEach(() => {
    vi.mocked(getCloudflareContext)
      .mockReset()
      .mockReturnValue({ env: {} } as unknown as ReturnType<typeof getCloudflareContext>);
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('uses the VPC binding when present', async () => {
    const fetchMock = vi.fn<(input: string) => Promise<Response>>(() =>
      Promise.resolve(new Response('ok', { status: 200 })),
    );
    vi.mocked(getCloudflareContext).mockReturnValue({
      env: { UMAXICA_APPS_EDGE_CF_WORKERS_VPC: { fetch: fetchMock } },
    } as unknown as ReturnType<typeof getCloudflareContext>);

    const client = getRailsClient();
    expect(client).not.toBeNull();

    await client?.fetch('/edge/v0/health');

    const [requestUrl] = fetchMock.mock.calls[0] as [string];
    expect(new URL(requestUrl).host).toBe('core.app.localhost:3000');
    expect(new URL(requestUrl).pathname).toBe('/edge/v0/health');
  });

  it('uses the Access transport when configured instead of the binding', async () => {
    // development: no VPC binding, so the client goes out over HTTPS to an
    // Access-protected hostname and presents a service token.
    const fetchSpy = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response('ok', { status: 200 })),
    );
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubEnv('PUBLIC_CORE_RAILS_ORIGIN', 'https://rails.example.test');
    vi.stubEnv('PUBLIC_CORE_ACCESS_CLIENT_ID', 'service-token-id');
    vi.stubEnv('PUBLIC_CORE_ACCESS_CLIENT_SECRET', 'service-token-secret');

    const client = getRailsClient();
    expect(client).not.toBeNull();

    await client?.fetch('/health/liveness.json');

    const [requestUrl, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(new URL(requestUrl).origin).toBe('https://rails.example.test');
    expect(new URL(requestUrl).pathname).toBe('/health/liveness.json');

    const headers = new Headers(init.headers);
    expect(headers.get('cf-access-client-id')).toBe('service-token-id');
    expect(headers.get('cf-access-client-secret')).toBe('service-token-secret');
  });

  it('ignores a partial Access configuration rather than calling out unauthenticated', () => {
    // Origin present but no token: reaching the Access hostname without
    // credentials would return an Access login page, which reads as a Rails
    // outage. Fail closed instead.
    vi.stubEnv('PUBLIC_CORE_RAILS_ORIGIN', 'https://rails.example.test');

    expect(getRailsClient()).toBeNull();
  });

  it('fails closed to null when no binding exists', () => {
    const client = getRailsClient();

    expect(client).toBeNull();
  });
});
