import { describe, it, expect } from 'vitest';

import type { RailsClient, RailsClientResult } from '../../src/lib/rails-client';
import { checkRailsLiveness } from '../../src/lib/rails-health';

function makeClient(result: RailsClientResult): RailsClient {
  return {
    fetch: () => Promise.resolve(result),
  };
}

/** Every string a caller could plausibly hope to read out of this report. */
const LEAK_MARKERS = [
  'internal details',
  'connection refused to core.org.localhost',
  '019f5fe0-287f-7040-9f2f-036cb5b21df7',
  'session=abc123',
  'Bearer token-value',
  'localhost',
  'ProxyError',
];

describe('rails liveness probe', () => {
  it('requests the unprefixed Rails liveness path and nothing else', async () => {
    const paths: string[] = [];
    const client: RailsClient = {
      fetch: (path) => {
        paths.push(path);
        return Promise.resolve({ kind: 'ok', status: 200, response: new Response('{}') });
      },
    };

    await checkRailsLiveness(client);

    // One request, and no `/{frame}/{brand}` prefix — Rails routes on the path
    // exactly as given and picks the namespace off the Host header instead.
    // See adr/006-development-workers-vpc-transport.md §4.
    expect(paths).toEqual(['/health/liveness.json']);
  });

  it('reports not-configured, with zero latency, when no client is available', async () => {
    const report = await checkRailsLiveness(null);
    expect(report).toEqual({ liveness: { kind: 'not-configured', latency_ms: 0 } });
  });

  it('reports ok with the upstream status for a healthy response', async () => {
    const client = makeClient({ kind: 'ok', status: 200, response: new Response('ok') });
    const report = await checkRailsLiveness(client);

    expect(report.liveness.kind).toBe('ok');
    expect(report.liveness.status).toBe(200);
    expect(typeof report.liveness.latency_ms).toBe('number');
    expect(report.liveness.latency_ms).toBeGreaterThanOrEqual(0);
  });

  it('reports http-error with only the status class, never the body', async () => {
    const client = makeClient({
      kind: 'http-error',
      status: 503,
      response: new Response('internal details', { status: 503 }),
    });
    const report = await checkRailsLiveness(client);

    expect(report.liveness.kind).toBe('http-error');
    expect(report.liveness.status).toBe(503);
    expect(JSON.stringify(report)).not.toContain('internal details');
  });

  it('reports unreachable and drops the client error message entirely', async () => {
    /*
     * The public shape used to carry `errorMessage`, fed by
     * `rails-client.ts`'s `getErrorMessage(error)` — i.e. an arbitrary
     * exception string on a public endpoint. This asserts the field is gone,
     * not merely that today's message happens to be harmless.
     */
    const client = makeClient({
      kind: 'unreachable',
      errorMessage: 'connection refused to core.org.localhost',
    });
    const report = await checkRailsLiveness(client);

    expect(report.liveness.kind).toBe('unreachable');
    expect(report.liveness).not.toHaveProperty('errorMessage');
    expect(report.liveness.status).toBeUndefined();
    expect(JSON.stringify(report)).not.toContain('core.org.localhost');
  });

  it('maps an invalid-path client result to unreachable without its reason', async () => {
    const client = makeClient({ kind: 'invalid-path', reason: 'path must not be empty' });
    const report = await checkRailsLiveness(client);

    expect(report.liveness.kind).toBe('unreachable');
    expect(JSON.stringify(report)).not.toContain('path must not be empty');
  });

  it.each(LEAK_MARKERS)('never surfaces %s, whatever the client reports', async (marker) => {
    for (const result of [
      { kind: 'unreachable', errorMessage: marker },
      { kind: 'invalid-path', reason: marker },
      { kind: 'http-error', status: 500, response: new Response(marker, { status: 500 }) },
      { kind: 'ok', status: 200, response: new Response(marker) },
    ] satisfies RailsClientResult[]) {
      const report = await checkRailsLiveness(makeClient(result));
      expect(JSON.stringify(report)).not.toContain(marker);
    }
  });
});
