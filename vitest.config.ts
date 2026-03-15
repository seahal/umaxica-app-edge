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
        '**/routes.ts',
        '**/test-setup.ts',
        '**/locales/**',
        '**/footer.tsx',
        '**/secrets-store.ts',
        '**/zod.ts',
        '**/entry.client.tsx',
        '**/entry.server.tsx',
        '**/react-router.config.ts',
      ],
      include: ['**/*.{ts,tsx,js,jsx}'],
      provider: 'v8',
      reporter: ['text', 'text-summary'],
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
