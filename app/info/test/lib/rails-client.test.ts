import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn<() => { env: Record<string, unknown> }>().mockReturnValue({
    env: {},
  }),
}));

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getRailsClient } from '../../src/lib/rails-client';

describe('app/info rails client', () => {
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
    expect(new URL(requestUrl).host).toBe('info.app.localhost:3000');
    expect(new URL(requestUrl).pathname).toBe('/edge/v0/health');
  });

  it('uses the private Podman transport only for explicit local Node development', async () => {
    const fetchSpy = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response('ok', { status: 200 })),
    );
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubEnv('EDGE_LOCAL_NODE_RUNTIME', '1');
    vi.stubEnv('EDGE_LOCAL_RAILS_ENABLED', '1');

    const client = getRailsClient();
    expect(client).not.toBeNull();

    await client?.fetch('/health/liveness.json');

    const [requestUrl, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(new URL(requestUrl).origin).toBe('http://info.app.localhost:3000');
    expect(new URL(requestUrl).pathname).toBe('/health/liveness.json');

    const headers = new Headers(init.headers);
    expect(headers.has('cf-access-client-id')).toBe(false);
    expect(headers.has('cf-access-client-secret')).toBe(false);
  });

  it('does not fabricate a local transport from the Rails overlay alone', () => {
    vi.stubEnv('EDGE_LOCAL_RAILS_ENABLED', '1');

    expect(getRailsClient()).toBeNull();
  });

  it('fails closed to null when no binding exists', () => {
    const client = getRailsClient();

    expect(client).toBeNull();
  });
});
