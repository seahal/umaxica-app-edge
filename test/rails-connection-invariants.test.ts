/**
 * Static guardrails for the Rails ↔ Edge connection.
 *
 * The design is recorded in `adr/005-rails-edge-workers-vpc-connection.md` and
 * amended by `adr/006-development-workers-vpc-transport.md`: one Cloudflare
 * Workers VPC binding, declared in `env.vpc` alone (the top level is production); paths sent to Rails
 * exactly as given, with no frame prefix; and no Rails dependency in the apex
 * workers.
 *
 * Fifteen frames each own a byte-identical copy of the client (deliberately —
 * `CLAUDE.md` forbids extracting a shared module), so the failure mode is drift:
 * one copy edited and fourteen left behind, or a sixteenth frame added without
 * a client at all. Nothing at runtime notices either. These assertions read the
 * files directly, so they need no container and no Cloudflare credentials.
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

/** The fifteen Next.js frames that reach Rails, as `<brand>/<frame>` paths. */
const RAILS_FRAMES = BRANDS.flatMap((brand) =>
  FRAMES.map((frame) => ({ brand, frame, workspace: `${brand}/${frame}` })),
);

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
     * The cores used to render an HTML status page here instead, and this
     * assertion used to pin that difference. It cost two parsers in
     * `tools/verify-edge-connectivity.mjs`, a "`jq` against a core port returns
     * markup" caveat in the operations doc, and a wrong turn during a manual
     * walkthrough. The stated reason — that the content frames had no UI to host
     * such a page — was not true either; they have `layout.tsx` and `style.css`.
     *
     * The page is not gone forever, only un-duplicated ahead of a refactor that
     * was already coming. `docs/design/rails-health-page.md` records what it did
     * so it can be rebuilt once, deliberately, rather than in fifteen copies.
     */
    const route = `${workspace}/src/app/rails-health/route.ts`;
    const page = `${workspace}/src/app/(page)/rails-health/page.tsx`;

    expect(existsSync(join(repoRoot, route)), `${route} is missing`).toBe(true);
    expect(existsSync(join(repoRoot, page)), `${page} must not come back per-frame`).toBe(false);
  });

  it('keeps all fifteen /rails-health routes byte-identical', () => {
    // Fifteen owned copies, so the failure mode is drift: one edited and
    // fourteen left behind. Nothing at runtime notices.
    const digests = new Set(
      RAILS_FRAMES.map(({ workspace }) => read(`${workspace}/src/app/rails-health/route.ts`)),
    );
    expect(digests.size, 'the fifteen route handlers have diverged').toBe(1);
  });

  it.each(RAILS_FRAMES)('$workspace sends its own Rails host', ({ brand, frame, workspace }) => {
    /*
     * Each frame addresses its own Rails entry point, and the host is how.
     *
     * Workers VPC does not route on it — one VPC Service and one tunnel serve
     * all fifteen — but the host becomes the `Host` header, and Rails dispatches
     * on that to `<Frame>::<Brand>::…`. Measured 2026-08-10 through a single
     * Service: `core.com.localhost` answered from `Core::Com::…`,
     * `docs.app.localhost` from `Docs::App::…`.
     *
     * So a wrong host here does not fail: it quietly reaches the wrong
     * namespace and answers 200. That is why this is pinned per frame rather
     * than left to review. It replaces an assertion that all fifteen agreed,
     * which was correct only while the split was still staged.
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

  it('keeps the dev transport credentials out of source and out of wrangler config', () => {
    /*
     * The development transport authenticates to a Cloudflare Access-protected
     * hostname with a service token. That token is a real credential: it must
     * arrive from `.env.development.local` (gitignored) at runtime and must never be
     * committed, either as a literal in a client copy or as a `vars` entry in a
     * `wrangler.jsonc`.
     *
     * `wrangler.jsonc` is the dangerous one — `vars` is plaintext configuration
     * that ships with the Worker, so a secret placed there would be deployed.
     */
    const secretNames = [
      'PUBLIC_CORE_ACCESS_CLIENT_ID',
      'PUBLIC_CORE_ACCESS_CLIENT_SECRET',
      'PUBLIC_CORE_RAILS_ORIGIN',
    ];

    for (const { workspace } of RAILS_FRAMES) {
      const config = read(`${workspace}/wrangler.jsonc`);
      for (const name of secretNames) {
        expect(config, `${workspace}/wrangler.jsonc must not carry ${name}`).not.toContain(name);
      }

      // The names may appear in the client as env lookups, but never with an
      // assigned string literal.
      const source = read(`${workspace}/src/lib/rails-client.ts`);
      expect(source, `${workspace} hardcodes a credential`).not.toMatch(
        /PUBLIC_CORE_ACCESS_CLIENT_(?:ID|SECRET)\s*=\s*['"]/,
      );
    }
  });

  it('sends no path prefix — Rails routes on the path exactly as given', () => {
    /*
     * ADR 005 decision 3 assumed frames would identify themselves to Rails with
     * a `/{frame}/{brand}` prefix, and said openly that whether Rails wanted
     * that was a question for the Rails repository. It did not: the first real
     * request over the VPC binding produced
     *
     *   ActionController::RoutingError (No route matches [GET] "/docs/app/health/liveness.json")
     *
     * Rails serves `/health/liveness.json` unprefixed. ADR 006 records the
     * retraction.
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

  it('points every frame at the same development origin', () => {
    /*
     * The VPC service targets exactly one Rails origin, so the fallback Access
     * transport points every frame at the public hostname for that same origin.
     * Both transports therefore reach the identical backend, and frames are not
     * distinguished at the URL level at all.
     *
     * The Rails tunnel also publishes per-brand hostnames. Switching a frame to
     * one of those in isolation is the failure this guards: development would
     * silently reach a different origin than production, and nothing would
     * notice until deploy.
     *
     * Moving to per-brand origins for real means per-brand VPC services first,
     * then changing all fifteen examples together — at which point this
     * assertion is the thing to update, deliberately.
     */
    const origins = RAILS_FRAMES.map(({ workspace }) => ({
      workspace,
      origin: /^PUBLIC_CORE_RAILS_ORIGIN=(.*)$/m.exec(read(`${workspace}/.env.example`))?.[1],
    }));

    const [first] = origins;
    expect(first?.origin, 'the example must ship a concrete origin').toBeTruthy();

    for (const { workspace, origin } of origins) {
      expect(origin, `${workspace} diverges from the shared development origin`).toBe(
        first?.origin,
      );
    }
  });

  it('ships an example that carries no credential', () => {
    // The origin is a public DNS name and is committed on purpose. The token
    // halves are credentials and must stay empty in the tracked example.
    for (const { workspace } of RAILS_FRAMES) {
      const example = read(`${workspace}/.env.example`);
      expect(example, `${workspace} leaks a client id`).toMatch(/^PUBLIC_CORE_ACCESS_CLIENT_ID=$/m);
      expect(example, `${workspace} leaks a client secret`).toMatch(
        /^PUBLIC_CORE_ACCESS_CLIENT_SECRET=$/m,
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

    expect(read(`${workspace}/wrangler.jsonc`)).not.toContain(VPC_BINDING);
  });
});

describe('workers vpc bindings', () => {
  /*
   * The binding is declared exactly once per frame, inside `env.vpc`.
   *
   * wrangler does NOT inherit bindings into `env` blocks, so placement is the
   * whole enforcement mechanism:
   *
   * - not in `development`/`test`, because the binding is `remote: true` and
   *   would force every local dev session to authenticate to Cloudflare.
   *   `pnpm dev` and `pnpm preview` needing no Cloudflare account is a property
   *   worth keeping.
   * - not at the top level, because **the top level is production** (there is
   *   no `env.production`), and the only VPC Service that exists today is on
   *   the *development* tunnel, terminating on a developer's machine. A
   *   production Worker pointed at it would leave the production network
   *   entirely. See adr/006-development-workers-vpc-transport.md.
   *
   * `tools/check-workers.mjs` asserts the same thing from the parsed config;
   * this is the textual belt to its braces.
   */
  it.each(RAILS_FRAMES)('$workspace declares the binding once, in env.vpc', ({ workspace }) => {
    const config = read(`${workspace}/wrangler.jsonc`);

    expect(config).toContain('"env"');
    expect(config).toContain('"development"');
    expect(config).toContain('"vpc"');
    expect(config).toContain('"test"');

    const declarations = config.match(new RegExp(VPC_BINDING, 'g')) ?? [];
    expect(declarations, `${workspace} must declare the binding exactly once`).toHaveLength(1);

    // The one declaration sits between the "vpc" and "test" keys — i.e. inside
    // the vpc block, not an adjacent environment.
    const at = config.indexOf(VPC_BINDING);
    expect(at).toBeGreaterThan(config.indexOf('"vpc"'));
    expect(at).toBeLessThan(config.indexOf('"test"'));
  });

  it.each(RAILS_FRAMES)('$workspace has no env.production at all', ({ workspace }) => {
    /*
     * A wrangler environment deploys to `<name>-<env>`, so an `env.production`
     * has to re-declare `name` purely to cancel that out. The top level is
     * production instead, and `wrangler deploy` with no `--env` deploys it.
     *
     * This assertion also protects the one below: the previous version sliced
     * the config from `indexOf('"production"')`, which returns -1 once the key
     * is gone — `slice(-1)` is the last character, so the service-id check
     * would have passed vacuously and silently.
     */
    const { config, error } = readWrangler(`${workspace}/wrangler.jsonc`);
    expect(error).toBeUndefined();
    expect(Object.keys(config?.env ?? {})).not.toContain('production');
  });

  it.each(RAILS_FRAMES)('$workspace declares no VPC binding at the top level', ({ workspace }) => {
    /*
     * Fail closed rather than fail outward. With no binding and no
     * `PUBLIC_CORE_RAILS_ORIGIN`, `getRailsClient()` returns null and
     * `/rails-health` reports `not-configured` and answers 503 — a visible,
     * correct absence.
     *
     * Restoring production means creating a production VPC Service on a
     * production tunnel and adding the block here. The next assertion is what
     * stops that restoration from re-using the development service.
     */
    const { config } = readWrangler(`${workspace}/wrangler.jsonc`);

    expect(
      config?.vpc_services ?? [],
      `${workspace} top level (production) must carry no vpc_services`,
    ).toHaveLength(0);
  });

  it('points every frame at the same development VPC service', () => {
    /*
     * One development Rails, so one VPC service shared by all fifteen frames.
     * Written as an assertion so a divergence — a frame left on an old service
     * after a migration — fails loudly.
     */
    const serviceIds = RAILS_FRAMES.flatMap(({ workspace }) =>
      [...read(`${workspace}/wrangler.jsonc`).matchAll(/"service_id":\s*"([^"]+)"/g)].map(
        (match) => match[1],
      ),
    );

    expect(serviceIds).toHaveLength(RAILS_FRAMES.length);
    expect(new Set(serviceIds).size).toBe(1);
  });

  it('never lets production reuse the development VPC service', () => {
    /*
     * The single assertion that makes "production cannot reach development
     * Rails" mechanical rather than procedural. It holds vacuously while the
     * top level declares no binding, and starts biting the moment somebody adds
     * one — which is exactly when it is needed.
     *
     * Read through the parsed config, not by slicing text at a key name: the
     * text version passed vacuously the moment `env.production` was removed.
     */
    const developmentId = JSON.parse(read('tools/workers-manifest.json'))
      .vpcDevelopmentServiceId as string;

    for (const { workspace } of RAILS_FRAMES) {
      const { config } = readWrangler(`${workspace}/wrangler.jsonc`);
      const productionIds = (config?.vpc_services ?? []).map(
        (entry: { service_id: string }) => entry.service_id,
      );

      expect(
        productionIds,
        `${workspace} production must not reuse the development VPC service`,
      ).not.toContain(developmentId);
    }
  });
});
