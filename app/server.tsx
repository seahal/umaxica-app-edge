import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { serveStatic } from "hono/cloudflare-workers";

import middleware from "./_middleware";
import AppHealthJson from "./routes/app/health.json";

type Bindings = {
	EDGE_CORPORATE_URL: string;
	EDGE_SERVICE_URL: string;
	EDGE_STAFF_URL: string;
	API_CORPORATE_URL: string;
	API_SERVICE_URL: string;
	API_STAFF_URL: string;
	WWW_CORPORATE_URL: string;
	WWW_SERVICE_URL: string;
	WWW_STAFF_URL: string;
	ASSETS: Fetcher;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", ...middleware);

// API routes
app.get("/api/health", AppHealthJson);

// Environment variables endpoint
app.get("/api/env", (c) => {
	const envVars = {
		EDGE_CORPORATE_URL: c.env.EDGE_CORPORATE_URL,
		EDGE_SERVICE_URL: c.env.EDGE_SERVICE_URL,
		EDGE_STAFF_URL: c.env.EDGE_STAFF_URL,
		API_CORPORATE_URL: c.env.API_CORPORATE_URL,
		API_SERVICE_URL: c.env.API_SERVICE_URL,
		API_STAFF_URL: c.env.API_STAFF_URL,
		WWW_CORPORATE_URL: c.env.WWW_CORPORATE_URL,
		WWW_SERVICE_URL: c.env.WWW_SERVICE_URL,
		WWW_STAFF_URL: c.env.WWW_STAFF_URL,
	};
	return c.json(envVars);
});

// Serve static assets
app.use(
	"/assets/*",
	serveStatic({
		root: "./public",
		manifest: {},
	}),
);
app.use(
	"/client.js",
	serveStatic({
		path: "./dist/client/client.js",
		manifest: {},
	}),
);

// SPA fallback - serve index.html for all other routes
app.get(
	"*",
	serveStatic({
		path: "./public/index.html",
		manifest: {},
	}),
);

showRoutes(app);

export default app;

// Development server
if (import.meta.main) {
	const port = 4000;
	console.log(`Server is running on port ${port}`);

	Bun.serve({
		port,
		fetch: app.fetch,
	});
}
