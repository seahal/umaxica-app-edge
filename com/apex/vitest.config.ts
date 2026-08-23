// Vitest configuration for ONE deployment unit.
//
// Deliberately self-contained: it extends nothing at the repository root, so
// this directory stays runnable if it is ever extracted into its own
// repository. The mocks under test/__mocks__ are this unit's own copies —
// per CLAUDE.md, duplication across frames is intentional, so that one frame's
// test requirements never force a change in another frame.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
  resolve: {
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
        // Browser-rendered entry and UI modules belong to Playwright/Hurl, not
        // Vitest; coverage must measure only the internal-logic layer.
        '**/src/index.tsx',
        '**/src/page-content.tsx',
        '**/src/renderer.tsx',
        '**/src/shell.tsx',
      ],
      include: ['src/**/*.{ts,tsx,js,jsx}'],
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      thresholds: {
        // TODO: raise to 99 once the uncovered branches in this unit's
        // request-handling edge cases are tested. Measured floor, not a target.
        branches: 93,
        functions: 83,
        lines: 96,
        statements: 94,
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
