import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import babel from "vite-plugin-babel";
import tsconfigPaths from "vite-tsconfig-paths";

const ReactCompilerConfig = {
	target: "19",
};

export default defineConfig(() => {
	return {
		plugins: [
			tailwindcss(),
			cloudflare({ viteEnvironment: { name: "ssr" } }),
			reactRouter(),
			babel({
				filter: /\.[jt]sx?$/,
				babelConfig: {
					presets: ["@babel/preset-typescript"], // if you use TypeScript
					plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
				},
			}),
			tsconfigPaths(),
		],
		optimizeDeps: {
			// Suppress deprecated esbuildOptions warning for Rolldown
			esbuildOptions: undefined,
		},
		server: {
			host: true,
			port: 5171,
			strictPort: true,
			watch: {
				usePolling: true,
			},
		},
	};
});
