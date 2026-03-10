import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  publicDir: false,
  build: {
    outDir: 'public/assets',
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/style.css'),
      output: {
        assetFileNames: 'style.css',
      },
    },
  },
  server: {
    host: true,
    port: 5501,
    strictPort: true,
    watch: {
      usePolling: true,
    },
  },
});
