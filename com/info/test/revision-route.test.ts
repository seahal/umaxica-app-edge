import { afterEach, describe, expect, it } from 'vitest';

import { GET } from '../src/pages/revision';
import { resetEnv, setEnv, setEnvShouldThrow } from './__mocks__/cloudflare-workers';

afterEach(() => {
  resetEnv();
});

describe('revision route', () => {
  it('returns the version_metadata binding as JSON', async () => {
    setEnv({ REVISION: { id: 'abc', tag: 't', timestamp: '2024-01-01T00:00:00.000Z' } });

    const response = await GET({} as never);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toContain('no-store');
    await expect(response.json()).resolves.toEqual({
      id: 'abc',
      tag: 't',
      timestamp: '2024-01-01T00:00:00.000Z',
    });
  });

  it('returns null fields when the binding is missing', async () => {
    setEnv({});
    const response = await GET({} as never);
    await expect(response.json()).resolves.toEqual({ id: null, tag: null, timestamp: null });
  });

  it('returns null fields when the environment cannot be read', async () => {
    setEnvShouldThrow(true);
    const response = await GET({} as never);
    await expect(response.json()).resolves.toEqual({ id: null, tag: null, timestamp: null });
  });
});
