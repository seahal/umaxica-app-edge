import { defineConfig } from 'vitest/config';

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
        '**/.react-router/**',
        '**/*.css',
        '**/*.svg',
      ],
      include: ['**/*.{ts,tsx,js,jsx}'],
      provider: 'v8',
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
