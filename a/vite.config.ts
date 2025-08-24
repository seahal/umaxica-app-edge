// vite.config.ts
import { reactRouter } from "@react-router/dev/vite";
import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare"; // add this
import { reactRouterHonoServer } from "react-router-hono-server/dev"; // add this
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [
		cloudflareDevProxy(),
		reactRouterHonoServer({
			runtime: "cloudflare",
			flag: { force_react_19: true },
		}), // add this
		reactRouter(),
		tsconfigPaths(),
	],
});
