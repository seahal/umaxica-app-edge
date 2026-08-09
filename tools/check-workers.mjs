#!/usr/bin/env node
// Validates every workspace's wrangler.jsonc against tools/workers-manifest.json.
// Run from the repo root: node tools/check-workers.mjs (pnpm run check:workers).

import { existsSync, readFileSync } from 'node:fs';
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

function checkEnvironments(ws, config, requiredEnvs = ['development', 'test', 'production']) {
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

  // `wrangler deploy --env production` would otherwise deploy to
  // `<name>-production`, orphaning the live Worker and its custom domain.
  if (config.env?.production && config.env.production.name !== config.name) {
    fail(
      ws,
      `env.production.name must equal the top-level name (${config.name}) so production keeps updating the deployed Worker`,
    );
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
  if (!existsSync(join(root, ws, 'public/_headers'))) {
    fail(ws, 'public/_headers is missing');
  }
}

for (const ws of manifest.railsBacked) {
  const config = loadWrangler(ws);
  if (!config) continue;
  // Only railsBacked workers need `preview` — it exists to carry the VPC binding.
  checkEnvironments(ws, config, ['development', 'preview', 'test', 'production']);
  checkOpenNext(ws, config);

  // The VPC binding lives in `env.preview` and nowhere else.
  //
  // `remote: true` does not mean "unusable locally" — it runs this Worker's
  // code in local workerd and proxies only the binding out to Cloudflare, which
  // is the supported way to reach a VPC Service in development. What it does
  // cost is an account credential at session start-up (Workers Scripts: Edit,
  // because wrangler stands up a remote-proxy Worker). Confining the binding to
  // `preview` keeps that cost on the one command that opts into it
  // (`pnpm preview:vpc`) and leaves `pnpm dev` / `pnpm preview` needing no
  // Cloudflare account at all.
  //
  // `production` carries no binding today: the only VPC Service that exists is
  // bound to the development tunnel, so declaring it in production would route
  // production traffic to a developer's machine. Until a production VPC Service
  // exists, production has no Rails transport and fails closed.
  //
  // Bindings are not inherited into `env.*`, so this placement is structural:
  // no other environment can acquire the binding by accident.
  // See adr/006-development-workers-vpc-transport.md.
  const previewBindings = config.env?.preview?.vpc_services ?? [];
  const declared = previewBindings.filter((v) => v.binding === manifest.vpcBinding);

  if (declared.length !== 1) {
    fail(
      ws,
      `env.preview must declare vpc_services binding ${manifest.vpcBinding} exactly once (found ${declared.length})`,
    );
  }
  if (declared[0] && declared[0].service_id !== manifest.vpcPreviewServiceId) {
    fail(
      ws,
      `env.preview vpc_services service_id must be ${manifest.vpcPreviewServiceId} (found ${declared[0].service_id})`,
    );
  }
  if (declared[0] && declared[0].remote !== true) {
    fail(
      ws,
      'env.preview vpc_services must set remote: true — local workerd cannot simulate a VPC Service',
    );
  }

  for (const envName of ['development', 'test', 'production']) {
    if ((config.env?.[envName]?.vpc_services ?? []).length > 0) {
      fail(
        ws,
        envName === 'production'
          ? `env.production must not declare vpc_services until a production VPC Service exists — the current one (${manifest.vpcPreviewServiceId}) is on the development tunnel`
          : `env.${envName} must not declare vpc_services — it would force every local dev session to authenticate to Cloudflare`,
      );
    }
  }

  if ((config.vpc_services ?? []).length > 0) {
    fail(
      ws,
      'top-level vpc_services must not be declared — it applies to every environment, including development',
    );
  }
}

for (const ws of manifest.contentSurface) {
  const config = loadWrangler(ws);
  if (!config) continue;
  checkEnvironments(ws, config);
  checkOpenNext(ws, config);
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
    if (declared[0] && declared[0].service_id !== manifest.vpcPreviewServiceId) {
      fail(ws, `vpc_services service_id must be ${manifest.vpcPreviewServiceId}`);
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
