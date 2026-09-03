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
  'connection refused to core.com.localhost',
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

  it('reports not-configured when no client is available', async () => {
    const report = await checkRailsLiveness(null);
    expect(report).toEqual({ liveness: { kind: 'not-configured' } });
  });

  it('reports ok with the upstream status for a healthy response', async () => {
    const client = makeClient({ kind: 'ok', status: 200, response: new Response('ok') });
    const report = await checkRailsLiveness(client);

    expect(report.liveness.kind).toBe('ok');
    expect(report.liveness.status).toBe(200);
  });

  /*
   * `/health` is unauthenticated by design, so every field on it is published to
   * anyone who asks. A timing measurement of the private edge-to-Rails hop is not
   * something a health check's callers need, and it was the last field on this
   * document that told an anonymous caller anything about the hop's behaviour
   * rather than its outcome. Timing lives in Workers Logs instead.
   *
   * Asserted on the object rather than on a type, because the type is erased and
   * a re-added field would compile.
   */
  it('publishes no timing for the private hop, in any outcome', async () => {
    const reports = [
      await checkRailsLiveness(null),
      await checkRailsLiveness(
        makeClient({ kind: 'ok', status: 200, response: new Response('ok') }),
      ),
      await checkRailsLiveness(makeClient({ kind: 'unreachable', errorMessage: 'nope' })),
    ];

    for (const report of reports) {
      expect(Object.keys(report.liveness)).not.toContain('latency_ms');
      expect(JSON.stringify(report)).not.toContain('latency');
    }
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
      errorMessage: 'connection refused to core.com.localhost',
    });
    const report = await checkRailsLiveness(client);

    expect(report.liveness.kind).toBe('unreachable');
    expect(report.liveness).not.toHaveProperty('errorMessage');
    expect(report.liveness.status).toBeUndefined();
    expect(JSON.stringify(report)).not.toContain('core.com.localhost');
  });

  it('maps a timeout client result to unreachable without naming the kind', async () => {
    const client: RailsClient = {
      fetch: () => Promise.resolve({ kind: 'timeout' } as unknown as RailsClientResult),
    };
    const report = await checkRailsLiveness(client);

    expect(report.liveness.kind).toBe('unreachable');
    expect(JSON.stringify(report)).not.toContain('timeout');
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
