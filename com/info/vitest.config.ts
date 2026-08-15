// Vitest configuration for ONE deployment unit.
//
// Deliberately self-contained: it extends nothing at the repository root, so
// this directory stays runnable if it is ever extracted into its own
// repository. The mocks under test/__mocks__ are this unit's own copies —
// per CLAUDE.md, duplication across frames is intentional, so that one frame's
// test requirements never force a change in another frame.
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
  resolve: {
    alias: {
      'next/server': fileURLToPath(new URL('./test/__mocks__/next-server.ts', import.meta.url)),
      '@opennextjs/cloudflare': fileURLToPath(
        new URL('./test/__mocks__/opennext-cloudflare.ts', import.meta.url),
      ),
      'server-only': fileURLToPath(new URL('./test/__mocks__/server-only.ts', import.meta.url)),
    },
    tsconfigPaths: true,
  },
  test: {
    coverage: {
      exclude: [
        '**/+types/**',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/node_modules/**',
        '**/build/**',
        '**/dist/**',
        '**/__mocks__/**',
        '**/public/**',
        '**/*.css',
        '**/*.svg',
        '**/locales/**',
        '**/coverage/**',
        '**/.next/**',
        '**/.open-next/**',
        '**/.wrangler/**',
        '**/e2e/**',
        '**/playwright.config.ts',
        '**/next.config.ts',
        '**/open-next.config.ts',
        '**/vitest.config.ts',
        '**/vitest.setup.ts',
      ],
      include: ['src/**/*.{ts,tsx,js,jsx}'],
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      thresholds: {
        branches: 99,
        functions: 99,
        lines: 99,
        statements: 99,
      },
    },
    deps: {
      interopDefault: true,
    },
    environment: 'happy-dom',
    globals: true,
    include: ['test/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
