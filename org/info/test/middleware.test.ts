import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn<() => { env: Record<string, unknown> }>().mockReturnValue({
    env: {},
  }),
}));

import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { middleware } from '../src/middleware';

describe('org/info middleware', () => {
  afterEach(() => {
    vi.mocked(getCloudflareContext)
      .mockReset()
      .mockReturnValue({
        env: {},
      } as unknown as ReturnType<typeof getCloudflareContext>);
  });

  it('passes the request through when no RATE_LIMITER binding is present', async () => {
    const request = new NextRequest('http://localhost/');
    const response = await middleware(request);
    expect(response.status).toBe(200);
  });

  it('returns 429 when the rate limiter rejects the request', async () => {
    vi.mocked(getCloudflareContext).mockReturnValue({
      env: { RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: false }) } },
    } as unknown as ReturnType<typeof getCloudflareContext>);

    const request = new NextRequest('http://localhost/');
    const response = await middleware(request);
    expect(response.status).toBe(429);
  });

  it('passes the request through when the rate limiter allows it', async () => {
    vi.mocked(getCloudflareContext).mockReturnValue({
      env: { RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) } },
    } as unknown as ReturnType<typeof getCloudflareContext>);

    const request = new NextRequest('http://localhost/');
    const response = await middleware(request);
    expect(response.status).toBe(200);
  });
});
