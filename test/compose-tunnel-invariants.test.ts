/**
 * Static guardrails for the Edge-owned Tunnel connector and secret boundary.
 * Edge and Global use different Tunnel IDs and tokens and share no Podman network.
 * Everything reads files directly, so the checks require no container engine.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = join(import.meta.dirname, '..');
const read = (relativePath: string) => readFileSync(join(repoRoot, relativePath), 'utf8');

const composeBase = read('compose.yaml');
const composeCustom = read('compose.custom.yaml');
const devcontainer = read('.devcontainer/devcontainer.json');

/**
 * Every compose file that can define a service, checked as one set.
 *
 * Enumerated rather than globbed so that adding a compose file is a deliberate
 * act: a new overlay that nobody adds here would sit outside these assertions
 * while looking covered. The repository is meant to have exactly these two —
 * shared, and the developer-local overlay — so the count is asserted, not just
 * the names.
 */
const composeFiles = [
  ['compose.yaml', composeBase],
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
  const injected = process.env['EDGE_TRACKED_FILES'];
  if (injected !== undefined) {
    return injected.split('\n').filter(Boolean);
  }
  return execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
}

describe('Edge-owned tunnel connector', () => {
  it('pins the supported cloudflared release in the shared file only', () => {
    // The connector is shared infrastructure, so it is defined once, centrally.
    // Only its token is per-developer, and that comes from the gitignored `.env`
    // rather than from the developer-local overlay.
    expect(composeBase).toContain('docker.io/cloudflare/cloudflared:2026.8.2');
    expect(composeCustom).not.toContain('cloudflared');
  });

  it('keeps exactly two compose files, each with a distinct role', () => {
    // The assertions above are only as complete as this list: everything shared
    // is in `compose.yaml`, and everything machine-specific in
    // `compose.custom.yaml`. A new overlay must be added here to be covered, so
    // make the omission fail.
    for (const [name] of composeFiles) {
      expect(existsSync(join(repoRoot, name)), `${name} is asserted on but missing`).toBe(true);
    }
    expect(
      trackedFiles()
        .filter((path) => /(?:^|\/)compose\..*ya?ml$/u.test(path))
        .sort(),
    ).toEqual(['compose.custom.yaml', 'compose.yaml']);
  });

  it('defines one hardened connector without a cross-project network', () => {
    const servicesBlock = /^services:\n((?: .*\n|\n)*)/mu.exec(composeBase)?.[1] ?? '';
    const serviceNames = [...servicesBlock.matchAll(/^ {2}([a-z0-9][\w-]*):/gmu)].map(
      (match) => match[1],
    );
    expect(serviceNames).toEqual(['core', 'cloudflare-tunnel']);

    const connector = /^ {2}cloudflare-tunnel:\n((?: {4}.*\n|\n)*)/mu.exec(composeBase)?.[1] ?? '';
    expect(connector).not.toBe('');
    expect(connector).not.toContain('umaxica-edge-tunnel');
    expect(connector).not.toContain('host.docker.internal');
    expect(connector).toContain('read_only: true');
    expect(connector).toContain('no-new-privileges:true');
    expect(connector).toContain('cap_drop:');
    expect(connector).toContain('restart: on-failure:3');
  });

  it('starts the connector with the standard devcontainer lifecycle', () => {
    // Both compose files, so the project resolves the same way it does under
    // `scripts/dev-start` and a bare `podman compose`, with one set of volumes
    // — which is why the overlay has to repeat the same `name:`, checked below.
    //
    // The overlay is no longer opt-in. It stopped being machine-specific when
    // its external Rails `networks:` block was removed, and what remains is
    // what an SELinux Enforcing host needs: `label=disable` on `core`, without
    // which `/home/edge/workspace` is unreadable inside the container.
    expect(devcontainer).toContain(
      '"dockerComposeFile": ["../compose.yaml", "../compose.custom.yaml"]',
    );
    // Loading it unconditionally is only safe while it stays host-portable, so
    // the overlay must declare nothing machine-specific: no external network,
    // and no service the base file already owns (see the `cloudflared` check
    // above, and the project-name check below).
    expect(composeCustom).not.toContain('external: true');
    expect(composeCustom).not.toMatch(/^networks:/mu);
    // Compose takes the project name from the last file that sets one, so a
    // divergent `name:` here forks the project away from `compose.yaml` and
    // `scripts/dev-start` — a second volume set, and a port clash with the
    // containers `--remove-existing-container` then fails to find.
    expect(composeCustom).toMatch(/^name: umaxica-apps-edge$/mu);
    expect(devcontainer).toContain('"runServices": ["core", "cloudflare-tunnel"]');
  });

  /*
   * The Edge-specific token is still what the connector prefers; the generic
   * CLOUDFLARED_TOKEN is accepted as a fallback, for a local setup that runs a
   * single tunnel and has no separate Edge value.
   *
   * Neither may carry a `:?` guard any more. Compose interpolates the whole file
   * whichever services are named, so now that the connector shares `compose.yaml`
   * with `core`, a required variable would stop `podman compose up core` on every
   * machine that never runs a tunnel. `scripts/dev-start --tunnel` is where the
   * requirement is enforced instead, and it has to look in `.env` as well as in
   * the shell, because compose reads that file and bash does not.
   */
  it('prefers the Edge-specific token and refuses to start a tunnel without one', () => {
    expect(composeBase).toMatch(
      /TUNNEL_TOKEN: ['"]\$\{EDGE_CLOUDFLARED_TOKEN:-\$\{CLOUDFLARED_TOKEN:-\}\}['"]/u,
    );
    expect(composeBase).not.toMatch(/CLOUDFLARED_TOKEN:\?/u);

    const devStart = read('scripts/dev-start');
    expect(devStart).toMatch(/--tunnel requires EDGE_CLOUDFLARED_TOKEN/u);
    expect(devStart).toContain("grep -Eq '^(EDGE_)?CLOUDFLARED_TOKEN=.+' .env");
  });
});

describe('secret hygiene', () => {
  it('keeps .env untracked and ignored', () => {
    const tracked = trackedFiles();

    expect(tracked).not.toContain('.env');
    expect(tracked.filter((path) => path.startsWith('.env') && path !== '.env.example')).toEqual(
      [],
    );
    expect(read('.gitignore')).toMatch(/^\.env$/mu);
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
        const match = /^([A-Z0-9_]+)=(.+)$/u.exec(line.trim());
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
      /\b(?:NEXT_PUBLIC|VITE)_[A-Z0-9_]*(?:TOKEN|SECRET|CREDENTIAL|PRIVATE_KEY)[A-Z0-9_]*\b/u;
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

      /*
       * Server-only, so nothing here can be bundled for the browser — and it has
       * to be the marker the unit's own bundler enforces. The `server-only`
       * package makes a Next build fail; `@tanstack/react-start/server-only` is
       * the equivalent for a Vite frame, denied in the client environment by the
       * Start plugin. Either satisfies the invariant; neither is optional.
       */
      expect(source, `${client} must be server-only`).toMatch(
        /import '(?:server-only|@tanstack\/react-start\/server-only)'/u,
      );

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
        /(?:ENV|environment|NODE_ENV)\b[^\n]{0,40}===?\s*['"]staging['"]/u.test(
          readFileSync(file, 'utf8'),
        )
      ) {
        offenders.push(path);
      }
    }

    expect(offenders).toEqual([]);
    expect(composeBase).toMatch(/CLOUDFLARE_ENV:\s*development/u);
    expect(composeBase).not.toMatch(/CLOUDFLARE_ENV:\s*staging/u);
  });
});
