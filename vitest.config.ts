import { defineConfig } from 'vite-plus';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@sentry/react-router': new URL('app/core/__mocks__/@sentry/react-router.ts', import.meta.url)
        .pathname,
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
        '**/.react-router/**',
        '**/*.css',
        '**/*.svg',
        '**/workers/**',
        '**/test-setup.ts',
        '**/locales/**',
        '**/zod.ts',
        '**/react-router.config.ts',
        'app/news/**',
        'dev/core/**',
        '**/coverage/**',
        '**/.next/**',
        '**/entry.client.tsx',
        '**/health.tsx',
        '**/apex/src/root-redirect.ts',
        'shared/cloudflare/**',
      ],
      include: ['**/*.{ts,tsx,js,jsx}'],
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      thresholds: {
        branches: 96,
        functions: 98,
        lines: 98,
        statements: 98,
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
      'shared/**/*.test.{ts,tsx}',
      'test/**/*.test.{ts,tsx}',
    ],
    setupFiles: ['./vitest.setup.ts'],
  },
});
