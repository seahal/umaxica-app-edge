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
	let path = c.req.path;

	console.log(`Original hostname: ${hostname}, path: ${path}`);

	if (hostname.includes("app.localhost")) {
		path = `/app${path}`;
	} else if (hostname.includes("com.localhost")) {
		path = `/com${path}`;
	} else if (hostname.includes("org.localhost")) {
		path = `/org${path}`;
	} else if (hostname.includes("umaxica.app")) {
		path = `/app${path}`;
	} else if (hostname.includes("umaxica.com")) {
		path = `/com${path}`;
	} else if (hostname.includes("umaxica.org")) {
		path = `/org${path}`;
	}

	console.log(`Rewritten path: ${path}`);

	const url = new URL(c.req.url);
	url.pathname = path;
	c.req.raw = new Request(url.toString(), c.req.raw);

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
