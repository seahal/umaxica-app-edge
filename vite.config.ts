import { defineConfig } from "vite";

export default defineConfig({
	build: {
		target: "esnext",
		outDir: "dist-server",
		ssr: true,
		rollupOptions: {
			input: "./app/server.tsx",
			output: {
				entryFileNames: "index.js",
				format: "es",
			},
			external: ["hono", "@cloudflare/workers-types"],
		},
	},
});
