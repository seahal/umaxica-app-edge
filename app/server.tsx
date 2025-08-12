import { createApp } from "honox/server";
import { secureHeaders } from "hono/secure-headers";

const app = createApp();

app.use("*", secureHeaders());
app.use("*", async (c, next) => {
	c.header(
		"Content-Security-Policy",
		"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'",
	);
	c.header("Referrer-Policy", "strict-origin-when-cross-origin");
	return next();
});

export default app;
