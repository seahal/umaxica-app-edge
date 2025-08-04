import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
	build: {
		target: "esnext",
		rollupOptions: {
			input: {
				// Client build
				client: resolve(__dirname, "app/client.tsx"),
				// Server build
				server: resolve(__dirname, "app/server.tsx"),
			},
			output: {
				dir: "dist",
				entryFileNames: (chunk) => {
					return chunk.name === "server"
						? "server/index.js"
						: "client/[name].js";
				},
				format: "es",
			},
			external: (id) => {
				// External for server bundle only
				if (id.includes("server")) {
					return ["hono", "@cloudflare/workers-types"].includes(id);
				}
				return false;
			},
		},
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "app"),
		},
	},
});
