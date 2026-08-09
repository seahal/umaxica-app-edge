import { describe, expect, it, vi } from 'vitest';
import {
  BLOCKED,
  FAIL,
  PASS,
  Report,
  SKIP,
  classifyProbeOutcome,
  extractInterfaceBlock,
  findMissingCells,
  isInsideContainer,
  loadSurfaces,
  main,
  parseRailsHealthJson,
  parseRailsHealthPage,
  railsHealthStatusMismatch,
  readRailsOrigin,
  waitFor,
} from '../tools/verify-edge-connectivity.mjs';
import { describeServiceIdProblem } from '../tools/lib/wrangler-config.mjs';

// The checker is the thing that decides whether the network is healthy, so its
// own control logic has to be pinned. Everything here is pure — no processes are
// spawned and no network is touched.

describe('mode handling', () => {
  it('rejects a missing mode', async () => {
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    await expect(main([])).resolves.toBe(2);
    expect(stderr).toHaveBeenCalled();
    stderr.mockRestore();
  });

  it('rejects an unknown mode rather than silently doing nothing', async () => {
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    await expect(main(['vpcc'])).resolves.toBe(2);
    stderr.mockRestore();
  });
});

describe('surfaces', () => {
  it('covers all fifteen Rails-backed frames, not just the three cores', () => {
    // The checker originally stopped at `*/core`, which silently left twelve
    // frames that talk to Rails completely unverified.
    const surfaces = loadSurfaces();
    expect(surfaces).toHaveLength(15);
    expect(new Set(surfaces.map((s) => s.brand))).toEqual(new Set(['app', 'com', 'org']));
    expect(new Set(surfaces.map((s) => s.frame))).toEqual(
      new Set(['core', 'docs', 'news', 'help', 'info']),
    );
  });

  it('reads each port from that workspace, never from a hard-coded table', () => {
    const ports = Object.fromEntries(loadSurfaces().map((s) => [s.key, s.port]));
    expect(ports).toEqual({
      'APP/CORE': 5405,
      'APP/DOCS': 5406,
      'APP/NEWS': 5407,
      'APP/HELP': 5408,
      'APP/INFO': 5403,
      'COM/CORE': 5105,
      'COM/DOCS': 5106,
      'COM/NEWS': 5107,
      'COM/HELP': 5108,
      'COM/INFO': 5103,
      'ORG/CORE': 5305,
      'ORG/DOCS': 5306,
      'ORG/NEWS': 5307,
      'ORG/HELP': 5308,
      'ORG/INFO': 5303,
    });
    expect(new Set(Object.values(ports)).size).toBe(15); // no collisions
  });

  it('derives each frame shape from disk, so cores and content frames differ', () => {
    for (const surface of loadSurfaces()) {
      // Only the cores own a /health Route Handler; all fifteen must publish
      // /rails-health in one form or the other, or the connection is unreportable.
      expect(surface.hasHealthRoute).toBe(surface.frame === 'core');
      expect(surface.railsHealthForm).toBe(surface.frame === 'core' ? 'html' : 'json');
    }
  });

  it('reads the Rails Host each frame will send', () => {
    for (const surface of loadSurfaces()) {
      expect(readRailsOrigin(surface.ws)).toMatch(/^http:\/\/core\.[a-z]+\.localhost:3000$/);
    }
  });
});

describe('report completeness', () => {
  it('flags a gate that omits a surface, so no surface can be silently dropped', () => {
    const report = new Report();
    report.record('Direct VPC → Rails', 'APP', PASS);
    report.record('Direct VPC → Rails', 'COM', PASS);
    expect(findMissingCells(report, ['APP', 'COM', 'ORG'])).toEqual(['Direct VPC → Rails/ORG']);
  });

  it('accepts SKIP as coverage, but not absence', () => {
    const report = new Report();
    for (const key of ['APP', 'COM', 'ORG']) report.record('Host port reachability', key, SKIP);
    expect(findMissingCells(report, ['APP', 'COM', 'ORG'])).toEqual([]);
  });

  it('would catch a gate that covered only the cores, across all fifteen keys', () => {
    // The exact regression this session existed to fix.
    const keys = loadSurfaces().map((s) => s.key);
    const report = new Report();
    for (const key of keys.filter((k) => k.endsWith('/CORE'))) {
      report.record('Preview → Rails VPC', key, PASS);
    }
    expect(findMissingCells(report, keys)).toHaveLength(12);
  });

  it('treats FAIL as the only non-zero exit condition', () => {
    const report = new Report();
    report.record('VPC config', 'APP', SKIP);
    report.note('WARN', 'production has no VPC Service yet');
    expect(report.hasFailure()).toBe(false);
    report.record('VPC config', 'COM', FAIL);
    expect(report.hasFailure()).toBe(true);
  });
});

describe('classifyProbeOutcome', () => {
  it('reports 200 as a transport pass', () => {
    const verdict = classifyProbeOutcome({ probe: { probe: 'reached', status: 200 } });
    expect(verdict.transport).toBe(PASS);
    expect(verdict.layer).toBeNull();
  });

  it('treats a 404 as proof the transport worked, blaming Rails routing', () => {
    // ADR 006's first verified run ended here. A 404 means the request arrived,
    // so reporting it as a transport failure would be actively misleading.
    const verdict = classifyProbeOutcome({ probe: { probe: 'reached', status: 404 } });
    expect(verdict.transport).toBe(PASS);
    expect(verdict.layer).toBe('Rails');
  });

  it('blames Rails for a 500, not the network', () => {
    const verdict = classifyProbeOutcome({ probe: { probe: 'reached', status: 500 } });
    expect(verdict.transport).toBe(PASS);
    expect(verdict.layer).toBe('Rails');
  });

  it('does not mistake a tunnel ProxyError for a Rails answer', () => {
    /*
     * Measured by stopping Rails: Workers VPC does not throw on an unreachable
     * origin, it returns HTTP 500 with `ProxyError: connection_refused` as the
     * body. Reading the status alone reports "Rails answered 500" when Rails
     * answered nothing — the exact layer confusion this tool exists to prevent.
     */
    const verdict = classifyProbeOutcome({
      probe: {
        probe: 'reached',
        status: 500,
        contentType: 'text/plain;charset=UTF-8',
        body: 'ProxyError: connection_refused',
      },
    });
    expect(verdict.transport).toBe(FAIL);
    expect(verdict.layer).toBe('Tunnel/private origin');
    expect(verdict.code).toBe('connection_refused');
    expect(verdict.detail).not.toContain('Rails answered');
  });

  it('still blames Rails for a 500 that carries no ProxyError', () => {
    const verdict = classifyProbeOutcome({
      probe: { probe: 'reached', status: 500, body: '{"error":"boom"}' },
    });
    expect(verdict.transport).toBe(PASS);
    expect(verdict.layer).toBe('Rails');
  });

  it('detects a missing binding', () => {
    const verdict = classifyProbeOutcome({ probe: { probe: 'binding-missing' } });
    expect(verdict).toMatchObject({ transport: FAIL, layer: 'Binding' });
  });

  it('maps documented VPC error codes to the layer that owns them', () => {
    const cases: Array<[string, string]> = [
      ['connection_refused', 'Tunnel/private origin'],
      ['destination_unavailable', 'Tunnel/private origin'],
      ['dns_error', 'Tunnel/private origin'],
      ['tls_certificate_error', 'Tunnel/private origin'],
      ['connection_timeout', 'Workers VPC'],
      ['rate_limited', 'Workers VPC'],
    ];
    for (const [code, layer] of cases) {
      const verdict = classifyProbeOutcome({
        probe: { probe: 'transport-error', message: `Error: ${code}` },
      });
      expect(verdict).toMatchObject({ transport: FAIL, layer, code });
    }
  });

  it('handles a timeout that carries no documented code', () => {
    const verdict = classifyProbeOutcome({
      probe: { probe: 'transport-error', message: 'The operation was aborted due to timeout' },
    });
    expect(verdict).toMatchObject({ transport: FAIL, layer: 'Workers VPC' });
  });

  it('never reduces an unknown transport error to a generic network error', () => {
    const verdict = classifyProbeOutcome({
      probe: { probe: 'transport-error', message: 'something new' },
    });
    expect(verdict.detail).toContain('something new');
  });

  it('reports missing auth as BLOCKED, never as PASS', () => {
    const verdict = classifyProbeOutcome({
      wranglerOutput: 'ERROR remote session could not be authenticated',
    });
    expect(verdict.transport).toBe(BLOCKED);
    expect(verdict.layer).toBe('Wrangler auth');
    expect(verdict.detail).toContain('wrangler login');
  });

  it('recognises the 10405 API-token rejection specifically', () => {
    const verdict = classifyProbeOutcome({
      wranglerOutput: 'code: 10405 Method not allowed for this authentication scheme',
    });
    expect(verdict.transport).toBe(BLOCKED);
  });

  it('fails rather than passes when the probe produced nothing', () => {
    expect(classifyProbeOutcome({ probe: null }).transport).toBe(FAIL);
  });
});

describe('service_id validation', () => {
  it.each([
    '',
    'TODO',
    '00000000-0000-0000-0000-000000000000',
    'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  ])('rejects the placeholder %j', (value) => {
    expect(describeServiceIdProblem(value)).not.toBeNull();
  });

  it('rejects a non-UUID and a missing value', () => {
    expect(describeServiceIdProblem('not-a-uuid')).toContain('not a UUID');
    expect(describeServiceIdProblem(undefined)).toContain('missing');
  });

  it('accepts the real development service id', () => {
    expect(describeServiceIdProblem('019f5fe0-287f-7040-9f2f-036cb5b21df7')).toBeNull();
  });
});

describe('parseRailsHealthPage', () => {
  it.each([
    ['Rails health is reachable', 'ok'],
    ['Rails responded with an error', 'http-error'],
    ['Rails is unreachable', 'unreachable'],
    ['Rails VPC binding is not configured', 'not-configured'],
  ])('maps %j to %j', (heading, kind) => {
    expect(parseRailsHealthPage(`<h1>${heading}</h1>`)).toBe(kind);
  });

  it('returns null for a page it does not recognise', () => {
    expect(parseRailsHealthPage('<h1>502 Bad Gateway</h1>')).toBeNull();
  });
});

describe('parseRailsHealthJson', () => {
  // The twelve content frames answer with a Route Handler, not a page.
  it.each(['ok', 'http-error', 'unreachable', 'not-configured'])('reads kind %j', (kind) => {
    expect(parseRailsHealthJson(JSON.stringify({ rails: { kind } }))).toBe(kind);
  });

  it('rejects a kind it does not know, rather than passing it through', () => {
    expect(parseRailsHealthJson('{"rails":{"kind":"probably-fine"}}')).toBeNull();
  });

  it('returns null for HTML or malformed bodies instead of throwing', () => {
    expect(parseRailsHealthJson('<!DOCTYPE html><h1>hi</h1>')).toBeNull();
    expect(parseRailsHealthJson('')).toBeNull();
    expect(parseRailsHealthJson('{"rails":null}')).toBeNull();
  });
});

describe('railsHealthStatusMismatch', () => {
  // The JSON route contracts 200 for ok and 503 otherwise; a body and status that
  // disagree would let a broken route read as healthy.
  it('accepts the documented pairings', () => {
    expect(railsHealthStatusMismatch('ok', 200)).toBeNull();
    expect(railsHealthStatusMismatch('not-configured', 503)).toBeNull();
    expect(railsHealthStatusMismatch('unreachable', 503)).toBeNull();
  });

  it('catches a healthy body served under a failing status, and the reverse', () => {
    expect(railsHealthStatusMismatch('ok', 503)).toContain('should answer 200');
    expect(railsHealthStatusMismatch('unreachable', 200)).toContain('should answer 503');
  });
});

describe('extractInterfaceBlock', () => {
  // A lazy regex here previously ran DevelopmentEnv into the following
  // PreviewEnv and reported the VPC binding as present in both — a false FAIL.
  const source = [
    'declare namespace Cloudflare {',
    '  interface DevelopmentEnv {',
    '    ASSETS: Fetcher;',
    '  }',
    '  interface PreviewEnv {',
    '    UMAXICA_APPS_EDGE_CF_WORKERS_VPC: Fetcher;',
    '  }',
    '}',
  ].join('\n');

  it('stops at the end of the named interface', () => {
    expect(extractInterfaceBlock(source, 'DevelopmentEnv')).not.toContain('VPC');
    expect(extractInterfaceBlock(source, 'PreviewEnv')).toContain('VPC');
  });

  it('returns null for an interface that is not there', () => {
    expect(extractInterfaceBlock(source, 'MissingEnv')).toBeNull();
  });
});

describe('waitFor', () => {
  it('returns as soon as the condition holds', async () => {
    let calls = 0;
    const result = await waitFor(() => ++calls >= 3, { timeoutMs: 5000, intervalMs: 1 });
    expect(result.ok).toBe(true);
  });

  it('gives up at the deadline instead of hanging', async () => {
    const result = await waitFor(() => false, { timeoutMs: 20, intervalMs: 5 });
    expect(result).toEqual({ ok: false, reason: 'timeout' });
  });

  it('aborts early when the child process has already died', async () => {
    const result = await waitFor(() => false, {
      timeoutMs: 5000,
      intervalMs: 1,
      onGiveUp: () => true,
    });
    expect(result).toEqual({ ok: false, reason: 'aborted' });
  });

  it('keeps polling when the check throws, since the server may not be up', async () => {
    let calls = 0;
    const result = await waitFor(
      () => {
        if (++calls < 3) throw new Error('ECONNREFUSED');
        return true;
      },
      { timeoutMs: 5000, intervalMs: 1 },
    );
    expect(result.ok).toBe(true);
    expect(calls).toBe(3);
  });
});

describe('isInsideContainer', () => {
  it('detects the devcontainer and the docker marker file', () => {
    expect(isInsideContainer({ DEVCONTAINER: '1' }, () => false)).toBe(true);
    expect(isInsideContainer({}, (path) => path === '/.dockerenv')).toBe(true);
    expect(isInsideContainer({}, () => false)).toBe(false);
  });
});
