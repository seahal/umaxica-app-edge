import { defineConfig } from "vite";

export default defineConfig({
	// Simple Vite config for TypeScript support
	// Wrangler handles the bundling for Cloudflare Workers
	esbuild: {
		jsx: "automatic",
		jsxImportSource: "hono/jsx",
	},
});
