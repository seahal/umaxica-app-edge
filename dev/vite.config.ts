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
			port: 5173,
			strictPort: true,
			watch: {
				usePolling: true,
			},
		},
	};
});
