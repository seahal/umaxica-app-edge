import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
  resolve: {
    tsconfigPaths: true,
    /*
     * Three Next.js modules, stubbed — and kept even though no frame is a Next
     * frame any more.
     *
     * `test/html-title-contract.test.ts` and `test/workerd-runtime-invariants.test.ts`
     * keep their Next-shaped guards over a set that is currently EMPTY, because
     * those guards are the only written record of what an OpenNext frame had to
     * declare and a frame returning to Next.js has to come back through them
     * (adr/013-frames-tanstack-start.md). Those guards `await import()` a frame's
     * own source, so the day the set is non-empty again they resolve `next/server`
     * and `server-only` — which nothing in a Node test process can. Deleting these
     * three aliases would not fail any test today; it would fail the guard on the
     * one commit that needs it.
     */
    alias: {
      '@opennextjs/cloudflare': fileURLToPath(
        new URL('./test/__mocks__/opennext-cloudflare.ts', import.meta.url),
      ),
      'next/server': fileURLToPath(new URL('./test/__mocks__/next-server.ts', import.meta.url)),
      'server-only': fileURLToPath(new URL('./test/__mocks__/server-only.ts', import.meta.url)),
    },
  },
  test: {
    deps: {
      interopDefault: true,
    },
    environment: 'happy-dom',
    globals: true,
    // Repository-level invariants only. Each deployment unit owns its own
    // vitest.config.ts and runs its own tests (`pnpm -r run test`), so this
    // config deliberately does NOT reach into app/, com/, org/, net/ or dev/ —
    // a unit whose tests only run from the repository root is not extractable.
    include: ['test/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
