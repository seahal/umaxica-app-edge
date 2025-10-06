import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		environment: "happy-dom",
		globals: true,
		setupFiles: ["app/test-setup.ts"],
		include: [
			"test/**/*.test.{ts,tsx,js,jsx}",
			"app/test/**/*.test.{ts,tsx,js,jsx}",
			"com/test/**/*.test.{ts,tsx,js,jsx}",
			"org/test/**/*.test.{ts,tsx,js,jsx}",
		],
	},
});
