#!/usr/bin/env node
// Validates every workspace's wrangler.jsonc against tools/workers-manifest.json.
// Run from the repo root: node tools/check-workers.mjs (pnpm run check:workers).

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  collectVpcBindings as vpcBindings,
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

// Keys Wrangler does NOT inherit into `env.*`. A key present at the top level
// but absent from an environment silently drops that binding once `--env` is
// passed, so every environment has to repeat them.
const NON_INHERITABLE = [
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
];

// `production` is deliberately absent from this list — the top level is
// production, and the assertion below is that `env.production` does NOT exist.
function checkEnvironments(ws, config, requiredEnvs = ['development', 'test']) {
  for (const envName of requiredEnvs) {
    if (!config.env?.[envName]) {
      fail(ws, `env.${envName} is missing`);
    }
  }

  // Rate limiter counters are per-namespace_id, so sharing one across tiers lets
  // local/CI traffic burn production's budget. namespace_id is plain config, not
  // a provisioned resource, so every tier can simply pick its own.
  const rateLimitIds = new Map();
  for (const [envName, env] of Object.entries(config.env ?? {})) {
    for (const limit of env.ratelimits ?? []) {
      const key = `${limit.name}:${limit.namespace_id}`;
      if (rateLimitIds.has(key)) {
        fail(
          ws,
          `env.${envName} shares ratelimit namespace_id ${limit.namespace_id} with env.${rateLimitIds.get(key)}`,
        );
      }
      rateLimitIds.set(key, envName);
    }
  }

  // The top level IS production; there is no `env.production`.
  //
  // A wrangler environment deploys to a separate Worker named `<name>-<env>`,
  // so an `env.production` has to re-declare `name` purely to cancel that out.
  // Putting production at the top level means `wrangler deploy` with no `--env`
  // is the production deploy, which is the shape Cloudflare's own model expects.
  if (config.env?.production) {
    fail(
      ws,
      'env.production must not exist — the top level is production, so `wrangler deploy` with no --env deploys it',
    );
  }
  if (config.vars?.EDGE_ENV !== 'production') {
    fail(ws, 'top-level vars must set EDGE_ENV to production — the top level is production');
  }

  // `CLOUDFLARE_ENV` is wrangler's own control variable, not ours to bind.
  //
  // `opennextjs-cloudflare upload` resolves the Worker's vars through
  // `getPlatformProxy()` and writes every string one straight into
  // `process.env` (getEnvFromPlatformProxy: `const envVars = process.env`),
  // then spawns wrangler with that env. A var named CLOUDFLARE_ENV therefore
  // comes back as `--env=<value>`; with "production" — the value the top level
  // would naturally carry — wrangler looks for an `env.production` that by
  // design does not exist and the upload dies. Measured, not assumed.
  //
  // That is why the tier is exposed as EDGE_ENV. Keep the two apart.
  for (const [envName, env] of [['<top level>', config], ...Object.entries(config.env ?? {})]) {
    if (env.vars?.CLOUDFLARE_ENV !== undefined) {
      fail(
        ws,
        `${envName} vars must not bind CLOUDFLARE_ENV — it is wrangler's control variable and leaks into the deploy as \`--env\`; use EDGE_ENV`,
      );
    }
  }

  for (const [envName, env] of Object.entries(config.env ?? {})) {
    const missing = NON_INHERITABLE.filter(
      (key) => config[key] !== undefined && env[key] === undefined,
    );
    if (missing.length > 0) {
      fail(ws, `env.${envName} is missing non-inheritable keys: ${missing.join(', ')}`);
    }
  }
}

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

// The one asset that is generated rather than committed: Tailwind's output.
//
// The rule above is "must be in git", but what it is really protecting is
// "CI's clean clone produces the same bytes". A committed copy of compiled CSS
// would satisfy the letter and lose the spirit — it can silently disagree with
// the `src/style.css` it came from, and nothing would check that. So this file
// is held to the stronger property instead, asserted below: its source is
// tracked, and every script that can upload regenerates it first.
const GENERATED_PUBLIC_ASSETS = new Map([['public/style.css', 'src/style.css']]);

// Scripts that put bytes on Cloudflare, or that stand in for them locally.
// `build` is included because CI's build matrix is what proves the generation
// step works at all.
const UPLOADING_SCRIPTS = ['build', 'dev', 'deploy', 'deploy:upload', 'upload:ci', 'deploy:ci'];

function checkGeneratedAsset(ws, relative, tracked) {
  const source = GENERATED_PUBLIC_ASSETS.get(relative);
  if (!tracked.has(`${ws}/${source}`)) {
    fail(ws, `${relative} is generated from ${source}, which is not tracked by git`);
    return;
  }

  let scripts;
  try {
    scripts = JSON.parse(readFileSync(join(root, ws, 'package.json'), 'utf8')).scripts ?? {};
  } catch {
    fail(ws, 'package.json is unreadable, so the generated-asset rule cannot be checked');
    return;
  }

  if (!scripts['build:css']) {
    fail(ws, `${relative} is generated but this unit declares no build:css script`);
    return;
  }

  for (const name of UPLOADING_SCRIPTS) {
    const script = scripts[name];
    if (!script) continue;
    // Either it regenerates the asset itself, or it delegates to a script that
    // does — `preview` runs `build`, which runs `build:css`.
    if (script.includes('build:css') || script.includes('pnpm run build')) continue;
    fail(
      ws,
      `script "${name}" can upload public/ without regenerating ${relative} — prefix it with \`pnpm run build:css &&\``,
    );
  }
}

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
    const path = `${join(entry.parentPath, entry.name).slice(root.length).replace(/^\//u, '')}`;
    if (tracked.has(path)) continue;

    const relative = path.slice(`${ws}/`.length);
    if (GENERATED_PUBLIC_ASSETS.has(relative)) {
      checkGeneratedAsset(ws, relative, tracked);
      continue;
    }

    fail(
      ws,
      `${path} is not tracked by git — wrangler would upload it from this machine and CI would deploy without it`,
    );
  }
}

for (const ws of manifest.railsBacked) {
  const config = loadWrangler(ws);
  if (!config) continue;
  // Only railsBacked workers need `vpc` — it exists to carry the VPC binding.
  checkEnvironments(ws, config, ['development', 'vpc', 'test']);
  checkOpenNext(ws, config);
  checkPublicAssets(ws);

  // The VPC binding lives in `env.vpc` and nowhere else.
  //
  // `remote: true` does not mean "unusable locally" — it runs this Worker's
  // code in local workerd and proxies only the binding out to Cloudflare, which
  // is the supported way to reach a VPC Service in development. What it does
  // cost is a `wrangler login` session at start-up (an API token cannot open
  // one). Confining the binding to `vpc` keeps that cost on the one command
  // that opts into it (`pnpm preview:vpc`) and leaves `pnpm dev` /
  // `pnpm preview` needing no Cloudflare account at all.
  //
  // Bindings are not inherited into `env.*`, so this placement is structural:
  // no other environment can acquire the binding by accident.
  // See adr/006-development-workers-vpc-transport.md.
  const declared = (config.env?.vpc?.vpc_services ?? []).filter(
    (v) => v.binding === manifest.vpcBinding,
  );

  if (declared.length !== 1) {
    fail(
      ws,
      `env.vpc must declare vpc_services binding ${manifest.vpcBinding} exactly once (found ${declared.length})`,
    );
  }
  if (declared[0] && declared[0].service_id !== manifest.vpcDevelopmentServiceId) {
    fail(
      ws,
      `env.vpc vpc_services service_id must be ${manifest.vpcDevelopmentServiceId} (found ${declared[0].service_id})`,
    );
  }
  if (declared[0] && declared[0].remote !== true) {
    fail(
      ws,
      'env.vpc vpc_services must set remote: true — local workerd cannot simulate a VPC Service',
    );
  }

  for (const envName of ['development', 'test']) {
    if ((config.env?.[envName]?.vpc_services ?? []).length > 0) {
      fail(
        ws,
        `env.${envName} must not declare vpc_services — it would force every local dev session to authenticate to Cloudflare`,
      );
    }
  }

  // The top level is production. A binding here would be a *production*
  // binding, and the only VPC Service that exists is on the development tunnel,
  // terminating on a developer's machine.
  //
  // Note this is NOT about leaking into `env.*`: non-inheritable keys declared
  // at the top level do not reach environments at all — wrangler warns "not
  // inherited by environments" and the environment resolves with no bindings.
  // Measured, because the previous comment here asserted the opposite.
  const topLevel = (config.vpc_services ?? []).filter((v) => v.binding === manifest.vpcBinding);
  if (topLevel.length > 0) {
    if (topLevel.some((v) => v.service_id === manifest.vpcDevelopmentServiceId)) {
      fail(
        ws,
        `top-level (production) vpc_services must not reuse the development service_id ${manifest.vpcDevelopmentServiceId} — it is on the development tunnel`,
      );
    }
    // A real production VPC Service is the intended end state, so a distinct
    // id here is allowed and only has to be well-formed.
  }
}

// Deploying production means running with no `--env`, and CLOUDFLARE_ENV picks
// the environment when the flag is absent. compose.yaml exports
// CLOUDFLARE_ENV=development, so a deploy script that does not blank it would
// silently ship to `<name>-development` and leave production untouched — a
// failure that looks like success. Verified with `wrangler deploy --dry-run`.
for (const ws of [...manifest.railsBacked, ...manifest.contentSurface]) {
  const pkgPath = join(root, ws, 'package.json');
  if (!existsSync(pkgPath)) continue;
  const scripts = JSON.parse(readFileSync(pkgPath, 'utf8')).scripts ?? {};
  for (const [name, body] of Object.entries(scripts)) {
    if (/--env\s+production/u.test(body)) {
      fail(ws, `${name} must not pass --env production — the top level is production`);
    }
    // Per sub-command, because a script chains several with `&&`. A segment
    // that passes `--env` is explicit and safe whatever CLOUDFLARE_ENV says;
    // one that does not is at the mercy of the variable.
    for (const segment of body.split('&&')) {
      // `build:next` is plain `next build` — no wrangler, nothing to redirect.
      if (!/opennextjs-cloudflare|wrangler/u.test(segment)) continue;
      if (/--env\s+\S+/u.test(segment)) continue;
      if (!segment.includes('CLOUDFLARE_ENV=')) {
        fail(
          ws,
          `${name} runs wrangler with no --env and does not blank CLOUDFLARE_ENV — the container exports it, so this would silently target <name>-development`,
        );
      }
    }
  }
}

for (const ws of manifest.contentSurface) {
  const config = loadWrangler(ws);
  if (!config) continue;
  checkEnvironments(ws, config);
  checkOpenNext(ws, config);
  checkPublicAssets(ws);
  if (vpcBindings(config).length > 0) {
    fail(
      ws,
      'contentSurface workers must not declare vpc_services (add the binding together with a Rails client implementation, then reclassify as railsBacked)',
    );
  }
}

for (const ws of manifest.standalone) {
  const config = loadWrangler(ws);
  if (!config) continue;
  checkEnvironments(ws, config);
  checkPublicAssets(ws);
  if (vpcBindings(config).length > 0) {
    fail(ws, 'standalone workers must not declare vpc_services');
  }
}

// tools/vpc-probe — the diagnostic Worker behind `pnpm run check:vpc`.
//
// Its `vpc_services` sits at the TOP LEVEL, which is exactly what the fifteen
// frames above are forbidden from doing. That is not an oversight. The frames'
// rule exists because a top-level binding leaks into `env.development`, making
// every ordinary `pnpm dev` authenticate to Cloudflare. This Worker declares no
// environments at all, is absent from `pnpm-workspace.yaml`, has no deploy
// script, and sets `workers_dev: false`, so there is no environment for it to
// leak into and nothing that could ship it. Do not "fix" it to match the frames.
{
  const ws = 'tools/vpc-probe';
  const { config, error } = readWranglerConfig(`${ws}/wrangler.jsonc`);
  if (error) {
    fail(ws, error.slice(`${ws}/`.length));
  } else {
    const declared = (config.vpc_services ?? []).filter((v) => v.binding === manifest.vpcBinding);
    if (declared.length !== 1) {
      fail(
        ws,
        `top-level vpc_services must declare ${manifest.vpcBinding} exactly once (found ${declared.length})`,
      );
    }
    if (declared[0] && declared[0].service_id !== manifest.vpcDevelopmentServiceId) {
      fail(ws, `vpc_services service_id must be ${manifest.vpcDevelopmentServiceId}`);
    }
    if (declared[0] && declared[0].remote !== true) {
      fail(ws, 'vpc_services must set remote: true — local workerd cannot simulate a VPC Service');
    }
    if (config.env !== undefined) {
      fail(ws, 'must declare no environments — its binding is top-level precisely because of that');
    }
    if (config.workers_dev !== false) {
      fail(ws, 'must set workers_dev: false — the probe is never served');
    }
  }

  // Keeping it out of the workspace is what stops `pnpm -r` reaching it.
  const workspaces = readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8');
  if (workspaces.includes('tools/vpc-probe')) {
    fail(
      ws,
      'must not be listed in pnpm-workspace.yaml — a workspace entry exposes it to `pnpm -r`',
    );
  }
}

if (failures.length > 0) {
  process.stderr.write(`check-workers: FAIL\n${failures.map((line) => `  - ${line}\n`).join('')}`);
  process.exit(1);
}

const checked =
  manifest.railsBacked.length + manifest.contentSurface.length + manifest.standalone.length;
process.stdout.write(`check-workers: OK (${checked} workers validated)\n`);
