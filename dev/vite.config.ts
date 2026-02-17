import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [cloudflare()],
  server: {
    host: true,
    port: 8783,
    strictPort: true,
  },
});
