import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createRailsClient as appCore } from '../app/core/src/lib/rails-client';
import { createRailsClient as appDocs } from '../app/docs/src/lib/rails-client';
import { createRailsClient as appHelp } from '../app/help/src/lib/rails-client';
import { createRailsClient as appInfo } from '../app/info/src/lib/rails-client';
import { createRailsClient as appNews } from '../app/news/src/lib/rails-client';
import { createRailsClient as comCore } from '../com/core/src/lib/rails-client';
import { createRailsClient as comDocs } from '../com/docs/src/lib/rails-client';
import { createRailsClient as comHelp } from '../com/help/src/lib/rails-client';
import { createRailsClient as comInfo } from '../com/info/src/lib/rails-client';
import { createRailsClient as comNews } from '../com/news/src/lib/rails-client';
import { createRailsClient as orgCore } from '../org/core/src/lib/rails-client';
import { createRailsClient as orgDocs } from '../org/docs/src/lib/rails-client';
import { createRailsClient as orgHelp } from '../org/help/src/lib/rails-client';
import { createRailsClient as orgInfo } from '../org/info/src/lib/rails-client';
import { createRailsClient as orgNews } from '../org/news/src/lib/rails-client';

type Factory = typeof appCore;

const factories: ReadonlyArray<readonly [string, Factory]> = [
  ['app/core', appCore],
  ['app/docs', appDocs],
  ['app/help', appHelp],
  ['app/info', appInfo],
  ['app/news', appNews],
  ['com/core', comCore],
  ['com/docs', comDocs],
  ['com/help', comHelp],
  ['com/info', comInfo],
  ['com/news', comNews],
  ['org/core', orgCore],
  ['org/docs', orgDocs],
  ['org/help', orgHelp],
  ['org/info', orgInfo],
  ['org/news', orgNews],
];

describe.each(factories)('%s Rails client edge cases', (_workspace, createRailsClient) => {
  it('rejects every dangerous relative-path form before fetching', async () => {
    const fetch = vi.fn(() => Promise.resolve(new Response('ok')));
    const client = createRailsClient({ fetch }, 'http://core.example.localhost:3000');

    await expect(client.fetch('/nested://scheme')).resolves.toMatchObject({
      kind: 'invalid-path',
      reason: 'path must not embed a scheme',
    });
    await expect(client.fetch('/with\u007fcontrol')).resolves.toMatchObject({
      kind: 'invalid-path',
      reason: 'path must not contain control characters',
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('reports non-Error transport failures without losing their message', async () => {
    const client = createRailsClient(
      { fetch: vi.fn(() => Promise.reject('socket unavailable')) },
      'http://core.example.localhost:3000',
    );

    await expect(client.fetch('/health')).resolves.toEqual({
      kind: 'unreachable',
      errorMessage: 'socket unavailable',
    });
  });

  it('preserves an HTTP error when its plain-text body cannot be inspected', async () => {
    const response = {
      ok: false,
      status: 500,
      headers: new Headers({ 'content-type': 'text/plain' }),
      clone: () => ({ text: () => Promise.reject(new Error('body unavailable')) }),
    } as unknown as Response;
    const client = createRailsClient(
      { fetch: vi.fn(() => Promise.resolve(response)) },
      'http://core.example.localhost:3000',
    );

    await expect(client.fetch('/health')).resolves.toMatchObject({
      kind: 'http-error',
      status: 500,
    });
  });

  it('does not inspect ordinary non-500 HTTP errors as VPC proxy failures', async () => {
    const response = new Response('missing', {
      status: 404,
      headers: { 'content-type': 'text/plain' },
    });
    const client = createRailsClient(
      { fetch: vi.fn(() => Promise.resolve(response)) },
      'http://core.example.localhost:3000',
    );
    await expect(client.fetch('/missing')).resolves.toMatchObject({
      kind: 'http-error',
      status: 404,
    });
  });

  it('applies transport credentials after stripping caller credentials', async () => {
    const fetch = vi.fn(() => Promise.resolve(new Response('ok')));
    const client = createRailsClient({ fetch }, 'http://core.example.localhost:3000', {
      authorization: 'Bearer transport',
    });

    await client.fetch('/health', { headers: { authorization: 'Bearer caller' } });
    const headers = new Headers(fetch.mock.calls[0]?.[1]?.headers);
    expect(headers.get('authorization')).toBe('Bearer transport');
  });

  it('fails closed when the configured origin is not normalized', async () => {
    const fetch = vi.fn(() => Promise.resolve(new Response('ok')));
    const client = createRailsClient({ fetch }, 'http://core.example.localhost:3000/');

    await expect(client.fetch('/health')).resolves.toEqual({
      kind: 'invalid-path',
      reason: 'path resolved outside the fixed origin',
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
