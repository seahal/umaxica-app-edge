/**
 * Static guardrails for secrets and for the tunnel topology.
 *
 * This file used to assert the shape of a `cloudflare-tunnel` connector defined
 * in this repository. That connector is gone: the system has ONE connector, and
 * it lives in the Rails repository. Registering a second one on the same tunnel
 * makes Cloudflare load-balance across both, so requests for the Rails
 * hostnames would land on an Edge container roughly half the time — including
 * `core-jp.umaxica.app`, which local development calls. The assertions below
 * keep a connector from reappearing here by accident.
 *
 * This file also used to assert that `compose.custom.yaml` did not exist, because
 * that is the Rails overlay's filename and its absence was a cheap proxy for "the
 * connector was not copied here". That proxy is retired: this repository now has a
 * `compose.custom.yaml` of its own, deliberately named to match the other side of
 * the shared connector, whose job is the opposite one — it owns the network the
 * connector visits instead of defining a connector. The guarantee is therefore
 * asserted on contents rather than on a filename, which is strictly stronger: no
 * `cloudflared` reference, no token, and exactly one service.
 *
 * Ownership of the network runs the other way from how this started. Edge defines
 * it and the connector joins, rather than Edge joining an `external` network the
 * connector already made. That is what lets the devcontainer — the primary
 * development environment — read the overlay at all: an external network must
 * exist before `up`, so its absence used to be a hard startup failure.
 *
 * Everything reads files directly — no container engine required, so it runs in
 * CI and in the pre-commit hook alongside the rest of the suite.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = join(import.meta.dirname, '..');
const read = (relativePath: string) => readFileSync(join(repoRoot, relativePath), 'utf8');

const composeBase = read('compose.yaml');
const composeOverride = read('.devcontainer/compose.override.yml');
const composeCustom = read('compose.custom.yaml');
const devcontainer = read('.devcontainer/devcontainer.json');

/**
 * Every compose file that can define a service, checked as one set.
 *
 * Enumerated rather than globbed so that adding a compose file is a deliberate
 * act: a new overlay that nobody adds here would sit outside these assertions
 * while looking covered.
 */
const composeFiles = [
  ['compose.yaml', composeBase],
  ['.devcontainer/compose.override.yml', composeOverride],
  ['compose.custom.yaml', composeCustom],
] as const;

/**
 * Source files worth scanning for leaked secrets.
 *
 * Enumerated via `git ls-files` rather than a directory walk: it is exactly the
 * set of files that can reach another machine, and it skips build output,
 * node_modules, and untracked tool caches for free.
 */
function collectSourceFiles(): string[] {
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.jsonc'];

  return (
    trackedFiles()
      .filter((path) => extensions.some((extension) => path.endsWith(extension)))
      .map((path) => join(repoRoot, path))
      // `git ls-files` still lists files deleted in the working tree but not yet
      // staged. They cannot reach another machine, so skip them.
      .filter((path) => existsSync(path))
  );
}

function trackedFiles(): string[] {
  const injected = process.env.EDGE_TRACKED_FILES;
  if (injected !== undefined) {
    return injected.split('\n').filter(Boolean);
  }
  return execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
}

describe('no tunnel connector in this repository', () => {
  it('defines no cloudflared service in any compose file', () => {
    // A connector here would be a SECOND connector on the shared tunnel.
    // Cloudflare load-balances across connectors, so Rails-bound requests would
    // start landing on an Edge container that cannot serve them.
    for (const [name, contents] of composeFiles) {
      expect(contents, `${name} must not define a connector`).not.toContain('cloudflared');
    }
  });

  it('enumerates every compose file that can define a service', () => {
    // The assertions above are only as complete as this list. `compose.custom.yaml`
    // shares its name with the Rails overlay that DOES define the connector, so a
    // future edit that copies content across would land in a file this suite has
    // to be reading. Fail loudly if one of them disappears or is renamed.
    for (const [name] of composeFiles) {
      expect(existsSync(join(repoRoot, name)), `${name} is asserted on but missing`).toBe(true);
    }
    expect(composeFiles.map(([name]) => name)).toContain('compose.custom.yaml');
  });

  it('owns the tunnel network without defining a second service', () => {
    // compose.custom.yaml exists to make `core` reachable FROM the Rails-side
    // connector, so it may define a network and an alias — and nothing else. A
    // second service here would be a second container on the tunnel network,
    // which is the failure this whole file is about.
    // Scoped to the `services:` block: `networks:` uses the same indentation, so
    // an unscoped match would count `tunnel` as a service.
    const servicesBlock = /^services:\n((?: .*\n|\n)*)/m.exec(composeCustom)?.[1] ?? '';
    const serviceNames = [...servicesBlock.matchAll(/^ {2}([a-z0-9][\w-]*):/gm)].map(
      (match) => match[1],
    );
    expect(serviceNames).toEqual(['core']);

    // `core` is also a Rails service name, and Podman registers the compose
    // service name as a network-scoped DNS name. Ingress must therefore address
    // the explicit alias, never the bare service name.
    expect(composeCustom, 'compose.custom.yaml must publish the edge-core alias').toContain(
      'edge-core',
    );

    // The network is compose-managed under a literal name, deliberately NOT
    // `external: true`. An external network has to exist before `up`, which is
    // what previously made this file unusable from the devcontainer: a machine
    // that had never run the connector could not start at all. Owning the network
    // inverts that — Edge creates it and the connector joins.
    //
    // A literal name also removes the failure mode an environment variable
    // brought with it: a misspelled network name would silently create an empty
    // network and leave the container isolated on it, which reads as a Cloudflare
    // fault rather than a typo.
    //
    // Scoped to the `networks:` block rather than the whole file: the header
    // comment quotes the `external: true` stanza the Rails side needs, and that
    // example is worth keeping where the name it has to match is defined.
    const networksBlock = /^networks:\n((?: .*\n|\n)*)/m.exec(composeCustom)?.[1] ?? '';
    expect(networksBlock).not.toContain('external: true');
    expect(networksBlock).toContain('name: umaxica-edge-tunnel');
    expect(composeCustom).not.toContain('EDGE_TUNNEL_NETWORK');
  });

  it('gives the devcontainer the tunnel network', () => {
    // The devcontainer is the primary development environment, so it must be able
    // to be reached through the Tunnel. That only works if it reads this overlay,
    // which is safe precisely because the network is not external.
    //
    // Matched with the trailing quote rather than both quotes, so the path form
    // `dockerComposeFile` actually uses — `"../compose.custom.yaml"` — matches.
    expect(devcontainer).toContain('compose.custom.yaml"');

    // Reading the overlay must not have brought a connector along with it. The
    // devcontainer runs the dev servers and nothing else.
    expect(devcontainer).not.toContain('"cloudflare-tunnel"');
    expect(devcontainer).not.toContain('tunnel-warn');
  });

  it('holds no tunnel connector token', () => {
    // The connector token belongs to whoever runs the connector. This
    // repository does not, so it must not carry one — reusing the Rails token
    // here is exactly how a second connector gets registered.
    for (const [name, contents] of composeFiles) {
      expect(contents, `${name} must not pass a tunnel token`).not.toContain('TUNNEL_TOKEN');
      expect(contents, `${name} must not pass a tunnel token`).not.toContain('CLOUDFLARED_TOKEN');
    }
  });
});

describe('secret hygiene', () => {
  it('keeps .env untracked and ignored', () => {
    const tracked = trackedFiles();

    expect(tracked).not.toContain('.env');
    expect(tracked.filter((path) => path.startsWith('.env') && path !== '.env.example')).toEqual(
      [],
    );
    expect(read('.gitignore')).toMatch(/^\.env$/m);
  });

  it('ships value-free .env examples everywhere', () => {
    /*
     * Name-agnostic on purpose: rather than listing the variables that happen to
     * exist today, assert that no tracked `.env.example` assigns a value to
     * anything. A new secret added to an example is then caught without anyone
     * remembering to extend this test.
     *
     * Local Rails connectivity needs no environment credential or public
     * fallback origin, so every tracked example must remain value-free.
     */
    const allowedWithValue = new Set<string>();
    const offenders: string[] = [];

    for (const path of trackedFiles().filter((file) => file.endsWith('.env.example'))) {
      for (const line of read(path).split('\n')) {
        const match = /^([A-Z0-9_]+)=(.+)$/.exec(line.trim());
        if (match && !allowedWithValue.has(match[1] as string)) {
          offenders.push(`${path}: ${match[1]}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('never exposes a credential through a client-visible variable prefix', () => {
    // NEXT_PUBLIC_* and VITE_* are inlined into the browser bundle at build
    // time. A name matching /token|secret|credential/ under those prefixes is
    // a leak regardless of the value.
    const forbidden =
      /\b(?:NEXT_PUBLIC|VITE)_[A-Z0-9_]*(?:TOKEN|SECRET|CREDENTIAL|PRIVATE_KEY)[A-Z0-9_]*\b/;
    const offenders: string[] = [];

    for (const file of collectSourceFiles()) {
      if (relative(repoRoot, file) === relative(repoRoot, import.meta.filename)) continue;
      if (forbidden.test(readFileSync(file, 'utf8'))) {
        offenders.push(relative(repoRoot, file));
      }
    }

    expect(offenders).toEqual([]);
  });

  it('never relays an inbound caller credential onward to Rails', () => {
    /*
     * The direction of trust. A credential arriving on an inbound request — a
     * browser session cookie, an `Authorization` header, an Access token
     * belonging to the end user — must never be forwarded to Rails. Every copy
     * strips those before dispatch, and applies its own transport credentials
     * only afterwards, so `init.headers` cannot smuggle one through.
     *
     * `test/rails-connection-invariants.test.ts` covers the other half: no
     * credential may be committed to source or to `wrangler.jsonc`.
     */
    const clients = ['app', 'com', 'org'].flatMap((tld) =>
      ['core', 'docs', 'news', 'help', 'info'].map(
        (frame) => `${tld}/${frame}/src/lib/rails-client.ts`,
      ),
    );

    for (const client of clients) {
      const source = read(client);

      // Server-only, so nothing here can be bundled for the browser.
      expect(source, `${client} must be server-only`).toContain("import 'server-only'");

      for (const header of [
        'cookie',
        'authorization',
        'cf-access-client-id',
        'cf-access-client-secret',
      ]) {
        expect(source, `${client} must strip ${header}`).toContain(`'${header}'`);
      }

      // The strip must precede the transport's own headers, otherwise a caller
      // could override the service token — or keep their own.
      const stripIndex = source.indexOf('FORBIDDEN_REQUEST_HEADERS) {');
      const applyIndex = source.indexOf('Object.entries(authHeaders)');
      expect(stripIndex, `${client} lost the header strip`).toBeGreaterThan(-1);
      expect(applyIndex, `${client} lost the auth application`).toBeGreaterThan(-1);
      expect(applyIndex, `${client} applies credentials before stripping`).toBeGreaterThan(
        stripIndex,
      );
    }
  });
});

describe('environment separation', () => {
  it('keeps the application environment at development, never aliased to staging', () => {
    // If staging returns, it arrives as new wrangler env blocks and new
    // Cloudflare config — not as a branch in application code.
    const offenders: string[] = [];

    for (const file of collectSourceFiles()) {
      const path = relative(repoRoot, file);
      if (path.includes('test/') || path.endsWith('.test.ts') || path.endsWith('.test.tsx'))
        continue;
      if (path === 'plans' || path.startsWith('plans/')) continue;
      if (
        /(?:ENV|environment|NODE_ENV)\b[^\n]{0,40}===?\s*['"]staging['"]/.test(
          readFileSync(file, 'utf8'),
        )
      ) {
        offenders.push(path);
      }
    }

    expect(offenders).toEqual([]);
    expect(composeBase).toMatch(/CLOUDFLARE_ENV:\s*development/);
    expect(composeBase).not.toMatch(/CLOUDFLARE_ENV:\s*staging/);
  });
});
