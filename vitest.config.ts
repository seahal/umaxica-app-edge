import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
  resolve: {
    tsconfigPaths: true,
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
