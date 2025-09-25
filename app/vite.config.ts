import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import babel from "vite-plugin-babel";
import tsconfigPaths from "vite-tsconfig-paths";

const ReactCompilerConfig = {
	target: "19",
};

export default defineConfig(({ mode }) => {
	const isProduction =
		process.env.NODE_ENV === "production" || mode === "production";
	const resolvedMode = isProduction ? "production" : "development";
	const env = loadEnv(resolvedMode, process.cwd(), "VITE_");
	// Align dotenv loading with NODE_ENV so dev builds can opt into production env vars.

	for (const [key, value] of Object.entries(env)) {
		process.env[key] = value;
	}

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
		server: {
			host: true,
			port: 5137,
			strictPort: true,
			watch: {
				usePolling: true,
			},
		},
	};
});
