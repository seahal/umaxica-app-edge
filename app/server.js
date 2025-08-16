import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import appRoutes from "./app/server";
const app = new Hono();
const isDev = process.env.NODE_ENV !== "production";
app.use("*", secureHeaders());
// Development-specific middleware for HMR
if (isDev) {
	app.use("*", async (c, next) => {
		// Allow HMR WebSocket connections
		c.header(
			"Content-Security-Policy",
			"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws: wss:; frame-ancestors 'none'; base-uri 'self'",
		);
		// Allow hot reload
		c.header("Access-Control-Allow-Origin", "*");
		c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
		c.header("Access-Control-Allow-Headers", "*");
		return next();
	});
} else {
	app.use("*", async (c, next) => {
		c.header(
			"Content-Security-Policy",
			"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'",
		);
		c.header("Referrer-Policy", "strict-origin-when-cross-origin");
		return next();
	});
}
// Development logging middleware
if (isDev) {
	app.use("*", async (c, next) => {
		const start = Date.now();
		await next();
		const duration = Date.now() - start;
		console.log(
			`[${new Date().toISOString()}] ${c.req.method} ${c.req.url} - ${duration}ms`,
		);
	});
}
app.route("/", appRoutes);
export default app;
