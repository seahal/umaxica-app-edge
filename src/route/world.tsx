import { Hono } from "hono/quick";

const app = new Hono();

app.get("*", (c) => {
	console.log(c.req.url);
	if (c.req.url.match(/umaxica.com/)) {
		return c.redirect("https://jp.umaxica.com", 301);
	} else if (c.req.url.match(/umaxica.org/)) {
		return c.redirect("https://jp.umaxica.org", 301);
	} else {
		return c.redirect("https://jp.umaxica.app", 301);
	}
});

export default app;
