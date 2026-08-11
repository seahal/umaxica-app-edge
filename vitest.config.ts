import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '@opennextjs/cloudflare': fileURLToPath(
        new URL('./test/__mocks__/opennext-cloudflare.ts', import.meta.url),
      ),
      'next/server': fileURLToPath(new URL('./test/__mocks__/next-server.ts', import.meta.url)),
      'server-only': fileURLToPath(new URL('./test/__mocks__/server-only.ts', import.meta.url)),
    },
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
        '**/test-setup.ts',
        '**/locales/**',
        '**/coverage/**',
        '**/.next/**',
        '**/.open-next/**',
        '**/.wrangler/**',
        '**/.claude/**',
        '**/.pnpm-store/**',
        '**/tmp/**',
        '**/e2e/**',
        '**/playwright.config.ts',
        '**/next.config.ts',
        '**/open-next.config.ts',
      ],
      include: ['**/*.{ts,tsx,js,jsx}'],
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
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
    include: [
      'app/**/*.test.{ts,tsx}',
      'com/**/*.test.{ts,tsx}',
      'dev/**/*.test.{ts,tsx}',
      'org/**/*.test.{ts,tsx}',
      'net/**/*.test.{ts,tsx}',
      'test/**/*.test.{ts,tsx}',
    ],
    setupFiles: ['./vitest.setup.ts'],
  },
});
