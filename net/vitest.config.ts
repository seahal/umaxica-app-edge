import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['apex/**/*.test.{ts,tsx}'],
    setupFiles: ['../vitest.setup.ts'],
  },
});
