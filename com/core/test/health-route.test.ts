import { afterEach, describe, expect, it, vi } from 'vitest';

import { checkRailsLiveness } from '../src/lib/rails-health';
import * as runtimeHealth from '../src/lib/runtime-health';
import { resetEnv, setEnv } from './__mocks__/cloudflare-workers';
import { handlers } from './utils/routes';

const GET = handlers.health;

afterEach(() => {
  vi.restoreAllMocks();
  resetEnv();
});

function expectPlainHealth(response: Response) {
  expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
  expect(response.headers.get('cache-control')).toBe('no-store');
}

describe('health probes', () => {
  it('answers 200 text/plain on all four URLs', async () => {
    for (const get of [GET, handlers.startups, handlers.livenesses, handlers.readinesses]) {
      const response = await get();
      expect(response.status).toBe(200);
      expectPlainHealth(response);
      const body = await response.text();
      expect(body).not.toContain('{');
      expect(body).not.toContain('<html');
    }
  });

  it('returns ok bodies for individual probes and the aggregate document', async () => {
    await expect((await handlers.startups()).text()).resolves.toBe('ok\n');
    await expect((await handlers.livenesses()).text()).resolves.toBe('ok\n');
    await expect((await handlers.readinesses()).text()).resolves.toBe('ok\n');
    await expect((await GET()).text()).resolves.toBe(
      'status: ok\nstartup: ok\nliveness: ok\nreadiness: ok\n',
    );
  });

  it('answers 503 when readiness fails, without failing liveness', async () => {
    vi.spyOn(runtimeHealth.runtimeProbes, 'checkReadiness').mockReturnValue('error');

    const ready = await handlers.readinesses();
    expect(ready.status).toBe(503);
    await expect(ready.text()).resolves.toBe('error\n');

    const live = await handlers.livenesses();
    expect(live.status).toBe(200);
    await expect(live.text()).resolves.toBe('ok\n');

    const aggregate = await GET();
    expect(aggregate.status).toBe(503);
    await expect(aggregate.text()).resolves.toBe(
      'status: error\nstartup: ok\nliveness: ok\nreadiness: error\n',
    );
  });

  it('does not probe Rails or any other downstream on liveness', async () => {
    const fetch = vi.fn(() => Promise.reject(new Error('connect ECONNREFUSED core.app.localhost')));
    setEnv({ UMAXICA_APPS_EDGE_CF_WORKERS_VPC: { fetch } });

    const response = await handlers.livenesses();

    expect(response.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
    const body = await response.text();
    expect(body).toBe('ok\n');
    expect(body).not.toContain('ECONNREFUSED');
    expect(body).not.toContain('core.app.localhost');
  });

  it('does not call Rails from the aggregate document', async () => {
    const fetch = vi.fn(() => Promise.resolve(new Response('{}', { status: 503 })));
    setEnv({ UMAXICA_APPS_EDGE_CF_WORKERS_VPC: { fetch } });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('rails-health helper stays closed', () => {
  it('still reports kinds without leaking exception text', async () => {
    const report = await checkRailsLiveness(null);
    expect(report).toEqual({ liveness: { kind: 'not-configured' } });
  });
});
