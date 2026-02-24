import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [cloudflare()],
  resolve: {
    alias: {
      "@umaxica/shared": path.resolve(__dirname, "../../shared/src/index.ts"),
    },
  },
  server: {
    host: true,
    port: 5501,
    strictPort: true,
  },
});
