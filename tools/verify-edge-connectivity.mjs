#!/usr/bin/env node
// Connectivity acceptance check for the Edge development network.
//
// Run from the repo root: node tools/verify-edge-connectivity.mjs <mode>
// (or `pnpm run check:connectivity`). See docs/operations/connectivity-acceptance.md.
//
// The point of this tool is that the paths it tests are NOT interchangeable:
//
//   next dev          Node. No VPC binding exists in `env.development`, so
//                     /rails-health here can never be VPC evidence.
//   preview           local workerd, `--env development`. No binding either.
//   preview:vpc       local workerd, `--env vpc`. The real remote binding.
//   vpc (this tool)   the binding alone, with no application code in the way.
//
// `/rails-health` cannot distinguish them: getRailsClient() falls back to a
// global fetch() against an Access-protected hostname that fronts the *same*
// tunnel, and RailsHealthResult carries no transport identity. So a green
// /rails-health is never accepted here as proof that the VPC binding works.
// That proof comes only from mode `vpc`.

import { spawn } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  describeServiceIdProblem,
  loadManifest,
  readWranglerConfig,
  repoRoot,
} from './lib/wrangler-config.mjs';

export const PASS = 'PASS';
export const WARN = 'WARN';
export const FAIL = 'FAIL';
export const BLOCKED = 'BLOCKED';
export const SKIP = 'SKIP';

export const MODES = ['config', 'vpc', 'next', 'preview', 'preview:vpc', 'host', 'links', 'all'];

// `host` is excluded from `all` on purpose: it is meaningless inside the
// container, which is where `all` is run.
const ALL_MODES = ['config', 'vpc', 'next', 'preview', 'preview:vpc'];

const LOG_DIR = join(repoRoot, 'tmp/connectivity-check');
const PROBE_PORT = Number(process.env.VPC_PROBE_PORT ?? 8799);
const PREVIEW_PORT = 8787; // opennextjs-cloudflare preview passes no --port.

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

/**
 * Every Rails-backed surface — all fifteen `{app,com,org}/{core,docs,news,help,
 * info}` frames, taken whole from tools/workers-manifest.json.
 *
 * Ports come from each workspace's own `dev` script, and the shape of each frame
 * (does it have `/health`? is `/rails-health` a page or a route handler?) is
 * **derived from the files on disk**, never from a hard-coded list of cores. Add
 * `/health` to a content frame and it starts being checked without touching this
 * tool; that is the property that stops the checker drifting from the repo.
 */
export function loadSurfaces(manifest = loadManifest()) {
  return manifest.railsBacked.map((ws) => {
    const [brand, frame] = ws.split('/');
    const pkg = JSON.parse(readFileSync(join(repoRoot, ws, 'package.json'), 'utf8'));
    const port = Number(/--port\s+(\d+)/.exec(pkg.scripts?.dev ?? '')?.[1]);
    if (!Number.isInteger(port)) {
      throw new Error(`${ws}: could not read a --port from its dev script`);
    }

    // Only the three cores answer /health from a Route Handler; all fifteen
    // expose /rails-health as JSON. Both facts are read from disk, not assumed.
    const hasHealthRoute = existsSync(join(repoRoot, ws, 'src/app/health/route.ts'));
    const hasRailsHealth = existsSync(join(repoRoot, ws, 'src/app/rails-health/route.ts'));

    return {
      key: `${brand.toUpperCase()}/${frame.toUpperCase()}`,
      brand,
      frame,
      ws,
      pkgName: pkg.name,
      port,
      hasHealthRoute,
      // false is a FAIL later, not a skip: a Rails-backed frame with no
      // /rails-health has no way to report the connection at all.
      hasRailsHealth,
    };
  });
}

/** The Rails origin a frame will send, read from its rails-client copy. */
export function readRailsOrigin(ws) {
  const source = readFileSync(join(repoRoot, ws, 'src/lib/rails-client.ts'), 'utf8');
  return /PRIVATE_RAILS_ORIGIN\s*=\s*'([^']+)'/.exec(source)?.[1] ?? null;
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

export class Report {
  constructor() {
    this.rows = new Map(); // gate -> Map(surfaceKey -> {status, detail})
    this.notes = [];
  }

  record(gate, surfaceKey, status, detail = '') {
    if (!this.rows.has(gate)) this.rows.set(gate, new Map());
    this.rows.get(gate).set(surfaceKey, { status, detail });
  }

  note(status, message) {
    this.notes.push({ status, message });
  }

  get(gate, surfaceKey) {
    return this.rows.get(gate)?.get(surfaceKey);
  }

  hasFailure() {
    for (const row of this.rows.values()) {
      for (const cell of row.values()) {
        if (cell.status === FAIL) return true;
      }
    }
    return this.notes.some((n) => n.status === FAIL);
  }
}

/**
 * Every gate must name every surface. A gate that silently omits one would read
 * as "covered" when it was not; SKIP is allowed, silence is not.
 */
export function findMissingCells(report, surfaceKeys) {
  const missing = [];
  for (const [gate, row] of report.rows) {
    for (const key of surfaceKeys) {
      if (!row.has(key)) missing.push(`${gate}/${key}`);
    }
  }
  return missing;
}

// ---------------------------------------------------------------------------
// VPC failure classification
// ---------------------------------------------------------------------------

// Cloudflare documents the exact codes a VPC fetch() throws. Match on those
// rather than inventing categories, and never collapse them to "network error".
// https://developers.cloudflare.com/workers-vpc/reference/troubleshooting/
const TRANSPORT_CODES = [
  ['dns_error', 'Tunnel/private origin', 'the origin hostname did not resolve on the Rails side'],
  ['connection_refused', 'Tunnel/private origin', 'nothing is listening behind the tunnel'],
  ['connection_terminated', 'Tunnel/private origin', 'the origin closed the connection'],
  ['destination_unavailable', 'Tunnel/private origin', 'the tunnel could not reach the origin'],
  [
    'destination_not_found',
    'Tunnel/private origin',
    'the VPC Service has no reachable destination',
  ],
  ['tls_certificate_error', 'Tunnel/private origin', 'the origin TLS certificate was rejected'],
  ['http_response_incomplete', 'Rails', 'the origin returned a truncated response'],
  ['connection_read_timeout', 'Tunnel/private origin', 'the origin accepted but never answered'],
  ['connection_timeout', 'Workers VPC', 'the connection attempt timed out'],
  ['connection_limit_reached', 'Workers VPC', 'the VPC Service hit its connection limit'],
  ['rate_limited', 'Workers VPC', 'the request was rate limited'],
];

/**
 * Turn a probe result (plus wrangler's own output) into a transport verdict and
 * the layer responsible. `transport` answers only "did the request leave over
 * the binding and arrive"; a 404 from Rails means it did.
 */
export function classifyProbeOutcome({ probe, wranglerOutput = '' } = {}) {
  const output = wranglerOutput.toLowerCase();

  if (
    output.includes('remote session could not be authenticated') ||
    output.includes('10405') ||
    output.includes('method not allowed for this authentication scheme')
  ) {
    return {
      transport: BLOCKED,
      layer: 'Wrangler auth',
      detail:
        'an API token cannot open a remote-binding session — run `wrangler login`, and check the root .env is excluded via --env-file',
    };
  }
  if (output.includes('not logged in') || output.includes('you are not authenticated')) {
    return { transport: BLOCKED, layer: 'Wrangler auth', detail: 'no Cloudflare session' };
  }
  if (/vpc service .*not found|could not find vpc service|service_id/.test(output)) {
    return {
      transport: FAIL,
      layer: 'Binding',
      detail: 'Cloudflare rejected the configured service_id',
    };
  }

  if (!probe) {
    return {
      transport: FAIL,
      layer: 'Wrangler',
      detail: 'the probe worker produced no response — see the log',
    };
  }

  if (probe.probe === 'binding-missing') {
    return {
      transport: FAIL,
      layer: 'Binding',
      detail: 'the VPC binding was not present in the Worker env',
    };
  }

  if (probe.probe === 'transport-error') {
    const haystack = `${probe.message ?? ''} ${probe.cause ?? ''}`.toLowerCase();
    for (const [code, layer, detail] of TRANSPORT_CODES) {
      if (haystack.includes(code)) {
        return { transport: FAIL, layer, detail: `${code}: ${detail}`, code };
      }
    }
    if (/timeout|aborted|timederror/.test(haystack)) {
      return { transport: FAIL, layer: 'Workers VPC', detail: 'timed out with no documented code' };
    }
    return {
      transport: FAIL,
      layer: 'Workers VPC',
      detail: `unrecognised transport error: ${probe.message ?? 'unknown'}`,
    };
  }

  if (probe.probe === 'reached') {
    const status = probe.status;

    // Workers VPC does NOT throw when the origin is unreachable. It answers
    // with an ordinary HTTP 500 whose body is `ProxyError: <documented code>`:
    //
    //   status 500, text/plain, "ProxyError: connection_refused"   (Rails down)
    //
    // Measured 2026-08-09 by stopping Rails. Taking that at face value would
    // report "Rails answered 500" when Rails answered nothing at all — the tunnel
    // did — which is exactly the layer confusion this tool exists to prevent.
    // Checked before the status, because the status alone cannot distinguish it.
    const proxyError = /ProxyError:\s*([a-z_]+)/i.exec(probe.body ?? '')?.[1];
    if (proxyError) {
      const known = TRANSPORT_CODES.find(([code]) => code === proxyError);
      return {
        transport: FAIL,
        layer: known?.[1] ?? 'Tunnel/private origin',
        detail: `${proxyError}: ${known?.[2] ?? 'the VPC service could not reach the origin'} (returned as HTTP ${status}, not thrown)`,
        code: proxyError,
        status,
      };
    }

    if (status === 200) {
      return { transport: PASS, layer: null, detail: 'Rails answered 200', status };
    }
    // The request demonstrably arrived, so the transport is proven either way.
    // ADR 006's first verified run ended exactly here, on a 404.
    if (status === 404) {
      return {
        transport: PASS,
        layer: 'Rails',
        detail: 'transport reached Rails, but Rails has no route for the health path (404)',
        status,
      };
    }
    return {
      transport: PASS,
      layer: 'Rails',
      detail: `transport reached Rails, which answered ${status}`,
      status,
    };
  }

  return {
    transport: FAIL,
    layer: 'Wrangler',
    detail: `unrecognised probe result: ${probe.probe}`,
  };
}

// ---------------------------------------------------------------------------
// /rails-health parsing
// ---------------------------------------------------------------------------

// One shape across all fifteen frames. The cores used to render an HTML status
// page instead, which forced a second parser to live here; unifying on JSON is
// what removed it. See docs/design/rails-health-page.md.

const RAILS_HEALTH_KINDS = new Set(['ok', 'http-error', 'unreachable', 'not-configured']);

/**
 * The twelve content frames expose /rails-health as a Route Handler returning
 * `{ rails: RailsHealthResult }` with status 200 iff the kind is `ok`. Returns
 * the kind, or null if the body is not that shape.
 */
export function parseRailsHealthJson(body) {
  try {
    const kind = JSON.parse(body)?.rails?.kind;
    return RAILS_HEALTH_KINDS.has(kind) ? kind : null;
  } catch {
    return null;
  }
}

/**
 * The JSON route promises 200 for `ok` and 503 for everything else. Checking it
 * costs nothing and catches a route handler that reports a healthy body under a
 * failing status (or the reverse) — a correctness check the HTML page, which has
 * no status contract, cannot offer.
 */
export function railsHealthStatusMismatch(kind, status) {
  const expected = kind === 'ok' ? 200 : 503;
  return status === expected ? null : `kind ${kind} should answer ${expected}, answered ${status}`;
}

// ---------------------------------------------------------------------------
// Generated Cloudflare types
// ---------------------------------------------------------------------------

/**
 * The body of `interface <name> { … }`, found by matching braces rather than by
 * regex. A lazy regex terminated on the first `}` at any indentation silently
 * ran one interface into the next, which reported PreviewEnv's binding as
 * DevelopmentEnv's — a false FAIL that looked entirely plausible.
 */
export function extractInterfaceBlock(source, name) {
  const start = source.indexOf(`interface ${name}`);
  if (start === -1) return null;
  const open = source.indexOf('{', start);
  if (open === -1) return null;

  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Poll until `check()` resolves truthy or the deadline passes. Never a fixed
 * sleep: a fixed sleep is either slower than it needs to be or a flake.
 */
export async function waitFor(check, { timeoutMs, intervalMs = 500, onGiveUp } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (onGiveUp?.()) return { ok: false, reason: 'aborted' };
    try {
      if (await check()) return { ok: true };
    } catch {
      // keep polling; the server may not be up yet
    }
    if (Date.now() >= deadline) return { ok: false, reason: 'timeout' };
    await sleep(intervalMs);
  }
}

async function httpGet(url, timeoutMs = 15_000) {
  const response = await fetch(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(timeoutMs),
  });
  return { status: response.status, body: await response.text() };
}

function logStream(name) {
  mkdirSync(LOG_DIR, { recursive: true });
  const path = join(LOG_DIR, `${name}.log`);
  return { path, stream: createWriteStream(path, { flags: 'w' }) };
}

function tail(text, lines = 20) {
  return text.split('\n').slice(-lines).join('\n');
}

/**
 * Spawn a long-running child in its own process group and return a handle whose
 * stop() kills the whole group. `pnpm --filter` sits between us and next/wrangler,
 * so killing the direct child alone leaves the real server running.
 */
function startProcess(command, args, { name, env = {} }) {
  const { path, stream } = logStream(name);
  const child = spawn(command, args, {
    cwd: repoRoot,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
  });

  let output = '';
  const capture = (chunk) => {
    output += chunk;
    stream.write(chunk);
  };
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', capture);
  child.stderr.on('data', capture);

  let exited = false;
  let exitCode = null;
  child.on('exit', (code) => {
    exited = true;
    exitCode = code;
  });

  const handle = {
    logPath: path,
    get output() {
      return output;
    },
    get exited() {
      return exited;
    },
    get exitCode() {
      return exitCode;
    },
    async stop() {
      if (!exited && child.pid) {
        try {
          process.kill(-child.pid, 'SIGTERM');
        } catch {
          // already gone
        }
        const stopped = await waitFor(() => exited, { timeoutMs: 8000, intervalMs: 200 });
        if (!stopped.ok && child.pid) {
          try {
            process.kill(-child.pid, 'SIGKILL');
          } catch {
            // already gone
          }
        }
      }
      stream.end();
    },
  };

  running.add(handle);
  return handle;
}

// Every child is registered here so the signal handlers below can reap them all.
// This is the trap: a failure or a Ctrl-C must not leave a dev server running.
const running = new Set();

async function stopAll() {
  await Promise.all([...running].map((handle) => handle.stop()));
  running.clear();
}

let cleaningUp = false;
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (cleaningUp) return;
    cleaningUp = true;
    void stopAll().finally(() => process.exit(130));
  });
}

// ---------------------------------------------------------------------------
// Toolchain
// ---------------------------------------------------------------------------

function run(command, args, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (c) => (stdout += c));
    child.stderr.on('data', (c) => (stderr += c));
    child.on('error', (error) => resolve({ code: -1, stdout, stderr: String(error) }));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

async function checkToolchain(report, surfaces) {
  const versions = {};
  for (const [name, command, args] of [
    ['node', 'node', ['--version']],
    ['pnpm', 'pnpm', ['--version']],
    ['pn', 'pn', ['--version']],
    ['wrangler', 'pnpm', ['exec', 'wrangler', '--version']],
  ]) {
    const result = await run(command, args);
    versions[name] = result.code === 0 ? result.stdout.trim().split('\n').pop().trim() : null;
  }

  const problems = [];
  for (const [name, value] of Object.entries(versions)) {
    if (!value) problems.push(`${name} could not be executed`);
  }
  // `pn` is a repo-provided sh wrapper around pnpm. If it resolves to something
  // else, every documented `pn run …` command is lying.
  if (versions.pn && versions.pnpm && versions.pn !== versions.pnpm) {
    problems.push(`pn reports ${versions.pn} but pnpm reports ${versions.pnpm}`);
  }

  const line = Object.entries(versions)
    .map(([k, v]) => `${k} ${v ?? 'MISSING'}`)
    .join(', ');
  for (const surface of surfaces) {
    report.record(
      'Toolchain',
      surface.key,
      problems.length ? FAIL : PASS,
      problems.length ? problems.join('; ') : line,
    );
  }
  if (!problems.length) report.note(PASS, `Toolchain: ${line}`);
  return versions;
}

// ---------------------------------------------------------------------------
// Mode: config
// ---------------------------------------------------------------------------

async function readCloudflareAuth() {
  const result = await run('pnpm', ['exec', 'wrangler', 'whoami', '--json'], {
    CLOUDFLARE_ENV: '',
  });
  if (result.code !== 0) {
    return { loggedIn: false, kind: 'none', raw: result.stdout + result.stderr };
  }
  try {
    const json = JSON.parse(result.stdout.slice(result.stdout.indexOf('{')));
    return {
      loggedIn: Boolean(json.loggedIn),
      kind: json.authType ?? 'unknown',
      email: json.email ?? null,
      raw: result.stdout,
    };
  } catch {
    // Fall back to the human-readable form rather than reporting a false negative.
    const text = result.stdout;
    return {
      loggedIn: text.includes('You are logged in'),
      kind: text.includes('API Token') ? 'API Token' : 'unknown',
      raw: text,
    };
  }
}

async function modeConfig(report, surfaces, manifest) {
  const checker = await run('node', ['tools/check-workers.mjs']);
  if (checker.code !== 0) {
    report.note(FAIL, `check-workers failed:\n${tail(checker.stdout + checker.stderr, 20)}`);
  } else {
    report.note(PASS, `check-workers: ${checker.stdout.trim()}`);
  }

  const railsHosts = new Map();

  for (const surface of surfaces) {
    const problems = [];
    const { config, error } = readWranglerConfig(join(surface.ws, 'wrangler.jsonc'));
    if (error) {
      problems.push(error);
    } else {
      const declared = (config.env?.vpc?.vpc_services ?? []).filter(
        (v) => v.binding === manifest.vpcBinding,
      );
      if (declared.length !== 1) {
        problems.push(`env.vpc must declare ${manifest.vpcBinding} exactly once`);
      } else {
        const idProblem = describeServiceIdProblem(declared[0].service_id);
        if (idProblem) problems.push(idProblem);
        if (declared[0].remote !== true) problems.push('vpc_services must set remote: true');
      }
    }

    // The generated types are what the application actually compiles against,
    // so a binding present in wrangler.jsonc but absent here still fails at use.
    const typesPath = join(repoRoot, surface.ws, 'cloudflare-env.d.ts');
    if (!existsSync(typesPath)) {
      problems.push('cloudflare-env.d.ts is missing — run cf-typegen');
    } else {
      const types = readFileSync(typesPath, 'utf8');
      const previewBlock = extractInterfaceBlock(types, 'VpcEnv');
      if (previewBlock === null) {
        problems.push('cloudflare-env.d.ts declares no VpcEnv — run cf-typegen');
      } else if (!previewBlock.includes(manifest.vpcBinding)) {
        problems.push(`cloudflare-env.d.ts VpcEnv does not declare ${manifest.vpcBinding}`);
      }
      for (const envName of ['DevelopmentEnv', 'TestEnv']) {
        const block = extractInterfaceBlock(types, envName);
        if (block?.includes(manifest.vpcBinding)) {
          problems.push(`cloudflare-env.d.ts ${envName} must not declare ${manifest.vpcBinding}`);
        }
      }
    }

    const origin = readRailsOrigin(surface.ws);
    if (!origin) {
      problems.push('could not read PRIVATE_RAILS_ORIGIN from rails-client.ts');
    } else {
      railsHosts.set(surface.key, new URL(origin).host);
    }

    report.record(
      'VPC config',
      surface.key,
      problems.length ? FAIL : PASS,
      problems.length ? problems.join('; ') : `env.vpc → ${manifest.vpcDevelopmentServiceId}`,
    );
  }

  // Rails entry-point routing.
  //
  // Rails dispatches to `<Frame>::<Brand>::…` on the Host header, and the Host
  // is whatever each frame's PRIVATE_RAILS_ORIGIN says. Workers VPC does not
  // route on it — one Service and one tunnel serve all fifteen — so a wrong
  // host does not fail. It reaches the wrong namespace and answers 200. That
  // is why this is checked here rather than left to the eye, and why it is no
  // longer opt-in: the staged single-host period ended 2026-08-10.
  const hosts = [...new Set(railsHosts.values())];
  for (const surface of surfaces) {
    const host = railsHosts.get(surface.key);
    const expected = `${surface.frame}.${surface.brand}.localhost:3000`;
    report.record(
      'Rails routing',
      surface.key,
      host === expected ? PASS : FAIL,
      host === expected ? host : `sends Host ${host}, expected ${expected}`,
    );
  }
  if (hosts.length !== surfaces.length) {
    report.note(
      FAIL,
      `Rails Host must be distinct per frame; ${surfaces.length} frames share ${hosts.length} hosts`,
    );
  } else {
    report.note(
      PASS,
      `Rails Host: ${surfaces.length} frames, ${hosts.length} distinct entry points`,
    );
  }

  const auth = await readCloudflareAuth();
  report.note(
    auth.loggedIn ? PASS : BLOCKED,
    auth.loggedIn
      ? `Cloudflare auth: ${auth.kind}${auth.email ? ` (${auth.email})` : ''}`
      : 'Cloudflare auth: not authenticated',
  );

  // Isolation.
  let devService = null;
  if (auth.loggedIn) {
    const list = await run('pnpm', ['exec', 'wrangler', 'vpc', 'service', 'list'], {
      CLOUDFLARE_ENV: '',
    });
    if (list.code === 0 && list.stdout.includes(manifest.vpcDevelopmentServiceId)) {
      devService = manifest.vpcDevelopmentServiceId;
      report.note(PASS, `VPC Service ${devService} exists on the account`);
    } else {
      report.note(
        FAIL,
        `VPC Service ${manifest.vpcDevelopmentServiceId} was not found on the account`,
      );
    }
  } else {
    report.note(BLOCKED, 'VPC Service existence not checked — no Cloudflare session');
  }

  const productionServices = new Set();
  for (const ws of manifest.railsBacked) {
    const { config } = readWranglerConfig(join(ws, 'wrangler.jsonc'));
    // The top level IS production — there is no `env.production`.
    for (const entry of config?.vpc_services ?? []) {
      productionServices.add(entry.service_id);
    }
  }

  report.note(
    PASS,
    `Development VPC Service: ${manifest.vpcDevelopmentServiceId}${devService ? ' (verified)' : ''}`,
  );
  report.note(
    productionServices.size ? PASS : WARN,
    productionServices.size
      ? `Production VPC Service: ${[...productionServices].join(', ')}`
      : 'Production VPC Service: none — env.production declares no binding, so production fails closed (ADR 006)',
  );

  const shared = [...productionServices].includes(manifest.vpcDevelopmentServiceId);
  if (shared) {
    report.note(
      FAIL,
      'Environment isolation: production reuses the development VPC Service — it is bound to the development tunnel',
    );
  } else {
    report.note(PASS, 'Environment isolation: production and development share no service_id');
  }

  if (process.env.STRICT_ENV_ISOLATION === '1' && productionServices.size === 0) {
    report.note(
      FAIL,
      'STRICT_ENV_ISOLATION: no production VPC Service exists yet (expected once the production tunnel is created)',
    );
  }

  report.note(
    PASS,
    `INFO: one VPC Service serves all ${manifest.railsBacked.length} frames, each addressing its own Rails entry point by Host`,
  );
}

// ---------------------------------------------------------------------------
// Mode: vpc — the direct transport probe
// ---------------------------------------------------------------------------

async function modeVpc(report, surfaces, manifest, { verbose }) {
  const auth = await readCloudflareAuth();
  if (!auth.loggedIn) {
    for (const surface of surfaces) {
      report.record('Direct VPC → Rails', surface.key, BLOCKED, 'no Cloudflare session');
    }
    report.note(BLOCKED, 'Direct VPC probe skipped — run `wrangler login`');
    return;
  }

  // CLOUDFLARE_API_TOKEN must be blanked AND the root .env kept out of wrangler's
  // reach: wrangler loads it itself and re-injects the token, and an API token
  // cannot open a remote-binding session at all. CLOUDFLARE_ENV is cleared
  // because the container exports it and the probe config has no environments.
  const worker = startProcess(
    'pnpm',
    [
      'exec',
      'wrangler',
      'dev',
      '--config',
      'tools/vpc-probe/wrangler.jsonc',
      '--env-file',
      'tools/vpc-probe/empty.env',
      '--ip',
      '127.0.0.1',
      '--port',
      String(PROBE_PORT),
    ],
    { name: 'vpc-probe', env: { CLOUDFLARE_API_TOKEN: '', CLOUDFLARE_ENV: '' } },
  );

  let probe = null;
  try {
    const ready = await waitFor(
      async () => (await httpGet(`http://127.0.0.1:${PROBE_PORT}/`, 20_000)).status > 0,
      { timeoutMs: 120_000, onGiveUp: () => worker.exited },
    );

    if (ready.ok) {
      const response = await httpGet(`http://127.0.0.1:${PROBE_PORT}/`, 30_000);
      try {
        probe = JSON.parse(response.body);
      } catch {
        probe = null;
      }
    }
  } finally {
    await worker.stop();
  }

  const verdict = classifyProbeOutcome({ probe, wranglerOutput: worker.output });
  const bindingLine = /env\.UMAXICA_APPS_EDGE_CF_WORKERS_VPC[^\n]*/.exec(worker.output)?.[0];

  for (const surface of surfaces) {
    const detail =
      verdict.transport === PASS
        ? `${verdict.detail} (shared VPC Service ${manifest.vpcDevelopmentServiceId})`
        : `${verdict.layer}: ${verdict.detail}`;
    report.record('Direct VPC → Rails', surface.key, verdict.transport, detail);
  }

  if (bindingLine) report.note(PASS, `Binding resolved: ${bindingLine.trim()}`);
  if (verdict.transport === PASS && verdict.layer === 'Rails' && verdict.status !== 200) {
    report.note(FAIL, `Rails layer: ${verdict.detail}`);
  }
  if (verdict.transport !== PASS) {
    report.note(verdict.transport, `Layer ${verdict.layer}: ${verdict.detail}`);
    report.note(SKIP, `full log: ${worker.logPath}`);
  }
  if (verbose && probe) {
    report.note(PASS, `probe response: ${JSON.stringify(probe)}`);
  }

  report.note(
    SKIP,
    'All surfaces share one VPC Service, so this is one transport exercised three times, not three paths.',
  );
}

// ---------------------------------------------------------------------------
// Mode: next
// ---------------------------------------------------------------------------

/**
 * Readiness is polled on `/`, which every frame has and which touches nothing
 * outside the process.
 *
 * It used to poll `/rails-health`, and that was wrong: `/rails-health` calls
 * Rails over the VPC binding, so merely *asking whether the server had started*
 * sent a request across the tunnel. Every frame therefore hit Rails twice per
 * run — once to answer "are you up", once to be measured — and a fifteen-frame
 * pass produced 31 Rails requests where it should have produced 16. Caught by
 * comparing the Rails log against the expected count.
 *
 * `/health` is not usable here either: twelve of the fifteen frames do not have
 * it, so polling it would hang forever on those.
 */
function readinessUrl(baseUrl) {
  return `${baseUrl}/`;
}

async function checkHttpSurface(report, surface, baseUrl, gatePrefix) {
  if (surface.hasHealthRoute) {
    const health = await httpGet(`${baseUrl}/health`).catch((e) => ({
      status: 0,
      body: String(e),
    }));
    let healthy = health.status === 200;
    if (healthy) {
      try {
        healthy = JSON.parse(health.body).status === 'ok';
      } catch {
        healthy = false;
      }
    }
    report.record(
      `${gatePrefix} /health`,
      surface.key,
      healthy ? PASS : FAIL,
      healthy ? 'status ok' : `HTTP ${health.status}`,
    );
  } else {
    // SKIP with the reason spelled out. Only the three cores own a `/health`
    // Route Handler; the content frames never had one, and inventing a FAIL for
    // a route the frame does not claim to have would be noise.
    report.record(`${gatePrefix} /health`, surface.key, SKIP, 'frame has no /health route');
  }

  const root = await httpGet(baseUrl).catch((e) => ({ status: 0, body: String(e) }));
  const rootOk = root.status >= 200 && root.status < 400;
  report.record(`${gatePrefix} /`, surface.key, rootOk ? PASS : FAIL, `HTTP ${root.status}`);

  // The one Rails-touching request in this function, and the only one the whole
  // run should make per frame. Keep it that way: anything else that calls
  // /rails-health doubles the traffic the tunnel and Rails see.
  const railsHealth = await httpGet(`${baseUrl}/rails-health`, 30_000).catch((e) => ({
    status: 0,
    body: String(e),
  }));

  const kind = parseRailsHealthJson(railsHealth.body);

  let statusProblem = null;
  if (kind) {
    statusProblem = railsHealthStatusMismatch(kind, railsHealth.status);
    if (statusProblem) {
      report.note(FAIL, `${surface.ws} ${gatePrefix} /rails-health: ${statusProblem}`);
    }
  }

  return { kind, status: railsHealth.status, statusProblem };
}

// Fifteen `next dev` servers at once is what root `pnpm dev` already does, and
// every port differs so they do not collide. The cap exists so a smaller machine
// degrades into batches instead of thrashing.
const NEXT_CONCURRENCY = Number(process.env.CHECK_NEXT_CONCURRENCY ?? 8);

async function modeNext(report, surfaces) {
  for (let i = 0; i < surfaces.length; i += NEXT_CONCURRENCY) {
    await runNextBatch(report, surfaces.slice(i, i + NEXT_CONCURRENCY));
  }

  report.note(
    SKIP,
    '/rails-health under next dev is never VPC evidence — env.development carries no binding. See mode `vpc`.',
  );
}

async function runNextBatch(report, surfaces) {
  const servers = surfaces.map((surface) => ({
    surface,
    handle: startProcess('pnpm', ['--filter', surface.pkgName, 'run', 'dev'], {
      name: `next-${surface.brand}-${surface.frame}`,
    }),
  }));

  try {
    for (const { surface, handle } of servers) {
      const baseUrl = `http://127.0.0.1:${surface.port}`;
      const ready = await waitFor(
        async () => (await httpGet(readinessUrl(baseUrl), 5000)).status > 0,
        { timeoutMs: 240_000, onGiveUp: () => handle.exited },
      );

      if (!ready.ok) {
        const why = handle.exited ? `exited with code ${handle.exitCode}` : 'timed out';
        report.record('Next.js dev server', surface.key, FAIL, `${why} — ${handle.logPath}`);
        report.record('Local /health', surface.key, SKIP, 'server never became ready');
        report.record('Local /', surface.key, SKIP, 'server never became ready');
        report.record('Local /rails-health', surface.key, SKIP, 'server never became ready');
        report.note(FAIL, `next dev (${surface.ws}) ${why}:\n${tail(handle.output)}`);
        continue;
      }

      report.record('Next.js dev server', surface.key, PASS, `listening on ${surface.port}`);
      const { kind, status } = await checkHttpSurface(report, surface, baseUrl, 'Local');

      // Under `--env development` the generated CloudflareEnv provably carries no
      // VPC binding, so this result can never be VPC evidence — whatever it says.
      if (kind === 'not-configured') {
        report.record(
          'Local /rails-health',
          surface.key,
          PASS,
          'not-configured (expected: no transport in next dev)',
        );
      } else if (kind === 'ok') {
        report.record(
          'Local /rails-health',
          surface.key,
          WARN,
          'ok via the Access fallback — transport=access-or-none (NOT VPC evidence)',
        );
      } else if (kind) {
        report.record(
          'Local /rails-health',
          surface.key,
          WARN,
          `${kind} (transport=access-or-none)`,
        );
      } else {
        report.record(
          'Local /rails-health',
          surface.key,
          FAIL,
          `unrecognised JSON response, HTTP ${status}`,
        );
      }
    }
  } finally {
    await Promise.all(servers.map(({ handle }) => handle.stop()));
  }
}

// ---------------------------------------------------------------------------
// Modes: preview and preview:vpc
// ---------------------------------------------------------------------------

async function modePreview(report, surfaces, { withVpc }) {
  const script = withVpc ? 'preview:vpc' : 'preview';
  const gate = withVpc ? 'Preview → Rails VPC' : 'workerd/OpenNext preview';

  if (withVpc) {
    const auth = await readCloudflareAuth();
    if (!auth.loggedIn) {
      for (const surface of surfaces) {
        report.record(gate, surface.key, BLOCKED, 'no Cloudflare session');
      }
      return;
    }
  }

  // `preview:vpc` is strictly sequential on the default port. ADR 006 is explicit
  // that fifteen concurrent remote-proxy sessions against Cloudflare is exactly
  // what not to do, so this is a deliberate cost, not an oversight.
  //
  // Plain `preview` opens no remote session, so it parallelises. Each frame gets
  // its own port: `opennextjs-cloudflare` forwards unknown flags to wrangler, and
  // `pnpm run <script> -- --port N` appends to the last command of the `&&` chain.
  const batchSize = withVpc ? 1 : PREVIEW_CONCURRENCY;
  for (let i = 0; i < surfaces.length; i += batchSize) {
    const batch = surfaces.slice(i, i + batchSize);
    await Promise.all(
      batch.map((surface, index) =>
        runPreviewSurface(report, surface, {
          script,
          gate,
          withVpc,
          port: withVpc ? PREVIEW_PORT : PREVIEW_PORT + 1 + index,
          // wrangler's inspector defaults to 9229 for every instance, so varying
          // only --port still collides the moment two run at once: the second
          // dies with `Address already in use (127.0.0.1:9229)`.
          inspectorPort: INSPECTOR_PORT + 1 + index,
        }),
      ),
    );
  }
}

// Distinct ports for the parallel, binding-free `preview` batches.
const PREVIEW_CONCURRENCY = Number(process.env.CHECK_PREVIEW_CONCURRENCY ?? 4);
const INSPECTOR_PORT = 9229; // wrangler's default; shared across instances.

async function runPreviewSurface(report, surface, { script, gate, withVpc, port, inspectorPort }) {
  const args = ['--filter', surface.pkgName, 'run', script];
  if (!withVpc) {
    args.push('--', '--port', String(port), '--inspector-port', String(inspectorPort));
  }

  const handle = startProcess('pnpm', args, {
    name: `${script.replace(':', '-')}-${surface.brand}-${surface.frame}`,
    // Blanked so the OAuth session is used: an API token cannot open a
    // remote-binding session at all.
    env: withVpc ? { CLOUDFLARE_API_TOKEN: '' } : {},
  });

  {
    try {
      const baseUrl = `http://127.0.0.1:${port}`;
      const ready = await waitFor(
        async () => (await httpGet(readinessUrl(baseUrl), 5000)).status > 0,
        { timeoutMs: 900_000, intervalMs: 2000, onGiveUp: () => handle.exited },
      );

      if (!ready.ok) {
        const why = handle.exited ? `exited with code ${handle.exitCode}` : 'timed out';
        const built = handle.output.includes('Worker saved in');
        report.record('OpenNext build', surface.key, built ? PASS : FAIL, built ? 'built' : why);
        report.record(gate, surface.key, FAIL, `${why} — ${handle.logPath}`);
        report.note(FAIL, `${script} (${surface.ws}) ${why}:\n${tail(handle.output)}`);
        return;
      }

      report.record('OpenNext build', surface.key, PASS, 'built and started on workerd');

      const { kind } = await checkHttpSurface(
        report,
        surface,
        baseUrl,
        withVpc ? 'Preview(vpc)' : 'Preview',
      );

      if (withVpc) {
        report.record(
          gate,
          surface.key,
          kind === 'ok' ? PASS : FAIL,
          `rails-health: ${kind ?? 'unrecognised'}`,
        );
      } else {
        // No binding in env.development, so not-configured is the correct answer.
        report.record(
          gate,
          surface.key,
          kind === 'not-configured' ? PASS : WARN,
          `workerd started; rails-health: ${kind ?? 'unrecognised'}`,
        );
      }
    } finally {
      await handle.stop();
    }
  }
}

// ---------------------------------------------------------------------------
// Mode: host
// ---------------------------------------------------------------------------

export function isInsideContainer(env = process.env, fileExists = existsSync) {
  return env.DEVCONTAINER === '1' || fileExists('/.dockerenv');
}

async function modeHost(report, surfaces) {
  if (isInsideContainer()) {
    for (const surface of surfaces) {
      report.record('Host port reachability', surface.key, SKIP, 'running inside the container');
    }
    report.note(
      SKIP,
      'Host reachability cannot be established from inside the container. Run this from the host OS while `pn run check:local` is running:\n' +
        surfaces.map((s) => `  curl -fsS http://127.0.0.1:${s.port}/health   # ${s.ws}`).join('\n'),
    );
    return;
  }

  for (const surface of surfaces) {
    const result = await httpGet(`http://127.0.0.1:${surface.port}/health`, 5000).catch((e) => ({
      status: 0,
      body: String(e),
    }));
    report.record(
      'Host port reachability',
      surface.key,
      result.status === 200 ? PASS : FAIL,
      result.status === 200 ? `port ${surface.port} reachable` : `port ${surface.port} unreachable`,
    );
  }

  report.note(
    SKIP,
    `preview/preview:vpc bind loopback inside the container, so ${PREVIEW_PORT} is not reachable from the host ` +
      'unless wrangler is given --ip 0.0.0.0. That is expected, not a failure.',
  );
}

// ---------------------------------------------------------------------------
// Mode: links — a clickable index for eyeballing every surface by hand
// ---------------------------------------------------------------------------

// Generated rather than hand-written so the ports can never drift from the
// `dev` scripts they come from.
export function buildLinkIndex(surfaces = loadSurfaces()) {
  return surfaces.map((surface) => ({
    ...surface,
    urls: [
      { path: '/', label: 'home' },
      { path: '/rails-health', label: 'rails-health' },
      ...(surface.hasHealthRoute ? [{ path: '/health', label: 'health' }] : []),
    ].map((u) => ({ ...u, href: `http://localhost:${surface.port}${u.path}` })),
    // Same port on purpose: it is already forwarded by the devcontainer, so the
    // VPC-connected app appears at the URL the developer already has open.
    vpcCommand:
      `CLOUDFLARE_API_TOKEN= pnpm --filter ${surface.pkgName} run preview:vpc ` +
      `-- --ip 0.0.0.0 --port ${surface.port}`,
  }));
}

function renderLinksHtml(index) {
  const esc = (s) =>
    s.replace(/[&<>"]/g, (c) => `&${{ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot' }[c]};`);
  const row = (f) => `
    <tr>
      <th scope="row"><code>${esc(f.ws)}</code><span class="port">:${f.port}</span></th>
      <td>${f.urls.map((u) => `<a href="${esc(u.href)}" target="_blank" rel="noreferrer">${esc(u.label)}</a>`).join('')}</td>
      <td><button class="copy" data-cmd="${esc(f.vpcCommand)}">copy command</button></td>
    </tr>`;

  return `<title>Edge local check links</title>
<style>
  :root { --bg:#fff; --fg:#111; --muted:#666; --line:#e3e3e3; --accent:#0b6; --warn:#b45; --card:#fafafa; }
  :root:not([data-theme="light"]) { }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
    --bg:#111417; --fg:#e8e8e8; --muted:#9aa; --line:#2a2f35; --accent:#3d9; --warn:#e88; --card:#171b1f; } }
  :root[data-theme="dark"] { --bg:#111417; --fg:#e8e8e8; --muted:#9aa; --line:#2a2f35; --accent:#3d9; --warn:#e88; --card:#171b1f; }
  body { background:var(--bg); color:var(--fg); font:15px/1.6 ui-sans-serif,system-ui,sans-serif; margin:0; padding:2rem 1.25rem 4rem; }
  main { max-width:60rem; margin:0 auto; }
  h1 { font-size:1.5rem; margin:0 0 .25rem; }
  h2 { font-size:1.05rem; margin:2.25rem 0 .5rem; }
  p.sub { color:var(--muted); margin:0 0 1.5rem; }
  .note { background:var(--card); border:1px solid var(--line); border-left:3px solid var(--warn); padding:.75rem 1rem; border-radius:6px; margin:0 0 1rem; }
  .note.ok { border-left-color:var(--accent); }
  table { width:100%; border-collapse:collapse; }
  th,td { text-align:left; padding:.45rem .5rem; border-bottom:1px solid var(--line); vertical-align:middle; }
  th[scope=row] { font-weight:600; white-space:nowrap; }
  .port { color:var(--muted); font-weight:400; }
  td a { display:inline-block; margin-right:.6rem; color:var(--accent); text-decoration:none; border-bottom:1px solid transparent; }
  td a:hover { border-bottom-color:currentColor; }
  button.copy { font:inherit; font-size:.85em; padding:.2rem .55rem; border:1px solid var(--line); background:var(--card); color:var(--muted); border-radius:5px; cursor:pointer; }
  button.copy:hover { color:var(--fg); }
  code,pre { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.9em; }
  pre { background:var(--card); border:1px solid var(--line); border-radius:6px; padding:.75rem 1rem; overflow-x:auto; }
  .wrap { overflow-x:auto; }
</style>
<main>
  <h1>Edge local check links</h1>
  <p class="sub">All fifteen Rails-backed frames. Open from the <strong>host</strong> browser — every port is forwarded by the devcontainer.</p>

  <div class="note">
    <strong>These links are not VPC.</strong> Under <code>pn run dev</code> the frames run on Node with
    <code>env.development</code>, which carries no VPC binding, so <code>/rails-health</code> will always say
    <em>not-configured</em>. That is the expected, healthy answer here — it proves the developer loop, not the tunnel.
  </div>

  <h2>1 · <code>pn run dev</code> — the ordinary developer loop</h2>
  <div class="wrap"><table>
    <thead><tr><th scope="col">Frame</th><th scope="col">Open</th><th scope="col">VPC variant</th></tr></thead>
    <tbody>${index.map(row).join('')}</tbody>
  </table></div>

  <h2>2 · Seeing a page that <em>is</em> connected over Workers VPC</h2>
  <div class="note ok">
    Run one frame at a time — each opens its own remote-binding proxy against Cloudflare, and
    ADR 006 is explicit that fifteen at once is what not to do. It binds
    <code>0.0.0.0</code> on that frame's usual port, so the URLs above keep working unchanged;
    <code>/rails-health</code> should then read <em>Rails health is reachable</em>.
  </div>
  <pre>${esc(index[0]?.vpcCommand ?? '')}</pre>
  <p class="sub">Use “copy command” in the table for any other frame. <code>CLOUDFLARE_API_TOKEN=</code> must be
  blank — an API token cannot open a remote-binding session; only <code>wrangler login</code> can.</p>

  <h2>3 · What not to expect</h2>
  <p class="sub"><code>pn run check:preview</code> and <code>check:preview:vpc</code> bind container loopback on
  8787+, which the host cannot reach. That is why the command above overrides <code>--ip</code> and
  <code>--port</code>. Regenerate this page with <code>pn run check:links</code>.</p>
</main>
<script>
  for (const b of document.querySelectorAll('button.copy')) {
    b.addEventListener('click', async () => {
      await navigator.clipboard.writeText(b.dataset.cmd);
      const was = b.textContent; b.textContent = 'copied'; setTimeout(() => { b.textContent = was; }, 1200);
    });
  }
</script>`;
}

function modeLinks(surfaces) {
  const index = buildLinkIndex(surfaces);
  mkdirSync(LOG_DIR, { recursive: true });
  const htmlPath = join(LOG_DIR, 'links.html');
  writeFileSync(htmlPath, renderLinksHtml(index));

  process.stdout.write('\nOpen from the HOST browser (not through Cloudflare Access):\n\n');
  for (const frame of index) {
    process.stdout.write(`  ${frame.ws.padEnd(10)} ${frame.urls.map((u) => u.href).join('  ')}\n`);
  }
  process.stdout.write(
    '\nThese are `next dev`, which has no VPC binding — /rails-health will read not-configured.\n' +
      'To view a frame actually connected over VPC, one at a time:\n\n' +
      `  ${index[0]?.vpcCommand}\n\n` +
      `Clickable index written to ${htmlPath}\n`,
  );
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const GATE_ORDER = [
  'Toolchain',
  'VPC config',
  'Rails routing',
  'Direct VPC → Rails',
  'Next.js dev server',
  'Local /health',
  'Local /',
  'Local /rails-health',
  'OpenNext build',
  'workerd/OpenNext preview',
  'Preview /health',
  'Preview /',
  'Preview /rails-health',
  'Preview(vpc) /health',
  'Preview(vpc) /',
  'Preview(vpc) /rails-health',
  'Preview → Rails VPC',
  'Host port reachability',
];

// Short column headers for the transposed matrix. Fifteen surfaces do not fit as
// columns, so surfaces became the rows and the gates need to be narrow.
const GATE_ABBREVIATIONS = new Map([
  ['Toolchain', 'tool'],
  ['VPC config', 'cfg'],
  ['Rails routing', 'rails'],
  ['Direct VPC → Rails', 'VPC→'],
  ['Next.js dev server', 'dev'],
  ['Local /health', 'd:hlt'],
  ['Local /', 'd:/'],
  ['Local /rails-health', 'd:rh'],
  ['OpenNext build', 'build'],
  ['workerd/OpenNext preview', 'wd'],
  ['Preview /health', 'p:hlt'],
  ['Preview /', 'p:/'],
  ['Preview(vpc) /health', 'v:hlt'],
  ['Preview(vpc) /', 'v:/'],
  ['Preview → Rails VPC', 'v:rh'],
  ['Host port reachability', 'host'],
]);

const STATUS_GLYPH = new Map([
  [PASS, 'ok'],
  [WARN, 'warn'],
  [FAIL, 'FAIL'],
  [BLOCKED, 'blkd'],
  [SKIP, 'skip'],
]);

export function renderMatrix(report, surfaces) {
  const gates = [...report.rows.keys()].sort((a, b) => {
    const ia = GATE_ORDER.indexOf(a);
    const ib = GATE_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  const heads = gates.map((g) => GATE_ABBREVIATIONS.get(g) ?? g.slice(0, 5));
  const widths = heads.map((h) => Math.max(4, h.length));
  const keyWidth = Math.max(9, ...surfaces.map((s) => s.key.length));

  const lines = [
    `| ${'Surface'.padEnd(keyWidth)} | ${heads.map((h, i) => h.padEnd(widths[i])).join(' | ')} |`,
    `| ${'-'.repeat(keyWidth)} | ${widths.map((w) => '-'.repeat(w)).join(' | ')} |`,
  ];
  for (const surface of surfaces) {
    const cells = gates.map((gate, i) =>
      (STATUS_GLYPH.get(report.get(gate, surface.key)?.status) ?? '—').padEnd(widths[i]),
    );
    lines.push(`| ${surface.key.padEnd(keyWidth)} | ${cells.join(' | ')} |`);
  }

  lines.push('');
  lines.push(`legend: ${gates.map((g, i) => `${heads[i]}=${g}`).join(' · ')}`);
  return lines.join('\n');
}

function printReport(report, surfaces) {
  process.stdout.write('\n');
  for (const { status, message } of report.notes) {
    process.stdout.write(`${status.padEnd(7)} ${message}\n`);
  }

  process.stdout.write('\nDetails\n');
  for (const [gate, row] of report.rows) {
    for (const [key, cell] of row) {
      if (cell.status === PASS && !cell.detail) continue;
      process.stdout.write(`  ${cell.status.padEnd(7)} ${gate} [${key}] ${cell.detail}\n`);
    }
  }

  process.stdout.write(`\n${renderMatrix(report, surfaces)}\n`);

  const missing = findMissingCells(
    report,
    surfaces.map((s) => s.key),
  );
  if (missing.length) {
    process.stdout.write(`\nWARN    gates missing a surface: ${missing.join(', ')}\n`);
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function main(argv = process.argv.slice(2)) {
  const verbose = argv.includes('--verbose');
  const requested = argv.find((arg) => !arg.startsWith('-'));

  if (!requested) {
    process.stderr.write(`verify-edge-connectivity: a mode is required (${MODES.join(', ')})\n`);
    return 2;
  }
  if (!MODES.includes(requested)) {
    process.stderr.write(
      `verify-edge-connectivity: unknown mode ${JSON.stringify(requested)} (${MODES.join(', ')})\n`,
    );
    return 2;
  }

  const manifest = loadManifest();
  const surfaces = loadSurfaces(manifest);
  const report = new Report();
  const modes = requested === 'all' ? ALL_MODES : [requested];

  process.stdout.write(
    `verify-edge-connectivity: ${modes.join(', ')} across ${surfaces.map((s) => s.key).join('/')}\n`,
  );

  try {
    for (const mode of modes) {
      if (mode === 'config') {
        await checkToolchain(report, surfaces);
        await modeConfig(report, surfaces, manifest);
      } else if (mode === 'vpc') {
        await modeVpc(report, surfaces, manifest, { verbose });
      } else if (mode === 'next') {
        await modeNext(report, surfaces);
      } else if (mode === 'preview') {
        await modePreview(report, surfaces, { withVpc: false });
      } else if (mode === 'preview:vpc') {
        await modePreview(report, surfaces, { withVpc: true });
      } else if (mode === 'host') {
        await modeHost(report, surfaces);
      } else if (mode === 'links') {
        modeLinks(surfaces);
        return 0; // an index, not a verdict — nothing to put in the matrix
      }
    }
  } finally {
    await stopAll();
  }

  printReport(report, surfaces);
  return report.hasFailure() ? 1 : 0;
}

if (process.argv[1] && process.argv[1].endsWith('verify-edge-connectivity.mjs')) {
  main()
    .then((code) => process.exit(code))
    .catch((error) => {
      process.stderr.write(`verify-edge-connectivity: ${error?.stack ?? error}\n`);
      void stopAll().finally(() => process.exit(1));
    });
}
