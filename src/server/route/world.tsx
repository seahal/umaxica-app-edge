import { Hono } from "hono/quick";

const app = new Hono();

app.get("*", (c) => {
	console.log(c.req.url);
	// FIXME: This is a temporary solution
	//        You know that this is not a good solution.
	if (c.req.url.match(/umaxica.com/)) {
		return c.redirect("https://jp.umaxica.com", 301);
	}
	if (c.req.url.match(/umaxica.org/)) {
		return c.redirect("https://jp.umaxica.org", 301);
	}
	return c.redirect("https://jp.umaxica.app", 301);
});

export default app;
