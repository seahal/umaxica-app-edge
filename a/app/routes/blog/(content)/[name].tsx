import { Hono } from "hono";
import { renderer } from "./_renderer";

const app = new Hono();

app.use("*", renderer);

app.get("/:name", (c) => {
	const name = c.req.param("name");

	return c.render(
		<article>
			<h1>
				{name.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())} (App)
			</h1>
			<p>This is the app blog post content for "{name}".</p>
			<p>
				App-specific content: Lorem ipsum dolor sit amet, consectetur adipiscing
				elit.
			</p>
		</article>,
	);
});

export default app;
