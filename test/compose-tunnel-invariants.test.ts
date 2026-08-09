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
const devcontainer = read('.devcontainer/devcontainer.json');

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
  return execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
}

describe('no tunnel connector in this repository', () => {
  it('defines no cloudflared service in any compose file', () => {
    // A connector here would be a SECOND connector on the shared tunnel.
    // Cloudflare load-balances across connectors, so Rails-bound requests would
    // start landing on an Edge container that cannot serve them.
    for (const [name, contents] of [
      ['compose.yaml', composeBase],
      ['.devcontainer/compose.override.yml', composeOverride],
    ] as const) {
      expect(contents, `${name} must not define a connector`).not.toContain('cloudflared');
    }

    expect(existsSync(join(repoRoot, 'compose.custom.yaml'))).toBe(false);
  });

  it('keeps the connector overlay out of the devcontainer', () => {
    // Quoted, so a prose mention or a doc filename (`cloudflare-tunnel-…​.md`)
    // does not trip this — only an actual service reference does.
    expect(devcontainer).not.toContain('"compose.custom.yaml"');
    expect(devcontainer).not.toContain('"cloudflare-tunnel"');
    expect(devcontainer).not.toContain('tunnel-warn');
  });

  it('holds no tunnel connector token', () => {
    // The connector token belongs to whoever runs the connector. This
    // repository does not, so it must not carry one — reusing the Rails token
    // here is exactly how a second connector gets registered.
    for (const [name, contents] of [
      ['compose.yaml', composeBase],
      ['.devcontainer/compose.override.yml', composeOverride],
    ] as const) {
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
     * `PUBLIC_CORE_RAILS_ORIGIN` is the one deliberate exception — a public DNS
     * name, not a credential, committed so the examples are usable as-is.
     */
    const allowedWithValue = new Set(['PUBLIC_CORE_RAILS_ORIGIN']);
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
    expect(composeBase).toContain('CLOUDFLARE_ENV=development');
    expect(composeBase).not.toContain('CLOUDFLARE_ENV=staging');
  });
});
