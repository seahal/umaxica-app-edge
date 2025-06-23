import { cloudflare } from "@cloudflare/vite-plugin";
import build from "@hono/vite-build/cloudflare-workers";
import { defineConfig } from "vite";
import ssrHotReload from "vite-plugin-ssr-hot-reload";

export default defineConfig(({ command, isSsrBuild }) => {
	if (command === "serve") {
		return { plugins: [ssrHotReload(), cloudflare()], server: {host: true, port: 4000, allowedHosts: true} };
	}
	if (!isSsrBuild) {
		return {
			build: {
				rollupOptions: {
					input: [
						"./src/client/app/index.tsx", "./src/client/app/style.css",
						"./src/client/com/index.tsx", "./src/client/com/style.css",
						"./src/client/org/index.tsx", "./src/client/org/style.css"
					],
					output: {
						assetFileNames: "assets/[name].[ext]",
						entryFileNames: "assets/[name].js",
					},
				},
			},
		};
	}
	return {
		plugins: [build({ entry: "./src/server/index.tsx", outputDir: "dist-server" })],
	};
});
export const server = {
	port: 4000,
	host: "0.0.0.0",
};