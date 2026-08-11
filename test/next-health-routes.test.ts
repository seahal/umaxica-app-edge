import { afterEach, describe, expect, it, vi } from 'vitest';
import type * as NextServer from 'next/server';

const mocks = vi.hoisted(() => ({
  connection: vi.fn(),
}));

vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof NextServer>()),
  connection: mocks.connection,
}));
import { setCloudflareContext } from '@opennextjs/cloudflare';

import { GET as appCoreRails } from '../app/core/src/app/rails-health/route';
import { GET as appDocsRails } from '../app/docs/src/app/rails-health/route';
import { GET as appHelpRails } from '../app/help/src/app/rails-health/route';
import { GET as appInfoRails } from '../app/info/src/app/rails-health/route';
import { GET as appNewsRails } from '../app/news/src/app/rails-health/route';
import { GET as comCoreRails } from '../com/core/src/app/rails-health/route';
import { GET as comDocsRails } from '../com/docs/src/app/rails-health/route';
import { GET as comHelpRails } from '../com/help/src/app/rails-health/route';
import { GET as comInfoRails } from '../com/info/src/app/rails-health/route';
import { GET as comNewsRails } from '../com/news/src/app/rails-health/route';
import { GET as orgCoreRails } from '../org/core/src/app/rails-health/route';
import { GET as orgDocsRails } from '../org/docs/src/app/rails-health/route';
import { GET as orgHelpRails } from '../org/help/src/app/rails-health/route';
import { GET as orgInfoRails } from '../org/info/src/app/rails-health/route';
import { GET as orgNewsRails } from '../org/news/src/app/rails-health/route';
import { GET as appInfoIdentity } from '../app/info/src/app/health.json/route';
import { GET as comInfoIdentity } from '../com/info/src/app/health.json/route';
import { GET as orgInfoIdentity } from '../org/info/src/app/health.json/route';

const railsRoutes = [
  ['app/core', appCoreRails],
  ['app/docs', appDocsRails],
  ['app/help', appHelpRails],
  ['app/info', appInfoRails],
  ['app/news', appNewsRails],
  ['com/core', comCoreRails],
  ['com/docs', comDocsRails],
  ['com/help', comHelpRails],
  ['com/info', comInfoRails],
  ['com/news', comNewsRails],
  ['org/core', orgCoreRails],
  ['org/docs', orgDocsRails],
  ['org/help', orgHelpRails],
  ['org/info', orgInfoRails],
  ['org/news', orgNewsRails],
] as const;

const identityRoutes = [
  ['app', appInfoIdentity],
  ['com', comInfoIdentity],
  ['org', orgInfoIdentity],
] as const;

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe.each(railsRoutes)('%s Rails health route', (_workspace, get) => {
  it('reports a healthy private Rails response', async () => {
    const fetch = vi.fn(() => Promise.resolve(new Response('{}', { status: 200 })));
    setCloudflareContext({
      env: { UMAXICA_APPS_EDGE_CF_WORKERS_VPC: { fetch } },
    });

    const response = await get();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ rails: { kind: 'ok', status: 200 } });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('fails closed when no private Rails transport is configured', async () => {
    setCloudflareContext({ env: {} });
    const response = await get();
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ rails: { kind: 'not-configured' } });
  });
});

describe.each(identityRoutes)('%s/info identity route', (service, get) => {
  it('reports the answering frame without reflecting the request host', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    const response = await get();
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    await expect(response.json()).resolves.toMatchObject({
      status: 'OK',
      service,
      frame: 'info',
      environment: 'test',
    });
  });

  it('reports a null environment when NODE_ENV is absent', async () => {
    const previous = process.env.NODE_ENV;
    Reflect.deleteProperty(process.env, 'NODE_ENV');
    try {
      const response = await get();
      await expect(response.json()).resolves.toMatchObject({ service, environment: null });
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});
