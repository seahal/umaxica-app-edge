import { createMiddleware } from "hono/factory";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { trimTrailingSlash } from "hono/trailing-slash";
import { timeout } from "hono/timeout";

const routingMiddleware = createMiddleware(async (c, next) => {
	const hostname = c.req.header("host") || "";
	const path = c.req.path;

	console.log(`Hostname: ${hostname}, path: ${path}`);

	await next();
});

export default [
	logger(),
	csrf(),
	cors(),
	secureHeaders(),
	prettyJSON(),
	trimTrailingSlash(),
	timeout(2000),
	routingMiddleware,
];
