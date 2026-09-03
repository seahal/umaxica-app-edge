import { describe, it, expect } from 'vitest';

import type { RailsClient, RailsClientResult } from '../../src/lib/rails-client';
import { checkRailsHealth, edgeReadinessFromRails } from '../../src/lib/rails-health';

function makeClient(result: RailsClientResult): RailsClient {
  return {
    fetch: () => Promise.resolve(result),
  };
}

const PASS_DOCUMENT = {
  status: 'pass',
  checks: {
    startup: { status: 'pass' },
    liveness: { status: 'pass' },
    readiness: { status: 'pass' },
  },
};

function jsonResponse(status: number, body: unknown, contentType = 'application/json'): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': contentType },
  });
}

const LEAK_MARKERS = [
  'internal details',
  'connection refused to core.app.localhost',
  '019f5fe0-287f-7040-9f2f-036cb5b21df7',
  'session=abc123',
  'Bearer token-value',
  'localhost',
  'ProxyError',
];

describe('rails health api consumer', () => {
  it('requests the unprefixed Health API path and nothing else', async () => {
    const paths: string[] = [];
    const client: RailsClient = {
      fetch: (path) => {
        paths.push(path);
        return Promise.resolve({
          kind: 'ok',
          status: 200,
          response: jsonResponse(200, PASS_DOCUMENT),
        });
      },
    };

    await checkRailsHealth(client);

    expect(paths).toEqual(['/api/v0/health.json']);
  });

  it('reports not-configured when no client is available', async () => {
    const report = await checkRailsHealth(null);
    expect(report).toEqual({ kind: 'not-configured' });
    expect(edgeReadinessFromRails(report)).toBe('ok');
  });

  it('reports pass for HTTP 200 application/json with status=pass', async () => {
    const report = await checkRailsHealth(
      makeClient({ kind: 'ok', status: 200, response: jsonResponse(200, PASS_DOCUMENT) }),
    );
    expect(report).toEqual({ kind: 'pass', status: 200 });
    expect(edgeReadinessFromRails(report)).toBe('ok');
  });

  it('reports warn for HTTP 200 application/json with status=warn', async () => {
    const body = {
      ...PASS_DOCUMENT,
      status: 'warn',
      checks: { ...PASS_DOCUMENT.checks, readiness: { status: 'warn' } },
    };
    const report = await checkRailsHealth(
      makeClient({ kind: 'ok', status: 200, response: jsonResponse(200, body) }),
    );
    expect(report.kind).toBe('warn');
    expect(edgeReadinessFromRails(report)).toBe('ok');
  });

  it('reports fail for HTTP 503 application/json with status=fail', async () => {
    const body = {
      status: 'fail',
      checks: {
        startup: { status: 'pass' },
        liveness: { status: 'pass' },
        readiness: { status: 'fail' },
      },
    };
    const report = await checkRailsHealth(
      makeClient({
        kind: 'http-error',
        status: 503,
        response: jsonResponse(503, body),
      }),
    );
    expect(report).toEqual({ kind: 'fail', status: 503 });
    expect(edgeReadinessFromRails(report)).toBe('error');
  });

  it('accepts charset parameters and additive unknown fields', async () => {
    const body = {
      status: 'pass',
      checks: {
        startup: { status: 'pass' },
        liveness: { status: 'pass' },
        readiness: { status: 'pass' },
        storage: { status: 'warn' },
      },
      some_future_field: {},
    };
    const report = await checkRailsHealth(
      makeClient({
        kind: 'ok',
        status: 200,
        response: jsonResponse(200, body, 'application/json; charset=utf-8'),
      }),
    );
    expect(report.kind).toBe('pass');
  });

  it('reports invalid-contract for an unknown status vocabulary', async () => {
    const report = await checkRailsHealth(
      makeClient({
        kind: 'ok',
        status: 200,
        response: jsonResponse(200, { ...PASS_DOCUMENT, status: 'banana' }),
      }),
    );
    expect(report.kind).toBe('invalid-contract');
    expect(edgeReadinessFromRails(report)).toBe('error');
  });

  it('reports invalid-contract when HTTP 200 carries status=fail', async () => {
    const report = await checkRailsHealth(
      makeClient({
        kind: 'ok',
        status: 200,
        response: jsonResponse(200, { ...PASS_DOCUMENT, status: 'fail' }),
      }),
    );
    expect(report.kind).toBe('invalid-contract');
  });

  it('reports invalid-contract when HTTP 503 carries status=pass', async () => {
    const report = await checkRailsHealth(
      makeClient({
        kind: 'http-error',
        status: 503,
        response: jsonResponse(503, PASS_DOCUMENT),
      }),
    );
    expect(report.kind).toBe('invalid-contract');
  });

  it('reports invalid-contract for text/plain and text/html bodies', async () => {
    const plain = await checkRailsHealth(
      makeClient({
        kind: 'ok',
        status: 200,
        response: new Response('ok', { status: 200, headers: { 'content-type': 'text/plain' } }),
      }),
    );
    const html = await checkRailsHealth(
      makeClient({
        kind: 'ok',
        status: 200,
        response: new Response('<html></html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
      }),
    );
    expect(plain.kind).toBe('invalid-contract');
    expect(html.kind).toBe('invalid-contract');
  });

  it('reports invalid-contract for invalid JSON', async () => {
    const report = await checkRailsHealth(
      makeClient({
        kind: 'ok',
        status: 200,
        response: new Response('{', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      }),
    );
    expect(report.kind).toBe('invalid-contract');
  });

  it('reports invalid-contract when a required check is missing', async () => {
    const report = await checkRailsHealth(
      makeClient({
        kind: 'ok',
        status: 200,
        response: jsonResponse(200, {
          status: 'pass',
          checks: { startup: { status: 'pass' }, liveness: { status: 'pass' } },
        }),
      }),
    );
    expect(report.kind).toBe('invalid-contract');
  });

  it('reports invalid-contract on a redirect', async () => {
    const report = await checkRailsHealth(
      makeClient({
        kind: 'http-error',
        status: 302,
        response: new Response(null, { status: 302, headers: { location: '/elsewhere' } }),
      }),
    );
    expect(report.kind).toBe('invalid-contract');
    expect(report.status).toBe(302);
  });

  it('reports http-error for a non-health HTTP failure', async () => {
    const report = await checkRailsHealth(
      makeClient({
        kind: 'http-error',
        status: 404,
        response: new Response('missing', { status: 404 }),
      }),
    );
    expect(report).toEqual({ kind: 'http-error', status: 404 });
    expect(JSON.stringify(report)).not.toContain('missing');
  });

  it('reports unreachable when the VPC cannot reach Rails', async () => {
    const report = await checkRailsHealth(
      makeClient({ kind: 'unreachable', errorMessage: 'connection refused to core.app.localhost' }),
    );
    expect(report).toEqual({ kind: 'unreachable' });
    expect(edgeReadinessFromRails(report)).toBe('error');
  });

  it('maps a ProxyError-shaped client result to unreachable without the body', async () => {
    const report = await checkRailsHealth(
      makeClient({ kind: 'unreachable', errorMessage: 'ProxyError: connection_refused' }),
    );
    expect(report.kind).toBe('unreachable');
    expect(JSON.stringify(report)).not.toContain('ProxyError');
  });

  it('publishes no timing for the private hop, in any outcome', async () => {
    const reports = [
      await checkRailsHealth(null),
      await checkRailsHealth(
        makeClient({ kind: 'ok', status: 200, response: jsonResponse(200, PASS_DOCUMENT) }),
      ),
      await checkRailsHealth(makeClient({ kind: 'unreachable', errorMessage: 'nope' })),
    ];

    for (const report of reports) {
      expect(Object.keys(report)).not.toContain('latency_ms');
      expect(JSON.stringify(report)).not.toContain('latency');
    }
  });

  it('maps an unexpected client kind to unreachable without naming the kind', async () => {
    const report = await checkRailsHealth(
      makeClient({ kind: 'timeout' } as unknown as RailsClientResult),
    );
    expect(report.kind).toBe('unreachable');
    expect(JSON.stringify(report)).not.toContain('timeout');
  });

  it('maps an invalid-path client result to unreachable without its reason', async () => {
    const report = await checkRailsHealth(
      makeClient({ kind: 'invalid-path', reason: 'path must not be empty' }),
    );
    expect(report.kind).toBe('unreachable');
    expect(JSON.stringify(report)).not.toContain('path must not be empty');
  });

  it.each(LEAK_MARKERS)('never surfaces %s, whatever the client reports', async (marker) => {
    for (const result of [
      { kind: 'unreachable', errorMessage: marker },
      { kind: 'invalid-path', reason: marker },
      { kind: 'http-error', status: 500, response: new Response(marker, { status: 500 }) },
      {
        kind: 'ok',
        status: 200,
        response: jsonResponse(200, { ...PASS_DOCUMENT, message: marker }),
      },
    ] satisfies RailsClientResult[]) {
      const report = await checkRailsHealth(makeClient(result));
      expect(JSON.stringify(report)).not.toContain(marker);
    }
  });
});
