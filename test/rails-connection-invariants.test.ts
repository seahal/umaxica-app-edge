/**
 * Static guardrails for the Rails ↔ Edge connection.
 *
 * The lifecycle model is recorded in `adr/009-wrangler-lifecycle-environment-reconstruction.md`,
 * which supersedes the environment halves of ADR 005 and ADR 006. There are
 * exactly three lifecycle environments — production (the top level),
 * `env.development` and `env.test` — and VPC is a binding capability rather
 * than an environment. Paths are sent to Rails exactly as given, with no frame
 * prefix, and the apex workers hold no Rails dependency at all.
 *
 * Fifteen frames each own a copy of the client (deliberately — `CLAUDE.md`
 * forbids extracting a shared module), so the failure mode is drift: one copy
 * edited and fourteen left behind, or a sixteenth frame added without a client
 * at all. Nothing at runtime notices either. These assertions read the files
 * directly, so they need no container and no Cloudflare credentials.
 *
 * Everything about wrangler configuration is asserted through the PARSED
 * config, never by string position. The previous version located the binding
 * with `indexOf('"vpc"') < indexOf(BINDING) < indexOf('"test"')`, and its own
 * comment records that an earlier variant of that trick passed vacuously the
 * moment a key name changed. Structure is what is being asserted, so structure
 * is what is read.
 *
 * `test/compose-tunnel-invariants.test.ts` already asserts the fifteen clients
 * exist and strip the `cf-access-client-*` headers; that is not repeated here.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readWranglerConfig as readWrangler } from '../tools/lib/wrangler-config.mjs';

const repoRoot = join(import.meta.dirname, '..');
const read = (relativePath: string) => readFileSync(join(repoRoot, relativePath), 'utf8');

const BRANDS = ['app', 'com', 'org'] as const;
const FRAMES = ['core', 'docs', 'news', 'help', 'info'] as const;
const APEX_WORKSPACES = ['app/apex', 'com/apex', 'net/apex', 'org/apex'] as const;

const VPC_BINDING = 'UMAXICA_APPS_EDGE_CF_WORKERS_VPC';

interface VpcService {
  binding: string;
  service_id: string;
  remote?: boolean;
}
interface WranglerEnv {
  vars?: Record<string, string>;
  vpc_services?: VpcService[];
  ratelimits?: { name: string; namespace_id: string }[];
}
interface WranglerConfig extends WranglerEnv {
  name?: string;
  env?: Record<string, WranglerEnv>;
}

interface Manifest {
  vpcBinding: string;
  vpcServices: { development: string; production: string };
  $productionIsBootstrap: boolean;
}

const manifest = JSON.parse(read('tools/workers-manifest.json')) as Manifest;

/** The fifteen Next.js frames that reach Rails, as `<brand>/<frame>` paths. */
const RAILS_FRAMES = BRANDS.flatMap((brand) =>
  FRAMES.map((frame) => ({ brand, frame, workspace: `${brand}/${frame}` })),
);

function config(workspace: string): WranglerConfig {
  const { config: parsed, error } = readWrangler(`${workspace}/wrangler.jsonc`);
  expect(error, `${workspace}/wrangler.jsonc failed to parse`).toBeUndefined();
  return parsed as WranglerConfig;
}

/** Entries for the Rails binding in one container (top level or an environment). */
function railsBindings(container: WranglerEnv | undefined): VpcService[] {
  return (container?.vpc_services ?? []).filter((entry) => entry.binding === VPC_BINDING);
}

/** Read a `const NAME = <value>;` declaration out of a client copy. */
function readConstant(source: string, name: string): string | undefined {
  return new RegExp(`const ${name} = (.+);`).exec(source)?.[1];
}

describe('rails client layout', () => {
  it.each(RAILS_FRAMES)('$workspace owns a complete Rails surface', ({ workspace }) => {
    // A frame with a client but no surface exposes nothing; a surface with no
    // client fails to compile. Both halves must be present in every frame.
    for (const file of [
      `${workspace}/src/lib/rails-client.ts`,
      `${workspace}/src/lib/rails-health.ts`,
    ]) {
      expect(existsSync(join(repoRoot, file)), `missing ${file}`).toBe(true);
    }
  });

  it.each(RAILS_FRAMES)('$workspace exposes /rails-health as JSON', ({ workspace }) => {
    /*
     * One shape across all fifteen frames — a Route Handler answering
     * `{"rails": {...}}`, 200 when the kind is `ok` and 503 otherwise.
     *
     * `docs/design/rails-health-page.md` records what the per-core HTML status
     * page did, so it can be rebuilt once, deliberately, rather than in fifteen
     * copies.
     */
    const route = `${workspace}/src/app/rails-health/route.ts`;
    const page = `${workspace}/src/app/(page)/rails-health/page.tsx`;

    expect(existsSync(join(repoRoot, route)), `${route} is missing`).toBe(true);
    expect(existsSync(join(repoRoot, page)), `${page} must not come back per-frame`).toBe(false);
  });

  it('keeps all fifteen /rails-health routes byte-identical', () => {
    const digests = new Set(
      RAILS_FRAMES.map(({ workspace }) => read(`${workspace}/src/app/rails-health/route.ts`)),
    );
    expect(digests.size, 'the fifteen route handlers have diverged').toBe(1);
  });

  it.each(RAILS_FRAMES)('$workspace sends its own Rails host', ({ brand, frame, workspace }) => {
    /*
     * Each frame addresses its own Rails entry point, and the host is how.
     *
     * Workers VPC does not route on it — "The host provided in the fetch()
     * operation is not used to route requests, and instead only populates the
     * Host field"; routing comes wholly from the VPC Service record, and the
     * port in the URL is ignored outright. One Service and one tunnel serve all
     * fifteen frames, and Rails dispatches on `Host` to `<Frame>::<Brand>::…`.
     *
     * So a wrong host here does not fail: it quietly reaches the wrong
     * namespace and answers 200. That is why this is pinned per frame rather
     * than left to review.
     */
    const origin = readConstant(
      read(`${workspace}/src/lib/rails-client.ts`),
      'PRIVATE_RAILS_ORIGIN',
    );
    expect(origin, `${workspace} must address ${frame}.${brand}`).toBe(
      `'http://${frame}.${brand}.localhost:3000'`,
    );
  });

  it('agrees on the timeout budget across all fifteen copies', () => {
    // Unlike the origin, this one *is* meant to be identical everywhere;
    // divergence means a copy was edited in isolation.
    const timeouts = new Set(
      RAILS_FRAMES.map(({ workspace }) =>
        readConstant(read(`${workspace}/src/lib/rails-client.ts`), 'RAILS_FETCH_TIMEOUT_MS'),
      ),
    );
    expect(timeouts.size, 'the fifteen timeout budgets have diverged').toBe(1);
    expect([...timeouts][0]).toBeDefined();
  });

  it('keeps Access credentials and public fallback origins out of every application runtime', () => {
    for (const { workspace } of RAILS_FRAMES) {
      const raw = read(`${workspace}/wrangler.jsonc`);
      const source = read(`${workspace}/src/lib/rails-client.ts`);
      const example = read(`${workspace}/.env.example`);
      for (const name of [
        'PUBLIC_CORE_ACCESS_CLIENT_ID',
        'PUBLIC_CORE_ACCESS_CLIENT_SECRET',
        'PUBLIC_CORE_RAILS_ORIGIN',
      ]) {
        expect(raw, `${workspace}/wrangler.jsonc must not carry ${name}`).not.toContain(name);
        expect(source, `${workspace} must not consume ${name}`).not.toContain(name);
        expect(example, `${workspace}/.env.example must not advertise ${name}`).not.toContain(name);
      }
    }
  });

  it('resolves the local Node transport BEFORE the VPC binding', () => {
    /*
     * Order is load-bearing, and this is a regression guard for a failure that
     * would be silent.
     *
     * `env.development` carries the VPC binding with `remote: true`, and
     * `next dev` resolves that environment. `next.config.ts` passes
     * `remoteBindings: false` so no Cloudflare session is opened — but wrangler
     * still materialises the binding as a stub that throws on use ("Binding …
     * needs to be run remotely"). Measured 2026-08-22 through
     * `getPlatformProxy({ remoteBindings: false })`: `bindingPresent: true`.
     *
     * So under `next dev` the binding is truthy but non-functional. Checking it
     * first — as this function did before the binding moved into
     * `env.development` — makes every local Rails call report `unreachable` and
     * makes the direct Podman transport dead code. Neither shows up as a test
     * failure anywhere else.
     */
    for (const { workspace } of RAILS_FRAMES) {
      const source = read(`${workspace}/src/lib/rails-client.ts`);

      expect(source).toContain("localEnv.EDGE_LOCAL_NODE_RUNTIME === '1'");
      expect(source).toContain("localEnv.EDGE_LOCAL_RAILS_ENABLED === '1'");

      const localAt = source.indexOf('EDGE_LOCAL_NODE_RUNTIME');
      const bindingAt = source.indexOf(`env.${VPC_BINDING}`);
      expect(localAt, `${workspace} must read the local Node marker`).toBeGreaterThan(-1);
      expect(bindingAt, `${workspace} must read the VPC binding`).toBeGreaterThan(-1);
      expect(
        localAt,
        `${workspace} must check the local Node runtime before the VPC binding`,
      ).toBeLessThan(bindingAt);
    }
  });

  it('gates the local Node transport behind the dev script', () => {
    for (const { workspace } of RAILS_FRAMES) {
      const pkg = JSON.parse(read(`${workspace}/package.json`)) as { scripts?: { dev?: string } };
      expect(pkg.scripts?.dev).toMatch(/^EDGE_LOCAL_NODE_RUNTIME=1 next dev /);
    }
  });

  it('keeps remote bindings off the Node dev path', () => {
    /*
     * Without this, `next dev` would open a remote-binding session against
     * Cloudflare — which an API token cannot authenticate — so every developer
     * would need an interactive `wrangler login` before the dev server would
     * start. `getPlatformProxy`'s `remoteBindings` option defaults to `true`
     * (wrangler 4.120.1), and `initOpenNextCloudflareForDev` forwards its
     * options straight through.
     */
    for (const { workspace } of RAILS_FRAMES) {
      expect(
        read(`${workspace}/next.config.ts`),
        `${workspace} must keep pnpm dev credential-free`,
      ).toContain('initOpenNextCloudflareForDev({ remoteBindings: false })');
    }
  });

  it('sends no path prefix — Rails routes on the path exactly as given', () => {
    /*
     * ADR 005 decision 3 assumed frames would identify themselves to Rails with
     * a `/{frame}/{brand}` prefix. The first real request over the binding
     * produced `ActionController::RoutingError (No route matches [GET]
     * "/docs/app/health/liveness.json")`; Rails serves `/health/liveness.json`
     * unprefixed, and ADR 006 records the retraction.
     *
     * This is a regression guard rather than a style rule. A prefix
     * reintroduced here would not fail loudly — it would produce 404s, which
     * `checkRailsHealth` reports as `http-error`, which reads like a Rails
     * outage rather than a client bug.
     */
    for (const { workspace } of RAILS_FRAMES) {
      const source = read(`${workspace}/src/lib/rails-client.ts`);

      expect(source, `${workspace} must not reintroduce a frame prefix`).not.toContain(
        'RAILS_FRAME_PREFIX',
      );
      expect(source, `${workspace} must not reintroduce prefix plumbing`).not.toContain(
        'pathPrefix',
      );
      expect(source, `${workspace} must build the URL from the path alone`).toContain(
        'new URL(path,',
      );
    }
  });
});

describe('apex workers stay independent of Rails', () => {
  // The apex workers own the root domain. They used to proxy Rails health, and
  // a Rails outage therefore surfaced as a failing apex. That coupling was
  // removed on purpose; this guards against it creeping back.
  it.each(APEX_WORKSPACES)('%s holds no Rails client or VPC binding', (workspace) => {
    for (const file of ['src/rails-client.ts', 'src/rails-health.ts']) {
      expect(existsSync(join(repoRoot, workspace, file)), `${workspace}/${file} returned`).toBe(
        false,
      );
    }

    const parsed = config(workspace);
    const everywhere = [parsed, ...Object.values(parsed.env ?? {})];
    for (const container of everywhere) {
      expect(
        container.vpc_services ?? [],
        `${workspace} must carry no vpc_services in any environment`,
      ).toHaveLength(0);
    }
  });
});

describe('lifecycle environments', () => {
  const ALL_WORKERS = [...RAILS_FRAMES.map((f) => f.workspace), ...APEX_WORKSPACES];

  it.each(ALL_WORKERS)('%s declares exactly development and test', (workspace) => {
    /*
     * Three lifecycle environments and no more: production is the top level,
     * development is `env.development`, test is `env.test`.
     *
     * `env.production` is absent because a Wrangler environment deploys to a
     * separate Worker named `<name>-<env>`, so it would have to re-declare
     * `name` purely to cancel that out. `env.vpc` is absent because VPC is a
     * transport capability, not a lifecycle tier — encoding it as an
     * environment is what this reconstruction removed. `env.staging` never
     * existed and must not appear.
     */
    expect(Object.keys(config(workspace).env ?? {}).sort()).toEqual(['development', 'test']);
  });

  it.each(ALL_WORKERS)('%s labels each tier with EDGE_ENV', (workspace) => {
    // EDGE_ENV is the lifecycle identifier. CLOUDFLARE_ENV is Wrangler's own
    // control variable and must never be bound as a Worker var: with no --env
    // it selects the environment, and `opennextjs-cloudflare upload` copies
    // Worker vars into `process.env` before spawning wrangler.
    const parsed = config(workspace);
    expect(parsed.vars?.EDGE_ENV).toBe('production');
    expect(parsed.env?.development?.vars?.EDGE_ENV).toBe('development');
    expect(parsed.env?.test?.vars?.EDGE_ENV).toBe('test');

    for (const container of [parsed, ...Object.values(parsed.env ?? {})]) {
      expect(container.vars?.CLOUDFLARE_ENV).toBeUndefined();
    }
  });

  it.each(ALL_WORKERS)('%s gives each tier its own rate-limit namespace', (workspace) => {
    // Counters are per-namespace_id, so a shared id lets local or CI traffic
    // spend production's budget.
    const parsed = config(workspace);
    const ids = [parsed, ...Object.values(parsed.env ?? {})].flatMap((c) =>
      (c.ratelimits ?? []).map((r) => `${r.name}:${r.namespace_id}`),
    );
    expect(new Set(ids).size, `${workspace} reuses a ratelimit namespace across tiers`).toBe(
      ids.length,
    );
  });
});

describe('workers vpc bindings', () => {
  it.each(RAILS_FRAMES)('$workspace binds Rails in production', ({ workspace }) => {
    /*
     * Exactly one binding, with no `remote` key.
     *
     * Remote bindings are a local-development mechanism: on deploy "all remote
     * bindings are disabled, which behaves exactly as if they were configured
     * with remote: false". Cloudflare's own get-started example writes a
     * deployed binding as `{binding, service_id}`, so the omission expresses
     * the default rather than hiding it.
     */
    const declared = railsBindings(config(workspace));
    expect(declared, `${workspace} production must bind Rails exactly once`).toHaveLength(1);
    expect(declared[0]?.service_id).toBe(manifest.vpcServices.production);
    expect(declared[0], 'production must not carry a `remote` key').not.toHaveProperty('remote');
  });

  it.each(RAILS_FRAMES)('$workspace binds Rails in development, remotely', ({ workspace }) => {
    /*
     * The SAME binding name as production, against the development Service,
     * resolved remotely. `remote: true` runs the Worker's code in local workerd
     * and proxies only this binding out to Cloudflare — the documented way to
     * reach a VPC Service in local development.
     *
     * Application code therefore calls
     * `env.UMAXICA_APPS_EDGE_CF_WORKERS_VPC.fetch(...)` identically in both
     * tiers; only the connection mode differs. That is the production parity
     * being claimed — not byte-identical configuration.
     */
    const declared = railsBindings(config(workspace).env?.development);
    expect(declared, `${workspace} development must bind Rails exactly once`).toHaveLength(1);
    expect(declared[0]?.service_id).toBe(manifest.vpcServices.development);
    expect(declared[0]?.remote).toBe(true);
  });

  it.each(RAILS_FRAMES)('$workspace binds no Rails transport in test', ({ workspace }) => {
    /*
     * An invariant, not an omission.
     *
     * `vpc_services` is non-inheritable, which means an environment that needs
     * it must state it explicitly. It does NOT mean every environment must
     * carry every production binding — and the test architecture has no Rails
     * dependency at all.
     */
    expect(railsBindings(config(workspace).env?.test)).toHaveLength(0);
  });

  it('uses one binding name everywhere, so no application code branches on tier', () => {
    const names = new Set<string>();
    for (const { workspace } of RAILS_FRAMES) {
      const parsed = config(workspace);
      for (const container of [parsed, ...Object.values(parsed.env ?? {})]) {
        for (const entry of container.vpc_services ?? []) names.add(entry.binding);
      }
    }
    expect([...names]).toEqual([VPC_BINDING]);
  });

  it('agrees on one VPC service per tier across all fifteen frames', () => {
    // One development Rails, so one Service shared by all fifteen. Written as
    // an assertion so a divergence — a frame left on an old service after a
    // migration — fails loudly.
    const production = new Set(
      RAILS_FRAMES.map(({ workspace }) => railsBindings(config(workspace))[0]?.service_id),
    );
    const development = new Set(
      RAILS_FRAMES.map(
        ({ workspace }) => railsBindings(config(workspace).env?.development)[0]?.service_id,
      ),
    );
    expect(production.size, 'production service ids have diverged').toBe(1);
    expect(development.size, 'development service ids have diverged').toBe(1);
  });

  it('keeps the production bootstrap state explicit and reversible', () => {
    /*
     * Production currently points at the DEVELOPMENT VPC Service, because
     * production Rails on AWS does not exist yet and the account holds exactly
     * one Service (verified 2026-08-22 with `wrangler vpc service list`).
     *
     * That is a deliberate, temporary migration state, and this assertion is
     * what keeps it from becoming permanent by forgetting. The old invariant —
     * "production must never reuse the development service_id" — is not
     * deleted, it is gated on `$productionIsBootstrap`. Flip that flag to false
     * and the guarantee comes back on, which is what the AWS cutover does.
     */
    const { development, production } = manifest.vpcServices;

    if (manifest.$productionIsBootstrap) {
      expect(
        production,
        'while bootstrapping, production is expected to share the development service',
      ).toBe(development);
    } else {
      expect(
        production,
        'production must not reuse the development VPC service — it is on the development tunnel',
      ).not.toBe(development);
    }
  });
});
