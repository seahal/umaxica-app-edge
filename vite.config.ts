import { cloudflare } from "@cloudflare/vite-plugin";
import build from "@hono/vite-build/cloudflare-workers";
import { defineConfig } from "vite";
import ssrHotReload from "vite-plugin-ssr-hot-reload";

export default defineConfig(({ command, isSsrBuild }) => {
	if (command === "serve") {
		return { plugins: [ssrHotReload(), cloudflare()], server: {host: true, port: 4444, allowedHosts: true} };
	}
	if (!isSsrBuild) {
		return {
			build: {
				rollupOptions: {
					input: ["./src/client/index.tsx", "./src/client/style.css"],
					output: {
						assetFileNames: "assets/[name].[ext]",
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
	port: 4444,
	host: "0.0.0.0",
};