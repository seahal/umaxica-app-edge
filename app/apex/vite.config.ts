import { resolve } from 'node:path';

import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vite-plus';
import ssrPlugin from 'vite-ssr-components/plugin';

import tailwindcss from '@tailwindcss/vite';

const sharedApexEntry = `${resolve(__dirname, '../../shared/apex')}/**/*.{ts,tsx}`;
const styleEntry = resolve(__dirname, 'src/style.css');

export default defineConfig({
  plugins: [
    cloudflare({
      inspectorPort: false,
    }),
    ssrPlugin({
      entry: {
        target: ['src/**/*.{ts,tsx}', sharedApexEntry],
      },
    }),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5401,
    strictPort: true,
    watch: {
      usePolling: true,
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.tsx'),
        style: styleEntry,
      },
    },
  },
});
