import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [cloudflare()],
  server: {
    host: true,
    port: 5301,
    strictPort: true,
  },
});
