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

	if (hostname.includes("umaxica.app")) {
		path = `/jp.umaxica.app${path}`;
	} else if (hostname.includes("umaxica.com")) {
		path = `/jp.umaxica.com${path}`;
	} else if (hostname.includes("umaxica.org")) {
		path = `/jp.umaxica.org${path}`;
	} else if (hostname.includes("app.localdomain")) {
		path = `/app.localdomain${path}`;
	} else if (hostname.includes("com.localdomain")) {
		path = `/com.localdomain${path}`;
	} else if (hostname.includes("org.localdomain")) {
		path = `/org.localdomain${path}`;
	}

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
