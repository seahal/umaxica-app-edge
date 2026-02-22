import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import ssrPlugin from "vite-ssr-components/plugin";

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [cloudflare(), ssrPlugin(), tailwindcss()],
  resolve: {
    alias: {
      "@umaxica/shared": path.resolve(__dirname, "../../shared/src/index.ts"),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
    },
  },
});
