#!/usr/bin/env node
// Validates every workspace's wrangler.jsonc against tools/workers-manifest.json.
// Run from the repo root: node tools/check-workers.mjs (pnpm run check:workers).
//
// TWO LAYERS, KEPT APART ON PURPOSE.
//
//   Layer 1 — Wrangler schema facts.  What the tool does: which keys are not
//             inherited into `env.*`. This is documentation about Wrangler.
//
//   Layer 2 — UMAXICA environment policy.  What this repository has decided:
//             which environments exist, and which resources each tier is
//             allowed and required to have.
//
// The previous version collapsed the two. It took a generic NON_INHERITABLE
// array and required every key present at the top level to reappear in every
// environment — turning "Wrangler does not inherit this" into "every
// environment must contain every production binding". Those are different
// claims, and the second one is false: `vpc_services` is non-inheritable, and
// `env.test` is supposed to have none. Policy now lives in named functions
// that say what they mean.
//
// Lifecycle model: adr/009. There are exactly three environments — production
// (top level), env.development, env.test. No staging, no env.production, no
// env.vpc.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  collectVpcBindings as vpcBindings,
  describeServiceIdProblem,
  loadManifest,
  readWranglerConfig,
  repoRoot as root,
} from './lib/wrangler-config.mjs';

const manifest = loadManifest();

const failures = [];
const fail = (ws, message) => failures.push(`${ws}: ${message}`);

function loadWrangler(ws) {
  const { config, error } = readWranglerConfig(join(ws, 'wrangler.jsonc'));
  if (error) {
    fail(ws, error.slice(`${ws}/`.length));
    return null;
  }
  return config;
}

// ---------------------------------------------------------------------------
// Layer 1 — Wrangler schema facts
// ---------------------------------------------------------------------------

// Keys Wrangler does NOT inherit into `env.*`. Cloudflare's wording is that
// non-inheritable keys "must be specified for each environment" — meaning by
// each environment that needs them. Presence at the top level says nothing
// about what any environment ought to contain.
//
// This list is used only to check the keys a worker CLASS's policy declares it
// needs (see RAILS_BACKED_REQUIRED / APEX_REQUIRED below). It is deliberately
// not iterated over the top-level config.
const WRANGLER_NON_INHERITABLE = new Set([
  'vars',
  'kv_namespaces',
  'services',
  'images',
  'version_metadata',
  'ratelimits',
  'vpc_services',
  'durable_objects',
  'r2_buckets',
  'd1_databases',
  'queues',
]);

/** Assert every key in `required` is stated explicitly by `env`. */
function checkNonInheritableKeys(ws, envName, env, required) {
  for (const key of required) {
    if (!WRANGLER_NON_INHERITABLE.has(key)) {
      throw new Error(`check-workers bug: ${key} is inheritable, do not require it per-env`);
    }
    if (env[key] === undefined) {
      fail(
        ws,
        `env.${envName} must declare ${key} — Wrangler does not inherit it from the top level`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Layer 2 — UMAXICA environment policy
// ---------------------------------------------------------------------------

const FORBIDDEN_ENVIRONMENTS = {
  production:
    'the top level IS production, so `wrangler deploy` with no --env deploys it; an env.production would deploy to <name>-production',
  staging: 'there is no staging tier — see adr/009',
  vpc: 'VPC is a binding capability, not a lifecycle environment; the binding lives in env.development (remote) and at the top level (production)',
};

/**
 * The top level is production.
 *
 * `CLOUDFLARE_ENV` is Wrangler's control variable, not ours to bind: with no
 * --env it selects the environment, and `opennextjs-cloudflare upload` reads
 * Worker vars through `getPlatformProxy()` into its own `process.env`, so a var
 * by that name comes back as `--env=<value>`. The tier is `EDGE_ENV`.
 */
function checkProductionEnvironment(ws, config) {
  for (const [name, why] of Object.entries(FORBIDDEN_ENVIRONMENTS)) {
    if (config.env?.[name]) {
      fail(ws, `env.${name} must not exist — ${why}`);
    }
  }

  if (config.vars?.EDGE_ENV !== 'production') {
    fail(ws, 'top-level vars must set EDGE_ENV to production — the top level is production');
  }

  for (const [envName, env] of [['<top level>', config], ...Object.entries(config.env ?? {})]) {
    if (env.vars?.CLOUDFLARE_ENV !== undefined) {
      fail(
        ws,
        `${envName} vars must not bind CLOUDFLARE_ENV — it is Wrangler's control variable and leaks into the deploy as \`--env\`; use EDGE_ENV`,
      );
    }
  }
}

function checkDevelopmentEnvironment(ws, config, requiredKeys) {
  const env = config.env?.development;
  if (!env) {
    fail(
      ws,
      'env.development is missing — it is the one and only Wrangler development environment',
    );
    return;
  }
  if (env.vars?.EDGE_ENV !== 'development') {
    fail(ws, 'env.development vars must set EDGE_ENV to development');
  }
  checkNonInheritableKeys(ws, 'development', env, requiredKeys);
}

function checkTestEnvironment(ws, config, requiredKeys) {
  const env = config.env?.test;
  if (!env) {
    fail(ws, 'env.test is missing');
    return;
  }
  if (env.vars?.EDGE_ENV !== 'test') {
    fail(ws, 'env.test vars must set EDGE_ENV to test');
  }
  checkNonInheritableKeys(ws, 'test', env, requiredKeys);
}

/**
 * Rate-limit counters are per-`namespace_id`, so sharing one across tiers lets
 * local or CI traffic spend production's budget. `namespace_id` is plain
 * config, not a provisioned resource, so every tier can simply pick its own.
 */
function checkRateLimitIsolation(ws, config) {
  const seen = new Map();
  const tiers = [['<top level>', config], ...Object.entries(config.env ?? {})];
  for (const [envName, env] of tiers) {
    for (const limit of env.ratelimits ?? []) {
      const key = `${limit.name}:${limit.namespace_id}`;
      if (seen.has(key)) {
        fail(
          ws,
          `env.${envName} shares ratelimit namespace_id ${limit.namespace_id} with ${seen.get(key)}`,
        );
      }
      seen.set(key, envName === '<top level>' ? 'the top level (production)' : `env.${envName}`);
    }
  }
}

// --- VPC policy, one function per lifecycle tier ---------------------------

const VPC_BINDING = manifest.vpcBinding;

function vpcEntries(container) {
  return (container?.vpc_services ?? []).filter((entry) => entry.binding === VPC_BINDING);
}

/**
 * Production carries the deployed binding, with no `remote` key.
 *
 * Remote bindings are a local-development mechanism: on deploy "all remote
 * bindings are disabled, which behaves exactly as if they were configured with
 * remote: false" (Cloudflare, local development docs). Cloudflare's own
 * get-started example writes a deployed binding as `{binding, service_id}`, so
 * omitting `remote` is the honest representation rather than a shorthand.
 */
function checkProductionVpcPolicy(ws, config) {
  const declared = vpcEntries(config);
  if (declared.length !== 1) {
    fail(
      ws,
      `the top level (production) must declare vpc_services binding ${VPC_BINDING} exactly once (found ${declared.length})`,
    );
    return;
  }
  const [entry] = declared;

  const problem = describeServiceIdProblem(entry.service_id);
  if (problem) {
    fail(ws, `top-level (production) vpc_services ${problem}`);
  } else if (entry.service_id !== manifest.vpcServices.production) {
    fail(
      ws,
      `top-level (production) vpc_services service_id must be ${manifest.vpcServices.production} (found ${entry.service_id})`,
    );
  }

  if ('remote' in entry) {
    fail(
      ws,
      'top-level (production) vpc_services must not set `remote` — remote bindings are disabled on deploy, so the key is local-development-only noise',
    );
  }
}

/**
 * Development carries the same binding NAME against the development Service,
 * resolved remotely. `remote: true` runs this Worker's code in local workerd
 * and proxies only the binding out to Cloudflare — the documented way to reach
 * a VPC Service in local development.
 */
function checkDevelopmentVpcPolicy(ws, config) {
  const declared = vpcEntries(config.env?.development);
  if (declared.length !== 1) {
    fail(
      ws,
      `env.development must declare vpc_services binding ${VPC_BINDING} exactly once (found ${declared.length})`,
    );
    return;
  }
  const [entry] = declared;

  const problem = describeServiceIdProblem(entry.service_id);
  if (problem) {
    fail(ws, `env.development vpc_services ${problem}`);
  } else if (entry.service_id !== manifest.vpcServices.development) {
    fail(
      ws,
      `env.development vpc_services service_id must be ${manifest.vpcServices.development} (found ${entry.service_id})`,
    );
  }

  if (entry.remote !== true) {
    fail(
      ws,
      'env.development vpc_services must set remote: true — local workerd cannot simulate a VPC Service',
    );
  }
}

/**
 * Test carries no Rails transport, and the absence is the invariant.
 *
 * This is the distinction the old checker lost: `vpc_services` being
 * non-inheritable means an environment that needs it must state it, NOT that
 * every environment must carry every production binding.
 */
function checkTestVpcPolicy(ws, config) {
  const declared = vpcEntries(config.env?.test);
  if (declared.length > 0) {
    fail(
      ws,
      'env.test must not declare vpc_services — the test architecture has no Rails dependency, and non-inheritable does not mean mandatory everywhere',
    );
  }
}

/**
 * While `$productionIsBootstrap` is true, production deliberately points at the
 * development VPC Service because production Rails does not exist yet. The
 * moment it is false the two ids must differ — the guarantee is suspended by an
 * explicit switch, not deleted.
 */
function checkBootstrapPolicy() {
  const { development, production } = manifest.vpcServices;
  const bootstrap = manifest.$productionIsBootstrap === true;

  if (bootstrap && development !== production) {
    fail(
      'tools/workers-manifest.json',
      '$productionIsBootstrap is true but vpcServices.production already differs from development — set the flag to false, the bootstrap state is over',
    );
  }
  if (!bootstrap && development === production) {
    fail(
      'tools/workers-manifest.json',
      `$productionIsBootstrap is false, so vpcServices.production must not reuse the development service ${development} — it is on the development tunnel and terminates on a developer's machine`,
    );
  }
}

// --- worker classes --------------------------------------------------------

const RAILS_BACKED_REQUIRED = ['vars', 'version_metadata', 'images', 'services', 'ratelimits'];
const APEX_REQUIRED = ['vars', 'version_metadata', 'kv_namespaces', 'ratelimits'];

function checkOpenNext(ws, config) {
  // Next.js only accepts development|test|production, and the top level is production.
  if (config.vars?.NODE_ENV !== 'production') {
    fail(ws, 'top-level vars must set NODE_ENV to production');
  }
  if (!config.compatibility_flags?.includes('nodejs_compat')) {
    fail(ws, 'compatibility_flags must include nodejs_compat');
  }
  if (config.assets?.binding !== 'ASSETS') {
    fail(ws, 'assets binding ASSETS is missing');
  }
  if (!(config.services ?? []).some((s) => s.binding === 'WORKER_SELF_REFERENCE')) {
    fail(ws, 'services binding WORKER_SELF_REFERENCE is missing');
  }
  if (config.images?.binding !== 'IMAGES') {
    fail(ws, 'images binding IMAGES is missing');
  }
}

/** An OpenNext frame that reaches Rails: production + development VPC, no test VPC. */
function checkRailsBackedWorker(ws, config) {
  checkProductionEnvironment(ws, config);
  checkDevelopmentEnvironment(ws, config, [...RAILS_BACKED_REQUIRED, 'vpc_services']);
  checkTestEnvironment(ws, config, RAILS_BACKED_REQUIRED);
  checkRateLimitIsolation(ws, config);
  checkOpenNext(ws, config);

  checkProductionVpcPolicy(ws, config);
  checkDevelopmentVpcPolicy(ws, config);
  checkTestVpcPolicy(ws, config);
}

/**
 * A Hono apex worker. It owns the root domain and must stay available through a
 * Rails outage, so it holds no Rails transport in any environment. Do not add
 * one for cosmetic consistency with the frames.
 */
function checkApexWorker(ws, config) {
  checkProductionEnvironment(ws, config);
  checkDevelopmentEnvironment(ws, config, APEX_REQUIRED);
  checkTestEnvironment(ws, config, APEX_REQUIRED);
  checkRateLimitIsolation(ws, config);

  if (vpcBindings(config).length > 0) {
    fail(
      ws,
      'apex workers must declare no vpc_services — the root domain must survive a Rails outage',
    );
  }
}

/** An OpenNext frame with no Rails client: no VPC binding anywhere. */
function checkContentSurfaceWorker(ws, config) {
  checkProductionEnvironment(ws, config);
  checkDevelopmentEnvironment(ws, config, RAILS_BACKED_REQUIRED);
  checkTestEnvironment(ws, config, RAILS_BACKED_REQUIRED);
  checkRateLimitIsolation(ws, config);
  checkOpenNext(ws, config);

  if (vpcBindings(config).length > 0) {
    fail(
      ws,
      'contentSurface workers must not declare vpc_services (add the binding together with a Rails client implementation, then reclassify as railsBacked)',
    );
  }
}

/**
 * tools/vpc-probe — the diagnostic Worker behind `pnpm run check:vpc`.
 *
 * It binds the VPC Service at the top level with `remote: true` and declares no
 * environments at all. That is not the frames' shape and is not meant to be:
 * it is never deployed (`workers_dev: false`, no deploy script, absent from
 * `pnpm-workspace.yaml`), imports no application code, and exists so a failure
 * can be attributed to the transport rather than to the application. Do not
 * "fix" it to match the frames.
 */
function checkDiagnosticWorker(ws) {
  const { config, error } = readWranglerConfig(`${ws}/wrangler.jsonc`);
  if (error) {
    fail(ws, error.slice(`${ws}/`.length));
    return;
  }

  const declared = vpcEntries(config);
  if (declared.length !== 1) {
    fail(
      ws,
      `top-level vpc_services must declare ${VPC_BINDING} exactly once (found ${declared.length})`,
    );
  } else {
    if (declared[0].service_id !== manifest.vpcServices.development) {
      fail(
        ws,
        `vpc_services service_id must be the development service ${manifest.vpcServices.development}`,
      );
    }
    if (declared[0].remote !== true) {
      fail(ws, 'vpc_services must set remote: true — local workerd cannot simulate a VPC Service');
    }
  }
  if (config.env !== undefined) {
    fail(ws, 'must declare no environments — its binding is top-level precisely because of that');
  }
  if (config.workers_dev !== false) {
    fail(ws, 'must set workers_dev: false — the probe is never served');
  }

  // Keeping it out of the workspace is what stops `pnpm -r` reaching it.
  if (readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8').includes(ws)) {
    fail(
      ws,
      'must not be listed in pnpm-workspace.yaml — a workspace entry exposes it to `pnpm -r`',
    );
  }
}

// ---------------------------------------------------------------------------
// Deployed static assets
// ---------------------------------------------------------------------------

// Static assets are the one thing that ships without any gate noticing it is
// gone. A missing .ts breaks typecheck; a missing route breaks a test. A missing
// public/ file breaks nothing until a browser 404s in production — and `wrangler
// deploy` uploads whatever is on disk, so a file that exists locally but was
// never committed passes every local check and then vanishes from CI's clean
// clone. Presence alone is therefore not enough: these have to be IN GIT.
//
// This is why the apex workers are checked too. They serve `public/` directly
// (`assets.directory: ./public`), so for them the directory IS the deployed
// surface; the OpenNext units build into `.open-next/assets` and copy from
// `public/`, which makes `public/` the source of truth in both cases.
const trackedFiles = (() => {
  let cache = null;
  return () => {
    if (cache === null) {
      cache = new Set(
        execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
          .split('\n')
          .filter(Boolean),
      );
    }
    return cache;
  };
})();

// Every browser-facing Worker publishes these. `service-worker.js` is asserted
// on by test/standard-url-contract.test.ts and by each unit's standard-contract
// e2e spec, both of which read the working tree and so cannot see this gap.
const REQUIRED_PUBLIC_ASSETS = ['_headers', 'service-worker.js'];

function checkPublicAssets(ws) {
  const publicDir = join(root, ws, 'public');
  if (!existsSync(publicDir)) {
    fail(ws, "public/ is missing — it is this worker's deployed static asset surface");
    return;
  }

  for (const asset of REQUIRED_PUBLIC_ASSETS) {
    if (!existsSync(join(publicDir, asset))) {
      fail(ws, `public/${asset} is missing`);
    }
  }

  const tracked = trackedFiles();
  for (const entry of readdirSync(publicDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const path = `${join(entry.parentPath, entry.name).slice(root.length).replace(/^\//, '')}`;
    if (!tracked.has(path)) {
      fail(
        ws,
        `${path} is not tracked by git — wrangler would upload it from this machine and CI would deploy without it`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Package scripts
// ---------------------------------------------------------------------------

// Deploying production means running with no `--env`, and CLOUDFLARE_ENV picks
// the environment when the flag is absent. compose.yaml exports
// CLOUDFLARE_ENV=development, so a deploy script that does not blank it would
// silently ship to `<name>-development` and leave production untouched — a
// failure that looks like success. Re-measured 2026-08-22 on wrangler 4.120.1
// with `wrangler deploy --dry-run`.
function checkPackageScripts(ws) {
  const pkgPath = join(root, ws, 'package.json');
  if (!existsSync(pkgPath)) return;
  const scripts = JSON.parse(readFileSync(pkgPath, 'utf8')).scripts ?? {};

  for (const [name, body] of Object.entries(scripts)) {
    if (/--env\s+production/.test(body)) {
      fail(ws, `${name} must not pass --env production — the top level is production`);
    }
    for (const forbidden of Object.keys(FORBIDDEN_ENVIRONMENTS)) {
      if (new RegExp(`--env[=\\s]+${forbidden}\\b`).test(body)) {
        fail(ws, `${name} passes --env ${forbidden}, which no longer exists — see adr/009`);
      }
    }
    if (/\bpreview:vpc\b/.test(name) || /\bpreview:vpc\b/.test(body)) {
      fail(
        ws,
        `${name} references preview:vpc — env.vpc is gone; \`preview\` carries the binding now`,
      );
    }

    // Per sub-command, because a script chains several with `&&`. A segment
    // that passes `--env` is explicit and safe whatever CLOUDFLARE_ENV says;
    // one that does not is at the mercy of the variable.
    for (const segment of body.split('&&')) {
      // `build:next` is plain `next build` — no wrangler, nothing to redirect.
      if (!/opennextjs-cloudflare|wrangler/.test(segment)) continue;
      if (/--env[=\s]+\S+/.test(segment)) continue;
      if (!segment.includes('CLOUDFLARE_ENV=')) {
        fail(
          ws,
          `${name} runs wrangler with no --env and does not blank CLOUDFLARE_ENV — the container exports it, so this would silently target <name>-development`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

checkBootstrapPolicy();

for (const ws of manifest.railsBacked) {
  const config = loadWrangler(ws);
  if (!config) continue;
  checkRailsBackedWorker(ws, config);
  checkPublicAssets(ws);
  checkPackageScripts(ws);
}

for (const ws of manifest.contentSurface) {
  const config = loadWrangler(ws);
  if (!config) continue;
  checkContentSurfaceWorker(ws, config);
  checkPublicAssets(ws);
  checkPackageScripts(ws);
}

for (const ws of manifest.standalone) {
  const config = loadWrangler(ws);
  if (!config) continue;
  checkApexWorker(ws, config);
  checkPublicAssets(ws);
}

checkDiagnosticWorker('tools/vpc-probe');

// The root fan-out scripts are checked too: a root script that passed a stale
// `--env vpc` would fail nowhere else.
checkPackageScripts('.');

if (failures.length > 0) {
  process.stderr.write(`check-workers: FAIL\n${failures.map((line) => `  - ${line}\n`).join('')}`);
  process.exit(1);
}

const checked =
  manifest.railsBacked.length + manifest.contentSurface.length + manifest.standalone.length;
process.stdout.write(`check-workers: OK (${checked} workers validated)\n`);
