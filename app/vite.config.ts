import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import build from "@hono/vite-build/cloudflare-workers";
import devServer from "@hono/vite-dev-server";

export default defineConfig({
	plugins: [
		cloudflare(),
		build({
			entry: "./server.tsx",
		}),
		devServer({
			entry: "./server.tsx",
		}),
	],
	server: {
		hmr: {
			port: 24678, // Custom HMR port
			overlay: true, // Show error overlay
		},
		fs: {
			allow: [".."], // Allow access to parent directories
		},
	},
	define: {
		"process.env.NODE_ENV": JSON.stringify(
			process.env.NODE_ENV || "development",
		),
	},
});
