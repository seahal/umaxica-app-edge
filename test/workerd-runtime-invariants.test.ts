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
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = join(import.meta.dirname, '..');
const read = (relativePath: string) => readFileSync(join(repoRoot, relativePath), 'utf8');

const BRANDS = ['app', 'com', 'org'] as const;
const FRAMES = ['core', 'docs', 'news', 'help', 'info'] as const;

/** The fifteen Cloudflare-hosted Next.js frames. `dev/acme` is on Vercel. */
const CLOUDFLARE_FRAMES = BRANDS.flatMap((brand) => FRAMES.map((frame) => `${brand}/${frame}`));

describe('Next.js options that workerd cannot honour', () => {
  it.each(CLOUDFLARE_FRAMES)('%s does not enable cacheComponents', (workspace) => {
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
  });

  it('keeps the Vercel frame out of scope, since it does not run on workerd', () => {
    // Not an endorsement, just a boundary: dev/acme is deployed to Vercel, where
    // Cache Components work. If it ever moves to Workers, add it above.
    expect(read('dev/acme/next.config.ts')).toContain('cacheComponents');
  });
});
