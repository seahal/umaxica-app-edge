/**
 * Static guardrails for Next.js options that the Workers runtime cannot honour.
 *
 * These exist because the failure mode is invisible to every other gate. A
 * `next.config.ts` option can typecheck, lint, build, and pass 1143 unit tests
 * while making every prerendered page hang in workerd — the app only breaks
 * once it is actually served by the Workers runtime, which is `pnpm run
 * check:preview`, not `pnpm test`.
 *
 * Keeping the assertion here rather than only in the connectivity checker means
 * a reintroduction fails in seconds, offline, instead of after a ten-minute
 * OpenNext build.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = join(import.meta.dirname, '..');
const read = (relativePath: string) => readFileSync(join(repoRoot, relativePath), 'utf8');

const BRANDS = ['app', 'com', 'org'] as const;
const FRAMES = ['core', 'docs', 'news', 'help', 'info'] as const;

/*
 * The frames that still build through Next.js. Currently none.
 *
 * Membership is read from disk — a workspace is a Next frame if and only if it
 * owns a `next.config.ts` — rather than listed, so this set empties and refills
 * on its own. It is empty as of `adr/013-frames-tanstack-start.md`; the guard is
 * kept rather than deleted because it is the only written record of what such a
 * frame may not declare.
 *
 * The guard below is meaningless for a unit with no `next.config.ts`: there is
 * no Cache Components option to enable. What replaces it for those units is the
 * absence assertion at the bottom of this file.
 */
const ALL_FRAMES = BRANDS.flatMap((brand) => FRAMES.map((frame) => `${brand}/${frame}`));
const CLOUDFLARE_FRAMES = ALL_FRAMES.filter((workspace) =>
  existsSync(join(repoRoot, workspace, 'next.config.ts')),
);
const VITE_FRAMES = ALL_FRAMES.filter(
  (workspace) => !existsSync(join(repoRoot, workspace, 'next.config.ts')),
);

describe('Next.js options that workerd cannot honour', () => {
  /*
   * Empty since the last frame left Next.js, and kept rather than deleted: this
   * is the only written record of why `cacheComponents` may not come back, and a
   * frame that returns to Next.js has to come back through this guard.
   * `it.each([])` is an error rather than a skip, so the set is checked for
   * emptiness first.
   */
  it('names every frame that still builds through Next.js', () => {
    expect(CLOUDFLARE_FRAMES.length + VITE_FRAMES.length).toBe(ALL_FRAMES.length);
  });

  it.each(CLOUDFLARE_FRAMES.length ? CLOUDFLARE_FRAMES : ['(no Next.js frames remain)'])(
    '%s does not enable cacheComponents',
    (workspace) => {
      if (workspace.startsWith('(')) return;
      /*
       * Next's Cache Components depend on `setTimeout()` semantics workerd does
       * not provide. Next says so itself at request time:
       *
       *   ▲ Next.js cannot guarantee that Cache Components will run as expected
       *     due to the current runtime's implementation of `setTimeout()`.
       *
       * and then every prerendered (`○`) and PPR (`◐`) route hangs until the
       * runtime cancels the request — HTTP 500, "your Worker's code had hung".
       * Only Route Handlers (`ƒ`) survive, which is why `/health` kept answering
       * 200 while `/` and `/rails-health` did not, in all fifteen frames.
       *
       * Verified by removing the flag and rebuilding: `/`, `/about` and
       * `/rails-health` went from 500 to 200.
       */
      expect(
        read(`${workspace}/next.config.ts`),
        `${workspace} must not enable cacheComponents — prerendered routes hang in workerd`,
      ).not.toMatch(/cacheComponents:\s*true/u);
    },
  );
});

describe('frames that have left Next.js', () => {
  it('still covers every frame between the two sets', () => {
    expect([...CLOUDFLARE_FRAMES, ...VITE_FRAMES].sort()).toEqual([...ALL_FRAMES].sort());
  });

  /*
   * The other half of the guard above. A Next frame must not enable Cache
   * Components; a frame that has left Next must not keep the config file that
   * used to carry the option, or a later reader could edit a file nothing reads
   * and believe they had changed the runtime.
   *
   * `.open-next` is checked for the same reason: `wrangler deploy` uploads what
   * is on disk, and a stale build directory left next to a Vite unit is a
   * deployable artefact nobody is testing.
   */
  it.each(VITE_FRAMES)('%s keeps no Next.js or OpenNext leftovers', (workspace) => {
    for (const leftover of [
      'next.config.ts',
      'open-next.config.ts',
      'next-env.d.ts',
      'postcss.config.mjs',
      '.open-next',
    ]) {
      expect(
        existsSync(join(repoRoot, workspace, leftover)),
        `${workspace}/${leftover} should not exist — this unit no longer builds through Next.js`,
      ).toBe(false);
    }
  });

  it.each(VITE_FRAMES)('%s declares neither next nor @opennextjs/cloudflare', (workspace) => {
    const manifest = JSON.parse(read(`${workspace}/package.json`)) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const declared = { ...manifest.dependencies, ...manifest.devDependencies };

    expect(Object.keys(declared)).not.toContain('next');
    expect(Object.keys(declared)).not.toContain('@opennextjs/cloudflare');
  });
});
